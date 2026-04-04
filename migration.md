```sql
-- Adicionar coluna team_id na tabela cleaning_templates
ALTER TABLE cleaning_templates
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Adicionar coluna team_id na tabela communication
ALTER TABLE communication
ADD COLUMN team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
```
