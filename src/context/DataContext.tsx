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
  addToCart: (produto: Produto) => void;
  removeFromCart: (produtoId: number) => void;
  updateCartQtd: (produtoId: number, delta: number) => void;
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
  addProduto: (nome: string, custo_pontos: number, categoria: string) => Promise<Produto | null>;
  updateProduto: (id: number, nome: string, custo_pontos: number, categoria: string) => Promise<void>;

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
  consentirAvaliacoes: (avaliacaoIds: number[]) => Promise<void>;

  // Desejos
  addDesejo: (alunoId: number, produtoId: number) => Promise<{ success: boolean; error?: string }>;
  removerDesejo: (alunoId: number, produtoId: number) => Promise<void>;
  comprarDesejoPorResponsavel: (alunoId: number, produtoId: number, responsavelId: number) => Promise<{ success: boolean; error?: string }>;

  // Compras & Carrinho checkout
  checkoutCarrinho: (alunoId: number) => Promise<{ success: boolean; error?: string; falta?: number }>;
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
            consentido: av.consentido ?? true,
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
  const addToCart = (produto: Produto) => {
    setCarrinho(prev => {
      const existing = prev.find(item => item.produto.id === produto.id);
      if (existing) {
        return prev.map(item =>
          item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const removeFromCart = (produtoId: number) => {
    setCarrinho(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const updateCartQtd = (produtoId: number, delta: number) => {
    setCarrinho(prev =>
      prev
        .map(item => {
          if (item.produto.id === produtoId) {
            const novaQtd = item.quantidade + delta;
            return novaQtd > 0 ? { ...item, quantidade: novaQtd } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
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
  const addProduto = async (nome: string, custo_pontos: number, categoria: string) => {
    const supabase = getSupabaseClient();
    const catClean = categoria.trim() || 'Geral';

    if (supabase) {
      const { data } = await supabase
        .from('produtos')
        .insert([{ nome: nome.trim(), custo_pontos, categoria: catClean }])
        .select()
        .single();

      if (data) {
        const novo: Produto = { id: data.id, nome: data.nome, custo_pontos: data.custo_pontos, categoria: data.categoria };
        setProdutos(prev => [...prev, novo]);
        return novo;
      }
    }

    const novoFallback: Produto = { id: Date.now(), nome: nome.trim(), custo_pontos, categoria: catClean };
    setProdutos(prev => [...prev, novoFallback]);
    return novoFallback;
  };

  const updateProduto = async (id: number, nome: string, custo_pontos: number, categoria: string) => {
    const supabase = getSupabaseClient();
    const catClean = categoria.trim() || 'Geral';

    if (supabase) {
      await supabase
        .from('produtos')
        .update({ nome: nome.trim(), custo_pontos, categoria: catClean })
        .eq('id', id);
    }

    setProdutos(prev =>
      prev.map(p => (p.id === id ? { ...p, nome: nome.trim(), custo_pontos, categoria: catClean } : p))
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

  const consentirAvaliacoes = async (avaliacaoIds: number[]) => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('avaliacoes').update({ consentido: true }).in('id', avaliacaoIds);
    }
    setAvaliacoes(prev =>
      prev.map(av => (avaliacaoIds.includes(av.id) ? { ...av, consentido: true } : av))
    );
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

    if (!aluno || !produto) return { success: false, error: 'Aluno ou produto não encontrado.' };
    if (aluno.pontos < produto.custo_pontos) {
      return { success: false, error: `Saldo insuficiente (${aluno.pontos}/${produto.custo_pontos}).` };
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
          autorizado_por: responsavelId,
          entregue: false,
          criado_em: agoraStr,
        },
      ]);
      await supabase.from('desejos').delete().eq('aluno_id', alunoId).eq('produto_id', produtoId);
    }

    setAlunos(prev => prev.map(a => (a.id === alunoId ? { ...a, pontos: novoSaldo } : a)));
    setCompras(prev => [
      {
        id: Date.now(),
        alunoId,
        produtoId,
        produtoNome: produto.nome,
        custoPontos: produto.custo_pontos,
        categoriaNome: produto.categoria,
        autorizadoPor: responsavelId,
        criadoEm: agoraStr,
        entregue: false,
      },
      ...prev,
    ]);
    removerDesejo(alunoId, produtoId);
    return { success: true };
  };

  // Compras & Carrinho checkout
  const checkoutCarrinho = async (alunoId: number) => {
    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) return { success: false, error: 'Aluno não encontrado.' };

    if (!aluno.pode_comprar) {
      return { success: false, error: 'Suas compras diretas estão pausadas pelo responsável.' };
    }

    const temPendentes = avaliacoes.some(av => av.alunoId === alunoId && av.tipo === 'negativa' && !av.consentido);
    if (temPendentes) {
      return { success: false, error: 'Você tem ocorrências pendentes de consentimento pelo responsável.' };
    }

    const totalPontos = carrinho.reduce((sum, item) => sum + item.produto.custo_pontos * item.quantidade, 0);

    if (aluno.pontos < totalPontos) {
      const falta = totalPontos - aluno.pontos;
      return { success: false, error: `Saldo insuficiente! Faltam 🪙 ${falta} PoloCoins.`, falta };
    }

    const novoSaldo = aluno.pontos - totalPontos;
    const agoraStr = new Date().toISOString().substring(0, 16).replace('T', ' ');
    const supabase = getSupabaseClient();

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
      await supabase.from('alunos').update({ pontos: novoSaldo }).eq('id', alunoId);
      await supabase.from('compras').insert(insertsSupabase);
    }

    setCompras(prev => [...novasCompras, ...prev]);
    setAlunos(prev => prev.map(a => (a.id === alunoId ? { ...a, pontos: novoSaldo } : a)));
    clearCart();
    return { success: true };
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
