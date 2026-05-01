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

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // GET: List all recipes or a specific recipe
    if (req.method === 'GET') {
      const { id } = req.query;
      
      if (id) {
        // Obter uma receita específica com seus ingredientes
        const { data: recipe, error: recipeError } = await supabase
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
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('name');

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // POST: Create a new recipe
    if (req.method === 'POST') {
      const { name, description, prep_time_minutes, base_portions, image_url, method, equipment, ingredients } = req.body;

      if (!name) return res.status(400).json({ error: 'Name is required' });

      const { data: userProfile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();

      // INSERE a Receita
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name, description, prep_time_minutes, base_portions, image_url, method, equipment, tenant_id: userProfile?.tenant_id
        })
        .select()
        .single();

      if (recipeError) return res.status(400).json({ error: recipeError.message });

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
        
        await supabase.from('recipe_ingredients').insert(ingredientsToInsert);
      }

      return res.status(201).json(recipe);
    }

    // DELETE: Remove recipe
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Recipe ID is required' });

      // Ingredientes serão deletados em cascata (se configurado no BD) ou podemos deletá-los explicitamente
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
      
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
