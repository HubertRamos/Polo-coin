import Input from "../Input/index.js"

/**
 * Form - Formulário padronizado do PoloCoin
 * @param {string} type Título do formulário (também vira texto do botão se submitText não for dado)
 * @param {Array} inputs Lista de campos { label, placeholder, type, id, required, options, value }
 * @param {Array} categorias Categorias opcionais (select de categoria)
 * @param {string|null} submitText Texto customizado do botão de envio
 * @param {string|null} selectedCategoria Categoria pré-selecionada
 * @param {Object} [options] Opções: { hideTitle: boolean }
 */
export default function Form(type, inputs = [], categorias = [], submitText = null, selectedCategoria = null, { hideTitle = false } = {}) {
    const inputsHtml = inputs.map(item => {
        return `
            <div class="form-group">
                <label class="form-label" for="${item.id}">${item.label}</label>
                ${Input(item.placeholder, item.type, item.id, item.required, item.options || [], item.value !== undefined ? item.value : "")}
            </div>
        `;
    }).join('');

    const selectHtml = categorias.length > 0 ? `
        <div class="form-group">
            <label class="form-label" for="categoria-select">Categoria</label>
            <select class="form-select" id="categoria-select" name="categoria_id" required>
                <option value="" disabled ${!selectedCategoria ? 'selected' : ''}>Selecione uma categoria</option>
                ${categorias.map(cat => {
                    const isSelected = selectedCategoria && (String(cat.id) === String(selectedCategoria) || cat.nome === selectedCategoria);
                    return `<option value="${cat.id}" ${isSelected ? 'selected' : ''}>${cat.nome}</option>`;
                }).join('')}
            </select>
        </div>
    ` : '';

    const btnTexto = submitText || type;

    return `
        <form id="meu-form" class="polocoin-form">
            ${!hideTitle && type ? `<h1 class="polocoin-form__title">${type}</h1>` : ''}
            ${inputsHtml}
            ${selectHtml}
            <button type="submit" class="btn btn-primary btn--lg w-full polocoin-form__submit">${btnTexto}</button>
        </form>
    `;
}
