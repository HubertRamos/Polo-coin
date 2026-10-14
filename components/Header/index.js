/**
 * Header - Cabeçalho fixo do PoloCoin
 * Recebe um objeto { Nome: ['url'] } e renderiza a navegação.
 * Em telas pequenas, vira um menu select compacto.
 */
export default function Header(links = {}) {
    const isMobile = window.innerWidth < 800;

    const itensMenu = Object.entries(links).map(([nome, arrayLink]) => ({
        nome: nome,
        url: arrayLink[0] || '#'
    }));

    return `
        <header class="polocoin-header">
            <div class="polocoin-header__inner">
                <a href="/index.html" class="polocoin-header__brand">
                    <div class="polocoin-header__brand-icon" aria-hidden="true">🪙</div>
                    <span>PoloCoin</span>
                </a>
                ${isMobile ? `
                    <select class="polocoin-header__mobile-menu" aria-label="Menu de navegação" onchange="window.location.href=this.value">
                        <option value="" disabled selected>Menu</option>
                        ${itensMenu.map(item => `
                            <option value="${item.url}">${item.nome}</option>
                        `).join('')}
                    </select>
                ` : `
                    <nav class="polocoin-header__nav">
                        ${itensMenu.map(item => `
                            <a href="${item.url}" class="polocoin-header__nav-link">${item.nome}</a>
                        `).join('')}
                    </nav>
                `}
            </div>
        </header>
    `;
}
