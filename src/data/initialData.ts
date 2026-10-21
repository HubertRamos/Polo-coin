import { Turma, Professor, Responsavel, Aluno, Produto, Categoria, Avaliacao, Compra, Desejo } from '../types';
import { PRODUCT_CATEGORIES } from '../config/productCategories';

export const INITIAL_TURMAS: Turma[] = [];
export const INITIAL_PROFESSORES: Professor[] = [];
export const INITIAL_RESPONSAVEIS: Responsavel[] = [];
export const INITIAL_ALUNOS: Aluno[] = [];
export const INITIAL_PRODUTOS: Produto[] = [];

// Gerado dinamicamente a partir da fonte única de verdade: src/config/productCategories.ts
export const INITIAL_CATEGORIAS: Categoria[] = PRODUCT_CATEGORIES.map((c, index) => ({
  id: index + 1,
  nome: c.nome,
}));

export const INITIAL_AVALIACOES: Avaliacao[] = [];
export const INITIAL_COMPRAS: Compra[] = [];
export const INITIAL_DESEJOS: Desejo[] = [];
