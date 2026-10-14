import AlunoAvatar from '../AlunoAvatar/index.js';
import Toast from '../Toast/index.js';
import { SkeletonCardAluno } from '../Skeleton/index.js';

/**
 * Renderiza o dashboard do responsável (filhos + desejos)
 * Permite aprovação de pedidos da Lista de Desejos e controle de permissões de compra.
 */

export async function renderDashboard(root) {
    const user = JSON.parse(sessionStorage.getItem('poloUser') || '{}');

    // Funções globais seguras (sem window.confirm ou window.alert que são bloqueados em iframes)
    window.autorizarCompra = async function(alunoId, produtoId, btnElement) {
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = '⏳ Processando...';
        }

        try {
            console.log('[Responsável] Enviando autorização de compra:', { aluno_id: alunoId, produto_id: produtoId, responsavel_id: user?.id });
            const resposta = await fetch('/responsavel/comprar-desejo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    aluno_id: Number(alunoId),
                    produto_id: Number(produtoId),
                    responsavel_id: user?.id || null
                })
            });

            const resultado = await resposta.json();
            console.log('[Responsável] Resposta autorização de compra:', resultado);

            if (resposta.ok) {
                // Atualiza o dashboard automaticamente para refletir a remoção do desejo e novos pontos
                const conteudo = document.getElementById('conteudo-principal') || root;
                if (conteudo) {
                    await renderDashboard(conteudo);
                }

                // Exibe feedback visual de sucesso
                Toast.success(`Pedido de "${resultado.produto?.nome || 'Item'}" aprovado com sucesso! Movido para entregas.`);
            } else {
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = '✅ Autorizar';
                }
                Toast.error(resultado.error || 'Erro ao processar autorização.');
            }
        } catch (erro) {
            console.error('Erro ao autorizar compra:', erro);
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = '✅ Autorizar';
            }
            Toast.error('Não foi possível comunicar com o servidor.');
        }
    };

    window.liberarCompra = async function(alunoId, btnElement) {
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = '⏳ Atualizando...';
        }
        try {
            const resposta = await fetch('/aluno/pode-comprar', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aluno_id: Number(alunoId), pode_comprar: true })
            });
            if (resposta.ok) {
                const conteudo = document.getElementById('conteudo-principal') || root;
                if (conteudo) await renderDashboard(conteudo);
                Toast.success('Permissão de compras liberada com sucesso!');
            } else {
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = '🔓 Liberar';
                }
                Toast.error('Erro ao liberar compras.');
            }
        } catch (e) {
            console.error('Erro ao liberar compras:', e);
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = '🔓 Liberar';
            }
            Toast.error('Erro de conexão ao liberar compras.');
        }
    };

    window.bloquearCompra = async function(alunoId, btnElement) {
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = '⏳ Atualizando...';
        }
        try {
            const resposta = await fetch('/aluno/pode-comprar', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aluno_id: Number(alunoId), pode_comprar: false })
            });
            if (resposta.ok) {
                const conteudo = document.getElementById('conteudo-principal') || root;
                if (conteudo) await renderDashboard(conteudo);
                Toast.warning('Compras bloqueadas para o aluno.');
            } else {
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = '🔒 Bloquear';
                }
                Toast.error('Erro ao bloquear compras.');
            }
        } catch (e) {
            console.error('Erro ao bloquear compras:', e);
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = '🔒 Bloquear';
            }
            Toast.error('Erro de conexão ao bloquear compras.');
        }
    };

    root.innerHTML = `
        <div class="resp-dashboard">
            <div class="resp-header">
                <h1 class="resp-header__title">Painel do Responsável</h1>
                <p class="resp-header__subtitle">Controle os saldos e pedidos de compra dos seus filhos</p>
            </div>

            <!-- Feedback visual para ações do responsável -->
            <div id="resp-feedback" class="alert" style="display: none; margin-bottom: 20px;"></div>

            <div id="resp-stats" class="resp-stats"></div>

            <div class="resp-secao">
                <div class="resp-secao__header">
                    <div class="resp-secao__icon resp-secao__icon--purple">👨‍👧‍👦</div>
                    <h2 class="resp-secao__title">Meus Filhos</h2>
                    <span id="resp-filhos-count" class="resp-secao__count"></span>
                </div>
                <div id="resp-filhos-grid" class="filhos-grid"></div>
            </div>

            <div class="resp-secao">
                <div class="resp-secao__header">
                    <div class="resp-secao__icon resp-secao__icon--orange">📦</div>
                    <h2 class="resp-secao__title">Pedidos de Compra (Lista de Desejos)</h2>
                    <span id="resp-desejos-count" class="resp-secao__count"></span>
                </div>
                <div id="resp-desejos-grid" class="desejos-grid"></div>
            </div>
        </div>
    `;

    try {
        const [filhosResp, desejosResp] = await Promise.all([
            fetch(`/responsavel/filhos?id=${user.id}`),
            fetch(`/responsavel/desejos?id=${user.id}`)
        ]);

        const filhos = await filhosResp.json();
        const desejosData = await desejosResp.json();

        // Total de desejos
        const totalDesejos = (desejosData || []).reduce((s, item) => s + (item.desejos?.length || 0), 0);

        const countFilhosEl = document.getElementById('resp-filhos-count');
        const countDesejosEl = document.getElementById('resp-desejos-count');
        if (countFilhosEl) countFilhosEl.textContent = `(${filhos.length || 0})`;
        if (countDesejosEl) countDesejosEl.textContent = `(${totalDesejos})`;

        // Lista de Filhos
        const filhosGrid = document.getElementById('resp-filhos-grid');
        if (filhosGrid) {
            if (!filhos || filhos.length === 0) {
                filhosGrid.innerHTML = `
                    <div class="empty-block" style="grid-column: 1/-1;">
                        <div class="empty-block__icon">👶</div>
                        <p class="empty-block__text">Nenhum filho associado a você.</p>
                    </div>
                `;
            } else {
                filhosGrid.innerHTML = filhos.map(filho => {
                    const statusClass = filho.pode_comprar ? 'filho-status--liberado' : 'filho-status--bloqueado';
                    const statusText = filho.pode_comprar ? '✅ Liberado' : '🔒 Bloqueado';
                    return `
                        <div class="filho-card">
                            <div class="filho-card__top">
                                ${AlunoAvatar({ aluno: filho, tamanho: 'medio', formato: 'avatar-only' })}
                                <div class="filho-info">
                                    <h3 class="filho-nome">${AlunoAvatar({ aluno: filho, tamanho: 'pequeno', formato: 'inline' })}</h3>
                                    <span class="filho-meta">
                                        ${filho.serie || '?'}º${filho.turma || '?'} · ID ${filho.id}
                                    </span>
                                </div>
                                <div class="filho-saldo">
                                    <div class="filho-saldo__badge">
                                        🪙 ${filho.pontos} <span>PoloCoins</span>
                                    </div>
                                    <span class="filho-status ${statusClass}">${statusText}</span>
                                </div>
                            </div>
                            <div class="filho-card__acoes">Liberdade de compra
                                ${filho.pode_comprar
                                    ? `<button class="btn btn-danger btn--sm" onclick="window.bloquearCompra(${filho.id}, this)">🔒 Bloquear</button>`
                                    : `<button class="btn btn-success btn--sm" onclick="window.liberarCompra(${filho.id}, this)">🔓 Liberar</button>`}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Lista de Desejos
        const todosDesejos = (desejosData || []).flatMap(item =>
            (item.desejos || []).map(d => ({
                aluno: item.aluno,
                ...d
            }))
        );

        const desejosGrid = document.getElementById('resp-desejos-grid');
        if (desejosGrid) {
            if (todosDesejos.length === 0) {
                desejosGrid.innerHTML = `
                    <div class="empty-block" style="grid-column: 1/-1;">
                        <div class="empty-block__icon">🎉</div>
                        <p class="empty-block__text">Nenhum pedido de compra pendente na Lista de Desejos.</p>
                    </div>
                `;
            } else {
                desejosGrid.innerHTML = todosDesejos.map(desejo => {
                    const nomeProd = desejo.produto_nome || 'Produto';
                    const custo = Number(desejo.custo_pontos || 0);

                    return `
                        <div class="desejo-card" id="card-desejo-${desejo.aluno_id}-${desejo.produto_id}">
                            <div class="desejo-card__top">
                                <div class="desejo-icone">📦</div>
                                <div class="desejo-info">
                                    <h3 class="desejo-nome">${nomeProd}</h3>
                                    <span class="desejo-meta">
                                        Filho: <strong>${AlunoAvatar({ aluno: desejo.aluno, tamanho: 'mini', formato: 'inline' })}</strong> · 🪙 ${custo} PoloCoins
                                    </span>
                                </div>
                                <div class="desejo-preco">
                                    <span class="desejo-preco__value">🪙 ${custo}</span>
                                    <span class="desejo-preco__label">custo</span>
                                </div>
                            </div>
                            <div class="desejo-card__acoes">
                                <button
                                    class="btn btn-success btn--sm btn-autorizar"
                                    data-aluno-id="${desejo.aluno_id}"
                                    data-produto-id="${desejo.produto_id}"
                                    onclick="window.autorizarCompra(${desejo.aluno_id}, ${desejo.produto_id}, this)"
                                >
                                    ✅ Autorizar
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (erro) {
        console.error('Erro ao carregar dados do responsável:', erro);
        const filhosGrid = document.getElementById('resp-filhos-grid');
        if (filhosGrid) {
            filhosGrid.innerHTML = `
                <div class="empty-block" style="grid-column: 1/-1;">
                    <p class="alert alert-danger" style="text-align: center; padding: 20px;">Erro ao carregar dados. Tente novamente.</p>
                </div>
            `;
        }
    }
}
