/**
 * Componente Button - Botões Padronizados do Sistema
 * 
 * Responsabilidade:
 * - Padronizar estilos de botões (primário, secundário, perigo, sucesso, aviso, ghost)
 * - Prover helper utilitário para estado de loading em requisições assíncronas
 * - Acessibilidade com aria-busy e suporte a teclado
 */

/**
 * Altera o estado de carregamento de um botão no DOM
 * @param {HTMLButtonElement|string} buttonOuSeletor
 * @param {boolean} isLoading
 * @param {string} [loadingText='Processando...']
 */
export function setButtonLoading(buttonOuSeletor, isLoading = true, loadingText = 'Processando...') {
    const btn = typeof buttonOuSeletor === 'string' 
        ? document.querySelector(buttonOuSeletor) 
        : buttonOuSeletor;

    if (!btn) return;

    if (isLoading) {
        if (!btn.dataset.originalText) {
            btn.dataset.originalText = btn.innerHTML;
        }
        btn.disabled = true;
        btn.setAttribute('aria-busy', 'true');
        btn.classList.add('btn-loading');
        btn.innerHTML = `
            <span class="btn-spinner" aria-hidden="true"></span>
            <span>${loadingText}</span>
        `;
    } else {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.classList.remove('btn-loading');
        if (btn.dataset.originalText) {
            btn.innerHTML = btn.dataset.originalText;
            delete btn.dataset.originalText;
        }
    }
}

/**
 * Renderiza HTML em string de um botão padronizado
 */
export default function Button({
    text = 'Botão',
    variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost'
    size = 'md',         // 'sm' | 'md' | 'lg'
    icon = '',
    type = 'button',
    disabled = false,
    id = '',
    className = '',
    style = '',
    onclick = ''
} = {}) {
    const classVariant = `btn-${variant}`;
    const classSize = size === 'sm' ? 'btn--sm' : size === 'lg' ? 'btn--lg' : '';

    return `
        <button
            type="${type}"
            ${id ? `id="${id}"` : ''}
            class="btn ${classVariant} ${classSize} ${className}"
            ${disabled ? 'disabled' : ''}
            ${onclick ? `onclick="${onclick}"` : ''}
            style="${style}"
        >
            ${icon ? `<span class="btn-icon" aria-hidden="true">${icon}</span>` : ''}
            <span class="btn-text">${text}</span>
        </button>
    `.trim();
}

if (typeof window !== 'undefined') {
    window.setButtonLoading = setButtonLoading;
}
