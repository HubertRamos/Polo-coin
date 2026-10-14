/**
 * Componente AlunoAvatar - Reutilizável
 *
 * Responsabilidade:
 * - Exibir o avatar do aluno com garantia de fallback para '🙂' (nunca null, undefined ou vazio).
 * - Suportar diferentes tamanhos e formatos visuais (inline, badge circular, avatar-only, stacked, card-header).
 * - Garantir acessibilidade com aria-label em emojis.
 * - Evitar duplicação de lógica visual em dezenas de arquivos do projeto.
 */

export const AVATAR_PADRAO = '🙂';

/**
 * Obtém o avatar seguro com fallback padrão 🙂
 * @param {Object|string} alunoOuAvatar
 * @returns {string} Emoji seguro
 */
export function obterAvatarSeguro(alunoOuAvatar) {
    if (!alunoOuAvatar) return AVATAR_PADRAO;
    if (typeof alunoOuAvatar === 'string') {
        const limpo = alunoOuAvatar.trim();
        return limpo || AVATAR_PADRAO;
    }
    const av = alunoOuAvatar.avatar || alunoOuAvatar.aluno_avatar;
    if (av && typeof av === 'string' && av.trim()) {
        return av.trim();
    }
    return AVATAR_PADRAO;
}

/**
 * Obtém o nome seguro do aluno
 * @param {Object|string} alunoOuNome
 * @param {string} fallback
 * @returns {string} Nome formatado
 */
export function obterNomeSeguro(alunoOuNome, fallback = 'Aluno') {
    if (!alunoOuNome) return fallback;
    if (typeof alunoOuNome === 'string') {
        const limpo = alunoOuNome.trim();
        return limpo || fallback;
    }
    const nome = alunoOuNome.aluno_nome || alunoOuNome.nome;
    if (nome && typeof nome === 'string' && nome.trim()) {
        return nome.trim();
    }
    return fallback;
}

const TAMANHOS_VALIDOS = ['mini', 'pequeno', 'medio', 'grande', 'extra'];

/**
 * Componente funcional que retorna HTML em string
 * Compatível com o padrão de módulos do projeto (Vanilla JS + ES Modules)
 *
 * @param {Object} props
 * @param {Object} [props.aluno] Objeto de dados do aluno
 * @param {string} [props.avatar] Avatar direto (sobrescreve props.aluno)
 * @param {string} [props.nome] Nome direto (sobrescreve props.aluno)
 * @param {'mini'|'pequeno'|'medio'|'grande'|'extra'} [props.tamanho='medio'] Tamanho visual
 * @param {'inline'|'badge'|'avatar-only'|'stacked'|'card-header'} [props.formato='inline'] Formato de exibição
 * @param {string} [props.subtitulo] Texto ou HTML de subtítulo (ex: saldo, responsável)
 * @param {string} [props.className] Classes extras
 * @param {string} [props.style] Estilos extras
 * @returns {string} HTML renderizado
 */
export default function AlunoAvatar({
    aluno = null,
    avatar = null,
    nome = null,
    tamanho = 'medio',
    formato = 'inline',
    subtitulo = '',
    className = '',
    style = ''
} = {}) {
    const avatarFinal = obterAvatarSeguro(avatar || aluno);
    const nomeFinal = obterNomeSeguro(nome || aluno);
    const tam = TAMANHOS_VALIDOS.includes(tamanho) ? tamanho : 'medio';

    const circulo = (extraClass = '') => `
        <div class="aluno-avatar-circle aluno-avatar-circle--${tam} ${extraClass}"
             style="${style}"
             role="img"
             aria-label="Avatar de ${nomeFinal}: ${avatarFinal}">
            <span>${avatarFinal}</span>
        </div>
    `.trim();

    // 1. Apenas o Avatar com Círculo Visual e Acessibilidade
    if (formato === 'avatar-only') {
        return `
            <div class="aluno-avatar-circle aluno-avatar-circle--${tam} ${className}"
                 style="${style}"
                 role="img"
                 aria-label="Avatar de ${nomeFinal}: ${avatarFinal}">
                <span>${avatarFinal}</span>
            </div>
        `.trim();
    }

    // 2. Formato Inline: "🙂 Nome do Aluno"
    if (formato === 'inline') {
        return `
            <span class="aluno-avatar-inline aluno-avatar-inline--${tam} ${className}" style="${style}">
                <span class="aluno-avatar-emoji"
                      role="img"
                      aria-label="Avatar de ${nomeFinal}: ${avatarFinal}">
                    ${avatarFinal}
                </span>
                <span class="aluno-avatar-nome">${nomeFinal}</span>
            </span>
        `.trim();
    }

    // 3. Formato Badge: [🙂] Nome do Aluno (+ Subtítulo opcional)
    if (formato === 'badge') {
        return `
            <div class="aluno-avatar-badge aluno-avatar-badge--${tam} ${className}" style="${style}">
                ${circulo()}
                <div class="aluno-avatar-info">
                    <div class="aluno-avatar-nome">${nomeFinal}</div>
                    ${subtitulo ? `<div class="aluno-avatar-sub">${subtitulo}</div>` : ''}
                </div>
            </div>
        `.trim();
    }

    // 4. Formato Stacked (Centralizado, Avatar em cima e nome embaixo)
    if (formato === 'stacked') {
        return `
            <div class="aluno-avatar-stacked ${className}" style="${style}">
                ${circulo('aluno-avatar-circle--destaque')}
                <strong class="aluno-avatar-nome">${nomeFinal}</strong>
                ${subtitulo ? `<span class="aluno-avatar-sub">${subtitulo}</span>` : ''}
            </div>
        `.trim();
    }

    // 5. Formato Card-Header (Destaque em topos de modais ou painel)
    if (formato === 'card-header') {
        return `
            <div class="aluno-avatar-header aluno-avatar-badge--${tam} ${className}" style="${style}">
                ${circulo('aluno-avatar-circle--destaque')}
                <div style="min-width: 0;">
                    <h2 class="aluno-avatar-header__nome">${nomeFinal}</h2>
                    ${subtitulo ? `<div class="aluno-avatar-sub">${subtitulo}</div>` : ''}
                </div>
            </div>
        `.trim();
    }

    // Fallback padrão
    return `<span>${avatarFinal} ${nomeFinal}</span>`;
}
