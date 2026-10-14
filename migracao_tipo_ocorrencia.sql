-- ============================================================
-- Migration: Adiciona coluna 'tipo' na tabela avaliacoes
-- Valores aceitos: 'positiva', 'negativa'
-- ============================================================

-- 1. Cria a coluna 'tipo' caso não exista
ALTER TABLE avaliacoes 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'positiva';

-- 2. Atualiza registros existentes com base no saldo de pontos:
-- pontos < 0 -> tipo = 'negativa'
-- pontos >= 0 -> tipo = 'positiva'
UPDATE avaliacoes 
SET tipo = 'negativa' 
WHERE pontos < 0;

UPDATE avaliacoes 
SET tipo = 'positiva' 
WHERE pontos >= 0 OR pontos IS NULL;
