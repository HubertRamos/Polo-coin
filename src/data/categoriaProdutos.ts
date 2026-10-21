/**
 * Módulo de compatibilidade: reexporta as categorias centralizadas de src/config/productCategories.ts
 */
export {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORIES as CATEGORIAS_PADRAO,
  getCategoriaIcone,
  DEFAULT_PRODUCT_CATEGORY,
} from '../config/productCategories';
export type { ProductCategoryConfig, ProductCategoryConfig as CategoriaInfo } from '../config/productCategories';
