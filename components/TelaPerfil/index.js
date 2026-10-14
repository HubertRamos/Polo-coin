/**
 * Tela de Perfil do Aluno com personalização de Avatar.
 * Permite escolher emojis/ícones pré-definidos divididos em 7 categorias.
 * Não permite upload, arquivos ou URLs externas.
 * Atualiza em tempo real sem recarregar a página.
 */

import Toast from '../Toast/index.js';

const CATEGORIAS_PADRAO = [
    {
        id: 'rostos',
        nome: 'Rostos',
        icone: '😀',
        avatares: [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️',
            '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋',
            '😛', '😜', '🤪', '🤓', '😎', '🥸', '🥳', '🤩', '🤠'
        ]
    },
    {
        id: 'animais',
        nome: 'Animais',
        icone: '🐶',
        avatares: [
            '🐱', '🐶', '🐺', '🦊', '🦝', '🦁', '🐯', '🐨', '🐼', '🐻',
            '🐸', '🐵', '🦄', '🦖', '🦕', '🐙', '🐬', '🐳', '🦅', '🦉',
            '🐝', '🦋', '🐢', '🐧'
        ]
    },
    {
        id: 'jogos',
        nome: 'Jogos',
        icone: '🎮',
        avatares: [
            '🎮', '🕹️', '👾', '🎲', '♟️', '🎯', '🎳', '🎪', '🪄', '🧩',
            '🃏', '🀄'
        ]
    },
    {
        id: 'esportes',
        nome: 'Esportes',
        icone: '⚽',
        avatares: [
            '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓',
            '🏸', '🥊', '🥋', '🛹', '⛸️', '🚴', '🏆', '🥇'
        ]
    },
    {
        id: 'tecnologia',
        nome: 'Tecnologia',
        icone: '🤖',
        avatares: [
            '🤖', '🚀', '🛸', '💻', '🛰️', '🔬', '🔭', '📡', '🔋', '⚡',
            '⚙️', '🖥️'
        ]
    },
    {
        id: 'criatividade',
        nome: 'Criatividade',
        icone: '🎨',
        avatares: [
            '🎨', '🎭', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎸',
            '📚', '✍️', '✏️', '💡'
        ]
    },
    {
        id: 'diversao',
        nome: 'Diversão',
        icone: '🎉',
        avatares: [
            '🔥', '💎', '👑', '⭐', '🌟', '🌈', '🍕', '🍔', '🍿', '🍦',
            '🍩', '🍭', '🎈', '🎁', '🧁', '🍪', '🌞', '🌙'
        ]
    }
];

export default async function TelaPerfil(root, alunoId) {
    if (!root) return;

    let user = JSON.parse(sessionStorage.getItem('poloUser') || '{}');
    let alunoInfo = {
        nome: user.nome || user.name || 'Aluno',
        avatar: user.avatar || '🙂',
        pontos: 0,
        turma_nome: 'Carregando...',
        responsavel_nome: 'Carregando...'
    };

    root.innerHTML = `
        <main class="container-center polocoin-main__section--centered" style="max-width: 720px;">
            <div class="tela-header">
                <div class="tela-header__icon tela-header__icon--blue">
                    <span class="tela-header__emoji" id="perfil-header-emoji">${alunoInfo.avatar}</span>
                </div>
                <div class="tela-header__info">
                    <h1 class="tela-header__title">Meu Perfil</h1>
                    <p class="tela-header__subtitle">Personalize seu avatar e acompanhe seus dados</p>
                </div>
            </div>

            <!-- Alerta de feedback dinâmico -->
            <div id="perfil-feedback-msg" class="alert alert-success" style="display: none;">
                <span id="perfil-feedback-texto">✓ Avatar atualizado com sucesso</span>
            </div>

            <!-- Seção: Meu Avatar -->
            <div class="card perfil-avatar-card">
                <h2 class="card__title-lg perfil-avatar-card__title">
                    <span aria-hidden="true">😀</span> Meu Avatar Atual
                </h2>

                <div class="perfil-avatar-card__corpo">
                    <div id="perfil-avatar-preview-box" class="perfil-avatar-preview">
                        <span id="perfil-avatar-grande">${alunoInfo.avatar}</span>
                    </div>

                    <p class="perfil-avatar-card__desc">
                        Este avatar representa você no painel da turma, ocorrências, lojinha e para seus responsáveis!
                    </p>

                    <button id="btn-abrir-seletor-avatar" class="btn btn-primary" type="button">
                        <span aria-hidden="true">🎨</span>
                        <span>Trocar Avatar</span>
                    </button>
                </div>
            </div>

            <!-- Seção: Meus Dados -->
            <div class="card">
                <h3 class="card__title-lg" style="display: flex; align-items: center; gap: 8px;">
                    <span aria-hidden="true">📌</span>
                    <span>Informações da Conta</span>
                </h3>

                <div class="perfil-info-grid">
                    <div class="perfil-info-item">
                        <small class="perfil-info-item__label">Nome do Aluno</small>
                        <strong id="perfil-info-nome">${alunoInfo.nome}</strong>
                    </div>

                    <div class="perfil-info-item">
                        <small class="perfil-info-item__label">Turma</small>
                        <strong id="perfil-info-turma">${alunoInfo.turma_nome}</strong>
                    </div>

                    <div class="perfil-info-item">
                        <small class="perfil-info-item__label">Responsável</small>
                        <strong id="perfil-info-resp">${alunoInfo.responsavel_nome}</strong>
                    </div>

                    <div class="perfil-info-item perfil-info-item--saldo">
                        <small class="perfil-info-item__label">Saldo Atual</small>
                        <strong id="perfil-info-saldo">🪙 ${alunoInfo.pontos} PoloCoins</strong>
                    </div>
                </div>

                <div class="perfil-acoes">
                    <button type="button" class="btn btn-secondary" onclick="window.navegarPara('senha')">
                        <span aria-hidden="true">🔒</span> Alterar Minha Senha
                    </button>
                </div>
            </div>
        </main>
    `;

    // Carrega dados completos do aluno do servidor
    try {
        const respAluno = await fetch(`/alunos/${alunoId}`);
        if (respAluno.ok) {
            const dados = await respAluno.json();
            if (dados) {
                alunoInfo.avatar = dados.avatar || alunoInfo.avatar || '🙂';
                alunoInfo.nome = dados.nome || alunoInfo.nome;
                alunoInfo.turma_nome = dados.turma_nome || 'N/A';
                alunoInfo.responsavel_nome = dados.responsavel_nome || 'Não informado';
                alunoInfo.pontos = dados.pontos ?? 0;

                // Atualiza sessão
                user.avatar = alunoInfo.avatar;
                sessionStorage.setItem('poloUser', JSON.stringify(user));

                // Atualiza interface
                const elAvatarGrande = document.getElementById('perfil-avatar-grande');
                const elHeaderEmoji = document.getElementById('perfil-header-emoji');
                const elNome = document.getElementById('perfil-info-nome');
                const elTurma = document.getElementById('perfil-info-turma');
                const elResp = document.getElementById('perfil-info-resp');
                const elSaldo = document.getElementById('perfil-info-saldo');

                if (elAvatarGrande) elAvatarGrande.textContent = alunoInfo.avatar;
                if (elHeaderEmoji) elHeaderEmoji.textContent = alunoInfo.avatar;
                if (elNome) elNome.textContent = alunoInfo.nome;
                if (elTurma) elTurma.textContent = alunoInfo.turma_nome;
                if (elResp) elResp.textContent = alunoInfo.responsavel_nome;
                if (elSaldo) elSaldo.textContent = `🪙 ${alunoInfo.pontos} PoloCoins`;

                // Atualiza avatar do sidebar
                const elSideAvatar = document.querySelector('#sidebar-aluno-avatar span, .polocoin-sidebar__avatar span');
                if (elSideAvatar) elSideAvatar.textContent = alunoInfo.avatar;
            }
        }
    } catch (e) {
        console.warn('Erro ao carregar dados do aluno no perfil:', e);
    }

    // Listener do botão Trocar Avatar
    const btnTrocar = document.getElementById('btn-abrir-seletor-avatar');
    if (btnTrocar) {
        btnTrocar.addEventListener('click', () => {
            abrirModalSeletorAvatar({
                alunoId,
                avatarAtual: alunoInfo.avatar,
                onAvatarSalvo: (novoAvatar) => {
                    alunoInfo.avatar = novoAvatar;
                    user.avatar = novoAvatar;
                    sessionStorage.setItem('poloUser', JSON.stringify(user));

                    // Atualiza elementos na tela
                    const elAvatarGrande = document.getElementById('perfil-avatar-grande');
                    const elHeaderEmoji = document.getElementById('perfil-header-emoji');
                    const previewBox = document.getElementById('perfil-avatar-preview-box');

                    if (elAvatarGrande) elAvatarGrande.textContent = novoAvatar;
                    if (elHeaderEmoji) elHeaderEmoji.textContent = novoAvatar;
                    if (previewBox) {
                        previewBox.style.transform = 'scale(1.15)';
                        setTimeout(() => { previewBox.style.transform = 'scale(1)'; }, 250);
                    }

                    // Atualiza avatar no menu lateral / sidebar
                    const elSideAvatar = document.querySelector('#sidebar-aluno-avatar span, .polocoin-sidebar__avatar span');
                    if (elSideAvatar) elSideAvatar.textContent = novoAvatar;

                    // Exibe feedback de sucesso: "✓ Avatar atualizado com sucesso"
                    exibirFeedbackPerfil('✓ Avatar atualizado com sucesso');
                }
            });
        });
    }
}

/**
 * Exibe notificação de feedback na tela do perfil
 */
function exibirFeedbackPerfil(texto) {
    const feedbackBox = document.getElementById('perfil-feedback-msg');
    const feedbackTexto = document.getElementById('perfil-feedback-texto');
    if (!feedbackBox || !feedbackTexto) return;

    feedbackTexto.textContent = texto;
    feedbackBox.style.display = 'block';

    setTimeout(() => {
        if (feedbackBox) feedbackBox.style.display = 'none';
    }, 4000);
}

/**
 * Modal visual de seleção de Avatar
 * Grade com categorias: Rostos, Animais, Jogos, Esportes, Tecnologia, Criatividade, Diversão.
 */
export function abrirModalSeletorAvatar({ alunoId, avatarAtual = '🙂', onAvatarSalvo = () => {} }) {
    const modalId = 'modal-seletor-avatar-aluno';
    const existente = document.getElementById(modalId);
    if (existente) existente.remove();

    let categoriaAtiva = 'rostos';
    let avatarSelecionado = avatarAtual;
    let salvando = false;

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'modal-overlay avatar-modal-overlay';

    function renderConteudo() {
        const catObj = CATEGORIAS_PADRAO.find(c => c.id === categoriaAtiva) || CATEGORIAS_PADRAO[0];

        overlay.innerHTML = `
            <div class="modal-content avatar-modal" role="dialog" aria-modal="true" aria-labelledby="modal-avatar-title">

                <!-- Header -->
                <div class="avatar-modal__header">
                    <div class="avatar-modal__header-info">
                        <div class="avatar-modal__header-icon" aria-hidden="true">🎨</div>
                        <div>
                            <h2 id="modal-avatar-title" class="avatar-modal__title">Escolha seu Novo Avatar</h2>
                            <p class="avatar-modal__subtitle">Selecione uma categoria e clique no emoji desejado</p>
                        </div>
                    </div>
                    <button id="btn-fechar-modal-avatar" type="button" class="polocoin-modal-close" aria-label="Fechar">
                        ✕
                    </button>
                </div>

                <!-- Tabs de Categorias -->
                <div class="avatar-modal__tabs">
                    ${CATEGORIAS_PADRAO.map(cat => {
                        const isAtiva = cat.id === categoriaAtiva;
                        return `
                            <button type="button" class="btn-categoria-avatar ${isAtiva ? 'btn-categoria-avatar--ativa' : ''}" data-cat="${cat.id}">
                                <span aria-hidden="true">${cat.icone}</span>
                                <span>${cat.nome}</span>
                            </button>
                        `;
                    }).join('')}
                </div>

                <!-- Corpo: Grade Visual de Emojis -->
                <div class="avatar-modal__corpo">
                    <div class="avatar-modal__corpo-info">
                        <span>
                            Categoria: <strong>${catObj.nome}</strong> (${catObj.avatares.length} opções)
                        </span>
                        <span class="text-muted text-xs">
                            Clique duas vezes para salvar direto
                        </span>
                    </div>

                    <div class="avatar-grid">
                        ${catObj.avatares.map(emoji => {
                            const isSelecionado = emoji === avatarSelecionado;
                            return `
                                <button type="button" class="btn-item-avatar ${isSelecionado ? 'btn-item-avatar--selecionado' : ''}" data-emoji="${emoji}" title="Selecionar ${emoji}">
                                    <span>${emoji}</span>
                                    ${isSelecionado ? '<span class="btn-item-avatar__check">✓</span>' : ''}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Footer: Preview e Botão Salvar -->
                <div class="avatar-modal__footer">
                    <div class="avatar-modal__preview">
                        <div class="avatar-modal__preview-box">
                            <span id="preview-avatar-selecionado">${avatarSelecionado}</span>
                        </div>
                        <div>
                            <span class="avatar-modal__preview-label">AVATAR ESCOLHIDO</span>
                            <strong class="avatar-modal__preview-texto">Pronto para aplicar</strong>
                        </div>
                    </div>

                    <div class="avatar-modal__acoes">
                        <button id="btn-cancelar-modal-avatar" type="button" class="btn btn-secondary btn--sm">
                            Cancelar
                        </button>
                        <button id="btn-confirmar-salvar-avatar" type="button" class="btn btn-success btn--sm" ${salvando ? 'disabled' : ''}>
                            <span>${salvando ? '⏳' : '✓'}</span>
                            <span>${salvando ? 'Salvando...' : 'Salvar Avatar'}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Eventos
        const btnFechar = overlay.querySelector('#btn-fechar-modal-avatar');
        const btnCancelar = overlay.querySelector('#btn-cancelar-modal-avatar');
        if (btnFechar) btnFechar.onclick = fechar;
        if (btnCancelar) btnCancelar.onclick = fechar;

        // Troca de categoria
        overlay.querySelectorAll('.btn-categoria-avatar').forEach(btn => {
            btn.onclick = () => {
                categoriaAtiva = btn.getAttribute('data-cat');
                renderConteudo();
            };
        });

        // Clique em emoji
        overlay.querySelectorAll('.btn-item-avatar').forEach(btn => {
            const emoji = btn.getAttribute('data-emoji');
            btn.onclick = () => {
                avatarSelecionado = emoji;
                renderConteudo();
            };
            btn.ondblclick = () => {
                avatarSelecionado = emoji;
                executarSalvamento();
            };
        });

        // Botão Salvar
        const btnSalvar = overlay.querySelector('#btn-confirmar-salvar-avatar');
        if (btnSalvar) {
            btnSalvar.onclick = executarSalvamento;
        }
    }

    async function executarSalvamento() {
        if (salvando) return;
        salvando = true;
        renderConteudo();

        try {
            const resp = await fetch(`/alunos/${alunoId}/avatar`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatar: avatarSelecionado })
            });

            const resultado = await resp.json();

            if (resp.ok) {
                fechar();
                Toast.success('✓ Avatar atualizado com sucesso!');
                onAvatarSalvo(resultado.avatar || avatarSelecionado);
            } else {
                Toast.error(resultado.error || 'Erro ao salvar avatar.');
                salvando = false;
                renderConteudo();
            }
        } catch (err) {
            console.error('Erro de conexão ao salvar avatar:', err);
            // Em caso de falha de conexão, aplica localmente para não bloquear o aluno
            fechar();
            Toast.info('Avatar atualizado temporariamente.');
            onAvatarSalvo(avatarSelecionado);
        }
    }

    function fechar() {
        overlay.remove();
    }

    // Fechar ao clicar fora
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fechar();
    });

    // Fechar ao pressionar ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            fechar();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    document.body.appendChild(overlay);
    renderConteudo();
}
