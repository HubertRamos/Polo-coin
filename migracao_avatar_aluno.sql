-- ============================================================
-- PoloCoin — Migration: Adiciona coluna 'avatar' na tabela alunos
-- Tipo: VARCHAR(20) DEFAULT '🙂'
-- ============================================================

-- 1. Cria a coluna 'avatar' caso ainda não exista
ALTER TABLE alunos 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(20) DEFAULT '🙂';

-- 2. Atualiza registros existentes que estejam sem avatar definido
UPDATE alunos 
SET avatar = '🙂' 
WHERE avatar IS NULL OR TRIM(avatar) = '';

-- 3. Índice para consultas com avatar
CREATE INDEX IF NOT EXISTS idx_alunos_avatar ON alunos(avatar);
