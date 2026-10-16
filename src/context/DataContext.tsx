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
} from '../types';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase';

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
  addTurma: (serie: number, turma: string) => Promise<void>;
  addAluno: (turmaId: number, nomeAluno: string, nomeResponsavel: string, senhaAluno?: string) => Promise<Aluno | null>;
  updateAluno: (id: number, data: Partial<Aluno>) => Promise<void>;
  updateAlunoAvatar: (id: number, avatar: string) => Promise<void>;
  updateAlunoPodeComprar: (id: number, podeComprar: boolean) => Promise<void>;
  updateAlunoSenha: (id: number, novaSenha: string) => Promise<void>;

  // Professores
  addProfessor: (name: string, usuario: string, password?: string) => Promise<void>;
  updateProfessor: (id: number, name: string, password?: string) => Promise<void>;
  linkTurmaProfessor: (professorId: number, turmaId: number) => Promise<void>;
  unlinkTurmaProfessor: (professorId: number, turmaId: number) => Promise<void>;

  // Produtos & Categorias
  addProduto: (nome: string, custo_pontos: number, categoria: string, estoque?: number) => Promise<Produto | null>;
  updateProduto: (id: number, nome: string, custo_pontos: number, categoria: string, estoque?: number) => Promise<void>;

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [desejos, setDesejos] = useState<Desejo[]>([]);
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(false);

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
      ]);

      if (resTurmas.data) {
        setTurmas(resTurmas.data.map((t: any) => ({ id: t.id, serie: t.serie, turma: t.turma })));
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
          }))
        );
      }

      if (resCategorias.data && resCategorias.data.length > 0) {
        setCategorias(resCategorias.data.map((c: any) => ({ id: c.id, nome: c.nome })));
      } else if (resProdutos.data) {
        const catsUnicas = Array.from(new Set(resProdutos.data.map((p: any) => p.categoria || 'Geral')));
        setCategorias(catsUnicas.map((nome, idx) => ({ id: idx + 1, nome })));
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
  const addTurma = async (serie: number, turma: string) => {
    const supabase = getSupabaseClient();
    const turmaUpper = turma.toUpperCase().trim();

    if (supabase) {
      const { data, error } = await supabase
        .from('turmas')
        .insert([{ serie, turma: turmaUpper }])
        .select()
        .single();

      if (!error && data) {
        setTurmas(prev => [...prev, { id: data.id, serie: data.serie, turma: data.turma }]);
        return;
      }
    }

    const nova: Turma = { id: Date.now(), serie, turma: turmaUpper };
    setTurmas(prev => [...prev, nova]);
  };

  // Alunos
  const addAluno = async (turmaId: number, nomeAluno: string, nomeResponsavel: string, senhaAluno = '123') => {
    const supabase = getSupabaseClient();
    let respId: number;

    const respExistente = responsaveis.find(r => r.nome.toLowerCase() === nomeResponsavel.toLowerCase().trim());

    if (respExistente) {
      respId = respExistente.id;
    } else {
      const novoUsuario = nomeResponsavel.toLowerCase().replace(/\s+/g, '');
      if (supabase) {
        const { data: respData } = await supabase
          .from('responsaveis')
          .insert([{ nome: nomeResponsavel.trim(), usuario: novoUsuario, senha: '123' }])
          .select()
          .single();

        if (respData) {
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
      const { data: alunoData } = await supabase
        .from('alunos')
        .insert([
          {
            nome: nomeAluno.trim(),
            turma_id: turmaId,
            responsavel_id: respId,
            avatar: '🦊',
            pontos: 0,
            pode_comprar: true,
            senha: senhaAluno,
          },
        ])
        .select()
        .single();

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
        };
        setAlunos(prev => [...prev, novo]);
        return novo;
      }
    }

    const novoFallback: Aluno = {
      id: Date.now() + 1,
      nome: nomeAluno.trim(),
      turmaId,
      responsavelId: respId,
      avatar: '🦊',
      pontos: 0,
      pode_comprar: true,
      senha: senhaAluno,
    };
    setAlunos(prev => [...prev, novoFallback]);
    return novoFallback;
  };

  const updateAluno = async (id: number, data: Partial<Aluno>) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase
        .from('alunos')
        .update({
          nome: data.nome,
          pontos: data.pontos,
          pode_comprar: data.pode_comprar,
          avatar: data.avatar,
        })
        .eq('id', id);
    }
    setAlunos(prev => prev.map(a => (a.id === id ? { ...a, ...data } : a)));
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
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('alunos').update({ senha: novaSenha }).eq('id', id);
    }
    setAlunos(prev => prev.map(a => (a.id === id ? { ...a, senha: novaSenha } : a)));
  };

  // Professores
  const addProfessor = async (name: string, usuario: string, password = '123') => {
    const supabase = getSupabaseClient();
    const cleanUser = usuario.trim() || name.toLowerCase().replace(/\s+/g, '');

    if (supabase) {
      const { data } = await supabase
        .from('professores')
        .insert([{ name: name.trim(), usuario: cleanUser, password }])
        .select()
        .single();

      if (data) {
        setProfessores(prev => [...prev, { id: data.id, name: data.name, usuario: data.usuario, password: data.password, turmasVinculadas: [] }]);
        return;
      }
    }

    const novo: Professor = {
      id: Date.now(),
      name: name.trim(),
      usuario: cleanUser,
      password,
      turmasVinculadas: [],
    };
    setProfessores(prev => [...prev, novo]);
  };

  const updateProfessor = async (id: number, name: string, password?: string) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const payload: any = { name: name.trim() };
      if (password) payload.password = password.trim();
      await supabase.from('professores').update(payload).eq('id', id);
    }
    setProfessores(prev =>
      prev.map(p => (p.id === id ? { ...p, name: name.trim(), password: password || p.password } : p))
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
  const addProduto = async (nome: string, custo_pontos: number, categoria: string, estoque?: number) => {
    const supabase = getSupabaseClient();
    const catClean = categoria.trim() || 'Geral';

    if (supabase) {
      const { data } = await supabase
        .from('produtos')
        .insert([{ nome: nome.trim(), custo_pontos, categoria: catClean }])
        .select()
        .single();

      if (data) {
        const novo: Produto = { id: data.id, nome: data.nome, custo_pontos: data.custo_pontos, categoria: data.categoria, estoque };
        setProdutos(prev => [...prev, novo]);
        return novo;
      }
    }

    const novoFallback: Produto = { id: Date.now(), nome: nome.trim(), custo_pontos, categoria: catClean, estoque };
    setProdutos(prev => [...prev, novoFallback]);
    return novoFallback;
  };

  const updateProduto = async (id: number, nome: string, custo_pontos: number, categoria: string, estoque?: number) => {
    const supabase = getSupabaseClient();
    const catClean = categoria.trim() || 'Geral';

    if (supabase) {
      await supabase
        .from('produtos')
        .update({ nome: nome.trim(), custo_pontos, categoria: catClean })
        .eq('id', id);
    }

    setProdutos(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              nome: nome.trim(),
              custo_pontos,
              categoria: catClean,
              estoque: estoque !== undefined ? estoque : p.estoque,
            }
          : p
      )
    );
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
        addAluno,
        updateAluno,
        updateAlunoAvatar,
        updateAlunoPodeComprar,
        updateAlunoSenha,
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
