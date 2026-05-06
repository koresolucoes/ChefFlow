```sql
-- Adicionar coluna team_id na tabela cleaning_templates
ALTER TABLE cleaning_templates
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Adicionar coluna team_id na tabela communication
ALTER TABLE communication
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- =========================================================================
-- FASE 1: FICHAS TÉCNICAS E RECEITUÁRIO
-- =========================================================================

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prep_time_minutes INTEGER DEFAULT 0,
  base_portions INTEGER DEFAULT 1,
  image_url TEXT,
  method TEXT,
  equipment TEXT,
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  quantity NUMERIC NOT NULL,
  unit VARCHAR(50) NOT NULL,
  correction_factor NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- FASE 1: WASTE LOG (DESPERDÍCIO)
-- =========================================================================

CREATE TABLE waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  unit VARCHAR(50) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  notes TEXT,
  cost_impact NUMERIC DEFAULT 0,
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- FASE 1: COMPRAS (HISTÓRICO DE ENTRADAS)
-- =========================================================================

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  unit VARCHAR(50) NOT NULL,
  total_cost NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  invoice_number VARCHAR(100),
  supplier_name VARCHAR(255),
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =========================================================================
-- FASE 2: INTEGRAÇÃO RECEITAS E PRODUÇÃO
-- =========================================================================

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS produced_item_id UUID REFERENCES inventory(id) ON DELETE SET NULL;

ALTER TABLE prep_tasks ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;
ALTER TABLE prep_tasks ADD COLUMN IF NOT EXISTS target_portions INTEGER;

-- =========================================================================
-- FASE 3: MELHORIAS NA PRODUÇÃO (MISE EN PLACE)
-- =========================================================================

ALTER TABLE prep_tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE prep_tasks ADD COLUMN IF NOT EXISTS due_date DATE;

-- =========================================================================
-- FASE 4: MELHORIAS NAS RECEITAS E ARMAZENAMENTO DE IMAGENS
-- =========================================================================

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category TEXT;

-- Criação do Bucket de Storage para Imagens das Fichas Técnicas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Segurança para o Bucket 'images'
CREATE POLICY "Imagens públicas para visualização" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'images');

CREATE POLICY "Upload apenas para usuários autenticados" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Edição apenas para usuários autenticados" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Deleção apenas para usuários autenticados" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'images' AND auth.role() = 'authenticated');
```
