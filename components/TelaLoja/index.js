import Header from '../Header/index.js';
import Toast from '../Toast/index.js';
import { SkeletonCardProduto } from '../Skeleton/index.js';
import { debounce } from '../../utils/helpers.js';

const CARRINHO_KEY = 'poloCarrinho';

function lerCarrinho() {
    try {
        return JSON.parse(sessionStorage.getItem(CARRINHO_KEY) || '[]');
    } catch { return []; }
}

function salvarCarrinho(items) {
    sessionStorage.setItem(CARRINHO_KEY, JSON.stringify(items));
}

function totalCarrinho(items) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((s, i) => s + Number(i.custo || 0) * (Number(i.quantidade) || 1), 0);
}

export default async function TelaLoja(root, alunoId) {
    root.innerHTML = `
        <main class="container-center polocoin-main__section--centered" style="max-width: 900px;">
            <!-- Cabeçalho -->
            <div class="tela-header">
                <div class="tela-header__icon tela-header__icon--orange">
                    <span class="tela-header__emoji">🛒</span>
                </div>
                <div class="tela-header__info">
                    <h1 class="tela-header__title">Minha Loja</h1>
                    <p class="tela-header__subtitle">Troque seus PoloCoins por recompensas</p>
                </div>
            </div>

            <!-- Saldo + Carrinho inline -->
            <div class="loja-barra">
                <div id="loja-saldo" class="saldo-card saldo-card--blue" style="flex: 1; min-width: 200px; margin-bottom: 0;">
                    <span class="saldo-card__emoji">🪙</span>
                    <span class="saldo-card__texto">Saldo: <strong id="loja-saldo-valor">—</strong> PoloCoins</span>
                </div>
                <button id="loja-carrinho-badge" class="loja-carrinho-btn" onclick="window.navegarPara('carrinho')">
                    <span class="loja-carrinho-btn__label">
                        🛒 Carrinho
                        <span id="loja-carrinho-qtd" class="loja-carrinho-btn__qtd">0</span>
                    </span>
                    <span class="loja-carrinho-btn__total">
                        Total: <strong id="loja-carrinho-total">0</strong> 🪙
                    </span>
                </button>
            </div>

            <!-- Filtros -->
            <div id="loja-filtros" class="loja-filtros">
                <input id="loja-busca" type="text" placeholder="🔍 Buscar produto..."
                    class="form-input loja-filtros__busca"
                    oninput="window.filtrarLoja()">
                <select id="loja-filtro-categoria" class="form-select loja-filtros__categoria"
                    onchange="window.filtrarLoja()">
                    <option value="">Todas as categorias</option>
                </select>
                <button id="loja-limpar-filtros" class="btn btn-ghost"
                    onclick="window.limparFiltrosLoja()">
                    ✕ Limpar
                </button>
            </div>

            <!-- Loading Skeleton -->
            <div id="loja-loading" class="produtos-grid" style="margin-bottom: 20px;">
                ${SkeletonCardProduto(6)}
            </div>

            <!-- Lista de produtos -->
            <div id="loja-produtos" style="display: none;">
                <div class="card" style="padding: 18px;">
                    <div class="loja-produtos-header">
                        <h2 class="card__title-lg" style="margin: 0; font-size: 16px;">Produtos</h2>
                        <span id="loja-contagem" class="text-muted" style="font-size: 13px;"></span>
                    </div>
                    <div id="loja-grid" class="produtos-grid"></div>
                </div>
            </div>

            <!-- Feedback compra -->
            <div id="loja-feedback" class="alert" style="display: none; margin-top: 16px;"></div>

            <!-- Saldo insuficiente -->
            <div id="loja-saldo-insuficiente" class="alert alert-danger" style="display: none; margin-top: 16px;">
                <div class="alert__icon">⚠️</div>
                <div>
                    <h3 style="margin: 0 0 6px 0; font-size: 14px;">Saldo Insuficiente</h3>
                    <p style="margin: 0; font-size: 13px;">
                        Falta <strong id="loja-falta"></strong> 🪙. Saldo atual: <strong id="loja-saldo-atual"></strong> 🪙.
                    </p>
                </div>
            </div>

            <!-- Desejo adicionado -->
            <div id="loja-desejo-adicionado" class="alert alert-warning" style="display: none; margin-top: 16px;">
                <div class="alert__icon">✅</div>
                <div>
                    <h3 style="margin: 0 0 6px 0; font-size: 14px;">Adicionado aos Desejos!</h3>
                    <p style="margin: 0; font-size: 13px;">Seu responsável será avisado.</p>
                </div>
            </div>
        </main>
    `;

    const dados = JSON.parse(sessionStorage.getItem('poloUser') || '{}');
    const alunoIdNum = dados?.id || alunoId;
    try {
        const res = await fetch(`/aluno/saldo?id=${alunoIdNum}`);
        const data = await res.json();
        document.getElementById('loja-saldo-valor').textContent = data.pontos || 0;
    } catch {
        document.getElementById('loja-saldo-valor').textContent = '?';
    }

    // Categorias para filtro
    let categorias = [];
    try {
        const res = await fetch('/categorias/filtro');
        categorias = await res.json();
        const sel = document.getElementById('loja-filtro-categoria');
        categorias.forEach(c => {
            sel.innerHTML += `<option value="${c.nome}">${c.nome}</option>`;
        });
    } catch { /* ignora */ }

    // Produtos
    await carregarProdutos('', '');

    // Botão de limpar filtros
    document.getElementById('loja-limpar-filtros').addEventListener('click', () => {
        window.limparFiltrosLoja();
    });

    // Atualiza badge do carrinho após carregar
    atualizarBadgeCarrinho();

    window.filtrarLoja = debounce(async () => {
        const busca = document.getElementById('loja-busca')?.value || '';
        const cat = document.getElementById('loja-filtro-categoria')?.value || '';
        await carregarProdutos(cat, busca);
    }, 200);

    window.limparFiltrosLoja = async () => {
        const buscaEl = document.getElementById('loja-busca');
        const catEl = document.getElementById('loja-filtro-categoria');
        if (buscaEl) buscaEl.value = '';
        if (catEl) catEl.value = '';
        await carregarProdutos('', '');
    };

    window.adicionarAoCarrinho = (p) => {
        const carrinho = lerCarrinho();
        const existing = carrinho.find(i => i.id === p.id);
        if (existing) {
            existing.quantidade = (Number(existing.quantidade) || 1) + 1;
        } else {
            const custo = Number(p.custo || 0);
            carrinho.push({ id: p.id, nome: p.nome || 'Produto', custo, quantidade: 1 });
        }
        salvarCarrinho(carrinho);
        atualizarBadgeCarrinho();
        Toast.success(`"${p.nome || 'Produto'}" adicionado ao carrinho!`);
    };

    window.removerDoCarrinho = (id) => {
        const carrinho = lerCarrinho();
        const item = carrinho.find(i => i.id === id);
        if (item) {
            if ((item.quantidade || 1) > 1) {
                item.quantidade -= 1;
            } else {
                const idx = carrinho.indexOf(item);
                carrinho.splice(idx, 1);
            }
        }
        salvarCarrinho(carrinho);
        atualizarBadgeCarrinho();
        Toast.info('Item atualizado no carrinho.');
        window.navegarPara('carrinho');
    };

    window.adicionarDesejo = (produtoId) => {
        const btn = document.querySelector(`button[data-id="${produtoId}"]`);
        if (btn) btn.disabled = true;
        fetch('/aluno/desejos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aluno_id: alunoIdNum, produto_id: produtoId })
        })
        .then(r => r.json())
        .then(d => {
            if (d.error) {
                Toast.error(d.error);
                if (btn) btn.disabled = false;
            } else {
                Toast.warning('Produto enviado para a Lista de Desejos! Aguarde aprovação do responsável.');
            }
        })
        .catch(() => {
            Toast.error('Erro de conexão ao salvar desejo.');
            if (btn) btn.disabled = false;
        });
    };

    window.confirmarCarrinho = async () => {
        const carrinho = lerCarrinho();
        if (carrinho.length === 0) {
            exibirFeedback('warning', 'Seu carrinho está vazio.');
            return;
        }
        const btn = document.getElementById('btn-confirmar-carrinho');
        btn.disabled = true;
        btn.innerHTML = '⏳ Processando...';

        try {
            const res = await fetch('/aluno/comprar-carrinho', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aluno_id: alunoIdNum, produtos: carrinho })
            });
            const data = await res.json();

            salvarCarrinho([]);
            atualizarBadgeCarrinho();

            if (res.ok) {
                if (data.status === 'desejos' || data.tipo === 'desejos') {
                    let msg = `📋 <strong>Pedido enviado para a Lista de Desejos!</strong><br>`;
                    msg += `Aguarde a aprovação do seu responsável.<br>`;
                    (data.desejos || []).forEach(d => {
                        msg += `• ${d.nome} (×${d.quantidade || 1}) — 🪙 ${d.custo_total || d.custo}<br>`;
                    });
                    msg += `<br>Nenhum PoloCoin foi debitado. Saldo: <strong>🪙 ${data.saldo_restante}</strong>`;
                    exibirFeedback('warning', msg);
                } else {
                    let msg = `✅ <strong>Compra realizada com sucesso!</strong><br>`;
                    (data.comprados || []).forEach(c => {
                        msg += `✅ ${c.nome} (×${c.quantidade || 1}) — 🪙 ${c.custo_total || c.custo}<br>`;
                    });
                    if (data.saldo_restante !== null && data.saldo_restante !== undefined) {
                        msg += `<br>Saldo restante: <strong>🪙 ${data.saldo_restante}</strong>`;
                    }
                    exibirFeedback('success', msg);
                }
                await carregarProdutos(document.getElementById('loja-filtro-categoria').value, document.getElementById('loja-busca').value);
            } else {
                let msg = `❌ <strong>Erro na compra:</strong><br>`;
                data.erros?.forEach(e => {
                    msg += `❌ ${e.msg}<br>`;
                });
                if (!msg.includes('<br>')) msg += data.error || 'Erro desconhecido.';
                exibirFeedback('danger', msg);
            }
        } catch (e) {
            exibirFeedback('danger', '❌ Erro de conexão. Tente novamente.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '🛒 Confirmar Compra';
        }
    };

    async function carregarProdutos(cat, busca) {
        try {
            const res = await fetch(`/produtos/filtrados?categoria=${encodeURIComponent(cat || '')}&busca=${encodeURIComponent(busca || '')}`);
            const data = await res.json();
            const produtos = Array.isArray(data) ? data : [];

            document.getElementById('loja-loading').style.display = 'none';
            document.getElementById('loja-produtos').style.display = 'block';
            document.getElementById('loja-contagem').textContent = `(${produtos.length} itens)`;

            if (produtos.length === 0) {
                document.getElementById('loja-grid').innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
                        Nenhum produto encontrado.
                    </div>
                `;
                return;
            }

            document.getElementById('loja-grid').innerHTML = produtos.map(p => {
                const cor = getCorCategoria(p.categoria_nome) || 'var(--text-secondary)';
                const custo = p.custo_pontos ?? 0;
                const nome = p.nome || 'Produto sem nome';
                return `
                    <div class="produto-card" style="--cat-cor: ${cor};">
                        <div class="produto-card__topo">
                            <span class="produto-card__categoria">${p.categoria_nome || 'Sem categoria'}</span>
                        </div>
                        <h3 class="produto-card__nome">${nome}</h3>
                        <div class="produto-card__rodape">
                            <span class="produto-card__preco">
                                <span aria-hidden="true">🪙</span>
                                <span class="produto-card__preco-valor">${custo}</span>
                            </span>
                            <button
                                data-id="${p.id}"
                                onclick="window.adicionarAoCarrinho({id:${p.id}, nome:'${nome.replace(/'/g, "\\'")}', custo:${custo}})"
                                class="btn btn-primary btn--sm"
                            >
                                🛒 Adicionar
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            console.error('Erro ao carregar produtos:', e);
            document.getElementById('loja-loading').innerHTML = `<p style="color:var(--color-danger);">Erro ao carregar. Tente novamente.</p>`;
        }
    }

    function atualizarBadgeCarrinho() {
        const carrinho = lerCarrinho();
        const totalItens = carrinho.reduce((s, i) => s + (Number(i.quantidade) || 1), 0);
        document.getElementById('loja-carrinho-qtd').textContent = totalItens;
        document.getElementById('loja-carrinho-total').textContent = totalCarrinho(carrinho);
    }

    function exibirFeedback(tipo, html) {
        const el = document.getElementById('loja-feedback');
        el.className = `alert alert-${tipo}`;
        el.style.display = 'block';
        el.innerHTML = html;
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
}

function getCorCategoria(nome) {
    const cores = {
        'Alimentação':  'var(--color-success)',
        'Beleza':       '#EC4899',
        'Vestuário':    'var(--color-primary)',
        'Limpeza':      'var(--color-coin)',
        'Eletrônicos':  'var(--color-secondary)',
        'Brinquedos':   '#F97316',
        'Outros':       'var(--text-secondary)',
    };
    return cores[nome] || 'var(--text-secondary)';
}
