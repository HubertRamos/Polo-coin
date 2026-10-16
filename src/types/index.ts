export type UserTipo = 'adm' | 'professor' | 'aluno' | 'responsavel';

export interface UserSession {
  id: number;
  nome: string;
  tipo: UserTipo;
  avatar: string;
  turmaNome?: string;
}

export interface Turma {
  id: number;
  serie: number;
  turma: string; // 'A', 'B', etc.
}

export interface Professor {
  id: number;
  name: string;
  usuario: string;
  password?: string;
  turmasVinculadas: number[]; // Turma IDs
}

export interface Aluno {
  id: number;
  nome: string;
  turmaId: number;
  responsavelId: number;
  avatar: string;
  pontos: number;
  pode_comprar: boolean;
  senha?: string;
}

export interface Responsavel {
  id: number;
  nome: string;
  usuario: string;
  senha?: string;
}

export interface Produto {
  id: number;
  nome: string;
  custo_pontos: number;
  categoria: string;
  imagem?: string;
  estoque?: number;
}

export interface Categoria {
  id: number;
  nome: string;
}

export interface Avaliacao {
  id: number;
  alunoId: number;
  professorId?: number;
  professorNome?: string;
  categoria: string;
  valor: string; // e.g., 'produtivo', 'bagunça'
  pontos: number;
  tipo: 'positiva' | 'negativa';
  observacao: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  consentido: boolean;
}

export interface Compra {
  id: number;
  alunoId: number;
  produtoId: number;
  produtoNome: string;
  custoPontos: number;
  categoriaNome: string;
  autorizadoPor?: number | null; // Responsavel ID if bought through wish
  criadoEm: string; // YYYY-MM-DD HH:MM
  entregue: boolean;
}

export interface Desejo {
  id: number;
  alunoId: number;
  produtoId: number;
  criadoEm: string;
  quantidade?: number;
}

export interface OpcaoAvaliacao {
  valor: string;
  label: string;
  descricao: string;
  cor: string;
  pontos: number;
  tipo: 'positiva' | 'negativa';
}

export interface CategoriaAvaliacao {
  nome: string;
  opcoes: OpcaoAvaliacao[];
}

export interface CategoriaAvatar {
  id: string;
  nome: string;
  icone: string;
  avatares: string[];
}
