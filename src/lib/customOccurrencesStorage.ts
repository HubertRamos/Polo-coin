/**
 * Módulo de Armazenamento Local Seguro e Isolado para Modelos de Ocorrências Personalizadas
 * 
 * REGRAS DE PRIVACIDADE E ISOLAMENTO:
 * 1. Os modelos são salvos EXCLUSIVAMENTE no localStorage deste navegador.
 * 2. NUNCA são enviados ao Supabase, PostgreSQL, APIs ou telemetria.
 * 3. São estritamente isolados pelo ID numérico estável do professor autenticado.
 * 4. Ao trocar de usuário, professores diferentes no mesmo navegador nunca veem modelos uns dos outros.
 */

export interface CustomOccurrenceTemplate {
  id: string;
  professorId: number;
  nome: string;
  tipo: 'positiva' | 'negativa';
  pontos: number;
  criadoEm: string;
  atualizadoEm?: string;
}

const STORAGE_KEY = 'polocoin_custom_occurrences_v1';

/**
 * Lê todos os modelos salvos no localStorage (de forma segura contra JSON corrompido)
 */
function lerTodosOsModelos(): CustomOccurrenceTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => 
      item &&
      typeof item.id === 'string' &&
      typeof item.professorId === 'number' &&
      typeof item.nome === 'string' &&
      (item.tipo === 'positiva' || item.tipo === 'negativa') &&
      typeof item.pontos === 'number'
    );
  } catch (err) {
    console.warn('[PoloCoin] Erro ao ler modelos de ocorrência do localStorage:', err);
    return [];
  }
}

/**
 * Grava a lista completa no localStorage com tratamento de cota
 */
function gravarTodosOsModelos(modelos: CustomOccurrenceTemplate[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modelos));
    return true;
  } catch (err) {
    console.error('[PoloCoin] Falha ao persistir modelos no localStorage (cota excedida ou restrição):', err);
    return false;
  }
}

/**
 * Valida os dados de uma ocorrência personalizada
 */
export function validarCamposOcorrencia(
  nome: string,
  tipo: string,
  pontos: number
): { valido: boolean; erro?: string } {
  const nomeLimpo = (nome || '').trim();
  if (!nomeLimpo) {
    return { valido: false, erro: 'Informe o nome/descrição da ocorrência.' };
  }
  if (nomeLimpo.length < 3) {
    return { valido: false, erro: 'O nome da ocorrência deve ter pelo menos 3 caracteres.' };
  }
  if (tipo !== 'positiva' && tipo !== 'negativa') {
    return { valido: false, erro: 'Selecione se a ocorrência é positiva ou negativa.' };
  }
  if (!pontos || isNaN(pontos) || pontos <= 0 || !Number.isInteger(pontos)) {
    return { valido: false, erro: 'A quantidade de PoloCoins deve ser um número inteiro maior que zero.' };
  }
  if (pontos > 500) {
    return { valido: false, erro: 'A quantidade máxima permitida por ocorrência é de 500 PoloCoins.' };
  }
  return { valido: true };
}

/**
 * Retorna exclusivamente os modelos pertencentes ao professor informado
 */
export function obterModelosDoProfessor(professorId: number | undefined | null): CustomOccurrenceTemplate[] {
  if (!professorId || typeof professorId !== 'number') return [];
  const todos = lerTodosOsModelos();
  return todos
    .filter(m => m.professorId === professorId)
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
}

/**
 * Cria ou atualiza um modelo personalizado salvo localmente para o professor autenticado
 */
export function salvarModeloPersonalizado(
  professorId: number,
  dados: {
    id?: string;
    nome: string;
    tipo: 'positiva' | 'negativa';
    pontos: number;
  }
): { success: boolean; modelo?: CustomOccurrenceTemplate; error?: string } {
  if (!professorId) {
    return { success: false, error: 'Identificação de professor inválida.' };
  }

  const validacao = validarCamposOcorrencia(dados.nome, dados.tipo, dados.pontos);
  if (!validacao.valido) {
    return { success: false, error: validacao.erro };
  }

  const todos = lerTodosOsModelos();
  const agora = new Date().toISOString();

  if (dados.id) {
    // Edição de modelo existente
    const index = todos.findIndex(m => m.id === dados.id && m.professorId === professorId);
    if (index === -1) {
      return { success: false, error: 'Modelo não encontrado para edição.' };
    }

    const atualizado: CustomOccurrenceTemplate = {
      ...todos[index],
      nome: dados.nome.trim(),
      tipo: dados.tipo,
      pontos: Math.round(dados.pontos),
      atualizadoEm: agora,
    };

    todos[index] = atualizado;
    const ok = gravarTodosOsModelos(todos);
    if (!ok) {
      return { success: false, error: 'Não foi possível salvar o modelo no armazenamento local do navegador.' };
    }
    return { success: true, modelo: atualizado };
  } else {
    // Criação de novo modelo
    const novo: CustomOccurrenceTemplate = {
      id: `mod_occ_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      professorId,
      nome: dados.nome.trim(),
      tipo: dados.tipo,
      pontos: Math.round(dados.pontos),
      criadoEm: agora,
    };

    todos.unshift(novo);
    const ok = gravarTodosOsModelos(todos);
    if (!ok) {
      return { success: false, error: 'Não foi possível salvar o modelo no armazenamento local do navegador.' };
    }
    return { success: true, modelo: novo };
  }
}

/**
 * Exclui um modelo personalizado do professor
 */
export function excluirModeloPersonalizado(
  professorId: number,
  modeloId: string
): { success: boolean; error?: string } {
  if (!professorId || !modeloId) {
    return { success: false, error: 'Parâmetros inválidos para exclusão.' };
  }

  const todos = lerTodosOsModelos();
  const filtrados = todos.filter(m => !(m.id === modeloId && m.professorId === professorId));

  if (filtrados.length === todos.length) {
    return { success: false, error: 'Modelo não encontrado.' };
  }

  const ok = gravarTodosOsModelos(filtrados);
  if (!ok) {
    return { success: false, error: 'Erro ao atualizar o armazenamento local.' };
  }
  return { success: true };
}
