import TelaLoja from '../TelaLoja/index.js'
import TelaCarrinho from '../TelaCarrinho/index.js'
import TelaOcorrencias from '../TelaOcorrencias/index.js'
import TelaEditarSenha from '../TelaSenha/index.js'
import TelaPerfil from '../TelaPerfil/index.js'

export default function MenuLateral(buttons = {}, user = {}) {
    const iconesPadrao = {
        perfil: '👤',
        loja: '🛒',
        carrinho: '🛍️',
        ocorrencias: '📋',
        senha: '🔒'
    };

    const itensMenu = Object.entries(buttons).map(([chave, item]) => ({
        chave: chave,
        nome: item.nome || chave,
        icone: item.icone || iconesPadrao[chave] || '📌',
        acao: item.acao || `window.navegarPara('${chave}')`
    }));

    window.navegarPara = async function(tela) {
        const conteudo = document.getElementById('conteudo-principal');
        if (!conteudo) return;

        // Marca o item ativo na sidebar
        document.querySelectorAll('.polocoin-sidebar__btn[data-tela]').forEach(btn => {
            const ativo = btn.dataset.tela === tela;
            btn.classList.toggle('polocoin-sidebar__btn--active', ativo);
            if (ativo) btn.setAttribute('aria-current', 'page');
            else btn.removeAttribute('aria-current');
        });

        conteudo.innerHTML = `
            <div class="loading-state">
                <div class="loading-state__icon">🪙</div>
                <p class="loading-state__text">Carregando...</p>
            </div>`;
        try {
            switch (tela) {
                case 'perfil':
                    await TelaPerfil(conteudo, user.id);
                    break;
                case 'loja':
                    await TelaLoja(conteudo, user.id);
                    break;
                case 'carrinho':
                    await TelaCarrinho(conteudo, user.id);
                    break;
                case 'ocorrencias':
                    await TelaOcorrencias(conteudo, user.id);
                    break;
                case 'senha':
                    await TelaEditarSenha(conteudo, user.id);
                    break;
                default:
                    conteudo.innerHTML = `<div class="alert alert-danger"><span>⚠️</span><p>Tela não encontrada.</p></div>`;
            }
        } catch (erro) {
            console.error('Erro ao carregar tela:', erro);
            conteudo.innerHTML = `
                <div class="alert alert-danger">
                    <span>⚠️</span>
                    <p>Erro ao carregar. Tente novamente.</p>
                </div>`;
        }
        closeMobileSidebar();
    };

    window.sair = function() {
        sessionStorage.removeItem('poloUser');
        window.location.href = '/index.html';
    };

    window.toggleMobileSidebar = function() {
        const sidebar = document.querySelector('.polocoin-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.toggle('polocoin-sidebar--open');
        if (overlay) overlay.classList.toggle('polocoin-sidebar-overlay--visible');
    };

    window.closeMobileSidebar = function() {
        const sidebar = document.querySelector('.polocoin-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('polocoin-sidebar--open');
        if (overlay) overlay.classList.remove('polocoin-sidebar-overlay--visible');
    };

    return `
        <div class="polocoin-layout">
            <div id="sidebar-overlay" class="polocoin-sidebar-overlay polocoin-sidebar-overlay--hidden"
                onclick="closeMobileSidebar()"></div>
            <button class="polocoin-sidebar-toggle" id="sidebar-toggle" onclick="toggleMobileSidebar()" aria-label="Abrir menu">
                <span class="polocoin-sidebar-toggle__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </span>
            </button>
            <aside class="polocoin-sidebar" id="sidebar">
                <div class="polocoin-sidebar__header" role="button" tabindex="0" onclick="window.navegarPara('perfil')" onkeydown="if(event.key==='Enter'||event.key===' '){window.navegarPara('perfil')}" title="Ver Meu Perfil e Avatar">
                    <div class="polocoin-sidebar__avatar" id="sidebar-aluno-avatar">
                        <span>${user.avatar || '🙂'}</span>
                    </div>
                    <div class="polocoin-sidebar__user-name">${user.nome || 'Aluno'}</div>
                    <div class="polocoin-sidebar__user-meta">Toque para ver seu perfil</div>
                </div>
                <div class="polocoin-sidebar__brand"><span class="polocoin-sidebar__brand-coin" aria-hidden="true">🪙</span> PoloCoin</div>
                <div class="polocoin-sidebar__divider"></div>
                <nav class="polocoin-sidebar__nav">
                    ${itensMenu.map(item => `
                        <button onclick="${item.acao}" class="polocoin-sidebar__btn" data-tela="${item.chave}">
                            <span class="polocoin-sidebar__btn-icon" aria-hidden="true">${item.icone}</span>
                            <span class="polocoin-sidebar__btn-label">${item.nome}</span>
                        </button>`).join('')}
                </nav>
                <div class="polocoin-sidebar__divider"></div>
                <button onclick="window.sair()" class="polocoin-sidebar__btn polocoin-sidebar__btn-danger">
                    <span class="polocoin-sidebar__btn-icon" aria-hidden="true">🚪</span>
                    <span class="polocoin-sidebar__btn-label">Sair</span>
                </button>
            </aside>
            <main id="conteudo-principal" class="polocoin-main">
                <div class="empty-state">
                    <div class="empty-state__icon">👋</div>
                    <h2 class="empty-state__text">Selecione uma opção</h2>
                    <p class="text-muted" style="font-size: 14px;">Use o menu à esquerda para navegar.</p>
                </div>
            </main>
        </div>`;
}
