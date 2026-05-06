import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_ANON_KEY'];
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials missing' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Admin client to bypass RLS if configured
    const adminSupabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Função auxiliar para upload de imagem base64
    const uploadBase64Image = async (base64String: string, recipeId: string): Promise<string | null> => {
      try {
        if (!base64String || !base64String.startsWith('data:image')) return null;
        
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;
        
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = contentType.split('/')[1];
        const fileName = `${recipeId}_${Date.now()}.${ext}`;

        const { data, error } = await adminSupabase.storage
          .from('images')
          .upload(`recipes/${fileName}`, buffer, {
            contentType: contentType,
            upsert: true
          });

        if (error) {
          console.error('Upload Error:', error);
          return null;
        }

        const { data: publicUrlData } = adminSupabase.storage
          .from('images')
          .getPublicUrl(`recipes/${fileName}`);
          
        return publicUrlData.publicUrl;
      } catch (err) {
        console.error('Error processing image:', err);
        return null;
      }
    };

    // GET: List all recipes or a specific recipe
    if (req.method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        // Obter uma receita específica com seus ingredientes
        const { data: recipe, error: recipeError } = await adminSupabase
          .from('recipes')
          .select(`
            *,
            recipe_ingredients (*)
          `)
          .eq('id', id)
          .single();
          
        if (recipeError) return res.status(400).json({ error: recipeError.message });
        return res.status(200).json(recipe);
      }
      
      // Listar todas as receitas
      const { data, error } = await adminSupabase
        .from('recipes')
        .select('*')
        .order('name');

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // POST: Create a new recipe
    if (req.method === 'POST') {
      let { name, description, prep_time_minutes, base_portions, image_url, method, equipment, ingredients, produced_item_id, category } = req.body;

      if (!name) return res.status(400).json({ error: 'Name is required' });

      const { data: userProfile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();

      // INSERE a Receita inicialmente sem imagem caso a imagem seja base64
      let dbImageUrl = image_url;
      if (image_url && image_url.startsWith('data:image')) {
        dbImageUrl = null; // Vamos atualizar depois que tiver o ID
      }

      const { data: recipe, error: recipeError } = await adminSupabase
        .from('recipes')
        .insert({
          name, description, prep_time_minutes, base_portions, image_url: dbImageUrl, method, equipment, produced_item_id, category, tenant_id: userProfile?.tenant_id
        })
        .select()
        .single();

      if (recipeError) return res.status(400).json({ error: recipeError.message });

      // Processa a imagem se for mockada
      if (image_url && image_url.startsWith('data:image')) {
         const uploadedUrl = await uploadBase64Image(image_url, recipe.id);
         if (uploadedUrl) {
            await adminSupabase.from('recipes').update({ image_url: uploadedUrl }).eq('id', recipe.id);
            recipe.image_url = uploadedUrl;
         }
      }

      // INSERE os Ingredientes e associa
      if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
        const ingredientsToInsert = ingredients.map((ing: any) => ({
          recipe_id: recipe.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          correction_factor: ing.correction_factor || 1.0,
          inventory_item_id: ing.inventory_item_id || null
        }));
        
        await adminSupabase.from('recipe_ingredients').insert(ingredientsToInsert);
      }

      return res.status(201).json(recipe);
    }
    
    // PUT: Update an existing recipe
    if (req.method === 'PUT') {
      let { id, name, description, prep_time_minutes, base_portions, image_url, method, equipment, ingredients, produced_item_id, category } = req.body;

      if (!id || !name) return res.status(400).json({ error: 'ID and Name are required' });

      let dbImageUrl = image_url;
      if (image_url && image_url.startsWith('data:image')) {
         const uploadedUrl = await uploadBase64Image(image_url, id);
         if (uploadedUrl) {
            dbImageUrl = uploadedUrl;
         }
      }

      // ATUALIZA a Receita
      const { data: recipe, error: recipeError } = await adminSupabase
        .from('recipes')
        .update({
          name, description, prep_time_minutes, base_portions, image_url: dbImageUrl, method, equipment, produced_item_id, category
        })
        .eq('id', id)
        .select()
        .single();

      if (recipeError) return res.status(400).json({ error: recipeError.message });

      // ATUALIZA os Ingredientes (Deleta os antigos e insere os novos)
      await adminSupabase.from('recipe_ingredients').delete().eq('recipe_id', id);
      
      if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
        const ingredientsToInsert = ingredients.map((ing: any) => ({
          recipe_id: recipe.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          correction_factor: ing.correction_factor || 1.0,
          inventory_item_id: ing.inventory_item_id || null
        }));
        
        await adminSupabase.from('recipe_ingredients').insert(ingredientsToInsert);
      }

      return res.status(200).json(recipe);
    }

    // DELETE: Remove recipe
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Recipe ID is required' });

      // Ingredientes serão deletados em cascata (se configurado no BD) ou podemos deletá-los explicitamente
      await adminSupabase.from('recipe_ingredients').delete().eq('recipe_id', id);
      
      const { error } = await adminSupabase.from('recipes').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
