import Form from '../../../components/Form/index.js'
import DashBoard from '../../../components/DashBoard/index.js'
import Header from '../../../components/Header/index.js'
import { linksHeader } from '../constLinks.js'
import UploadFile from '../../../components/UploadFile/index.js'

const root = document.getElementById('root')

let produtos = []
let categorias = []
let compras = []
let historico = []

const coresCategoria = {
    'Alimentação':  'var(--color-success)',
    'Beleza':       '#EC4899',
    'Vestuário':    'var(--color-primary)',
    'Limpeza':      'var(--color-coin)',
    'Eletrônicos':  'var(--color-secondary)',
    'Brinquedos':   '#F97316',
}

function getCor(nome) {
    return coresCategoria[nome] || 'var(--text-secondary)'
}

function formatarPreco(valor) {
    if (valor == null) return '0 🪙'
    return `${parseInt(valor, 10) || 0} 🪙`
}

function formatarData(dateStr) {
    if (!dateStr) return '—'
    try {
        const d = new Date(dateStr)
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
        return dateStr
    }
}

async function carregarDados() {
    try {
        const [p, c, comp] = await Promise.all([
            fetch('/produtos').then(r => r.json()),
            fetch('/categorias/produtos').then(r => r.json()),
            fetch('/admin/compras').then(r => r.json()),
        ])
        produtos = p || []
        categorias = c || []
        compras = comp || []
    } catch (e) {
        console.error('Erro ao carregar dados:', e)
    }
}

function renderizarCards() {
    const content = document.getElementById('dashboard-content')
    if (!content) return

    console.log('[Ver Produtos] produtos carregados:', produtos.length, '| compras:', compras.length)

    if (produtos.length === 0) {
        content.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state__icon">🛒</div>
                <p class="empty-state__text">Nenhum produto cadastrado. Clique em "+ Adicionar" para criar o primeiro.</p>
            </div>
        `
        return
    }

    content.innerHTML = produtos.map(prod => {
        const preco = parseFloat(prod.custo_pontos) || 0
        const cor = getCor(prod.categoria_nome) || 'var(--text-secondary)'
        const cat = prod.categoria_nome || 'Sem categoria'

        return `
            <div class="card" style="border-left: 4px solid ${cor};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                    <div style="flex: 1; min-width: 0;">
                        <strong style="font-size: 15px; color: var(--text-primary); display: block;">${prod.nome}</strong>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${cat}</div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;">
                        <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${formatarPreco(preco)}</div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 11px; color: var(--text-muted);">ID: ${prod.id}</span>
                            <button class="btn btn-secondary btn-editar-prod" data-id="${prod.id}" style="padding: 4px 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                                <i class="fa-solid fa-pen-to-square"></i> Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }).join('') + `
            <div style="margin-top: 20px; text-align: center;">
                <button id="btn-voltar-compras" class="btn btn-ghost">
                    <i class="fa-solid fa-arrow-left" style="font-size: 11px; margin-right: 4px;"></i>
                    Voltar às Compras
                </button>
            </div>
        `
    const btnVoltar = document.getElementById('btn-voltar-compras')
    if (btnVoltar) btnVoltar.addEventListener('click', () => Render())

    content.querySelectorAll('.btn-editar-prod').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.getAttribute('data-id'))
            const prod = produtos.find(p => Number(p.id) === id)
            if (prod) {
                abrirModalAdd(prod)
            }
        })
    })
}

function renderizarCompras() {
    const content = document.getElementById('dashboard-content')
    if (!content) return

    const comprasNaoEntregues = compras.filter(c => !c.entregue)

    if (comprasNaoEntregues.length === 0) {
        content.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state__icon">🛒</div>
                <p class="empty-state__text">Nenhuma compra pendente.</p>
            </div>
        `
        return
    }

    content.innerHTML = comprasNaoEntregues.map(compra => {
        const responsavel = compra.responsavel_nome || '— (compra direta)'
        return `
            <div class="card" style="border-left: 4px solid var(--color-primary);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                        <strong style="font-size: 14px; color: var(--text-primary);">${compra.produto_nome}</strong>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                            Aluno: ${compra.aluno_nome} · 🪙 ${compra.custo_pontos} pontos
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 2px;">
                            ${formatarData(compra.criado_em)}
                        </div>
                        <div style="font-size: 12px; color: var(--color-primary);">
                            Autorizado por: ${responsavel}
                        </div>
                    </div>
                </div>
            </div>
        `
    }).join('')
}

function abrirModalAdd(produtoParaEditar = null) {
    const isEdicao = Boolean(produtoParaEditar && produtoParaEditar.id)
    const categoriaOptions = categorias.map(c => ({ id: c.id, nome: c.nome }))

    const tituloFormulario = isEdicao ? 'Editar Produto' : 'Novo Produto'
    const textoBotao = isEdicao ? 'Salvar Alterações' : 'Novo Produto'
    const catPreselecionada = isEdicao ? (produtoParaEditar.categoria_id || produtoParaEditar.categoria_nome) : null

    root.innerHTML = `
        ${Header(linksHeader)}

        <main class="polocoin-main" style="max-width: 480px;">
            <div style="margin-bottom: 20px; text-align: center;">
                <button id="btn-voltar" class="btn btn-ghost">
                    <i class="fa-solid fa-arrow-left" style="font-size: 11px; margin-right: 4px;"></i>
                    Voltar aos Produtos
                </button>
            </div>

            ${Form(
                tituloFormulario,
                [
                    { label: 'Nome do Produto', placeholder: 'Ex: Chocolate Amargo 50g', type: 'text', id: 'prod-nome', required: true, value: isEdicao ? (produtoParaEditar.nome || '') : '' },
                    { label: 'Custo em PoloCoins (🪙)', placeholder: 'Ex: 50', type: 'number', id: 'prod-preco', required: true, value: isEdicao ? (produtoParaEditar.custo_pontos || '') : '' },
                ],
                categoriaOptions,
                textoBotao,
                catPreselecionada
            )}

            ${!isEdicao ? UploadFile() : ''}

            <p id="msg" style="text-align: center; font-size: 12px; min-height: 18px; margin: 8px 0 0;"></p>
        </main>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            input[type="number"] {
                -moz-appearance: textfield;
            }
            input[type="number"]::-webkit-outer-spin-button,
            input[type="number"]::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
        </style>
    `

    const btnVoltar = document.getElementById('btn-voltar')
    if (btnVoltar) btnVoltar.addEventListener('click', () => {
        Render()
        renderizarCards()
    })

    const form = document.getElementById('meu-form')
    const msg = document.getElementById('msg')

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()

            const nome = document.getElementById('prod-nome').value.trim()
            const preco = parseFloat(document.getElementById('prod-preco').value)
            const catSelect = document.getElementById('categoria-select')
            let categoria = catSelect ? catSelect.value : ''

            if (!nome || isNaN(preco) || preco <= 0) {
                msg.textContent = 'Preencha nome e custo em moedas corretamente.'
                msg.style.color = 'var(--color-danger)'
                return
            }

            msg.textContent = isEdicao ? 'Salvando alterações...' : 'Cadastrando...'
            msg.style.color = 'var(--color-primary)'

            try {
                const custoPontosInt = Math.round(preco)
                const url = isEdicao ? `/produtos/${produtoParaEditar.id}` : '/produtos'
                const method = isEdicao ? 'PUT' : 'POST'

                const resposta = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome,
                        custo_pontos: custoPontosInt,
                        preco: custoPontosInt,
                        categoria
                    }),
                })

                const dados = await resposta.json()

                if (resposta.ok) {
                    msg.textContent = isEdicao ? '✓ Produto atualizado com sucesso!' : '✓ Produto cadastrado com sucesso!'
                    msg.style.color = 'var(--color-success)'
                    form.reset()
                    await carregarDados()
                    setTimeout(() => {
                        Render()
                        renderizarCards()
                    }, 600)
                } else {
                    msg.textContent = dados.error || (isEdicao ? 'Erro ao atualizar.' : 'Erro ao cadastrar.')
                    msg.style.color = 'var(--color-danger)'
                }
            } catch (erro) {
                msg.textContent = 'Erro de conexão. Tente novamente.'
                msg.style.color = 'var(--color-danger)'
                console.error(erro)
            }
        })
    }

    const fileInput = document.getElementById('csv-file')

if (fileInput) {
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0]
        if (!file) return

        const reader = new FileReader()

        reader.onload = async function(e) {
            const conteudo = e.target.result
            const linhas = conteudo.split('\n')

            let cadastrados = 0
            let ignorados = 0

            for (const linha of linhas) {
                if (!linha.trim()) continue

                const colunas = linha.split(',')

                if (colunas.length < 3) {
                    ignorados++
                    continue
                }

                const nome = colunas[0].trim()
                const pontosValor = parseInt(colunas[1].trim())
                const categoria = colunas[2].trim()

                try {
                    const resposta = await fetch('/produtos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
    nome,
    custo_pontos: pontosValor,
    preco: pontosValor,
    categoria
})
                    })

                    if (resposta.ok)
                        cadastrados++
                    else
                        ignorados++

                } catch {
                    ignorados++
                }
            }

            alert(
                `Importação concluída!\n\n` +
                `Cadastrados: ${cadastrados}\n` +
                `Ignorados: ${ignorados}`
            )

            fileInput.value = ''
            await carregarDados()
            Render()
        }

        reader.readAsText(file)
    })
}
}

async function Render() {
    await carregarDados()
    await carregarHistorico()

    // Separa compras por tipo (só as não entregues)
    const comprasAutorizadas = compras.filter(c => c.autorizado_por !== null && c.autorizado_por !== '' && !c.entregue)
    const comprasDiretas = compras.filter(c => (!c.autorizado_por || c.autorizado_por === '') && !c.entregue)

    root.innerHTML = `
        ${Header(linksHeader)}

        <main class="polocoin-main">
            <!-- Cabeçalho da Página -->
            <div class="polocoin-main__header">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="
                            width: 36px;
                            height: 36px;
                            background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <i class="fa-solid fa-cart-shopping" style="color: white; font-size: 14px;"></i>
                        </div>
                        <div>
                            <h1 class="polocoin-main__title">Produtos</h1>
                            <p class="polocoin-main__subtitle">Gerencie os produtos da lojinha do PoloCoin.</p>
                        </div>
                    </div>
                </div>

                <div class="polocoin-main__actions">
                    <button id="btn-ver-produtos" class="btn btn-secondary">
                        <i class="fa-solid fa-box" style="font-size: 12px;"></i>
                        Ver Produtos
                    </button>
                    <button id="btn-ver-historico" class="btn btn-ghost" style="color: var(--color-secondary);">
                        <i class="fa-solid fa-clock-rotate-left" style="font-size: 12px;"></i>
                        Histórico (7 dias)
                    </button>
                    <button id="btn-adicionar" class="btn btn-primary">
                        <i class="fa-solid fa-plus" style="font-size: 10px;"></i>
                        Adicionar Produto
                    </button>
                </div>
            </div>

            <!-- Compras Realizadas -->
            <div style="margin-top: 24px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                    <div style="
                        width: 32px;
                        height: 32px;
                        background: linear-gradient(135deg, var(--color-secondary), #7C3AED);
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <i class="fa-solid fa-receipt" style="color: white; font-size: 13px;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 16px; color: var(--text-primary); font-weight: 700;">Compras Realizadas</h2>
                        <p style="color: var(--text-secondary); font-size: 12px; margin: 0;">Histórico de pedidos dos alunos</p>
                    </div>
                </div>

                ${compras.length === 0 ? `
                    <div class="alert alert-neutral" style="text-align: center; padding: 20px;">
                        Nenhuma compra realizada ainda.
                    </div>
                ` : `
                    ${comprasAutorizadas.length > 0 ? `
                        <div style="margin-bottom: 16px;">
                            <h3 style="margin: 0 0 10px 0; font-size: 13px; color: var(--text-primary); font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                <span style="color: var(--color-success);">●</span> Autorizadas pelo Responsável (${comprasAutorizadas.length})
                            </h3>
                            <div class="card-grid">
                                ${comprasAutorizadas.map(c => `
                                    <div class="card" style="border-left: 3px solid ${c.entregue ? 'var(--text-muted)' : 'var(--color-success)'};">
                                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                            <div>
                                                <strong style="font-size: 13px; color: var(--text-primary);">${c.produto_nome}</strong>
                                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                                                    ${c.aluno_nome} · 🪙 ${c.custo_pontos} pontos
                                                </div>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <div style="text-align: right; font-size: 11px; color: var(--text-secondary); min-width: 70px;">
                                                    ${formatarData(c.criado_em)}
                                                </div>
                                                ${c.entregue ? `
                                                    <span class="badge badge-success">Entregue</span>
                                                ` : `
                                                    <button onclick="confirmarEntrega(${c.id})" class="btn btn-success" style="padding: 4px 10px; font-size: 11px;">
                                                        ✓ Confirmar
                                                    </button>
                                                `}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${comprasDiretas.length > 0 ? `
                        <div>
                            <h3 style="margin: 0 0 10px 0; font-size: 13px; color: var(--text-primary); font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                <span style="color: var(--color-coin);">●</span> Compras Diretas (${comprasDiretas.length})
                            </h3>
                            <div class="card-grid">
                                ${comprasDiretas.map(c => `
                                    <div class="card" style="border-left: 3px solid ${c.entregue ? 'var(--text-muted)' : 'var(--color-coin)'};">
                                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                                            <div>
                                                <strong style="font-size: 13px; color: var(--text-primary);">${c.produto_nome}</strong>
                                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                                                    ${c.aluno_nome} · 🪙 ${c.custo_pontos} pontos
                                                </div>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <div style="text-align: right; font-size: 11px; color: var(--text-secondary); min-width: 80px;">
                                                    ${formatarData(c.criado_em)}
                                                </div>
                                                ${c.entregue ? `
                                                    <span class="badge badge-success">Entregue</span>
                                                ` : `
                                                    <button onclick="confirmarEntrega(${c.id})" class="btn" style="background: var(--color-coin); color: white; padding: 4px 10px; font-size: 11px;">
                                                        ✓ Confirmar
                                                    </button>
                                                `}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                `}
            </div>

            <!-- Histórico de Vendas (7 dias) -->
            <div id="historico-section" style="margin-top: 24px; display: none;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                    <div style="
                        width: 32px;
                        height: 32px;
                        background: linear-gradient(135deg, #06B6D4, var(--color-primary));
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <i class="fa-solid fa-chart-line" style="color: white; font-size: 13px;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 16px; color: var(--text-primary); font-weight: 700;">Histórico de Vendas</h2>
                        <p style="color: var(--text-secondary); font-size: 12px; margin: 0;">Últimos 7 dias · Limpeza automática a cada 7 dias</p>
                    </div>
                </div>
                <div id="historico-content"></div>
            </div>
        </main>

        <div id="dashboard-content"></div>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            #btn-ver-produtos:hover { background: var(--bg-subtle); }
            #btn-adicionar:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
            }
        </style>
    `

    const btnVerProdutos = document.getElementById('btn-ver-produtos')
    if (btnVerProdutos) btnVerProdutos.addEventListener('click', () => {
        console.log('[Ver Produtos] clicado')
        renderizarCards()
    })

    const btnVerHistorico = document.getElementById('btn-ver-historico')
    if (btnVerHistorico) btnVerHistorico.addEventListener('click', () => {
        renderizarHistorico()
    })

    const btnAdd = document.getElementById('btn-adicionar')
    if (btnAdd) btnAdd.addEventListener('click', abrirModalAdd)
}

// Nova função para mostrar as compras no dashboard do adm
async function RenderCompras() {
    await carregarDados()

    const comprasAutorizadas = compras.filter(c => c.autorizado_por !== null && c.autorizado_por !== '')
    const comprasDiretas = compras.filter(c => !c.autorizado_por || c.autorizado_por === '')

    root.innerHTML = `
        ${Header(linksHeader)}

        <main class="polocoin-main">
            <!-- Cabeçalho -->
            <div class="polocoin-main__header">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="
                            width: 36px;
                            height: 36px;
                            background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <i class="fa-solid fa-receipt" style="color: white; font-size: 14px;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h1 class="polocoin-main__title">Compras Realizadas</h1>
                            <p class="polocoin-main__subtitle">Histórico de compras dos alunos</p>
                        </div>
                    </div>
                </div>

                <button id="btn-voltar-compras" class="btn btn-ghost">
                    <i class="fa-solid fa-chevron-left" style="font-size: 11px; margin-right: 4px;"></i>
                    Voltar
                </button>
            </div>

            ${compras.length === 0 ? `
                <div class="alert alert-neutral" style="text-align: center; padding: 40px;">
                    Nenhuma compra realizada ainda.
                </div>
            ` : `
                <!-- Stats -->
                <div style="margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
                    <div class="stat-card stat-card--success">
                        <div class="stat-card__label">TOTAL DE COMPRAS</div>
                        <div class="stat-card__value">${compras.length}</div>
                    </div>
                    <div class="stat-card stat-card--info">
                        <div class="stat-card__label">AUTORIZADAS PELO PAI</div>
                        <div class="stat-card__value">${comprasAutorizadas.length}</div>
                    </div>
                    <div class="stat-card stat-card--warning">
                        <div class="stat-card__label">COMPRAS DIRETAS</div>
                        <div class="stat-card__value">${comprasDiretas.length}</div>
                    </div>
                </div>

                ${comprasAutorizadas.length > 0 ? `
                    <div style="margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: var(--text-primary); font-weight: 600;">
                            ✅ Autorizadas pelo Responsável (${comprasAutorizadas.length})
                        </h3>
                        <div class="card-grid">
                            ${comprasAutorizadas.map(compra => `
                                <div class="card" style="border-left: 4px solid var(--color-success);">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 10px;">
                                    <div>
                                    <strong style="font-size: 14px; color: var(--text-primary);">${compra.produto_nome}</strong>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                                        Aluno: ${compra.aluno_nome} · 🪙 ${compra.custo_pontos} pontos
                                    </div>
                                    </div>
                                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                                    <div style="font-size: 11px; color: var(--text-secondary);">
                                        ${formatarData(compra.criado_em)}
                                    </div>
                                    <div style="font-size: 12px; color: var(--color-primary);">
                                        👨‍👧 Responsável: ${compra.responsavel_nome}
                                    </div>
                                    ${compra.entregue ? `
                                        <span class="badge badge-success">✓ Entregue</span>
                                    ` : `
                                        <button onclick="confirmarEntrega(${compra.id})" class="btn btn-success" style="padding: 4px 10px; font-size: 11px;">
                                            ✓ Confirmar
                                        </button>
                                    `}
                                    </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${comprasDiretas.length > 0 ? `
                    <div>
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: var(--text-primary); font-weight: 600;">
                            🔓 Compras Diretas (${comprasDiretas.length})
                        </h3>
                        <div class="card-grid">
                            ${comprasDiretas.map(compra => `
                                <div class="card" style="border-left: 4px solid var(--color-coin);">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 10px;">
                                    <div>
                                    <strong style="font-size: 14px; color: var(--text-primary);">${compra.produto_nome}</strong>
                                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                                        Aluno: ${compra.aluno_nome} · 🪙 ${compra.custo_pontos} pontos
                                    </div>
                                    </div>
                                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                                    <div style="font-size: 11px; color: var(--text-secondary);">
                                        ${formatarData(compra.criado_em)}
                                    </div>
                                    <div style="font-size: 12px; color: #dc2626;">
                                        ⚠️ Compra sem autorização do responsável
                                    </div>
                                    ${compra.entregue ? `
                                        <span class="badge badge-success">✓ Entregue</span>
                                    ` : `
                                        <button onclick="confirmarEntrega(${compra.id})" class="btn" style="background: var(--color-coin); color: white; padding: 4px 10px; font-size: 11px;">
                                            ✓ Confirmar
                                        </button>
                                    `}
                                    </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            `}
        </main>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            #btn-voltar-compras:hover { color: var(--text-primary); }
        </style>
    `

    const btnVoltar = document.getElementById('btn-voltar-compras')
    if (btnVoltar) btnVoltar.addEventListener('click', () => Render())
}

// Garante execução mesmo se o DOM já estiver pronto quando o módulo carregar
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', Render)
} else {
    Render()
}

window.confirmarEntrega = confirmarEntrega
window.Render = Render
window.renderizarCards = renderizarCards
window.renderizarHistorico = renderizarHistorico
window.limparHistorico = limparHistorico
window.abrirModalAdd = abrirModalAdd

async function carregarHistorico() {
    try {
        const res = await fetch('/admin/historico-vendas')
        if (!res.ok) throw new Error('Erro ao buscar histórico')
        historico = await res.json()
        const lastCleanup = localStorage.getItem('historicoLastCleanup')
        const now = Date.now()
        if (!lastCleanup || now - Number(lastCleanup) > 7 * 24 * 60 * 60 * 1000) {
            try {
                const r = await fetch('/admin/historico-vendas/limpar', { method: 'DELETE' })
                if (!r.ok) throw new Error('Erro ao limpar')
            } catch (e) { console.error('Limpeza automática falhou:', e) }
            localStorage.setItem('historicoLastCleanup', now.toString())
        }
        renderizarHistorico()
    } catch (err) {
        console.error('Erro ao carregar histórico:', err)
        historico = []
    }
}

async function renderizarHistorico() {
    const section = document.getElementById('historico-section')
    const content = document.getElementById('historico-content')
    if (!section || !content) return
    const isHidden = section.style.display === 'none' || !section.style.display
    section.style.display = isHidden ? 'block' : 'none'
    if (isHidden && historico.length === 0) {
        await carregarHistorico()
        return
    }
    if (historico.length === 0) {
        content.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-state__icon">📋</div><p class="empty-state__text">Nenhuma venda nos últimos 7 dias.</p></div>`
        return
    }
    const hoje = new Date()
    const cleanupHtml = `<button id="btn-limpar-historico" onclick="limparHistorico()" class="btn btn-ghost" style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">🗑 Limpar histórico</button>`
    content.innerHTML = cleanupHtml + historico.map(c => {
        const data = new Date(c.criado_em)
        const diffDays = Math.floor((hoje - data) / (1000 * 60 * 60 * 24))
        const diffStr = diffDays === 0 ? 'Hoje' : diffDays === 1 ? 'Ontem' : diffDays + 'd atrás'
        const resp = c.responsavel_nome || '— (compra direta)'
        return `<div class="card" style="border-left: 3px solid #06B6D4;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                <div>
                    <strong style="font-size: 13px; color: var(--text-primary);">${c.produto_nome}</strong>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${c.aluno_nome} · 🪙 ${c.custo_pontos} pontos</div>
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${diffStr} · ${formatarData(c.criado_em)}</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span class="badge" style="background: ${c.entregue ? '#dcfce7' : '#fef3c7'}; color: ${c.entregue ? '#166534' : '#92400e'}; font-size: 10px; padding: 2px 8px; border-radius: 10px;">${c.entregue ? 'Entregue' : 'Pendente'}</span>
                    <div style="font-size: 11px; color: var(--color-primary);">${c.autorizado_por ? '✅ ' + resp : '⚡ Compra direta'}</div>
                </div>
            </div>
        </div>`
    }).join('')
    const btnLimpar = document.getElementById('btn-limpar-historico')
    if (btnLimpar) btnLimpar.addEventListener('click', limparHistorico)
}

async function limparHistorico() {
    try {
        const res = await fetch('/admin/historico-vendas/limpar', { method: 'DELETE' })
        const data = await res.json()
        if (!res.ok) { alert(data.error || 'Erro ao limpar histórico.'); return }
        alert(data.message)
        historico = []
        localStorage.setItem('historicoLastCleanup', Date.now().toString())
        renderizarHistorico()
    } catch (err) {
        alert('Erro de conexão. Tente novamente.')
        console.error(err)
    }
}

async function confirmarEntrega(compraId) {
    try {
        const res = await fetch(`/admin/compras/${compraId}/entregar`, { method: 'PATCH' })
        const data = await res.json()
        if (!res.ok) {
            alert(data.error || 'Erro ao confirmar entrega.')
            return
        }
        alert('Entrega confirmada!')
        Render()
    } catch (err) {
        alert('Erro de conexão. Tente novamente.')
    }
}
