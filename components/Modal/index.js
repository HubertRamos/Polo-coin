/**
 * Componente Modal - Sistema Padronizado de Modais e Popups
 * 
 * Responsabilidade:
 * - Renderizar janelas modais acessíveis e responsivas
 * - Gerenciamento automático de tecla ESC para fechar
 * - Fechamento ao clicar no overlay de fundo
 * - Retenção e restauração de foco acessível
 * - Disponível como módulo ES e no objeto global window.PoloModal
 */

let activeModals = [];
let keydownListenerAttached = false;
let lastActiveElement = null;

function handleGlobalKeydown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
        if (activeModals.length > 0) {
            const topModal = activeModals[activeModals.length - 1];
            fecharModal(topModal.id);
        }
    }
}

function attachKeydownListener() {
    if (!keydownListenerAttached) {
        document.addEventListener('keydown', handleGlobalKeydown);
        keydownListenerAttached = true;
    }
}

function detachKeydownListenerIfEmpty() {
    if (activeModals.length === 0 && keydownListenerAttached) {
        document.removeEventListener('keydown', handleGlobalKeydown);
        keydownListenerAttached = false;
    }
}

/**
 * Abre um modal padronizado
 * @param {Object} options
 * @param {string} [options.id] ID opcional do modal
 * @param {string} options.title Título principal do modal
 * @param {string} [options.subtitle] Subtítulo informativo
 * @param {string|HTMLElement} options.content Conteúdo HTML ou elemento
 * @param {string} [options.footer] HTML do rodapé/ações
 * @param {string} [options.maxWidth='560px'] Largura máxima
 * @param {Function} [options.onClose] Callback disparado ao fechar
 * @returns {string} ID do modal aberto
 */
export function abrirModal({
    id = `modal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title = '',
    subtitle = '',
    content = '',
    footer = '',
    maxWidth = '560px',
    onClose = null
} = {}) {
    // Salva elemento que tinha foco antes de abrir
    if (activeModals.length === 0) {
        lastActiveElement = document.activeElement;
    }

    // Se já existir modal com mesmo ID, fecha anterior
    fecharModal(id);

    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'polocoin-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', `${id}-title`);

    const contentHtml = typeof content === 'string' ? content : (content?.outerHTML || '');

    overlay.innerHTML = `
        <div class="polocoin-modal-container" style="max-width: ${maxWidth};">
            <div class="polocoin-modal-header">
                <div>
                    <h2 id="${id}-title" class="polocoin-modal-title">${title}</h2>
                    ${subtitle ? `<p class="polocoin-modal-subtitle">${subtitle}</p>` : ''}
                </div>
                <button type="button" class="polocoin-modal-close" aria-label="Fechar janela modal">✕</button>
            </div>
            <div class="polocoin-modal-body">
                ${contentHtml}
            </div>
            ${footer ? `<div class="polocoin-modal-footer">${footer}</div>` : ''}
        </div>
    `;

    // Fechar ao clicar no overlay fora do container
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            fecharModal(id);
        }
    });

    const btnClose = overlay.querySelector('.polocoin-modal-close');
    if (btnClose) {
        btnClose.addEventListener('click', () => fecharModal(id));
    }

    document.body.appendChild(overlay);
    document.body.classList.add('polocoin-modal-open');

    activeModals.push({ id, overlay, onClose });
    attachKeydownListener();

    // Animação de entrada
    requestAnimationFrame(() => {
        overlay.classList.add('polocoin-modal-overlay--visible');
        if (btnClose) {
            btnClose.focus();
        }
    });

    return id;
}

/**
 * Fecha um modal específico ou o modal mais recente
 * @param {string} [id] ID do modal a fechar
 */
export function fecharModal(id = null) {
    let index = -1;
    if (id) {
        index = activeModals.findIndex(m => m.id === id);
    } else if (activeModals.length > 0) {
        index = activeModals.length - 1;
    }

    if (index === -1) return;

    const [modal] = activeModals.splice(index, 1);
    if (!modal) return;

    const { overlay, onClose } = modal;
    overlay.classList.remove('polocoin-modal-overlay--visible');

    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        if (typeof onClose === 'function') {
            onClose();
        }

        if (activeModals.length === 0) {
            document.body.classList.remove('polocoin-modal-open');
            detachKeydownListenerIfEmpty();

            // Restaura foco
            if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
                try {
                    lastActiveElement.focus();
                } catch {}
            }
        }
    }, 180);
}

export const Modal = {
    open: abrirModal,
    close: fecharModal
};

if (typeof window !== 'undefined') {
    window.PoloModal = Modal;
    window.abrirModal = abrirModal;
    window.fecharModalGenerico = fecharModal;
}

export default Modal;
