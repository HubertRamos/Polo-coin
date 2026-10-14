/**
 * Configuração centralizada da política de retenção e limpeza de dados do PoloCoin.
 * 
 * Para alterar os prazos de retenção, basta modificar os valores numéricos abaixo (em anos).
 * Nenhuma outra parte do código precisa ser alterada.
 */
export const DATA_RETENTION = {
    // Prazo de retenção para histórico de entregas de produtos (em anos)
    productDeliveriesYears: 5,

    // Prazo de retenção para histórico de ocorrências dos alunos (em anos)
    occurrencesYears: 3,

    // Intervalo de execução da rotina automática (em milissegundos - 24 horas padrão)
    checkIntervalMs: 24 * 60 * 60 * 1000
};
