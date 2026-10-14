/**
 * Utilitários do PoloCoin
 * 
 * Funções auxiliares para debounce em buscas, formatação de datas,
 * tratamento de strings e manipulação de valores monetários escolares.
 */

/**
 * Cria uma versão com debounce de uma função para evitar execuções excessivas em buscas ao vivo.
 * @param {Function} func Função a ser executada
 * @param {number} wait Tempo de espera em milissegundos
 * @returns {Function}
 */
export function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Capitaliza a primeira letra de uma string de forma segura contra null/undefined.
 * @param {string} str
 * @returns {string}
 */
export function capitalizar(str) {
    if (!str) return '';
    const s = String(str);
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Formata datas no padrão brasileiro (DD/MM/AAAA) com ou sem hora.
 * @param {string|Date} dataStr
 * @param {boolean} incluirHora
 * @returns {string}
 */
export function formatarDataBR(dataStr, incluirHora = false) {
    if (!dataStr) return '—';
    try {
        const d = new Date(dataStr);
        if (isNaN(d.getTime())) {
            // Tenta formato YYYY-MM-DD
            if (typeof dataStr === 'string' && dataStr.includes('-')) {
                const parts = dataStr.split('T')[0].split('-');
                if (parts.length === 3) {
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                }
            }
            return String(dataStr);
        }

        const opcoes = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'America/Sao_Paulo'
        };

        if (incluirHora) {
            opcoes.hour = '2-digit';
            opcoes.minute = '2-digit';
        }

        return new Intl.DateTimeFormat('pt-BR', opcoes).format(d);
    } catch {
        return String(dataStr);
    }
}

/**
 * Formata valores numéricos de PoloCoins para exibição tabular limpa.
 * @param {number|string} valor
 * @returns {string}
 */
export function formatarPoloCoins(valor) {
    const num = Number(valor);
    if (isNaN(num)) return '0 🪙';
    return `${num.toLocaleString('pt-BR')} 🪙`;
}

if (typeof window !== 'undefined') {
    window.PoloHelpers = {
        debounce,
        capitalizar,
        formatarDataBR,
        formatarPoloCoins
    };
}
