/**
 * Componente Toast - Sistema Global de Notificações
 * 
 * Responsabilidade:
 * - Exibir mensagens de feedback visual (sucesso, erro, aviso, informação)
 * - Auto-dismiss configurável (padrão 3.5 segundos)
 * - Botão de fechar manual e animação suave
 * - Acessível para leitores de tela (role="status" ou role="alert")
 * - Disponível como módulo ES e no objeto global window.Toast
 */

const ICONES = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
};

const TITULOS_PADRAO = {
    success: 'Sucesso',
    error: 'Erro',
    warning: 'Atenção',
    info: 'Informação'
};

function obterContainer() {
    let container = document.getElementById('polocoin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'polocoin-toast-container';
        container.className = 'polocoin-toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Exibe uma notificação toast
 * @param {'success'|'error'|'warning'|'info'} tipo 
 * @param {string} mensagem Texto da notificação
 * @param {string} [titulo] Título opcional
 * @param {number} [duracao=3500] Duração em ms (0 para fixo)
 */
export function showToast(tipo = 'info', mensagem = '', titulo = null, duracao = 3500) {
    if (!mensagem) return;

    const container = obterContainer();
    const tipoValido = ['success', 'error', 'warning', 'info'].includes(tipo) ? tipo : 'info';
    const icone = ICONES[tipoValido];
    const tituloFinal = titulo || TITULOS_PADRAO[tipoValido];

    const toast = document.createElement('div');
    toast.className = `polocoin-toast polocoin-toast--${tipoValido}`;
    toast.setAttribute('role', tipoValido === 'error' ? 'alert' : 'status');

    toast.innerHTML = `
        <div class="polocoin-toast__icon" aria-hidden="true">${icone}</div>
        <div class="polocoin-toast__content">
            <strong class="polocoin-toast__title">${tituloFinal}</strong>
            <div class="polocoin-toast__message">${mensagem}</div>
        </div>
        <button type="button" class="polocoin-toast__close" aria-label="Fechar notificação">✕</button>
        ${duracao > 0 ? `<div class="polocoin-toast__progress" style="animation-duration: ${duracao}ms;"></div>` : ''}
    `;

    const btnClose = toast.querySelector('.polocoin-toast__close');
    const fechar = () => {
        toast.classList.add('polocoin-toast--closing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 220);
    };

    if (btnClose) {
        btnClose.addEventListener('click', fechar);
    }

    container.appendChild(toast);

    // Animação de entrada
    requestAnimationFrame(() => {
        toast.classList.add('polocoin-toast--visible');
    });

    if (duracao > 0) {
        setTimeout(fechar, duracao);
    }

    return toast;
}

export const Toast = {
    success: (msg, titulo, duracao) => showToast('success', msg, titulo, duracao),
    error: (msg, titulo, duracao) => showToast('error', msg, titulo, duracao),
    warning: (msg, titulo, duracao) => showToast('warning', msg, titulo, duracao),
    info: (msg, titulo, duracao) => showToast('info', msg, titulo, duracao),
    show: showToast
};

if (typeof window !== 'undefined') {
    window.Toast = Toast;
    window.showToast = showToast;
}

export default Toast;
