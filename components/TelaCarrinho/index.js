import Toast from '../Toast/index.js';

const CARRINHO_KEY = 'poloCarrinho';

function lerCarrinho() {
    try { return JSON.parse(sessionStorage.getItem(CARRINHO_KEY) || '[]'); }
    catch { return []; }
}

function salvarCarrinho(items) {
    sessionStorage.setItem(CARRINHO_KEY, JSON.stringify(items));
}

function totalCarrinho(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((s, i) => s + Number(i.custo || 0) * (Number(i.quantidade) || 1), 0);
}

function totalItensCarrinho(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((s, i) => s + (Number(i.quantidade) || 1), 0);
}

export default async function TelaCarrinho(root, alunoId) {
    const dados = JSON.parse(sessionStorage.getItem('poloUser') || '{}');
    const alunoIdNum = dados?.id || alunoId;

    let saldo = 0;
    try {
        const r = await fetch(`/aluno/saldo?id=${alunoIdNum}`);
        const d = await r.json();
        saldo = d.pontos || 0;
    } catch {}

    const renderTela = (mensagemResultado = null) => {
        const carrinho = lerCarrinho();

        // Banner de resultado de compra recente (desejos ou comprado)
        let feedbackBanner = '';
        if (mensagemResultado) {
            if (mensagemResultado.tipo === 'desejos' || mensagemResultado.status === 'desejos') {
                feedbackBanner = `
                    <div class="alert alert-warning carrinho-banner">
                        <span class="carrinho-banner__icon" aria-hidden="true">📋</span>
                        <div>
                            <h3 class="carrinho-banner__title">Pedido enviado para a Lista de Desejos!</h3>
                            <p class="carrinho-banner__text">
                                Como você está bloqueado para compras diretas, o pedido foi enviado para a Lista de Desejos e aguarda autorização do seu responsável.
                            </p>
                            <ul class="carrinho-banner__lista">
                                ${(mensagemResultado.desejos || []).map(d => `<li><strong>${d.nome}</strong> (×${d.quantidade || 1}) — 🪙 ${d.custo_total || d.custo}</li>`).join('')}
                            </ul>
                            <div class="carrinho-banner__destaque">
                                🪙 Nenhum PoloCoin foi descontado. Seu saldo continua: <strong>🪙 ${mensagemResultado.saldo_restante}</strong>
                            </div>
                        </div>
                    </div>
                `;
            } else if (mensagemResultado.tipo === 'comprado' || mensagemResultado.status === 'comprado') {
                feedbackBanner = `
                    <div class="alert alert-success carrinho-banner">
                        <span class="carrinho-banner__icon" aria-hidden="true">📦</span>
                        <div>
                            <h3 class="carrinho-banner__title">Compra realizada com sucesso!</h3>
                            <p class="carrinho-banner__text">
                                Seu pedido foi registrado e enviado para a fila de entrega (Pendentes de Entrega).
                            </p>
                            <ul class="carrinho-banner__lista">
                                ${(mensagemResultado.comprados || []).map(c => `<li><strong>${c.nome}</strong> (×${c.quantidade || 1}) — 🪙 ${c.custo_total || c.custo}</li>`).join('')}
                            </ul>
                            <div class="carrinho-banner__destaque">
                                🪙 Saldo restante: <strong>🪙 ${mensagemResultado.saldo_restante}</strong>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        if (carrinho.length === 0) {
            root.innerHTML = `
            <main class="container-center polocoin-main" style="max-width: 680px; margin-top: 70px;">
                <div class="tela-header">
                    <div class="tela-header__icon tela-header__icon--blue">
                        <span class="tela-header__emoji">🛍️</span>
                    </div>
                    <div class="tela-header__info">
                        <h1 class="tela-header__title">Meu Carrinho</h1>
                        <p class="tela-header__subtitle">Produtos selecionados para compra</p>
                    </div>
                </div>

                ${feedbackBanner}

                <div class="card carrinho-vazio">
                    <div class="carrinho-vazio__icon" aria-hidden="true">🛒</div>
                    <h2 class="carrinho-vazio__title">Seu carrinho está vazio</h2>
                    <p class="text-muted" style="font-size: 13px; margin-bottom: 20px;">Adicione produtos da loja para continuar.</p>
                    <button onclick="window.navegarPara('loja')" class="btn btn-primary">
                        ← Ir para a Loja
                    </button>
                </div>
            </main>`;
            return;
        }

        const total = totalCarrinho(carrinho);
        const totalQtd = totalItensCarrinho(carrinho);
        const falta = total - saldo;
        const podeFinalizar = saldo >= total;
        const saldoAbaixo = total > saldo;

        const itensHtml = carrinho.map(item => {
            const itemQtd = Number(item.quantidade) || 1;
            const itemCusto = Number(item.custo) || 0;
            const subtotal = itemCusto * itemQtd;

            return `
            <div class="carrinho-item">
                <div class="carrinho-item__info">
                    <strong class="carrinho-item__nome">${item.nome || 'Produto'}</strong>
                    <span class="carrinho-item__preco-unit">🪙 ${itemCusto} PoloCoins cada</span>
                </div>
                <div class="carrinho-item__acoes">
                    <div class="carrinho-qtd">
                        <button onclick="window.decrementarDoCarrinho(${item.id})" class="carrinho-qtd__btn" title="Diminuir quantidade" aria-label="Diminuir quantidade">−</button>
                        <span class="carrinho-qtd__valor">${itemQtd}</span>
                        <button onclick="window.incrementarDoCarrinho(${item.id})" class="carrinho-qtd__btn" title="Aumentar quantidade" aria-label="Aumentar quantidade">+</button>
                    </div>

                    <span class="carrinho-item__subtotal">🪙 ${subtotal}</span>

                    <button onclick="window.removerDoCarrinho(${item.id})" class="btn btn-ghost carrinho-item__remover" title="Remover produto do carrinho" aria-label="Remover produto">
                        ✕
                    </button>
                </div>
            </div>`;
        }).join('');

        root.innerHTML = `
            <main class="container-center polocoin-main" style="max-width: 680px; margin-top: 70px;">
                <div class="tela-header">
                    <div class="tela-header__icon tela-header__icon--blue">
                        <span class="tela-header__emoji">🛍️</span>
                    </div>
                    <div class="tela-header__info">
                        <h1 class="tela-header__title">Meu Carrinho</h1>
                        <p class="tela-header__subtitle">Produtos selecionados para compra</p>
                    </div>
                </div>

                ${feedbackBanner}

                <!-- Resumo dos itens -->
                <div class="card carrinho-resumo">
                    <span class="carrinho-resumo__texto">
                        🛒 Total de produtos: <strong>${totalQtd} ${totalQtd === 1 ? 'unidade' : 'unidades'}</strong> (${carrinho.length} ${carrinho.length === 1 ? 'item' : 'itens'} distintos)
                    </span>
                    <div class="carrinho-resumo__total">Total: <strong class="carrinho-resumo__total-valor">🪙 ${total}</strong></div>
                </div>

                <!-- Lista de itens do carrinho -->
                <div id="carrinho-listagem" class="carrinho-lista">
                    ${itensHtml}
                </div>

                <!-- Painel de Saldo e Finalização -->
                <div class="card carrinho-finalizar">
                    <div class="carrinho-finalizar__linha">
                        <div>
                            <span class="carrinho-finalizar__saldo-label">Seu saldo disponível:</span>
                            <span class="carrinho-finalizar__saldo-valor">🪙 ${saldo}</span>
                        </div>
                        <div class="carrinho-finalizar__botoes">
                            <button onclick="window.navegarPara('loja')" class="btn btn-secondary">
                                ← Continuar comprando
                            </button>
                            <button id="btn-confirmar-carrinho" class="btn btn-success" ${!podeFinalizar ? 'disabled' : ''}>
                                ${!podeFinalizar ? '🛒 Saldo Insuficiente' : '🛒 Finalizar Compra'}
                            </button>
                        </div>
                    </div>

                    ${saldoAbaixo ? `
                    <div class="alert alert-danger" style="margin: 14px 0 0;">
                        <span style="font-size: 18px;">⚠️</span>
                        <div>
                            <strong>Saldo insuficiente!</strong> Faltam <strong>🪙 ${falta}</strong> PoloCoins para finalizar este pedido.<br>
                            Diminua as quantidades ou remova produtos do carrinho.
                        </div>
                    </div>` : ''}
                </div>

                <div id="carrinho-feedback" class="alert" style="display: none; margin-top: 16px;"></div>
            </main>`;

        // Vincula evento de clique no botão de finalizar
        document.getElementById('btn-confirmar-carrinho')?.addEventListener('click', () => {
            if (!podeFinalizar) {
                const fb = document.getElementById('carrinho-feedback');
                if (fb) {
                    fb.className = 'alert alert-danger';
                    fb.innerHTML = `❌ <strong>Saldo insuficiente!</strong> Faltam 🪙 ${falta} PoloCoins para finalizar.`;
                    fb.style.display = 'block';
                    setTimeout(() => { fb.style.display = 'none'; }, 4000);
                }
                return;
            }
            criarModalConfirmacao(carrinho, total, saldo);
        });
    };

    // Funções globais de manipulação do carrinho
    window.incrementarDoCarrinho = (id) => {
        const carrinho = lerCarrinho();
        const item = carrinho.find(i => i.id === id);
        if (item) {
            item.quantidade = (Number(item.quantidade) || 1) + 1;
            salvarCarrinho(carrinho);
            renderTela();
        }
    };

    window.decrementarDoCarrinho = (id) => {
        const carrinho = lerCarrinho();
        const item = carrinho.find(i => i.id === id);
        if (item) {
            if ((Number(item.quantidade) || 1) > 1) {
                item.quantidade -= 1;
            } else {
                const idx = carrinho.indexOf(item);
                carrinho.splice(idx, 1);
            }
            salvarCarrinho(carrinho);
            renderTela();
        }
    };

    window.removerDoCarrinho = (id) => {
        const novos = lerCarrinho().filter(i => i.id !== id);
        salvarCarrinho(novos);
        renderTela();
    };

    // ---- Modal de Conferência do Pedido ----
    const criarModalConfirmacao = (carrinho, total, saldoAtual) => {
        const overlay = document.createElement('div');
        overlay.className = 'polocoin-modal-overlay polocoin-modal-overlay--visible';

        const modal = document.createElement('div');
        modal.className = 'polocoin-modal-container';
        modal.style.maxWidth = '440px';

        modal.innerHTML = `
            <div class="polocoin-modal-header">
                <h2 class="polocoin-modal-title" style="display: flex; align-items: center; gap: 8px;">
                    <span aria-hidden="true">🛒</span> Conferência do Pedido
                </h2>
                <button id="modal-fechar" class="polocoin-modal-close" aria-label="Fechar">✕</button>
            </div>
            <div class="polocoin-modal-body">
                <p class="text-muted" style="margin: 0 0 12px; font-size: 13px;">
                    Confira os itens abaixo antes de confirmar a finalização:
                </p>
                <div class="carrinho-modal-lista">
                    ${carrinho.map(item => `
                        <div class="carrinho-modal-item">
                            <div style="flex: 1; min-width: 0;">
                                <span class="carrinho-modal-item__nome">${item.nome || 'Produto'}</span>
                                <span class="carrinho-modal-item__qtd">×${Number(item.quantidade) || 1}</span>
                            </div>
                            <span class="carrinho-modal-item__valor">🪙 ${(Number(item.custo) || 0) * (Number(item.quantidade) || 1)}</span>
                        </div>`).join('')}
                </div>
                <div class="carrinho-modal-total">
                    <span>Total em PoloCoins:</span>
                    <span class="carrinho-modal-total__valor">🪙 ${total}</span>
                </div>
                <div class="carrinho-modal-saldo">
                    Saldo disponível: <strong>🪙 ${saldoAtual}</strong>
                </div>
            </div>
            <div class="polocoin-modal-footer">
                <button id="modal-cancelar" class="btn btn-secondary" style="flex: 1;">
                    Cancelar
                </button>
                <button id="modal-confirmar" class="btn btn-success" style="flex: 1;">
                    ✅ Confirmar
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const fechar = () => overlay.remove();

        document.getElementById('modal-fechar').onclick = fechar;
        document.getElementById('modal-cancelar').onclick = fechar;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });

        document.getElementById('modal-confirmar').onclick = async () => {
            const btnConfirmar = document.getElementById('modal-confirmar');
            btnConfirmar.disabled = true;
            btnConfirmar.innerHTML = '⏳ Processando...';

            await processarCompra(fechar);
        };
    };

    const processarCompra = async (fecharModal) => {
        const carrinho = lerCarrinho();
        try {
            const res = await fetch('/aluno/comprar-carrinho', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aluno_id: alunoIdNum, produtos: carrinho })
            });
            const data = await res.json();

            if (res.ok) {
                // Limpa o carrinho
                salvarCarrinho([]);

                // Atualiza o saldo localmente
                if (data.saldo_restante !== null && data.saldo_restante !== undefined) {
                    saldo = Number(data.saldo_restante);
                }

                if (fecharModal) fecharModal();
                if (data.status === 'desejos' || data.tipo === 'desejos') {
                    Toast.warning('Pedido enviado para a Lista de Desejos!');
                } else {
                    Toast.success('Compra realizada com sucesso!');
                }
                renderTela(data);
            } else {
                if (fecharModal) fecharModal();
                Toast.error(data.error || 'Não foi possível concluir o pedido.');
                const fb = document.getElementById('carrinho-feedback');
                if (fb) {
                    fb.className = 'alert alert-danger';
                    fb.innerHTML = `❌ <strong>Erro:</strong> ${data.error || 'Não foi possível concluir o pedido.'}`;
                    fb.style.display = 'block';
                    setTimeout(() => { fb.style.display = 'none'; }, 6000);
                }
            }
        } catch {
            if (fecharModal) fecharModal();
            Toast.error('Erro de conexão ao finalizar. Tente novamente.');
            const fb = document.getElementById('carrinho-feedback');
            if (fb) {
                fb.className = 'alert alert-danger';
                fb.innerHTML = '❌ Erro de conexão ao finalizar. Tente novamente.';
                fb.style.display = 'block';
                setTimeout(() => { fb.style.display = 'none'; }, 6000);
            }
        }
    };

    // Render inicial
    renderTela();
}
