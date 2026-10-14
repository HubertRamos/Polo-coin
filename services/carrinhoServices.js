import { supabase } from '../config/supabase.js';
import { deduzirPontos } from './pontosServices.js';

/**
 * Processa o carrinho de compras de um aluno.
 * Regra de Negócio:
 * 1. Valida dados e busca produtos solicitados.
 * 2. Valida pendência de ocorrências com consentimento negativo.
 * 3. Valida saldo: tanto alunos LIBERADOS quanto BLOQUEADOS precisam de saldo suficiente.
 * 4. Ponto de Decisão (Autorização):
 *    - Se aluno BLOQUEADO (pode_comprar = false):
 *      Cria registros na Lista de Desejos (desejos).
 *      NÃO cria pedido pendente (compras).
 *      NÃO desconta PoloCoins do aluno.
 *      NÃO reserva/altera estoque.
 *      Retorna status: 'desejos'.
 *    - Se aluno LIBERADO (pode_comprar = true):
 *      Desconta PoloCoins do saldo.
 *      Cria pedidos pendentes na tabela compras (entregue = false).
 *      NÃO passa pela Lista de Desejos.
 *      Retorna status: 'comprado'.
 */
export async function processarCarrinho(aluno_id, produtosInput) {
    if (!aluno_id || !Array.isArray(produtosInput) || produtosInput.length === 0) {
        throw new Error('DADOS_INVALIDOS');
    }

    const alunoIdNum = Number(aluno_id);

    // Normaliza os itens do carrinho agrupando por ID e somando quantidades
    const itensMap = new Map();
    for (const item of produtosInput) {
        if (typeof item === 'object' && item !== null) {
            const id = Number(item.id);
            const qtd = Math.max(1, Number(item.quantidade) || 1);
            if (id) {
                itensMap.set(id, (itensMap.get(id) || 0) + qtd);
            }
        } else {
            const id = Number(item);
            if (id) {
                itensMap.set(id, (itensMap.get(id) || 0) + 1);
            }
        }
    }

    if (itensMap.size === 0) {
        throw new Error('DADOS_INVALIDOS');
    }

    // 1. Busca os dados do aluno (saldo e permissão pode_comprar)
    const { data: aluno, error: errAluno } = await supabase
        .from('alunos')
        .select('id, nome, pontos, pode_comprar')
        .eq('id', alunoIdNum)
        .maybeSingle();

    if (errAluno) {
        throw new Error(errAluno.message);
    }
    if (!aluno) {
        throw new Error('ALUNO_NAO_ENCONTRADO');
    }

    // 2. Verifica se tem ocorrências pendentes de consentimento
    const valoresNegativos = [
        'bagunça', 'desmotivado', 'não entregou', 'conflituante',
        'isolado', 'desinteressado', 'indiferente', 'atrasado'
    ];

    const { data: ocorrencias, error: errOc } = await supabase
        .from('avaliacoes')
        .select('id, pontos, valor')
        .eq('aluno_id', alunoIdNum)
        .eq('consentido', false);

    if (errOc) {
        throw new Error(errOc.message);
    }

    const temOcorrenciaNegativa = (ocorrencias || []).some(
        av => (av.pontos !== null && av.pontos <= 10) || valoresNegativos.includes(av.valor)
    );

    if (temOcorrenciaNegativa) {
        throw new Error('OCORRENCIAS_PENDENTES');
    }

    // 3. Busca os produtos no banco para garantir preços e existência reais
    const ids = Array.from(itensMap.keys());
    const { data: produtosDb, error: errProd } = await supabase
        .from('produtos')
        .select('id, nome, custo_pontos')
        .in('id', ids);

    if (errProd) {
        throw new Error(errProd.message);
    }
    if (!produtosDb || produtosDb.length === 0) {
        throw new Error('PRODUTOS_NAO_ENCONTRADOS');
    }

    const prodDbMap = new Map(produtosDb.map(p => [Number(p.id), p]));

    let totalPontos = 0;
    const listaItens = [];
    for (const [id, qtd] of itensMap.entries()) {
        const prod = prodDbMap.get(id);
        if (!prod) {
            throw new Error(`Produto ${id} não encontrado`);
        }
        const custoUnitario = Number(prod.custo_pontos || 0);
        const subtotal = custoUnitario * qtd;
        totalPontos += subtotal;
        listaItens.push({
            id: prod.id,
            nome: prod.nome,
            custo_unitario: custoUnitario,
            quantidade: qtd,
            custo_total: subtotal
        });
    }

    // 4. Validação de Saldo (Obrigatória para AMBOS os casos: Bloqueado e Liberado)
    const saldoAtual = Number(aluno.pontos || 0);
    if (saldoAtual < totalPontos) {
        const err = new Error('SALDO_INSUFICIENTE');
        err.saldoAtual = saldoAtual;
        err.totalPontos = totalPontos;
        err.falta = totalPontos - saldoAtual;
        throw err;
    }

    // 5. Ponto de Decisão: Autorização do Responsável
    const podeComprar = aluno.pode_comprar === true || aluno.pode_comprar === 1;

    // --- CENÁRIO A: Aluno BLOQUEADO para compras ---
    if (!podeComprar) {
        const desejosCriados = [];
        for (const item of listaItens) {
            // Verifica se o item já está na lista de desejos
            const { data: existing, error: errExist } = await supabase
                .from('desejos')
                .select('id')
                .eq('aluno_id', alunoIdNum)
                .eq('produto_id', item.id)
                .maybeSingle();

            if (errExist) {
                console.error('Erro ao verificar desejo existente:', errExist);
            }

            if (!existing) {
                const { error: errInsert } = await supabase
                    .from('desejos')
                    .insert([{
                        aluno_id: alunoIdNum,
                        produto_id: item.id
                    }]);

                if (errInsert) {
                    console.error('Erro ao inserir na lista de desejos:', errInsert);
                }
            }

            desejosCriados.push({
                id: item.id,
                nome: item.nome,
                custo: item.custo_unitario,
                quantidade: item.quantidade,
                custo_total: item.custo_total
            });
        }

        // NÃO desconta PoloCoins
        // NÃO cria compras (pedidos pendentes)
        // NÃO reserva estoque
        return {
            status: 'desejos',
            tipo: 'desejos',
            bloqueado: true,
            desejos: desejosCriados,
            total_pontos: totalPontos,
            saldo_restante: saldoAtual,
            mensagem: 'Pedido enviado para a Lista de Desejos! Aguarde a aprovação do seu responsável.'
        };
    }

    // --- CENÁRIO B: Aluno LIBERADO para compras ---
    // 1. Deduz os pontos do saldo do aluno
    const novoSaldo = await deduzirPontos(alunoIdNum, totalPontos);

    // 2. Registra na tabela compras (fila de entrega: entregue = false)
    const rowsToInsert = [];
    const comprados = [];
    for (const item of listaItens) {
        for (let i = 0; i < item.quantidade; i++) {
            rowsToInsert.push({
                aluno_id: alunoIdNum,
                produto_id: item.id,
                custo_pontos: item.custo_unitario,
                autorizado_por: null,
                entregue: false
            });
        }
        comprados.push({
            id: item.id,
            nome: item.nome,
            custo: item.custo_unitario,
            quantidade: item.quantidade,
            custo_total: item.custo_total
        });
    }

    const { error: errCompras } = await supabase
        .from('compras')
        .insert(rowsToInsert);

    if (errCompras) {
        throw new Error(errCompras.message);
    }

    return {
        status: 'comprado',
        tipo: 'pendente_entrega',
        bloqueado: false,
        comprados,
        total_pontos: totalPontos,
        saldo_restante: novoSaldo,
        mensagem: 'Compra realizada com sucesso! Pedido enviado para a fila de entrega.'
    };
}
