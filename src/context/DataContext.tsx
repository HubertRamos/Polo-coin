import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Turma,
  Professor,
  Responsavel,
  Aluno,
  Produto,
  Categoria,
  Avaliacao,
  Compra,
  Desejo,
  MovimentacaoAluno,
} from '../types';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase';
import {
  ProfessorImportData,
  AlunoImportData,
  ProdutoImportData,
  normalizarTexto,
} from '../lib/spreadsheetImport';
import {
  validarDuplicidadeProfessor,
  validarDuplicidadeAluno,
  validarDuplicidadeProduto,
  normalizarIdentificador,
  normalizarUsuario,
} from '../lib/duplicateValidation';
import { validarTransferencia } from '../lib/movementService';
import { INITIAL_CATEGORIAS } from '../data/initialData';
import { PRODUCT_CATEGORIES, DEFAULT_PRODUCT_CATEGORY } from '../config/productCategories';

export interface CartItem {
  produto: Produto;
  quantidade: number;
}

interface DataContextType {
  turmas: Turma[];
  professores: Professor[];
  responsaveis: Responsavel[];
  alunos: Aluno[];
  produtos: Produto[];
  categorias: Categoria[];
  avaliacoes: Avaliacao[];
  compras: Compra[];
  desejos: Desejo[];
  carrinho: CartItem[];
  loading: boolean;
  isSupabaseOnline: boolean;
  carregarDados: () => Promise<void>;

  // Cart operations
  addToCart: (produto: Produto, quantidade?: number) => { success: boolean; error?: string };
  removeFromCart: (produtoId: number) => void;
  updateCartQtd: (produtoId: number, delta: number) => { success: boolean; error?: string };
  clearCart: () => void;

  // Turmas & Alunos
  addTurma: (serie: number, turma: string, anoLetivo?: number) => Promise<Turma | null>;
  updateTurmaAnoLetivo: (turmaId: number, anoLetivo: number) => Promise<void>;
  addAluno: (
    turmaId: number,
    nomeAluno: string,
    nomeResponsavel: string,
    senhaAluno?: string,
    matricula?: string
  ) => Promise<Aluno | null>;
  updateAluno: (id: number, data: Partial<Aluno>) => Promise<void>;
  updateAlunoAvatar: (id: number, avatar: string) => Promise<void>;
  updateAlunoPodeComprar: (id: number, podeComprar: boolean) => Promise<void>;
  updateAlunoSenha: (id: number, novaSenha: string) => Promise<void>;
  updateResponsavel: (id: number, data: { nome?: string; senha?: string }) => Promise<void>;

  // Professores
  addProfessor: (name: string, usuario: string, password?: string) => Promise<void>;
  updateProfessor: (id: number, name: string, password?: string) => Promise<void>;
  linkTurmaProfessor: (professorId: number, turmaId: number) => Promise<void>;
  unlinkTurmaProfessor: (professorId: number, turmaId: number) => Promise<void>;

  // Produtos & Categorias
  addProduto: (
    nome: string,
    custo_pontos?: number,
    categoria?: string,
    estoque?: number,
    codigo?: string
  ) => Promise<Produto | null>;
  updateProduto: (
    id: number,
    nome: string,
    custo_pontos: number,
    categoria: string,
    estoque?: number,
    codigo?: string
  ) => Promise<void>;

  // Avaliações
  addAvaliacao: (
    alunoId: number,
    categoria: string,
    valor: string,
    pontos: number,
    tipo: 'positiva' | 'negativa',
    observacao: string,
    professorId?: number,
    professorNome?: string
  ) => Promise<void>;
  consentirAvaliacoes: (avaliacaoIds: number[], responsavelId?: number) => Promise<{ success: boolean; error?: string }>;

  // Desejos
  addDesejo: (alunoId: number, produtoId: number) => Promise<{ success: boolean; error?: string }>;
  removerDesejo: (alunoId: number, produtoId: number) => Promise<void>;
  comprarDesejoPorResponsavel: (alunoId: number, produtoId: number, responsavelId: number) => Promise<{ success: boolean; error?: string }>;

  // Compras & Carrinho checkout
  checkoutCarrinho: (alunoId: number) => Promise<{ success: boolean; destino?: 'entregas' | 'desejos'; error?: string; falta?: number }>;
  comprarProdutoDireto: (alunoId: number, produtoId: number) => Promise<{ success: boolean; error?: string; falta?: number }>;
  marcarEntrega: (compraId: number) => Promise<void>;
  limparHistoricoVendas: () => Promise<void>;
  executarLimpezaGeral: () => Promise<{ removidos: number }>;

  // Importação em massa por planilhas
  importarProfessoresEmMassa: (dados: ProfessorImportData[]) => Promise<BatchImportResult>;
  importarAlunosEmMassa: (dados: AlunoImportData[]) => Promise<BatchImportResult>;
  importarProdutosEmMassa: (dados: ProdutoImportData[]) => Promise<BatchImportResult>;

  // Movimentação & Progressão de Alunos
  movimentacoes: MovimentacaoAluno[];
  transferirAlunos: (params: {
    turmaOrigemId: number;
    turmaDestinoId: number;
    alunosIds: number[];
    adminNome: string;
    motivo?: string;
  }) => Promise<{
    success: boolean;
    loteId: string;
    movimentados: number;
    error?: string;
    detalhes?: { alunoId: number; alunoNome: string; status: 'sucesso' | 'falha'; erro?: string }[];
  }>;
  progredirAlunos: (params: {
    anoOrigem: number;
    anoDestino: number;
    itens: { alunoId: number; turmaDestinoId: number; motivo?: string }[];
    adminNome: string;
    loteId?: string;
    motivoGeral?: string;
  }) => Promise<{
    success: boolean;
    loteId: string;
    movimentados: number;
    error?: string;
    detalhes?: { alunoId: number; alunoNome: string; status: 'sucesso' | 'falha'; erro?: string }[];
  }>;
}

export interface BatchImportResult {
  success: boolean;
  criados: number;
  ignorados: number;
  falhas: number;
  erros: { linha?: number; item: string; motivo: string }[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>(() => {
    try {
      const s = localStorage.getItem('polocoin_categorias_v1');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const nomesExistentes = new Set(parsed.map((c: any) => normalizarIdentificador(c.nome)));
          const unificadas = [...parsed];
          INITIAL_CATEGORIAS.forEach(padrao => {
            if (!nomesExistentes.has(normalizarIdentificador(padrao.nome))) {
              unificadas.push(padrao);
            }
          });
          return unificadas;
        }
      }
    } catch {
      // fallback seguro
    }
    return INITIAL_CATEGORIAS;
  });
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [desejos, setDesejos] = useState<Desejo[]>([]);
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoAluno[]>(() => {
    try {
      const s = localStorage.getItem('polocoin_movimentacoes_v1');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('polocoin_movimentacoes_v1', JSON.stringify(movimentacoes));
    } catch {
      // ignore
    }
  }, [movimentacoes]);

  useEffect(() => {
    try {
      localStorage.setItem('polocoin_categorias_v1', JSON.stringify(categorias));
    } catch {
      // ignore
    }
  }, [categorias]);

  const carregarDados = useCallback(async () => {
    const supabase = getSupabaseClient();
    const config = getSupabaseConfig();

    if (!supabase || !config.isConfigured) {
      setIsSupabaseOnline(false);
      return;
    }

    setLoading(true);
    try {
      const [
        resTurmas,
        resProf,
        resProfTurmas,
        resResp,
        resAlunos,
        resProdutos,
        resCategorias,
        resAvaliacoes,
        resCompras,
        resDesejos,
        resMovimentacoes,
      ] = await Promise.all([
        supabase.from('turmas').select('*').order('serie', { ascending: true }),
        supabase.from('professores').select('*').order('name', { ascending: true }),
        supabase.from('professor_turmas').select('*'),
        supabase.from('responsaveis').select('*').order('nome', { ascending: true }),
        supabase.from('alunos').select('*').order('nome', { ascending: true }),
        supabase.from('produtos').select('*').order('nome', { ascending: true }),
        supabase.from('categorias').select('*').order('nome', { ascending: true }),
        supabase.from('avaliacoes').select('*').order('id', { ascending: false }),
        supabase.from('compras').select('*').order('id', { ascending: false }),
        supabase.from('desejos').select('*').order('id', { ascending: false }),
        supabase.from('movimentacoes_alunos').select('*').order('id', { ascending: false }),
      ]);

      if (resTurmas.data) {
        setTurmas(
          resTurmas.data.map((t: any) => ({
            id: t.id,
            serie: t.serie,
            turma: t.turma,
            anoLetivo: t.ano_letivo || t.anoLetivo || 2026,
          }))
        );
      }

      if (resProf.data) {
        const vinculos = resProfTurmas.data || [];
        setProfessores(
          resProf.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            usuario: p.usuario,
            password: p.password,
            turmasVinculadas: vinculos.filter((v: any) => v.professor_id === p.id).map((v: any) => v.turma_id),
          }))
        );
      }

      if (resResp.data) {
        setResponsaveis(resResp.data.map((r: any) => ({ id: r.id, nome: r.nome, usuario: r.usuario, senha: r.senha })));
      }

      if (resAlunos.data) {
        setAlunos(
          resAlunos.data.map((a: any) => ({
            id: a.id,
            nome: a.nome,
            turmaId: a.turma_id,
            responsavelId: a.responsavel_id,
            avatar: a.avatar || '🦊',
            pontos: a.pontos || 0,
            pode_comprar: a.pode_comprar ?? true,
            senha: a.senha,
            matricula: a.matricula || undefined,
          }))
        );
      }

      if (resProdutos.data) {
        setProdutos(
          resProdutos.data.map((p: any) => ({
            id: p.id,
            nome: p.nome,
            custo_pontos: p.custo_pontos,
            categoria: p.categoria || 'Geral',
            estoque: p.estoque,
            codigo: p.codigo || undefined,
          }))
        );
      }

      if (resCategorias.data && resCategorias.data.length > 0) {
        const nomesDb = new Set(resCategorias.data.map((c: any) => normalizarIdentificador(c.nome)));
        const listaFinal: Categoria[] = resCategorias.data.map((c: any) => ({ id: c.id, nome: c.nome }));

        INITIAL_CATEGORIAS.forEach(padrao => {
          if (!nomesDb.has(normalizarIdentificador(padrao.nome))) {
            listaFinal.push({ id: 1000 + padrao.id, nome: padrao.nome });
          }
        });

        if (resProdutos.data) {
          resProdutos.data.forEach((p: any) => {
            const cat = p.categoria ? String(p.categoria).trim() : '';
            if (cat && !listaFinal.some(c => normalizarIdentificador(c.nome) === normalizarIdentificador(cat))) {
              listaFinal.push({ id: Date.now() + Math.random(), nome: cat });
            }
          });
        }

        setCategorias(listaFinal);
      } else {
        let baseLista: Categoria[] = [...INITIAL_CATEGORIAS];
        try {
          const { data: insertedCats } = await supabase
            .from('categorias')
            .upsert(INITIAL_CATEGORIAS.map(c => ({ nome: c.nome })), { onConflict: 'nome', ignoreDuplicates: true })
            .select();

          if (insertedCats && insertedCats.length > 0) {
            baseLista = insertedCats.map((c: any) => ({ id: c.id, nome: c.nome }));
          }
        } catch (catErr) {
          console.warn('[PoloCoin] Aviso ao sincronizar categorias padrão no banco:', catErr);
        }

        // Incorpora também categorias de produtos já existentes
        if (resProdutos.data) {
          resProdutos.data.forEach((p: any) => {
            const cat = p.categoria ? String(p.categoria).trim() : '';
            if (cat && !baseLista.some(c => normalizarIdentificador(c.nome) === normalizarIdentificador(cat))) {
              baseLista.push({ id: Date.now() + Math.random(), nome: cat });
            }
          });
        }
        setCategorias(baseLista);
      }

      if (resAvaliacoes.data) {
        setAvaliacoes(
          resAvaliacoes.data.map((av: any) => ({
            id: av.id,
            alunoId: av.aluno_id,
            professorId: av.professor_id,
            professorNome: av.professor_nome,
            categoria: av.categoria,
            valor: av.valor,
            pontos: av.pontos,
            tipo: av.tipo,
            observacao: av.observacao || '',
            data: av.data || (av.created_at ? av.created_at.split('T')[0] : ''),
            hora: av.hora || (av.created_at ? av.created_at.substring(11, 16) : ''),
            consentido: av.consentido !== null && av.consentido !== undefined ? av.consentido : av.tipo === 'positiva',
          }))
        );
      }

      if (resCompras.data) {
        setCompras(
          resCompras.data.map((c: any) => ({
            id: c.id,
            alunoId: c.aluno_id,
            produtoId: c.produto_id,
            produtoNome: c.produto_nome,
            custoPontos: c.custo_pontos,
            categoriaNome: c.categoria_nome || 'Geral',
            autorizadoPor: c.autorizado_por,
            criadoEm: c.criado_em || (c.created_at ? c.created_at.substring(0, 16).replace('T', ' ') : ''),
            entregue: c.entregue ?? false,
          }))
        );
      }

      if (resDesejos.data) {
        setDesejos(
          resDesejos.data.map((d: any) => ({
            id: d.id,
            alunoId: d.aluno_id,
            produtoId: d.produto_id,
            criadoEm: d.criado_em || '',
          }))
        );
      }

      if (resMovimentacoes && resMovimentacoes.data) {
        setMovimentacoes(
          resMovimentacoes.data.map((m: any) => ({
            id: m.id,
            alunoId: m.aluno_id,
            alunoNome: m.aluno_nome,
            alunoMatricula: m.aluno_matricula || undefined,
            turmaOrigemId: m.turma_origem_id,
            turmaOrigemNome: m.turma_origem_nome,
            anoLetivoOrigem: m.ano_letivo_origem,
            turmaDestinoId: m.turma_destino_id,
            turmaDestinoNome: m.turma_destino_nome,
            anoLetivoDestino: m.ano_letivo_destino,
            tipo: m.tipo,
            dataHora: m.data_hora || m.created_at || '',
            adminNome: m.admin_nome,
            loteId: m.lote_id,
            motivo: m.motivo || undefined,
            resultado: m.resultado || 'sucesso',
          }))
        );
      }

      setIsSupabaseOnline(true);
    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err);
      setIsSupabaseOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Cart operations
  const addToCart = (produto: Produto, quantidade = 1): { success: boolean; error?: string } => {
    const qtdToAdd = Math.max(1, quantidade);

    if (produto.estoque !== undefined) {
      if (produto.estoque <= 0) {
        return { success: false, error: `O produto "${produto.nome}" está esgotado no estoque.` };
      }
      const itemExistente = carrinho.find(item => item.produto.id === produto.id);
      const qtdAtual = itemExistente ? itemExistente.quantidade : 0;
      if (qtdAtual + qtdToAdd > produto.estoque) {
        return {
          success: false,
          error: `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoque} (você já possui ${qtdAtual} no carrinho).`,
        };
      }
    }

    setCarrinho(prev => {
      const existing = prev.find(item => item.produto.id === produto.id);
      if (existing) {
        return prev.map(item =>
          item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + qtdToAdd } : item
        );
      }
      return [...prev, { produto, quantidade: qtdToAdd }];
    });

    return { success: true };
  };

  const removeFromCart = (produtoId: number) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const updateCartQtd = (produtoId: number, delta: number): { success: boolean; error?: string } => {
    const item = carrinho.find(i => i.produto.id === produtoId);
    if (!item) return { success: false, error: 'Item não encontrado no carrinho.' };

    if (delta > 0 && item.produto.estoque !== undefined) {
      if (item.quantidade + delta > item.produto.estoque) {
        return {
          success: false,
          error: `Limite de estoque atingido para "${item.produto.nome}" (${item.produto.estoque} unidades disponíveis).`,
        };
      }
    }

    setCarrinho(prev =>
      prev
        .map(i => {
          if (i.produto.id === produtoId) {
            const novaQtd = i.quantidade + delta;
            return novaQtd > 0 ? { ...i, quantidade: novaQtd } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );

    return { success: true };
  };

  const clearCart = () => setCarrinho([]);

  // Turmas
  const addTurma = async (serie: number, turma: string, anoLetivo = 2026): Promise<Turma | null> => {
    const supabase = getSupabaseClient();
    const turmaUpper = turma.toUpperCase().trim();
    const ano = Number(anoLetivo) || 2026;

    if (supabase) {
      const { data, error } = await supabase
        .from('turmas')
        .insert([{ serie, turma: turmaUpper, ano_letivo: ano }])
        .select()
        .single();

      if (!error && data) {
        const criada: Turma = {
          id: data.id,
          serie: data.serie,
          turma: data.turma,
          anoLetivo: data.ano_letivo || ano,
        };
        setTurmas(prev => [...prev, criada]);
        return criada;
      }
    }

    const nova: Turma = { id: Date.now(), serie, turma: turmaUpper, anoLetivo: ano };
    setTurmas(prev => [...prev, nova]);
    return nova;
  };

  const updateTurmaAnoLetivo = async (turmaId: number, anoLetivo: number) => {
    const ano = Number(anoLetivo) || 2026;
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('turmas').update({ ano_letivo: ano }).eq('id', turmaId);
    }
    setTurmas(prev => prev.map(t => (t.id === turmaId ? { ...t, anoLetivo: ano } : t)));
  };

  // Alunos
  const addAluno = async (
    turmaId: number,
    nomeAluno: string,
    nomeResponsavel: string,
    senhaAluno = '123',
    matricula?: string
  ) => {
    const cleanNome = nomeAluno.trim();
    const cleanMatricula = matricula ? matricula.trim() : undefined;

    // 1. Validação centralizada de duplicidade
    const validacao = validarDuplicidadeAluno(
      { nome: cleanNome, turmaId, matricula: cleanMatricula },
      alunos
    );
    if (validacao.isDuplicate) {
      throw new Error(validacao.message || 'Aluno duplicado.');
    }

    const supabase = getSupabaseClient();

    // 2. Verificação no Supabase contra concorrência
    if (supabase) {
      if (cleanMatricula) {
        const { data: alunoMat } = await supabase
          .from('alunos')
          .select('id, nome, matricula')
          .ilike('matricula', cleanMatricula)
          .maybeSingle();

        if (alunoMat) {
          throw new Error(`Esta matrícula escolar (${cleanMatricula}) já está vinculada a outro(a) aluno(a).`);
        }
      }

      const { data: alunoTurma } = await supabase
        .from('alunos')
        .select('id, nome')
        .eq('turma_id', turmaId)
        .ilike('nome', cleanNome)
        .maybeSingle();

      if (alunoTurma) {
        throw new Error(`Já existe um(a) aluno(a) cadastrado(a) nesta turma com o nome "${cleanNome}".`);
      }
    }

    let respId: number;
    const respExistente = responsaveis.find(
      r => normalizarIdentificador(r.nome) === normalizarIdentificador(nomeResponsavel)
    );

    if (respExistente) {
      respId = respExistente.id;
    } else {
      const baseUser = normalizarUsuario(nomeResponsavel.replace(/\s+/g, ''));
      let novoUsuario = baseUser || 'resp';
      let count = 2;
      while (responsaveis.some(r => normalizarUsuario(r.usuario) === novoUsuario)) {
        novoUsuario = `${baseUser}${count}`;
        count++;
      }

      if (supabase) {
        const { data: respData, error: respErr } = await supabase
          .from('responsaveis')
          .insert([{ nome: nomeResponsavel.trim(), usuario: novoUsuario, senha: '123' }])
          .select()
          .single();

        if (respErr && (respErr as any).code === '23505') {
          const { data: existingResp } = await supabase
            .from('responsaveis')
            .select('id, nome, usuario, senha')
            .ilike('nome', nomeResponsavel.trim())
            .maybeSingle();
          if (existingResp) {
            respId = existingResp.id;
          } else {
            respId = Date.now();
          }
        } else if (respData) {
          respId = respData.id;
          setResponsaveis(prev => [...prev, { id: respData.id, nome: respData.nome, usuario: respData.usuario, senha: respData.senha }]);
        } else {
          respId = Date.now();
        }
      } else {
        respId = Date.now();
        setResponsaveis(prev => [...prev, { id: respId, nome: nomeResponsavel.trim(), usuario: novoUsuario, senha: '123' }]);
      }
    }

    if (supabase) {
      const payload: any = {
        nome: cleanNome,
        turma_id: turmaId,
        responsavel_id: respId,
        avatar: '🦊',
        pontos: 0,
        pode_comprar: true,
        senha: senhaAluno,
      };
      if (cleanMatricula) {
        payload.matricula = cleanMatricula;
      }

      const { data: alunoData, error: alunoErr } = await supabase
        .from('alunos')
        .insert([payload])
        .select()
        .single();

      if (alunoErr) {
        if ((alunoErr as any).code === '23505') {
          if (cleanMatricula && alunoErr.message.toLowerCase().includes('matricula')) {
            throw new Error(`Esta matrícula escolar (${cleanMatricula}) já está em uso.`);
          }
          throw new Error(`Já existe um aluno cadastrado nesta turma com o nome "${cleanNome}".`);
        }
        throw new Error('Falha ao salvar aluno no servidor.');
      }

      if (alunoData) {
        const novo: Aluno = {
          id: alunoData.id,
          nome: alunoData.nome,
          turmaId: alunoData.turma_id,
          responsavelId: alunoData.responsavel_id,
          avatar: alunoData.avatar || '🦊',
          pontos: alunoData.pontos || 0,
          pode_comprar: alunoData.pode_comprar ?? true,
          senha: alunoData.senha,
          matricula: alunoData.matricula || cleanMatricula,
        };
        setAlunos(prev => [...prev, novo]);
        return novo;
      }
    }

    const novoFallback: Aluno = {
      id: Date.now() + 1,
      nome: cleanNome,
      turmaId,
      responsavelId: respId,
      avatar: '🦊',
      pontos: 0,
      pode_comprar: true,
      senha: senhaAluno,
      matricula: cleanMatricula,
    };
    setAlunos(prev => [...prev, novoFallback]);
    return novoFallback;
  };

  const updateAluno = async (id: number, data: Partial<Aluno>) => {
    const cleanNome = data.nome !== undefined ? data.nome.trim() : undefined;
    const cleanMatricula = data.matricula !== undefined ? data.matricula.trim() || undefined : undefined;
    const alunoAtual = alunos.find(a => a.id === id);

    if (alunoAtual && (cleanNome || cleanMatricula || data.turmaId)) {
      const validacao = validarDuplicidadeAluno(
        {
          nome: cleanNome || alunoAtual.nome,
          turmaId: data.turmaId || alunoAtual.turmaId,
          matricula: cleanMatricula !== undefined ? cleanMatricula : alunoAtual.matricula,
        },
        alunos,
        id
      );
      if (validacao.isDuplicate) {
        throw new Error(validacao.message || 'Dados conflitantes com outro aluno.');
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const payload: any = {};
      if (cleanNome !== undefined) payload.nome = cleanNome;
      if (data.pontos !== undefined) payload.pontos = data.pontos;
      if (data.pode_comprar !== undefined) payload.pode_comprar = data.pode_comprar;
      if (data.avatar !== undefined) payload.avatar = data.avatar;
      if (cleanMatricula !== undefined) payload.matricula = cleanMatricula || null;
      if (data.turmaId !== undefined) payload.turma_id = data.turmaId;
      if (data.senha !== undefined && data.senha.trim()) payload.senha = data.senha.trim();

      const { error } = await supabase.from('alunos').update(payload).eq('id', id);
      if (error) {
        if ((error as any).code === '23505') {
          throw new Error('Os dados informados entram em conflito com outro aluno já existente.');
        }
        throw new Error('Falha ao atualizar dados do aluno.');
      }
    }
    setAlunos(prev =>
      prev.map(a =>
        a.id === id
          ? {
              ...a,
              ...data,
              nome: cleanNome || a.nome,
              matricula: cleanMatricula !== undefined ? cleanMatricula : a.matricula,
              senha: data.senha !== undefined && data.senha.trim() ? data.senha.trim() : a.senha,
            }
          : a
      )
    );
  };

  const updateAlunoAvatar = async (id: number, avatar: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('alunos').update({ avatar }).eq('id', id);
    }
    setAlunos(prev => prev.map(a => (a.id === id ? { ...a, avatar } : a)));
  };

  const updateAlunoPodeComprar = async (id: number, podeComprar: boolean) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('alunos').update({ pode_comprar: podeComprar }).eq('id', id);
    }
    setAlunos(prev => prev.map(a => (a.id === id ? { ...a, pode_comprar: podeComprar } : a)));
  };

  const updateAlunoSenha = async (id: number, novaSenha: string) => {
    const cleanSenha = novaSenha.trim();
    if (!cleanSenha || cleanSenha.length < 3) {
      throw new Error('A nova senha do aluno deve conter no mínimo 3 caracteres.');
    }
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('alunos').update({ senha: cleanSenha }).eq('id', id);
    }
    setAlunos(prev => prev.map(a => (a.id === id ? { ...a, senha: cleanSenha } : a)));
  };

  const updateResponsavel = async (id: number, data: { nome?: string; senha?: string }) => {
    const cleanNome = data.nome !== undefined ? data.nome.trim() : undefined;
    const cleanSenha = data.senha !== undefined && data.senha.trim() ? data.senha.trim() : undefined;

    if (cleanNome !== undefined && !cleanNome) {
      throw new Error('O nome do responsável não pode ficar em branco.');
    }
    if (cleanSenha !== undefined && cleanSenha.length < 3) {
      throw new Error('A nova senha do responsável deve ter pelo menos 3 caracteres.');
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const payload: any = {};
      if (cleanNome !== undefined) payload.nome = cleanNome;
      if (cleanSenha !== undefined) payload.senha = cleanSenha;

      if (Object.keys(payload).length > 0) {
        const { error } = await supabase.from('responsaveis').update(payload).eq('id', id);
        if (error) {
          throw new Error('Falha ao atualizar dados do responsável no banco.');
        }
      }
    }

    setResponsaveis(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              nome: cleanNome !== undefined ? cleanNome : r.nome,
              senha: cleanSenha !== undefined ? cleanSenha : r.senha,
            }
          : r
      )
    );
  };

  // Professores
  const addProfessor = async (name: string, usuario: string, password = '123') => {
    const cleanName = name.trim();
    let cleanUser = normalizarUsuario(usuario);
    if (!cleanUser && cleanName) {
      const baseUser = normalizarUsuario(cleanName.replace(/\s+/g, '.'));
      cleanUser = baseUser;
      let counter = 2;
      while (professores.some(p => normalizarUsuario(p.usuario) === cleanUser)) {
        cleanUser = `${baseUser}${counter}`;
        counter++;
      }
    }

    // 1. Validação centralizada de duplicidade (unicidade pelo usuário de acesso)
    const validacao = validarDuplicidadeProfessor({ usuario: cleanUser, name: cleanName }, professores);
    if (validacao.isDuplicate) {
      throw new Error(validacao.message || 'Já existe um professor com este usuário de acesso.');
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      // Prevenção contra concorrência
      const { data: existente } = await supabase
        .from('professores')
        .select('id, usuario')
        .ilike('usuario', cleanUser)
        .maybeSingle();

      if (existente) {
        throw new Error(`Já existe um professor cadastrado com o usuário de acesso "@${cleanUser}".`);
      }

      const { data, error } = await supabase
        .from('professores')
        .insert([{ name: cleanName, usuario: cleanUser, password }])
        .select()
        .single();

      if (error) {
        if ((error as any).code === '23505') {
          throw new Error(`Já existe um professor cadastrado com o usuário de acesso "@${cleanUser}".`);
        }
        throw new Error('Não foi possível cadastrar o professor. Verifique os dados informados.');
      }

      if (data) {
        setProfessores(prev => [...prev, { id: data.id, name: data.name, usuario: data.usuario, password: data.password, turmasVinculadas: [] }]);
        return;
      }
    }

    const novo: Professor = {
      id: Date.now(),
      name: cleanName,
      usuario: cleanUser,
      password,
      turmasVinculadas: [],
    };
    setProfessores(prev => [...prev, novo]);
  };

  const updateProfessor = async (id: number, name: string, password?: string) => {
    const cleanName = name.trim();
    const profAtual = professores.find(p => p.id === id);
    if (!profAtual) return;

    const supabase = getSupabaseClient();
    if (supabase) {
      const payload: any = { name: cleanName };
      if (password && password.trim()) payload.password = password.trim();
      const { error } = await supabase.from('professores').update(payload).eq('id', id);
      if (error) {
        throw new Error('Não foi possível atualizar os dados do professor.');
      }
    }
    setProfessores(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              name: cleanName,
              password: password && password.trim() ? password.trim() : p.password,
            }
          : p
      )
    );
  };

  const linkTurmaProfessor = async (professorId: number, turmaId: number) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('professor_turmas').insert([{ professor_id: professorId, turma_id: turmaId }]);
    }
    setProfessores(prev =>
      prev.map(p =>
        p.id === professorId && !p.turmasVinculadas.includes(turmaId)
          ? { ...p, turmasVinculadas: [...p.turmasVinculadas, turmaId] }
          : p
      )
    );
  };

  const unlinkTurmaProfessor = async (professorId: number, turmaId: number) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from('professor_turmas')
        .delete()
        .eq('professor_id', professorId)
        .eq('turma_id', turmaId);
    }
    setProfessores(prev =>
      prev.map(p =>
        p.id === professorId
          ? { ...p, turmasVinculadas: p.turmasVinculadas.filter(tid => tid !== turmaId) }
          : p
      )
    );
  };

  // Produtos
  const addProduto = async (
    nome: string,
    custo_pontos?: number,
    categoria?: string,
    estoque?: number,
    codigo?: string
  ) => {
    const cleanNome = nome.trim();
    if (!cleanNome) {
      throw new Error('O nome do produto não pode ficar em branco.');
    }
    const cleanCat = (categoria && categoria.trim()) || DEFAULT_PRODUCT_CATEGORY.nome;
    const custoFinal =
      custo_pontos !== undefined && !isNaN(custo_pontos) && custo_pontos > 0
        ? Number(custo_pontos)
        : 10;
    const cleanCodigo = codigo ? codigo.trim() : undefined;

    // 1. Validação centralizada de duplicidade
    const validacao = validarDuplicidadeProduto(
      { nome: cleanNome, categoria: cleanCat, codigo: cleanCodigo },
      produtos
    );
    if (validacao.isDuplicate) {
      throw new Error(validacao.message || 'Produto duplicado.');
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      if (cleanCodigo) {
        const { data: prodCod } = await supabase
          .from('produtos')
          .select('id, nome, codigo')
          .ilike('codigo', cleanCodigo)
          .maybeSingle();

        if (prodCod) {
          throw new Error(`Já existe um produto cadastrado com o código / SKU "${cleanCodigo}".`);
        }
      }

      const { data: prodCat } = await supabase
        .from('produtos')
        .select('id, nome, categoria')
        .ilike('categoria', cleanCat)
        .ilike('nome', cleanNome)
        .maybeSingle();

      if (prodCat) {
        throw new Error(`Já existe um produto com o nome "${cleanNome}" na categoria "${cleanCat}".`);
      }

      const payload: any = {
        nome: cleanNome,
        custo_pontos: custoFinal,
        categoria: cleanCat,
      };
      if (cleanCodigo) payload.codigo = cleanCodigo;
      if (estoque !== undefined) payload.estoque = estoque;

      const { data, error } = await supabase
        .from('produtos')
        .insert([payload])
        .select()
        .single();

      if (error) {
        if ((error as any).code === '23505') {
          throw new Error('Já existe um produto com este código ou com o mesmo nome na mesma categoria.');
        }
        throw new Error('Não foi possível salvar o produto.');
      }

      if (data) {
        const novo: Produto = {
          id: data.id,
          nome: data.nome,
          custo_pontos: data.custo_pontos,
          categoria: data.categoria,
          estoque: data.estoque,
          codigo: data.codigo || cleanCodigo,
        };
        if (!categorias.some(c => normalizarIdentificador(c.nome) === normalizarIdentificador(cleanCat))) {
          setCategorias(prev => [...prev, { id: Date.now(), nome: cleanCat }]);
        }
        setProdutos(prev => [...prev, novo]);
        return novo;
      }
    }

    if (!categorias.some(c => normalizarIdentificador(c.nome) === normalizarIdentificador(cleanCat))) {
      setCategorias(prev => [...prev, { id: Date.now(), nome: cleanCat }]);
    }

    const novoFallback: Produto = {
      id: Date.now(),
      nome: cleanNome,
      custo_pontos: custoFinal,
      categoria: cleanCat,
      estoque,
      codigo: cleanCodigo,
    };
    setProdutos(prev => [...prev, novoFallback]);
    return novoFallback;
  };

  const updateProduto = async (
    id: number,
    nome: string,
    custo_pontos: number,
    categoria: string,
    estoque?: number,
    codigo?: string
  ) => {
    const cleanNome = nome.trim();
    const cleanCat = categoria.trim() || 'Geral';
    const cleanCodigo = codigo ? codigo.trim() || undefined : undefined;

    // Validação de duplicidade excluindo o próprio ID
    const validacao = validarDuplicidadeProduto(
      { nome: cleanNome, categoria: cleanCat, codigo: cleanCodigo },
      produtos,
      id
    );
    if (validacao.isDuplicate) {
      throw new Error(validacao.message || 'Produto conflitante com item já cadastrado.');
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      const payload: any = {
        nome: cleanNome,
        custo_pontos,
        categoria: cleanCat,
      };
      if (cleanCodigo !== undefined) payload.codigo = cleanCodigo || null;

      const { error } = await supabase.from('produtos').update(payload).eq('id', id);
      if (error) {
        if ((error as any).code === '23505') {
          throw new Error('Já existe outro produto cadastrado com este código ou nome na mesma categoria.');
        }
        throw new Error('Falha ao atualizar produto.');
      }
    }

    setProdutos(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              nome: cleanNome,
              custo_pontos,
              categoria: cleanCat,
              estoque: estoque !== undefined ? estoque : p.estoque,
              codigo: cleanCodigo !== undefined ? cleanCodigo : p.codigo,
            }
          : p
      )
    );
    if (!categorias.some(c => normalizarIdentificador(c.nome) === normalizarIdentificador(cleanCat))) {
      setCategorias(prev => [...prev, { id: Date.now(), nome: cleanCat }]);
    }
  };

  // Avaliações
  const addAvaliacao = async (
    alunoId: number,
    categoria: string,
    valor: string,
    pontos: number,
    tipo: 'positiva' | 'negativa',
    observacao: string,
    professorId = 1,
    professorNome = 'Professor'
  ) => {
    const agora = new Date();
    const dataStr = agora.toISOString().split('T')[0];
    const horaStr = agora.toTimeString().substring(0, 5);

    const supabase = getSupabaseClient();

    if (supabase) {
      const { data: avData } = await supabase
        .from('avaliacoes')
        .insert([
          {
            aluno_id: alunoId,
            professor_id: professorId,
            professor_nome: professorNome,
            categoria,
            valor,
            pontos,
            tipo,
            observacao,
            data: dataStr,
            hora: horaStr,
            consentido: tipo === 'positiva',
          },
        ])
        .select()
        .single();

      // Atualiza saldo do aluno no banco
      const alunoAtual = alunos.find(a => a.id === alunoId);
      if (alunoAtual) {
        const delta = tipo === 'positiva' ? pontos : -pontos;
        const novoSaldo = Math.max(0, alunoAtual.pontos + delta);
        await supabase.from('alunos').update({ pontos: novoSaldo }).eq('id', alunoId);
      }

      if (avData) {
        setAvaliacoes(prev => [
          {
            id: avData.id,
            alunoId: avData.aluno_id,
            professorId: avData.professor_id,
            professorNome: avData.professor_nome,
            categoria: avData.categoria,
            valor: avData.valor,
            pontos: avData.pontos,
            tipo: avData.tipo,
            observacao: avData.observacao || '',
            data: avData.data,
            hora: avData.hora,
            consentido: avData.consentido,
          },
          ...prev,
        ]);

        setAlunos(prev =>
          prev.map(a => {
            if (a.id === alunoId) {
              const delta = tipo === 'positiva' ? pontos : -pontos;
              return { ...a, pontos: Math.max(0, a.pontos + delta) };
            }
            return a;
          })
        );
        return;
      }
    }

    const novaFallback: Avaliacao = {
      id: Date.now(),
      alunoId,
      professorId,
      professorNome,
      categoria,
      valor,
      pontos,
      tipo,
      observacao,
      data: dataStr,
      hora: horaStr,
      consentido: tipo === 'positiva',
    };
    setAvaliacoes(prev => [novaFallback, ...prev]);

    setAlunos(prev =>
      prev.map(a => {
        if (a.id === alunoId) {
          const delta = tipo === 'positiva' ? pontos : -pontos;
          return { ...a, pontos: Math.max(0, a.pontos + delta) };
        }
        return a;
      })
    );
  };

  const consentirAvaliacoes = async (
    avaliacaoIds: number[],
    responsavelId?: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!avaliacaoIds || avaliacaoIds.length === 0) {
      return { success: true };
    }

    // Validação estrita de segurança: apenas permitir confirmar ocorrências dos alunos vinculados à conta do responsável
    if (responsavelId) {
      const filhosValidosIds = alunos.filter(a => a.responsavelId === responsavelId).map(a => a.id);
      const invalidas = avaliacoes.filter(
        av => avaliacaoIds.includes(av.id) && !filhosValidosIds.includes(av.alunoId)
      );

      if (invalidas.length > 0) {
        return {
          success: false,
          error: 'Operação não permitida: você só pode confirmar ocorrências de alunos vinculados à sua conta.',
        };
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('avaliacoes')
          .update({ consentido: true })
          .in('id', avaliacaoIds);

        if (error) {
          console.error('[DataContext] Erro ao registrar consentimento no Supabase:', error);
          return {
            success: false,
            error: 'Não foi possível salvar a ciência no banco de dados. Por favor, tente novamente.',
          };
        }
      } catch (err: any) {
        console.error('[DataContext] Falha na comunicação ao registrar consentimento:', err);
        return {
          success: false,
          error: 'Erro de conexão com o servidor. Verifique sua conexão e tente novamente.',
        };
      }
    }

    // Atualiza estado local apenas após confirmação de sucesso
    setAvaliacoes(prev =>
      prev.map(av => (avaliacaoIds.includes(av.id) ? { ...av, consentido: true } : av))
    );

    return { success: true };
  };

  // Desejos
  const addDesejo = async (alunoId: number, produtoId: number) => {
    const temPendentes = avaliacoes.some(av => av.alunoId === alunoId && av.tipo === 'negativa' && !av.consentido);
    if (temPendentes) {
      return { success: false, error: 'Você tem ocorrências pendentes de consentimento dos responsáveis.' };
    }

    const jaExiste = desejos.some(d => d.alunoId === alunoId && d.produtoId === produtoId);
    if (jaExiste) {
      return { success: false, error: 'Este produto já está na sua lista de desejos!' };
    }

    const agoraStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data } = await supabase
        .from('desejos')
        .insert([{ aluno_id: alunoId, produto_id: produtoId, criado_em: agoraStr }])
        .select()
        .single();

      if (data) {
        setDesejos(prev => [{ id: data.id, alunoId: data.aluno_id, produtoId: data.produto_id, criadoEm: data.criado_em }, ...prev]);
        return { success: true };
      }
    }

    setDesejos(prev => [{ id: Date.now(), alunoId, produtoId, criadoEm: agoraStr }, ...prev]);
    return { success: true };
  };

  const removerDesejo = async (alunoId: number, produtoId: number) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('desejos').delete().eq('aluno_id', alunoId).eq('produto_id', produtoId);
    }
    setDesejos(prev => prev.filter(d => !(d.alunoId === alunoId && d.produtoId === produtoId)));
  };

  const comprarDesejoPorResponsavel = async (alunoId: number, produtoId: number, responsavelId: number) => {
    const aluno = alunos.find(a => a.id === alunoId);
    const produto = produtos.find(p => p.id === produtoId);
    const desejo = desejos.find(d => d.alunoId === alunoId && d.produtoId === produtoId);

    if (!aluno || !produto) return { success: false, error: 'Aluno ou produto não encontrado.' };

    const qtd = desejo?.quantidade && desejo.quantidade > 0 ? desejo.quantidade : 1;
    const custoTotal = produto.custo_pontos * qtd;

    if (produto.estoque !== undefined && produto.estoque < qtd) {
      return {
        success: false,
        error: `Estoque insuficiente para "${produto.nome}" (disponível: ${produto.estoque}).`,
      };
    }

    if (aluno.pontos < custoTotal) {
      return { success: false, error: `Saldo insuficiente (${aluno.pontos}/${custoTotal} PoloCoins).` };
    }

    const novoSaldo = aluno.pontos - custoTotal;
    const agoraStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
    const supabase = getSupabaseClient();

    const novasCompras: Compra[] = [];
    const insertsSupabase: any[] = [];
    for (let i = 0; i < qtd; i++) {
      novasCompras.push({
        id: Date.now() + Math.random(),
        alunoId,
        produtoId,
        produtoNome: produto.nome,
        custoPontos: produto.custo_pontos,
        categoriaNome: produto.categoria,
        autorizadoPor: responsavelId,
        criadoEm: agoraStr,
        entregue: false,
      });

      insertsSupabase.push({
        aluno_id: alunoId,
        produto_id: produtoId,
        produto_nome: produto.nome,
        custo_pontos: produto.custo_pontos,
        categoria_nome: produto.categoria,
        autorizado_por: responsavelId,
        entregue: false,
        criado_em: agoraStr,
      });
    }

    if (supabase) {
      try {
        const { error: errAluno } = await supabase.from('alunos').update({ pontos: novoSaldo }).eq('id', alunoId);
        if (errAluno) {
          console.error('[DataContext] Erro ao debitar saldo no Supabase:', errAluno);
          return { success: false, error: 'Falha ao debitar saldo no servidor.' };
        }
        await supabase.from('compras').insert(insertsSupabase);
        await supabase.from('desejos').delete().eq('aluno_id', alunoId).eq('produto_id', produtoId);
      } catch (err: any) {
        console.error('[DataContext] Erro no servidor:', err);
        return { success: false, error: 'Falha de comunicação ao autorizar o resgate.' };
      }
    }

    setAlunos(prev => prev.map(a => (a.id === alunoId ? { ...a, pontos: novoSaldo } : a)));
    setCompras(prev => [...novasCompras, ...prev]);
    if (produto.estoque !== undefined) {
      setProdutos(prev =>
        prev.map(p => (p.id === produtoId ? { ...p, estoque: Math.max(0, (p.estoque ?? 0) - qtd) } : p))
      );
    }
    removerDesejo(alunoId, produtoId);
    return { success: true };
  };

  // Compras & Carrinho checkout
  const checkoutCarrinho = async (
    alunoId: number
  ): Promise<{
    success: boolean;
    destino?: 'entregas' | 'desejos';
    error?: string;
    falta?: number;
  }> => {
    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) return { success: false, error: 'Aluno não encontrado.' };

    if (carrinho.length === 0) {
      return { success: false, error: 'Seu carrinho está vazio. Adicione recompensas na loja.' };
    }

    // Validação de ocorrências disciplinares pendentes
    const temPendentes = avaliacoes.some(av => av.alunoId === alunoId && av.tipo === 'negativa' && !av.consentido);
    if (temPendentes) {
      return {
        success: false,
        error: 'Você possui ocorrências disciplinares com pendência de ciência do seu responsável. Solicite a confirmação aos seus pais antes de concluir novos pedidos.',
      };
    }

    // Validação de estoque para todos os itens do carrinho
    for (const item of carrinho) {
      if (item.produto.estoque !== undefined) {
        if (item.produto.estoque <= 0) {
          return {
            success: false,
            error: `O produto "${item.produto.nome}" está esgotado no estoque escolar.`,
          };
        }
        if (item.quantidade > item.produto.estoque) {
          return {
            success: false,
            error: `Estoque insuficiente para "${item.produto.nome}" (disponível: ${item.produto.estoque}, no carrinho: ${item.quantidade}).`,
          };
        }
      }
    }

    const totalPontos = carrinho.reduce((sum, item) => sum + item.produto.custo_pontos * item.quantidade, 0);
    const agoraStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
    const supabase = getSupabaseClient();

    // ============================================================
    // CASO A — Aluno liberado para compras autônomas (pode_comprar: true)
    // ============================================================
    if (aluno.pode_comprar) {
      if (aluno.pontos < totalPontos) {
        const falta = totalPontos - aluno.pontos;
        return {
          success: false,
          error: `Saldo insuficiente! Você possui 🪙 ${aluno.pontos} PoloCoins e o total é 🪙 ${totalPontos}. Faltam 🪙 ${falta} PoloCoins.`,
          falta,
        };
      }

      const novoSaldo = aluno.pontos - totalPontos;
      const novasCompras: Compra[] = [];
      const insertsSupabase: any[] = [];

      carrinho.forEach(item => {
        for (let i = 0; i < item.quantidade; i++) {
          novasCompras.push({
            id: Date.now() + Math.random(),
            alunoId,
            produtoId: item.produto.id,
            produtoNome: item.produto.nome,
            custoPontos: item.produto.custo_pontos,
            categoriaNome: item.produto.categoria,
            autorizadoPor: null,
            criadoEm: agoraStr,
            entregue: false,
          });

          insertsSupabase.push({
            aluno_id: alunoId,
            produto_id: item.produto.id,
            produto_nome: item.produto.nome,
            custo_pontos: item.produto.custo_pontos,
            categoria_nome: item.produto.categoria,
            autorizado_por: null,
            entregue: false,
            criado_em: agoraStr,
          });
        }
      });

      if (supabase) {
        try {
          const { error: errSaldo } = await supabase.from('alunos').update({ pontos: novoSaldo }).eq('id', alunoId);
          if (errSaldo) {
            console.error('[DataContext] Erro ao debitar saldo no Supabase:', errSaldo);
            return {
              success: false,
              error: 'Não foi possível debitar o saldo no servidor. Os itens foram mantidos no carrinho.',
            };
          }

          const { error: errCompras } = await supabase.from('compras').insert(insertsSupabase);
          if (errCompras) {
            console.error('[DataContext] Erro ao registrar compras no Supabase:', errCompras);
            // Reverter saldo em caso de falha nas compras
            await supabase.from('alunos').update({ pontos: aluno.pontos }).eq('id', alunoId);
            return {
              success: false,
              error: 'Falha ao registrar entrega pendente no servidor. Tente novamente.',
            };
          }
        } catch (err: any) {
          console.error('[DataContext] Erro de rede ao finalizar compra:', err);
          return {
            success: false,
            error: 'Erro de conexão com o servidor. O carrinho foi preservado para nova tentativa.',
          };
        }
      }

      // Atualiza compras pendentes de entrega
      setCompras(prev => [...novasCompras, ...prev]);
      // Atualiza saldo do aluno
      setAlunos(prev => prev.map(a => (a.id === alunoId ? { ...a, pontos: novoSaldo } : a)));
      // Movimenta estoque se rastreado
      setProdutos(prev =>
        prev.map(p => {
          const cartItem = carrinho.find(ci => ci.produto.id === p.id);
          if (cartItem && p.estoque !== undefined) {
            return { ...p, estoque: Math.max(0, p.estoque - cartItem.quantidade) };
          }
          return p;
        })
      );

      clearCart();
      return { success: true, destino: 'entregas' };
    }

    // ============================================================
    // CASO B — Aluno NÃO liberado para compras autônomas (pode_comprar: false)
    // Envia o pedido para a Lista de Desejos / Aprovação do Responsável
    // NÃO deduz PoloCoins nem movimenta estoque
    // ============================================================
    const novosDesejos: Desejo[] = [];
    const insertsSupabaseDesejos: any[] = [];

    carrinho.forEach(item => {
      const jaExiste = desejos.some(d => d.alunoId === alunoId && d.produtoId === item.produto.id);
      if (!jaExiste) {
        novosDesejos.push({
          id: Date.now() + Math.random(),
          alunoId,
          produtoId: item.produto.id,
          criadoEm: agoraStr,
          quantidade: item.quantidade,
        });

        insertsSupabaseDesejos.push({
          aluno_id: alunoId,
          produto_id: item.produto.id,
          criado_em: agoraStr,
        });
      }
    });

    if (supabase && insertsSupabaseDesejos.length > 0) {
      try {
        const { error: errDesejo } = await supabase.from('desejos').insert(insertsSupabaseDesejos);
        if (errDesejo) {
          console.error('[DataContext] Erro ao registrar desejos no Supabase:', errDesejo);
          return {
            success: false,
            error: 'Não foi possível encaminhar o pedido para a aprovação familiar no servidor. Tente novamente.',
          };
        }
      } catch (err: any) {
        console.error('[DataContext] Falha na comunicação ao registrar desejos:', err);
        return {
          success: false,
          error: 'Falha de conexão com o servidor. Seus itens foram mantidos no carrinho.',
        };
      }
    }

    setDesejos(prev => {
      let atualizados = [...prev];
      carrinho.forEach(ci => {
        const idx = atualizados.findIndex(d => d.alunoId === alunoId && d.produtoId === ci.produto.id);
        if (idx !== -1) {
          atualizados[idx] = {
            ...atualizados[idx],
            quantidade: (atualizados[idx].quantidade || 1) + ci.quantidade,
            criadoEm: agoraStr,
          };
        }
      });
      return [...novosDesejos, ...atualizados];
    });

    clearCart();
    return { success: true, destino: 'desejos' };
  };

  const comprarProdutoDireto = async (alunoId: number, produtoId: number) => {
    const aluno = alunos.find(a => a.id === alunoId);
    const produto = produtos.find(p => p.id === produtoId);
    if (!aluno || !produto) return { success: false, error: 'Aluno ou produto inválido.' };

    if (!aluno.pode_comprar) {
      return { success: false, error: 'Suas compras diretas estão pausadas pelo responsável.' };
    }

    const temPendentes = avaliacoes.some(av => av.alunoId === alunoId && av.tipo === 'negativa' && !av.consentido);
    if (temPendentes) {
      return { success: false, error: 'Você tem ocorrências pendentes de consentimento pelo seu responsável.' };
    }

    if (aluno.pontos < produto.custo_pontos) {
      const falta = produto.custo_pontos - aluno.pontos;
      return { success: false, error: `Saldo insuficiente! Faltam 🪙 ${falta} PoloCoins.`, falta };
    }

    const novoSaldo = aluno.pontos - produto.custo_pontos;
    const agoraStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
    const supabase = getSupabaseClient();

    if (supabase) {
      await supabase.from('alunos').update({ pontos: novoSaldo }).eq('id', alunoId);
      await supabase.from('compras').insert([
        {
          aluno_id: alunoId,
          produto_id: produtoId,
          produto_nome: produto.nome,
          custo_pontos: produto.custo_pontos,
          categoria_nome: produto.categoria,
          autorizado_por: null,
          entregue: false,
          criado_em: agoraStr,
        },
      ]);
    }

    setCompras(prev => [
      {
        id: Date.now(),
        alunoId,
        produtoId,
        produtoNome: produto.nome,
        custoPontos: produto.custo_pontos,
        categoriaNome: produto.categoria,
        autorizadoPor: null,
        criadoEm: agoraStr,
        entregue: false,
      },
      ...prev,
    ]);
    setAlunos(prev => prev.map(a => (a.id === alunoId ? { ...a, pontos: novoSaldo } : a)));

    return { success: true };
  };

  const marcarEntrega = async (compraId: number) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('compras').update({ entregue: true }).eq('id', compraId);
    }
    setCompras(prev => prev.map(c => (c.id === compraId ? { ...c, entregue: true } : c)));
  };

  const limparHistoricoVendas = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('compras').delete().eq('entregue', true);
    }
    setCompras(prev => prev.filter(c => !c.entregue));
  };

  const executarLimpezaGeral = async () => {
    const antes = compras.length;
    await limparHistoricoVendas();
    return { removidos: antes - compras.filter(c => !c.entregue).length };
  };

  // -------------------------------------------------------------
  // Importações em Massa por Planilhas
  // -------------------------------------------------------------
  const importarProfessoresEmMassa = async (
    dados: ProfessorImportData[]
  ): Promise<BatchImportResult> => {
    const supabase = getSupabaseClient();
    let criados = 0;
    let ignorados = 0;
    let falhas = 0;
    const erros: { linha?: number; item: string; motivo: string }[] = [];

    const novosProfessores: Professor[] = [];

    for (let i = 0; i < dados.length; i++) {
      const item = dados[i];
      const cleanUser = normalizarUsuario(item.usuario);
      const cleanName = item.nome.trim();

      // Checagem centralizada de duplicidade
      const validacaoLocal = validarDuplicidadeProfessor(
        { usuario: cleanUser, name: cleanName },
        [...professores, ...novosProfessores]
      );

      if (validacaoLocal.isDuplicate) {
        ignorados++;
        erros.push({
          linha: i + 2,
          item: cleanName,
          motivo: validacaoLocal.message || `Usuário "@${cleanUser}" já cadastrado. Não foi duplicado.`,
        });
        continue;
      }

      try {
        let profId: number = Date.now() + Math.floor(Math.random() * 1000);
        const senhaFinal = item.senha || '123';

        if (supabase) {
          // Checagem no banco para prevenir duplicidade concorrente
          const { data: profExistente } = await supabase
            .from('professores')
            .select('id, usuario')
            .ilike('usuario', cleanUser)
            .maybeSingle();

          if (profExistente) {
            ignorados++;
            erros.push({
              linha: i + 2,
              item: cleanName,
              motivo: `Docente com usuário "@${cleanUser}" já cadastrado no banco de dados. Registro ignorado.`,
            });
            continue;
          }

          const { data, error } = await supabase
            .from('professores')
            .insert([{ name: cleanName, usuario: cleanUser, password: senhaFinal }])
            .select()
            .single();

          if (error) {
            if ((error as any).code === '23505') {
              ignorados++;
              erros.push({
                linha: i + 2,
                item: cleanName,
                motivo: `Conflito de unicidade: o usuário "@${cleanUser}" já existe no banco.`,
              });
              continue;
            }
            falhas++;
            erros.push({
              linha: i + 2,
              item: cleanName,
              motivo: error.message || 'Falha ao salvar no banco de dados.',
            });
            continue;
          }

          if (!data) {
            falhas++;
            erros.push({
              linha: i + 2,
              item: cleanName,
              motivo: 'Não foi possível confirmar a criação do docente.',
            });
            continue;
          }

          profId = data.id;

          if (item.turmasIds && item.turmasIds.length > 0) {
            const vinculos = item.turmasIds.map(tid => ({
              professor_id: profId,
              turma_id: tid,
            }));
            await supabase.from('professor_turmas').insert(vinculos);
          }
        }

        novosProfessores.push({
          id: profId,
          name: cleanName,
          usuario: cleanUser,
          password: senhaFinal,
          turmasVinculadas: item.turmasIds || [],
        });
        criados++;
      } catch (err: any) {
        falhas++;
        erros.push({
          linha: i + 2,
          item: cleanName,
          motivo: err?.message || 'Erro inesperado ao registrar professor.',
        });
      }
    }

    if (novosProfessores.length > 0) {
      setProfessores(prev => [...prev, ...novosProfessores]);
    }

    return {
      success: criados > 0 || (ignorados > 0 && falhas === 0),
      criados,
      ignorados,
      falhas,
      erros,
    };
  };

  const importarAlunosEmMassa = async (
    dados: AlunoImportData[]
  ): Promise<BatchImportResult> => {
    const supabase = getSupabaseClient();
    let criados = 0;
    let ignorados = 0;
    let falhas = 0;
    const erros: { linha?: number; item: string; motivo: string }[] = [];

    const novosAlunos: Aluno[] = [];
    const novosResponsaveis: Responsavel[] = [];

    for (let i = 0; i < dados.length; i++) {
      const item = dados[i];
      const cleanNome = item.nome.trim();
      const cleanMatricula = item.matricula ? item.matricula.trim() : undefined;

      // Validação centralizada de duplicidade
      const validacaoLocal = validarDuplicidadeAluno(
        {
          nome: cleanNome,
          turmaId: item.turmaId,
          matricula: cleanMatricula,
        },
        [...alunos, ...novosAlunos]
      );

      if (validacaoLocal.isDuplicate) {
        ignorados++;
        erros.push({
          linha: i + 2,
          item: cleanNome,
          motivo: validacaoLocal.message || 'Aluno duplicado.',
        });
        continue;
      }

      try {
        let respId: number;
        const nomeRespClean = item.nomeResponsavel.trim();
        const respExistente =
          responsaveis.find(
            r => normalizarIdentificador(r.nome) === normalizarIdentificador(nomeRespClean)
          ) ||
          novosResponsaveis.find(
            r => normalizarIdentificador(r.nome) === normalizarIdentificador(nomeRespClean)
          );

        if (respExistente) {
          respId = respExistente.id;
        } else {
          const baseUsuario = normalizarUsuario(nomeRespClean.replace(/\s+/g, '')) || 'resp';
          let novoUsuario = baseUsuario;
          let counter = 2;
          while (
            responsaveis.some(r => normalizarUsuario(r.usuario) === novoUsuario) ||
            novosResponsaveis.some(r => normalizarUsuario(r.usuario) === novoUsuario)
          ) {
            novoUsuario = `${baseUsuario}${counter}`;
            counter++;
          }

          if (supabase) {
            const { data: respData, error: respErr } = await supabase
              .from('responsaveis')
              .insert([{ nome: nomeRespClean, usuario: novoUsuario, senha: '123' }])
              .select()
              .single();

            if (respErr && (respErr as any).code === '23505') {
              const { data: foundResp } = await supabase
                .from('responsaveis')
                .select('id, nome, usuario, senha')
                .ilike('nome', nomeRespClean)
                .maybeSingle();
              if (foundResp) {
                respId = foundResp.id;
              } else {
                respId = Date.now();
              }
            } else if (respErr || !respData) {
              falhas++;
              erros.push({
                linha: i + 2,
                item: cleanNome,
                motivo: `Não foi possível criar o responsável "${nomeRespClean}".`,
              });
              continue;
            } else {
              respId = respData.id;
              novosResponsaveis.push({
                id: respData.id,
                nome: respData.nome,
                usuario: respData.usuario,
                senha: respData.senha,
              });
            }
          } else {
            respId = Date.now() + Math.floor(Math.random() * 1000);
            novosResponsaveis.push({
              id: respId,
              nome: nomeRespClean,
              usuario: novoUsuario,
              senha: '123',
            });
          }
        }

        let alunoId: number = Date.now() + Math.floor(Math.random() * 1000);
        const senhaAlunoFinal = item.senha || '123';

        if (supabase) {
          // Checagem de matrícula pré-existente
          if (cleanMatricula) {
            const { data: matExistente } = await supabase
              .from('alunos')
              .select('id, matricula')
              .ilike('matricula', cleanMatricula)
              .maybeSingle();

            if (matExistente) {
              ignorados++;
              erros.push({
                linha: i + 2,
                item: cleanNome,
                motivo: `Matrícula escolar "${cleanMatricula}" já está vinculada a outro aluno no banco.`,
              });
              continue;
            }
          }

          // Checagem de aluno na turma
          const { data: alunoTurmaExistente } = await supabase
            .from('alunos')
            .select('id, nome')
            .eq('turma_id', item.turmaId)
            .ilike('nome', cleanNome)
            .maybeSingle();

          if (alunoTurmaExistente) {
            ignorados++;
            erros.push({
              linha: i + 2,
              item: cleanNome,
              motivo: `Aluno "${cleanNome}" já está matriculado nesta turma no banco.`,
            });
            continue;
          }

          const payload: any = {
            nome: cleanNome,
            turma_id: item.turmaId,
            responsavel_id: respId,
            avatar: '🦊',
            pontos: 0,
            pode_comprar: item.podeComprar,
            senha: senhaAlunoFinal,
          };
          if (cleanMatricula) payload.matricula = cleanMatricula;

          const { data: alunoData, error: alunoErr } = await supabase
            .from('alunos')
            .insert([payload])
            .select()
            .single();

          if (alunoErr) {
            if ((alunoErr as any).code === '23505') {
              ignorados++;
              erros.push({
                linha: i + 2,
                item: cleanNome,
                motivo: `Conflito de unicidade (matrícula ou turma) ao salvar aluno no banco.`,
              });
              continue;
            }
            falhas++;
            erros.push({
              linha: i + 2,
              item: cleanNome,
              motivo: alunoErr.message || 'Falha ao salvar aluno no servidor.',
            });
            continue;
          }
          if (!alunoData) {
            falhas++;
            erros.push({
              linha: i + 2,
              item: cleanNome,
              motivo: 'Não foi possível confirmar o salvamento do estudante.',
            });
            continue;
          }
          alunoId = alunoData.id;
        }

        novosAlunos.push({
          id: alunoId,
          nome: cleanNome,
          turmaId: item.turmaId,
          responsavelId: respId,
          avatar: '🦊',
          pontos: 0,
          pode_comprar: item.podeComprar,
          senha: senhaAlunoFinal,
          matricula: cleanMatricula,
        });
        criados++;
      } catch (err: any) {
        falhas++;
        erros.push({
          linha: i + 2,
          item: cleanNome,
          motivo: err?.message || 'Erro inesperado ao cadastrar aluno.',
        });
      }
    }

    if (novosResponsaveis.length > 0) {
      setResponsaveis(prev => [...prev, ...novosResponsaveis]);
    }
    if (novosAlunos.length > 0) {
      setAlunos(prev => [...prev, ...novosAlunos]);
    }

    return {
      success: criados > 0 || (ignorados > 0 && falhas === 0),
      criados,
      ignorados,
      falhas,
      erros,
    };
  };

  const importarProdutosEmMassa = async (
    dados: ProdutoImportData[]
  ): Promise<BatchImportResult> => {
    const supabase = getSupabaseClient();
    let criados = 0;
    let ignorados = 0;
    let falhas = 0;
    const erros: { linha?: number; item: string; motivo: string }[] = [];

    const novosProdutos: Produto[] = [];
    const novasCategorias: Categoria[] = [];

    for (let i = 0; i < dados.length; i++) {
      const item = dados[i];
      const cleanNome = item.nome.trim();
      const cleanCat = item.categoria.trim() || 'Geral';
      const cleanCodigo = item.codigo ? item.codigo.trim() : undefined;

      // Validação centralizada de duplicidade
      const validacaoLocal = validarDuplicidadeProduto(
        {
          nome: cleanNome,
          categoria: cleanCat,
          codigo: cleanCodigo,
        },
        [...produtos, ...novosProdutos]
      );

      if (validacaoLocal.isDuplicate) {
        ignorados++;
        erros.push({
          linha: i + 2,
          item: cleanNome,
          motivo: validacaoLocal.message || 'Produto duplicado.',
        });
        continue;
      }

      try {
        const catExiste =
          categorias.some(c => normalizarIdentificador(c.nome) === normalizarIdentificador(cleanCat)) ||
          novasCategorias.some(c => normalizarIdentificador(c.nome) === normalizarIdentificador(cleanCat));

        if (!catExiste) {
          let catId = Date.now() + Math.floor(Math.random() * 500);
          if (supabase) {
            const { data: catData } = await supabase
              .from('categorias')
              .insert([{ nome: cleanCat }])
              .select()
              .single();
            if (catData) catId = catData.id;
          }
          novasCategorias.push({ id: catId, nome: cleanCat });
        }

        let prodId: number = Date.now() + Math.floor(Math.random() * 1000);
        if (supabase) {
          // Checagem de código no banco
          if (cleanCodigo) {
            const { data: codExistente } = await supabase
              .from('produtos')
              .select('id, codigo')
              .ilike('codigo', cleanCodigo)
              .maybeSingle();

            if (codExistente) {
              ignorados++;
              erros.push({
                linha: i + 2,
                item: cleanNome,
                motivo: `Código / SKU "${cleanCodigo}" já existe no banco de dados.`,
              });
              continue;
            }
          }

          // Checagem de categoria + nome no banco
          const { data: prodCatExistente } = await supabase
            .from('produtos')
            .select('id, nome, categoria')
            .ilike('categoria', cleanCat)
            .ilike('nome', cleanNome)
            .maybeSingle();

          if (prodCatExistente) {
            ignorados++;
            erros.push({
              linha: i + 2,
              item: cleanNome,
              motivo: `Produto "${cleanNome}" na categoria "${cleanCat}" já cadastrado no banco.`,
            });
            continue;
          }

          const payload: any = {
            nome: cleanNome,
            custo_pontos: item.custoPontos,
            categoria: cleanCat,
          };
          if (cleanCodigo) payload.codigo = cleanCodigo;

          const { data: prodData, error: prodErr } = await supabase
            .from('produtos')
            .insert([payload])
            .select()
            .single();

          if (prodErr) {
            if ((prodErr as any).code === '23505') {
              ignorados++;
              erros.push({
                linha: i + 2,
                item: cleanNome,
                motivo: `Conflito de unicidade (código ou nome na categoria) ao salvar no banco.`,
              });
              continue;
            }
            falhas++;
            erros.push({
              linha: i + 2,
              item: cleanNome,
              motivo: prodErr.message || 'Falha ao salvar produto no banco de dados.',
            });
            continue;
          }
          if (!prodData) {
            falhas++;
            erros.push({
              linha: i + 2,
              item: cleanNome,
              motivo: 'Não foi possível confirmar o salvamento do produto.',
            });
            continue;
          }
          prodId = prodData.id;
        }

        novosProdutos.push({
          id: prodId,
          nome: cleanNome,
          custo_pontos: item.custoPontos,
          categoria: cleanCat,
          estoque: item.estoque,
          codigo: cleanCodigo,
        });
        criados++;
      } catch (err: any) {
        falhas++;
        erros.push({
          linha: i + 2,
          item: cleanNome,
          motivo: err?.message || 'Erro inesperado ao registrar produto.',
        });
      }
    }

    if (novasCategorias.length > 0) {
      setCategorias(prev => [...prev, ...novasCategorias]);
    }
    if (novosProdutos.length > 0) {
      setProdutos(prev => [...prev, ...novosProdutos]);
    }

    return {
      success: criados > 0 || (ignorados > 0 && falhas === 0),
      criados,
      ignorados,
      falhas,
      erros,
    };
  };

  // -------------------------------------------------------------
  // Modo A: Transferência de Alunos entre Turmas do Mesmo Ano
  // -------------------------------------------------------------
  const transferirAlunos = async (params: {
    turmaOrigemId: number;
    turmaDestinoId: number;
    alunosIds: number[];
    adminNome: string;
    motivo?: string;
  }): Promise<{
    success: boolean;
    loteId: string;
    movimentados: number;
    error?: string;
    detalhes?: { alunoId: number; alunoNome: string; status: 'sucesso' | 'falha'; erro?: string }[];
  }> => {
    const { turmaOrigemId, turmaDestinoId, alunosIds, adminNome, motivo } = params;

    const validacao = validarTransferencia({
      turmaOrigemId,
      turmaDestinoId,
      alunosIds,
      turmas,
      alunos,
      compras,
      desejos,
    });

    if (!validacao.valido) {
      return {
        success: false,
        loteId: '',
        movimentados: 0,
        error: validacao.erros.join(' '),
      };
    }

    const turmaOrigem = validacao.turmaOrigem!;
    const turmaDestino = validacao.turmaDestino!;
    const loteId = `LOTE-TRANSF-${Date.now()}`;
    const dataHora = new Date().toISOString();
    const supabase = getSupabaseClient();

    const detalhes: { alunoId: number; alunoNome: string; status: 'sucesso' | 'falha'; erro?: string }[] = [];
    const novosHistoricos: MovimentacaoAluno[] = [];
    const idsMovimentadosComSucesso: number[] = [];

    for (const aluno of validacao.alunosValidados) {
      let falhou = false;
      let erroMsg = '';

      if (supabase) {
        // Validação no Supabase para garantir que o aluno ainda pertence à turma de origem
        const { data: alunoDb } = await supabase
          .from('alunos')
          .select('id, turma_id')
          .eq('id', aluno.id)
          .single();

        if (!alunoDb || alunoDb.turma_id !== turmaOrigem.id) {
          falhou = true;
          erroMsg = `Aluno "${aluno.nome}" já foi movimentado em outra operação simultânea.`;
        } else {
          const { error: errUpdate } = await supabase
            .from('alunos')
            .update({ turma_id: turmaDestino.id })
            .eq('id', aluno.id);

          if (errUpdate) {
            falhou = true;
            erroMsg = errUpdate.message;
          } else {
            await supabase.from('movimentacoes_alunos').insert([{
              aluno_id: aluno.id,
              aluno_nome: aluno.nome,
              aluno_matricula: aluno.matricula || null,
              turma_origem_id: turmaOrigem.id,
              turma_origem_nome: `${turmaOrigem.serie}º Ano ${turmaOrigem.turma}`,
              ano_letivo_origem: turmaOrigem.anoLetivo || 2026,
              turma_destino_id: turmaDestino.id,
              turma_destino_nome: `${turmaDestino.serie}º Ano ${turmaDestino.turma}`,
              ano_letivo_destino: turmaDestino.anoLetivo || 2026,
              tipo: 'transferencia',
              admin_nome: adminNome || 'Administrador',
              lote_id: loteId,
              motivo: motivo ? motivo.trim() : null,
              resultado: 'sucesso',
            }]);
          }
        }
      }

      if (!falhou) {
        idsMovimentadosComSucesso.push(aluno.id);
        novosHistoricos.push({
          id: Date.now() + Math.floor(Math.random() * 100000),
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          alunoMatricula: aluno.matricula,
          turmaOrigemId: turmaOrigem.id,
          turmaOrigemNome: `${turmaOrigem.serie}º Ano ${turmaOrigem.turma}`,
          anoLetivoOrigem: turmaOrigem.anoLetivo || 2026,
          turmaDestinoId: turmaDestino.id,
          turmaDestinoNome: `${turmaDestino.serie}º Ano ${turmaDestino.turma}`,
          anoLetivoDestino: turmaDestino.anoLetivo || 2026,
          tipo: 'transferencia',
          dataHora,
          adminNome: adminNome || 'Administrador',
          loteId,
          motivo: motivo ? motivo.trim() : undefined,
          resultado: 'sucesso',
        });
        detalhes.push({ alunoId: aluno.id, alunoNome: aluno.nome, status: 'sucesso' });
      } else {
        detalhes.push({ alunoId: aluno.id, alunoNome: aluno.nome, status: 'falha', erro: erroMsg });
      }
    }

    if (idsMovimentadosComSucesso.length > 0) {
      setAlunos(prev =>
        prev.map(a =>
          idsMovimentadosComSucesso.includes(a.id) ? { ...a, turmaId: turmaDestino.id } : a
        )
      );
      setMovimentacoes(prev => [...novosHistoricos, ...prev]);
    }

    return {
      success: idsMovimentadosComSucesso.length > 0,
      loteId,
      movimentados: idsMovimentadosComSucesso.length,
      detalhes,
    };
  };

  // -------------------------------------------------------------
  // Modo B: Progressão de Fim de Ano Letivo
  // -------------------------------------------------------------
  const progredirAlunos = async (params: {
    anoOrigem: number;
    anoDestino: number;
    itens: { alunoId: number; turmaDestinoId: number; motivo?: string }[];
    adminNome: string;
    loteId?: string;
    motivoGeral?: string;
  }): Promise<{
    success: boolean;
    loteId: string;
    movimentados: number;
    error?: string;
    detalhes?: { alunoId: number; alunoNome: string; status: 'sucesso' | 'falha'; erro?: string }[];
  }> => {
    const { anoOrigem, anoDestino, itens, adminNome, motivoGeral } = params;

    if (!itens || itens.length === 0) {
      return {
        success: false,
        loteId: '',
        movimentados: 0,
        error: 'Nenhum aluno informado para progressão.',
      };
    }

    const loteId = params.loteId || `LOTE-PROG-${Date.now()}`;
    const dataHora = new Date().toISOString();
    const supabase = getSupabaseClient();

    const detalhes: { alunoId: number; alunoNome: string; status: 'sucesso' | 'falha'; erro?: string }[] = [];
    const novosHistoricos: MovimentacaoAluno[] = [];
    const mapaAlunosAtualizados = new Map<number, number>(); // alunoId -> novaTurmaId

    for (const item of itens) {
      const aluno = alunos.find(a => a.id === item.alunoId);
      const turmaOrigem = aluno ? turmas.find(t => t.id === aluno.turmaId) : undefined;
      const turmaDestino = turmas.find(t => t.id === item.turmaDestinoId);

      if (!aluno || !turmaDestino) {
        detalhes.push({
          alunoId: item.alunoId,
          alunoNome: aluno?.nome || `Aluno #${item.alunoId}`,
          status: 'falha',
          erro: 'Aluno ou turma de destino não encontrado no cadastro escolar.',
        });
        continue;
      }

      // Validar ano letivo da turma de destino
      const anoTurmaDest = turmaDestino.anoLetivo || 2026;
      if (anoTurmaDest !== anoDestino) {
        detalhes.push({
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          status: 'falha',
          erro: `A turma de destino ${turmaDestino.serie}º ${turmaDestino.turma} pertence ao ano ${anoTurmaDest}, esperado ${anoDestino}.`,
        });
        continue;
      }

      let falhou = false;
      let erroMsg = '';

      if (supabase) {
        const { error: errUpdate } = await supabase
          .from('alunos')
          .update({ turma_id: turmaDestino.id })
          .eq('id', aluno.id);

        if (errUpdate) {
          falhou = true;
          erroMsg = errUpdate.message;
        } else {
          await supabase.from('movimentacoes_alunos').insert([{
            aluno_id: aluno.id,
            aluno_nome: aluno.nome,
            aluno_matricula: aluno.matricula || null,
            turma_origem_id: turmaOrigem?.id || null,
            turma_origem_nome: turmaOrigem ? `${turmaOrigem.serie}º Ano ${turmaOrigem.turma}` : 'Origem',
            ano_letivo_origem: anoOrigem,
            turma_destino_id: turmaDestino.id,
            turma_destino_nome: `${turmaDestino.serie}º Ano ${turmaDestino.turma}`,
            ano_letivo_destino: anoDestino,
            tipo: 'progressao',
            admin_nome: adminNome || 'Administrador',
            lote_id: loteId,
            motivo: item.motivo || motivoGeral || 'Progressão de fim de ano letivo',
            resultado: 'sucesso',
          }]);
        }
      }

      if (!falhou) {
        mapaAlunosAtualizados.set(aluno.id, turmaDestino.id);
        novosHistoricos.push({
          id: Date.now() + Math.floor(Math.random() * 100000),
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          alunoMatricula: aluno.matricula,
          turmaOrigemId: turmaOrigem?.id || 0,
          turmaOrigemNome: turmaOrigem ? `${turmaOrigem.serie}º Ano ${turmaOrigem.turma}` : 'Origem',
          anoLetivoOrigem: anoOrigem,
          turmaDestinoId: turmaDestino.id,
          turmaDestinoNome: `${turmaDestino.serie}º Ano ${turmaDestino.turma}`,
          anoLetivoDestino: anoDestino,
          tipo: 'progressao',
          dataHora,
          adminNome: adminNome || 'Administrador',
          loteId,
          motivo: item.motivo || motivoGeral || 'Progressão de fim de ano letivo',
          resultado: 'sucesso',
        });
        detalhes.push({ alunoId: aluno.id, alunoNome: aluno.nome, status: 'sucesso' });
      } else {
        detalhes.push({ alunoId: aluno.id, alunoNome: aluno.nome, status: 'falha', erro: erroMsg });
      }
    }

    if (mapaAlunosAtualizados.size > 0) {
      setAlunos(prev =>
        prev.map(a => {
          const novoId = mapaAlunosAtualizados.get(a.id);
          return novoId ? { ...a, turmaId: novoId } : a;
        })
      );
      setMovimentacoes(prev => [...novosHistoricos, ...prev]);
    }

    return {
      success: mapaAlunosAtualizados.size > 0,
      loteId,
      movimentados: mapaAlunosAtualizados.size,
      detalhes,
    };
  };

  return (
    <DataContext.Provider
      value={{
        turmas,
        professores,
        responsaveis,
        alunos,
        produtos,
        categorias,
        avaliacoes,
        compras,
        desejos,
        carrinho,
        loading,
        isSupabaseOnline,
        carregarDados,
        addToCart,
        removeFromCart,
        updateCartQtd,
        clearCart,
        addTurma,
        updateTurmaAnoLetivo,
        addAluno,
        updateAluno,
        updateAlunoAvatar,
        updateAlunoPodeComprar,
        updateAlunoSenha,
        updateResponsavel,
        addProfessor,
        updateProfessor,
        linkTurmaProfessor,
        unlinkTurmaProfessor,
        addProduto,
        updateProduto,
        addAvaliacao,
        consentirAvaliacoes,
        addDesejo,
        removerDesejo,
        comprarDesejoPorResponsavel,
        checkoutCarrinho,
        comprarProdutoDireto,
        marcarEntrega,
        limparHistoricoVendas,
        executarLimpezaGeral,
        importarProfessoresEmMassa,
        importarAlunosEmMassa,
        importarProdutosEmMassa,
        movimentacoes,
        transferirAlunos,
        progredirAlunos,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
