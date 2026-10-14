export default function Input(placeholder, type = "text", id = "input", required = "", options = [], value = "") {
    if (type === "select") {
        const optionsHtml = options.map(opt =>
            `<option value="${opt.value}" ${value && String(opt.value) === String(value) ? 'selected' : ''}>${opt.text}</option>`
        ).join('');
        return `
            <select class="form-select" id="${id}" ${required ? 'required' : ''}>
                <option value="" disabled ${!value ? 'selected' : ''}>${placeholder || 'Selecione'}</option>
                ${optionsHtml}
            </select>
        `;
    }
    const valAttr = value !== undefined && value !== null && value !== '' ? `value="${String(value).replace(/"/g, '&quot;')}"` : '';
    return `
        <input class="form-input" type="${type}" id="${id}" placeholder="${placeholder}" ${required ? 'required' : ''} ${valAttr} />
    `;
}
