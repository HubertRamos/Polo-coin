/**
 * Componente Badge - Indicadores Visuais de Status
 * 
 * Responsabilidade:
 * - Renderizar etiquetas limpas e acessíveis para status, categorias e pontuações
 * - Evitar pill sandwiches caóticos
 * - Alto contraste e alinhamento visual
 */

const VARIANTS = {
    success: 'polocoin-badge--success',
    danger: 'polocoin-badge--danger',
    warning: 'polocoin-badge--warning',
    info: 'polocoin-badge--info',
    neutral: 'polocoin-badge--neutral',
    polo: 'polocoin-badge--polo'
};

export default function Badge({
    variant = 'neutral',
    text = '',
    icon = '',
    className = '',
    style = ''
} = {}) {
    const variantClass = VARIANTS[variant] || VARIANTS.neutral;
    return `
        <span class="polocoin-badge ${variantClass} ${className}" style="${style}">
            ${icon ? `<span class="polocoin-badge__icon" aria-hidden="true">${icon}</span>` : ''}
            <span class="polocoin-badge__text">${text}</span>
        </span>
    `.trim();
}
