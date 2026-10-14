-- ============================================================
-- PoloCoin — Migration 001: Schema Otimizado (Supabase Compatible)
-- ============================================================

-- 0. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela: admins
CREATE TABLE IF NOT EXISTS admins (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Certifique-se de salvar HASH no backend
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela: professores
CREATE TABLE IF NOT EXISTS professores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela: categorias
CREATE TABLE IF NOT EXISTS categorias (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela: produtos
CREATE TABLE IF NOT EXISTS produtos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    custo_pontos INT NOT NULL DEFAULT 0 CHECK (custo_pontos >= 0),
    categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL ON UPDATE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON produtos(categoria_id);

-- 5. Tabela: turmas
CREATE TABLE IF NOT EXISTS turmas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    serie INT NOT NULL,
    turma VARCHAR(10) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(serie, turma)
);

-- 6. Tabela: responsaveis
CREATE TABLE IF NOT EXISTS responsaveis (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela: alunos
CREATE TABLE IF NOT EXISTS alunos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    turma_id BIGINT NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    responsavel_id BIGINT NOT NULL REFERENCES responsaveis(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    pontos INT NOT NULL DEFAULT 0 CHECK (pontos >= 0),
    pode_comprar BOOLEAN NOT NULL DEFAULT false,
    avatar VARCHAR(20) DEFAULT '🙂',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(turma_id, nome)
);

CREATE INDEX IF NOT EXISTS idx_alunos_turma_id ON alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_alunos_responsavel_id ON alunos(responsavel_id);

-- 8. Tabela: professor_turmas
CREATE TABLE IF NOT EXISTS professor_turmas (
    professor_id BIGINT NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    turma_id BIGINT NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (professor_id, turma_id)
);

CREATE INDEX IF NOT EXISTS idx_professor_turmas_turma_id ON professor_turmas(turma_id);

-- 9. Tabela: avaliacoes
CREATE TABLE IF NOT EXISTS avaliacoes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aluno_id BIGINT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    professor_id BIGINT NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL,
    valor VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'positiva',
    pontos INT NOT NULL DEFAULT 0,
    observacao TEXT,
    consentido BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_aluno_id ON avaliacoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_professor_id ON avaliacoes(professor_id);

-- 10. Tabela: desejos
CREATE TABLE IF NOT EXISTS desejos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aluno_id BIGINT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    produto_id BIGINT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(aluno_id, produto_id) -- Impede itens duplicados na lista de desejos
);

CREATE INDEX IF NOT EXISTS idx_desejos_aluno_id ON desejos(aluno_id);
CREATE INDEX IF NOT EXISTS idx_desejos_produto_id ON desejos(produto_id);

-- 11. Tabela: compras
CREATE TABLE IF NOT EXISTS compras (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aluno_id BIGINT NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    produto_id BIGINT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    custo_pontos INT NOT NULL CHECK (custo_pontos >= 0),
    autorizado_por BIGINT REFERENCES responsaveis(id) ON DELETE SET NULL,
    entregue BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compras_aluno_id ON compras(aluno_id);
CREATE INDEX IF NOT EXISTS idx_compras_produto_id ON compras(produto_id);
CREATE INDEX IF NOT EXISTS idx_compras_entregue ON compras(entregue);

-- ============================================================
-- Carga Inicial (Seed Data)
-- ============================================================

-- NOTA: Substitua 'adm123' pelo hash gerado pela sua aplicação (ex: bcrypt/argon2)
INSERT INTO admins (name, password)
VALUES ('adm', 'adm123')
ON CONFLICT (name) DO UPDATE 
SET password = EXCLUDED.password;