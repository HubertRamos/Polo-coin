/**
 * CardProduto - Card de produto da loja/admin
 * Reutilizável em qualquer lista de produtos.
 * A cor da categoria é passada via variável CSS --cat-cor.
 */

const coresCategoria = {
    'Alimentação':  'var(--color-success)',
    'Beleza':       '#EC4899',
    'Vestuário':    'var(--color-primary)',
    'Limpeza':      'var(--color-coin)',
    'Eletrônicos':  'var(--color-secondary)',
    'Brinquedos':   '#F97316',
    'Outros':       'var(--text-secondary)',
}

export default function CardProduto(produto, onClickComprar) {
    const cor = coresCategoria[produto.categoria_nome] || coresCategoria['Outros']
    const preco = parseInt(produto.custo_pontos ?? produto.preco ?? 0, 10) || 0
    const categoria = produto.categoria_nome || 'Sem categoria'

    return `
        <div class="produto-card" style="--cat-cor: ${cor}">
            <div class="produto-card__topo">
                <span class="produto-card__categoria">${categoria}</span>
                <span class="produto-card__id">#${produto.id}</span>
            </div>
            <h3 class="produto-card__nome">${produto.nome}</h3>
            <div class="produto-card__rodape">
                <span class="produto-card__preco">
                    <span aria-hidden="true">🪙</span>
                    <span class="produto-card__preco-valor">${preco}</span>
                </span>
                <button
                    class="btn-comprar"
                    data-id="${produto.id}"
                    data-nome="${produto.nome.replace(/"/g, '&quot;')}"
                    data-preco="${preco}"
                    onclick="window.comprarProduto(${produto.id})"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    Comprar
                </button>
            </div>
        </div>
    `
}
