import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { DATA_RETENTION } from '../config/dataRetention.js';

let timerAgendador = null;
let ultimoStatusExecucao = {
    ultimaExecucao: null,
    entregasRemovidas: 0,
    ocorrenciasRemovidas: 0,
    sucesso: true,
    mensagem: 'Nenhuma execução realizada ainda'
};

/**
 * Calcula a data limite em formato ISO com base no número de anos configurados.
 * @param {number} anos - Quantidade de anos para subtrair da data atual.
 * @returns {string} Timestamp ISO 8601 correspondente à data limite.
 */
export function calcularDataLimite(anos) {
    const anosNum = Number(anos) || 0;
    const dataLimite = new Date();
    dataLimite.setFullYear(dataLimite.getFullYear() - anosNum);
    return dataLimite.toISOString();
}

/**
 * Remove registros de compras/entregas com data de criação anterior ao prazo estipulado.
 * @param {number} [anos=DATA_RETENTION.productDeliveriesYears]
 * @returns {Promise<{ removidos: number, dataLimite: string }>}
 */
export async function limparEntregasAntigas(anos = DATA_RETENTION.productDeliveriesYears) {
    const dataLimite = calcularDataLimite(anos);
    console.log(`[RETENÇÃO] Limpando entregas de produtos anteriores a ${dataLimite} (${anos} anos)...`);

    const { data, error } = await supabase
        .from('compras')
        .delete()
        .lt('criado_em', dataLimite)
        .select('id');

    if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
            throw new Error('Chave de API do Supabase inválida no arquivo .env');
        }
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
            throw new Error('Tabela "compras" ainda não criada no banco (execute restaurar_db.sql no Supabase)');
        }
        throw new Error(`Erro ao limpar entregas: ${error.message}`);
    }

    const removidos = data ? data.length : 0;
    console.log(`[RETENÇÃO] Entregas antigas removidas: ${removidos}`);
    return { removidos, dataLimite };
}

/**
 * Remove registros de ocorrências (avaliações) com data anterior ao prazo estipulado.
 * Não afeta o saldo atual dos alunos, pois este é persistido na tabela 'alunos'.
 * @param {number} [anos=DATA_RETENTION.occurrencesYears]
 * @returns {Promise<{ removidos: number, dataLimite: string }>}
 */
export async function limparOcorrenciasAntigas(anos = DATA_RETENTION.occurrencesYears) {
    const dataLimite = calcularDataLimite(anos);
    console.log(`[RETENÇÃO] Limpando ocorrências de alunos anteriores a ${dataLimite} (${anos} anos)...`);

    const { data, error } = await supabase
        .from('avaliacoes')
        .delete()
        .lt('criado_em', dataLimite)
        .select('id');

    if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
            throw new Error('Chave de API do Supabase inválida no arquivo .env');
        }
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
            throw new Error('Tabela "avaliacoes" ainda não criada no banco (execute restaurar_db.sql no Supabase)');
        }
        throw new Error(`Erro ao limpar ocorrências: ${error.message}`);
    }

    const removidos = data ? data.length : 0;
    console.log(`[RETENÇÃO] Ocorrências antigas removidas: ${removidos}`);
    return { removidos, dataLimite };
}

/**
 * Executa o ciclo completo de limpeza de dados de acordo com a configuração centralizada.
 * @returns {Promise<typeof ultimoStatusExecucao>}
 */
export async function executarLimpezaGeral() {
    if (!isSupabaseConfigured) {
        console.warn('[RETENÇÃO] ⚠️ Rotina pausada: informe SUPABASE_URL e SUPABASE_ANON_KEY válidas no arquivo .env.');
        return ultimoStatusExecucao;
    }
    const inicio = new Date();
    console.log(`[RETENÇÃO] Iniciando rotina automática de limpeza de dados em ${inicio.toISOString()}...`);

    try {
        const [resEntregas, resOcorrencias] = await Promise.all([
            limparEntregasAntigas(DATA_RETENTION.productDeliveriesYears),
            limparOcorrenciasAntigas(DATA_RETENTION.occurrencesYears)
        ]);

        ultimoStatusExecucao = {
            ultimaExecucao: inicio.toISOString(),
            entregasRemovidas: resEntregas.removidos,
            dataLimiteEntregas: resEntregas.dataLimite,
            ocorrenciasRemovidas: resOcorrencias.removidos,
            dataLimiteOcorrencias: resOcorrencias.dataLimite,
            sucesso: true,
            mensagem: `Limpeza concluída com sucesso. Entregas removidas: ${resEntregas.removidos}. Ocorrências removidas: ${resOcorrencias.removidos}.`
        };

        console.log(`[RETENÇÃO] ${ultimoStatusExecucao.mensagem}`);
        return ultimoStatusExecucao;
    } catch (err) {
        ultimoStatusExecucao = {
            ultimaExecucao: inicio.toISOString(),
            entregasRemovidas: 0,
            ocorrenciasRemovidas: 0,
            sucesso: false,
            mensagem: err.message
        };
        console.warn(`[RETENÇÃO] ⚠️ ${err.message}`);
        return ultimoStatusExecucao;
    }
}

/**
 * Retorna o status da política de retenção e última execução.
 */
export function obterStatusRetencao() {
    return {
        configuracao: {
            productDeliveriesYears: DATA_RETENTION.productDeliveriesYears,
            occurrencesYears: DATA_RETENTION.occurrencesYears,
            checkIntervalHours: (DATA_RETENTION.checkIntervalMs || 86400000) / (1000 * 60 * 60)
        },
        ultimoStatus: ultimoStatusExecucao
    };
}

/**
 * Inicializa o agendador diário da política de retenção.
 * Executa uma verificação inicial logo após a subida do servidor e agenda repetições diárias.
 */
export function iniciarAgendadorRetencao() {
    if (timerAgendador) {
        clearInterval(timerAgendador);
    }

    const intervaloMs = DATA_RETENTION.checkIntervalMs || 24 * 60 * 60 * 1000;
    console.log(`[RETENÇÃO] Serviço de retenção agendado para rodar a cada ${(intervaloMs / 3600000).toFixed(1)}h.`);

    // Executa a primeira limpeza 5 segundos após a inicialização para não interferir na subida inicial do servidor
    setTimeout(() => {
        executarLimpezaGeral().catch(err => {
            console.error('[RETENÇÃO] Erro na execução inicial de limpeza:', err);
        });
    }, 5000);

    // Agenda execuções periódicas a cada 24 horas
    timerAgendador = setInterval(() => {
        executarLimpezaGeral().catch(err => {
            console.error('[RETENÇÃO] Erro na execução periódica de limpeza:', err);
        });
    }, intervaloMs);

    return timerAgendador;
}
