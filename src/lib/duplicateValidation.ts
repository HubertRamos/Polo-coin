import { Professor, Aluno, Produto } from '../types';

/**
 * Normaliza um texto para comparação segura de identificadores únicos:
 * - Remove espaços no início e fim
 * - Reduz múltiplos espaços internos para um único espaço
 * - Converte para minúsculas
 * - Remove acentos (opcional para identificadores como username, mas preserva caracteres básicos)
 */
export function normalizarIdentificador(txt: string | undefined | null): string {
  if (!txt) return '';
  return txt
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function normalizarUsuario(txt: string | undefined | null): string {
  if (!txt) return '';
  return txt
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]/g, '');
}

export interface DuplicateValidationResult {
  isDuplicate: boolean;
  field?: 'usuario' | 'matricula' | 'aluno_turma' | 'codigo' | 'produto_categoria';
  message?: string;
}

/**
 * Validação de duplicidade para Professores:
 * Identificador único: `usuario` (login de acesso).
 * REGRA: O mesmo usuário não pode existir mais de uma vez (case-insensitive, sem espaços).
 * FALSOS POSITIVOS EVITADOS: Dois professores podem ter o mesmo nome, desde que possuam usuários diferentes.
 */
export function validarDuplicidadeProfessor(
  dados: { usuario: string; name?: string },
  professoresExistentes: Professor[],
  excludeId?: number
): DuplicateValidationResult {
  const userNorm = normalizarUsuario(dados.usuario);

  if (!userNorm) {
    return { isDuplicate: false };
  }

  const conflito = professoresExistentes.find(p => {
    if (excludeId !== undefined && p.id === excludeId) return false;
    return normalizarUsuario(p.usuario) === userNorm;
  });

  if (conflito) {
    return {
      isDuplicate: true,
      field: 'usuario',
      message: `Já existe um professor cadastrado com este usuário de acesso (@${userNorm}).`,
    };
  }

  return { isDuplicate: false };
}

/**
 * Validação de duplicidade para Alunos:
 * Identificadores únicos:
 * 1. `matricula` (quando informada): Identificador escolar global único. Ninguém pode ter a mesma matrícula.
 * 2. `(turmaId, nome)`: Não é permitido duplicar a matrícula do mesmo aluno na MESMA turma.
 * FALSOS POSITIVOS EVITADOS: Dois alunos com o mesmo nome em turmas DIFERENTES são permitidos.
 */
export function validarDuplicidadeAluno(
  dados: { nome: string; turmaId: number; matricula?: string },
  alunosExistentes: Aluno[],
  excludeId?: number
): DuplicateValidationResult {
  const nomeNorm = normalizarIdentificador(dados.nome);
  const matNorm = normalizarIdentificador(dados.matricula);

  // 1. Verificação por Matrícula Escolar Única (se fornecida)
  if (matNorm) {
    const conflitoMatricula = alunosExistentes.find(a => {
      if (excludeId !== undefined && a.id === excludeId) return false;
      return a.matricula && normalizarIdentificador(a.matricula) === matNorm;
    });

    if (conflitoMatricula) {
      return {
        isDuplicate: true,
        field: 'matricula',
        message: `Esta matrícula escolar (${dados.matricula?.trim()}) já está vinculada a outro(a) aluno(a) cadastrado(a).`,
      };
    }
  }

  // 2. Verificação por Nome dentro da mesma Turma
  if (nomeNorm && dados.turmaId) {
    const conflitoTurma = alunosExistentes.find(a => {
      if (excludeId !== undefined && a.id === excludeId) return false;
      return a.turmaId === dados.turmaId && normalizarIdentificador(a.nome) === nomeNorm;
    });

    if (conflitoTurma) {
      return {
        isDuplicate: true,
        field: 'aluno_turma',
        message: `Já existe um(a) aluno(a) cadastrado(a) nesta turma com o nome "${dados.nome.trim()}".`,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Validação de duplicidade para Produtos:
 * Identificadores únicos:
 * 1. `codigo` / SKU (quando informado): Código único de produto na loja.
 * 2. `(categoria, nome)`: Não pode haver dois produtos com o mesmo nome na mesma categoria.
 * FALSOS POSITIVOS EVITADOS: Produtos com o mesmo nome em categorias distintas são permitidos se não tiverem o mesmo código.
 */
export function validarDuplicidadeProduto(
  dados: { nome: string; categoria: string; codigo?: string },
  produtosExistentes: Produto[],
  excludeId?: number
): DuplicateValidationResult {
  const nomeNorm = normalizarIdentificador(dados.nome);
  const catNorm = normalizarIdentificador(dados.categoria || 'Geral');
  const codNorm = normalizarIdentificador(dados.codigo);

  // 1. Verificação por Código / SKU único (se fornecido)
  if (codNorm) {
    const conflitoCodigo = produtosExistentes.find(p => {
      if (excludeId !== undefined && p.id === excludeId) return false;
      return p.codigo && normalizarIdentificador(p.codigo) === codNorm;
    });

    if (conflitoCodigo) {
      return {
        isDuplicate: true,
        field: 'codigo',
        message: `Já existe um produto com o código / SKU "${dados.codigo?.trim()}".`,
      };
    }
  }

  // 2. Verificação por Nome na mesma Categoria
  if (nomeNorm) {
    const conflitoNomeCat = produtosExistentes.find(p => {
      if (excludeId !== undefined && p.id === excludeId) return false;
      return (
        normalizarIdentificador(p.nome) === nomeNorm &&
        normalizarIdentificador(p.categoria || 'Geral') === catNorm
      );
    });

    if (conflitoNomeCat) {
      return {
        isDuplicate: true,
        field: 'produto_categoria',
        message: `Já existe um produto cadastrado com o nome "${dados.nome.trim()}" na categoria "${dados.categoria || 'Geral'}".`,
      };
    }
  }

  return { isDuplicate: false };
}
