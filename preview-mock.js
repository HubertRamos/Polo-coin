// ============================================================
// PoloCoin — MODO DEMONSTRAÇÃO (somente no preview estático)
// Intercepta fetch() e responde com dados de exemplo, permitindo
// navegar por todo o front-end sem o backend Express/Supabase.
// Este arquivo NÃO faz parte do projeto real.
// ============================================================
(() => {
    const produtos = [
        { id: 1, nome: 'Bala de Goma', custo_pontos: 30, categoria_nome: 'Alimentação' },
        { id: 2, nome: 'Chocolate Barra', custo_pontos: 50, categoria_nome: 'Alimentação' },
        { id: 3, nome: 'Caderno Decorado', custo_pontos: 120, categoria_nome: 'Outros' },
        { id: 4, nome: 'Fone de Ouvido', custo_pontos: 400, categoria_nome: 'Eletrônicos' },
        { id: 5, nome: 'Carrinho de Controle', custo_pontos: 650, categoria_nome: 'Brinquedos' },
        { id: 6, nome: 'Camiseta PoloCoin', custo_pontos: 250, categoria_nome: 'Vestuário' },
    ];
    const categorias = [
        { id: 1, nome: 'Alimentação' }, { id: 2, nome: 'Eletrônicos' },
        { id: 3, nome: 'Brinquedos' }, { id: 4, nome: 'Vestuário' }, { id: 5, nome: 'Outros' },
    ];
    const aluno = { id: 1, nome: 'Hubert Prado Ramos', avatar: '🦊', turma_nome: '3ºA', responsavel_nome: 'Hebert Ramos', pontos: 350, serie: 3, turma: 'A' };
    const alunos = [
        { id: 1, nome: 'Hubert Prado Ramos', avatar: '🦊', pontos: 350, serie: 3, turma: 'A', pode_comprar: true },
        { id: 2, nome: 'Victor Hubo', avatar: '🐼', pontos: 120, serie: 3, turma: 'A', pode_comprar: true },
        { id: 3, nome: 'Maria Silva', avatar: '🐰', pontos: 480, serie: 3, turma: 'A', pode_comprar: false },
    ];
    const ocorrencias = [
        { aluno_nome: 'Hubert Prado Ramos', aluno_avatar: '🦊', serie: 3, turma: 'A', categoria: 'Comportamento', valor: 'bagunça', pontos: 10, observacao: 'Conversou durante a explicação da matéria.', data: '2026-10-10', hora: '09:30' },
        { aluno_nome: 'Hubert Prado Ramos', aluno_avatar: '🦊', serie: 3, turma: 'A', categoria: 'Tarefa', valor: 'não entregou', pontos: 5, observacao: 'Não entregou a atividade de matemática.', data: '2026-10-08', hora: '14:00' },
    ];
    const avaliacoesPos = [
        { aluno_nome: 'Hubert Prado Ramos', aluno_avatar: '🦊', serie: 3, turma: 'A', categoria: 'Destaque', valor: 'ajudou colega', pontos: 20, observacao: 'Ajudou um colega com dificuldade na atividade.', data: '2026-10-12', hora: '10:15' },
    ];
    const filhos = [
        { id: 1, nome: 'Hubert Prado Ramos', avatar: '🦊', serie: 3, turma: 'A', pontos: 350, pode_comprar: false },
        { id: 2, nome: 'Victor Hubo', avatar: '🐼', serie: 3, turma: 'A', pontos: 120, pode_comprar: true },
    ];
    const desejos = [
        { aluno: filhos[0], desejos: [
            { aluno_id: 1, produto_id: 5, produto_nome: 'Carrinho de Controle', custo_pontos: 650 },
            { aluno_id: 1, produto_id: 4, produto_nome: 'Fone de Ouvido', custo_pontos: 400 } ] },
    ];
    const compras = [
        { id: 1, aluno_nome: 'Victor Hubo', produto_nome: 'Chocolate Barra', custo_pontos: 50, autorizado_por: null, criado_em: '2026-10-12 10:00', entregue: 0, turma_nome: '3ºA', categoria_nome: 'Alimentação' },
        { id: 2, aluno_nome: 'Hubert Prado Ramos', produto_nome: 'Caderno Decorado', custo_pontos: 120, autorizado_por: 1, criado_em: '2026-10-11 15:30', entregue: 1, turma_nome: '3ºA', categoria_nome: 'Outros' },
    ];
    const professores = [
        { id: 1, nome: 'Robson', usuario: 'robson' },
        { id: 2, nome: 'Ana Beatriz', usuario: 'anab' },
    ];
    const turmasLista = [{ id: 1, serie: 3, turma: 'A' }, { id: 2, serie: 5, turma: 'B' }];

    const usuariosDemo = {
        aluno:       { id: 1, nome: 'Hubert Prado Ramos', tipo: 'aluno', avatar: '🦊' },
        responsavel: { id: 1, nome: 'Hebert Ramos', tipo: 'responsavel', avatar: '👨‍👧' },
        professor:   { id: 1, nome: 'Robson', tipo: 'professor', avatar: '👨‍🏫' },
        adm:         { id: 1, nome: 'Direção', tipo: 'adm', avatar: '🛡️' },
    };

    const json = (data, status = 200) => new Response(JSON.stringify(data), {
        status, headers: { 'Content-Type': 'application/json' }
    });

    const realFetch = window.fetch.bind(window);

    window.fetch = async (input, opts = {}) => {
        const rawUrl = typeof input === 'string' ? input : input.url;
        const method = (opts.method || (typeof input !== 'string' && input.method) || 'GET').toUpperCase();
        const u = new URL(rawUrl, location.origin);
        const p = u.pathname;

        // Arquivos estáticos passam direto
        if (/\.(html|js|css|json|svg|png|ico|woff2?)$/.test(p)) return realFetch(input, opts);

        let body = {};
        try { if (opts.body) body = JSON.parse(opts.body); } catch {}

        // ---- rotas mockadas ----
        if (method === 'POST' && p === '/login') {
            const user = usuariosDemo[body.tipo] || usuariosDemo.aluno;
            if (body.nome) user.nome = body.nome;
            return json({ user });
        }
        if (method === 'GET' && p === '/aluno/saldo') return json({ pontos: 350 });
        if (method === 'GET' && p === '/aluno/pode-comprar') return json({ pode_comprar: true });
        if (method === 'GET' && p === '/aluno/ocorrencias') return json(ocorrencias);
        if (method === 'GET' && p === '/aluno/desejos') return json(desejos[0].desejos);
        if (method === 'GET' && p === '/categorias/filtro') return json(categorias);
        if (method === 'GET' && p === '/categorias/produtos') return json(categorias);
        if (method === 'GET' && p === '/produtos/filtrados') return json(produtos);
        if (method === 'GET' && p === '/produtos') return json(produtos);
        if (method === 'GET' && /^\/alunos\/\d+$/.test(p)) return json(aluno);
        if (method === 'GET' && p === '/responsavel/filhos') return json(filhos);
        if (method === 'GET' && p === '/responsavel/desejos') return json(desejos);
        if (method === 'GET' && p === '/responsavel/ocorrencias') return json(ocorrencias);
        if (method === 'GET' && p === '/professor/turmas') return json({
            vinculadas: [{ turma_id: 1, serie: 3, turma: 'A' }, { turma_id: 2, serie: 5, turma: 'B' }],
            disponiveis: [{ id: 3, serie: 7, turma: 'C' }],
        });
        if (method === 'GET' && /^\/turmas\/\d+\/alunos/.test(p)) return json({ alunos });
        if (method === 'GET' && /^\/turmas\/\d+\/avaliacoes/.test(p)) return json(avaliacoesPos);
        if (method === 'GET' && p === '/turmas') return json(turmasLista);
        if (method === 'GET' && p === '/professores') return json(professores);
        if (method === 'GET' && /^\/avaliacoes\/\d+/.test(p)) return json(ocorrencias);
        if (method === 'GET' && p === '/admin/compras') return json(compras);
        if (method === 'GET' && p.startsWith('/admin/entregas-pendentes')) return json(compras.filter(c => !c.entregue));
        if (method === 'GET' && p === '/admin/historico-vendas') return json(compras);
        if (method === 'GET' && p.startsWith('/relatorios/')) return json({ avaliacoes: avaliacoesPos, ocorrencias, resumo: { pontos_positivos: 20, pontos_negativos: 15 } });

        // Escritas: sempre sucesso
        if (method !== 'GET') return json({ ok: true, sucesso: true });

        // Qualquer outra rota GET: objeto vazio amigável
        return json([]);
    };

    // Selo de demonstração
    window.addEventListener('DOMContentLoaded', () => {
        const badge = document.createElement('div');
        badge.textContent = '🧪 Modo demonstração — dados fictícios';
        badge.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:99999;background:#1e293b;color:#fff;' +
            'font:600 12px/1 system-ui;padding:8px 14px;border-radius:999px;opacity:.85;pointer-events:none;' +
            'box-shadow:0 4px 12px rgba(0,0,0,.25)';
        document.body.appendChild(badge);
    });
})();
