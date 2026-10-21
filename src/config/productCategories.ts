/**
 * Configuração Centralizada de Categorias de Produtos do PoloCoin
 * 
 * FONTE ÚNICA DE VERDADE:
 * Para adicionar, remover ou modificar categorias disponíveis no sistema,
 * edite EXCLUSIVAMENTE esta lista `PRODUCT_CATEGORIES`.
 * 
 * Exemplo para adicionar uma nova categoria:
 * { id: 'papelaria', nome: 'Papelaria', icone: '✏️', descricao: 'Materiais escolares e escrita' },
 */

export interface ProductCategoryConfig {
  id: string; // Identificador estável
  nome: string; // Nome exibido na interface
  icone?: string; // Emoji ou ícone representativo
  descricao?: string; // Descrição opcional
}

export const PRODUCT_CATEGORIES: ProductCategoryConfig[] = [
  { id: 'alimentacao', nome: 'Alimentação', icone: '🍎', descricao: 'Lanches, guloseimas e bebidas' },
  { id: 'beleza', nome: 'Beleza', icone: '💅', descricao: 'Itens de cuidado pessoal e estética' },
  { id: 'vestuario', nome: 'Vestuário', icone: '👕', descricao: 'Roupas, bonés e acessórios' },
  { id: 'limpeza', nome: 'Limpeza', icone: '🧹', descricao: 'Produtos de higiene e conservação' },
  { id: 'eletronicos', nome: 'Eletrônicos', icone: '🎧', descricao: 'Fones, cabos e dispositivos' },
  { id: 'brinquedos', nome: 'Brinquedos', icone: '🧸', descricao: 'Jogos, pelúcias e passatempos' },
];

/**
 * Retorna o ícone associado a uma categoria de forma dinâmica,
 * buscando diretamente na lista centralizada sem condições fixas espalhadas.
 */
export function getCategoriaIcone(nomeCategoria: string | undefined | null): string {
  if (!nomeCategoria) return '📦';
  const norm = nomeCategoria.trim().toLowerCase();
  const encontrada = PRODUCT_CATEGORIES.find(
    c => c.nome.toLowerCase() === norm || c.id.toLowerCase() === norm
  );
  if (encontrada && encontrada.icone) return encontrada.icone;
  return '📦';
}

/**
 * Categoria padrão inicial para novos cadastros
 */
export const DEFAULT_PRODUCT_CATEGORY = PRODUCT_CATEGORIES[0];
