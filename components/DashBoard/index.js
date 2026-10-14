/**
 * Componente DashBoard Dinâmico
 * @param {string} title - Título exibido no topo
 * @param {boolean} showAddButton - Se true, exibe o botão de Adicionar no topo
 * @param {boolean} showEditButton - Se true, exibe o botão de Editar em cada item da lista
 */
export default function DashBoard(title, showAddButton = false, showEditButton = false) {

    const addButtonHtml = showAddButton ? `
        <button class="btn btn-success btn--sm" id="btn-add-item">+ Adicionar</button>
    ` : '';

    return `
        <div class="dashboard-panel">
            <div class="dashboard-panel__header">
                <h1 class="dashboard-panel__title">${title}</h1>
                ${addButtonHtml}
            </div>

            <div class="dashboard-panel__lista" id="dashboard-content">
                <p class="text-muted">Carregando...</p>
            </div>
        </div>
    `;
}
