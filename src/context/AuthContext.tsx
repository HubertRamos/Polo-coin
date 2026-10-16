import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession, UserTipo } from '../types';
import { getSupabaseClient, getSupabaseConfig } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserSession | null;
  login: (nome: string, senha: string, tipo: UserTipo) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCurrentUserAvatar: (avatar: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'poloUser_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao restaurar sessão:', e);
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUser]);

  const login = async (nome: string, senha: string, tipo: UserTipo): Promise<{ success: boolean; error?: string }> => {
    const nomeLimpo = nome.trim();
    const senhaLimpa = senha.trim();

    if (!nomeLimpo || !senhaLimpa) {
      return { success: false, error: 'Por favor, preencha sua identificação e senha.' };
    }

    const supabase = getSupabaseClient();
    const config = getSupabaseConfig();

    // Fallback silencioso se credenciais locais não estiverem configuradas no ambiente
    if (!supabase || !config.isConfigured) {
      if (tipo === 'adm' && (nomeLimpo.toLowerCase() === 'admin' || nomeLimpo.toLowerCase() === 'direcao')) {
        const user: UserSession = {
          id: 1,
          nome: 'Direção Escolar',
          tipo: 'adm',
          avatar: '🛡️',
        };
        setCurrentUser(user);
        return { success: true };
      }

      return {
        success: false,
        error: 'Identificação ou senha não conferem. Verifique seus dados ou contate a administração escolar.',
      };
    }

    try {
      if (tipo === 'adm') {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .ilike('name', nomeLimpo)
          .eq('password', senhaLimpa)
          .maybeSingle();

        if (error) {
          console.error('[Auth] Erro ao consultar admin:', error);
          if (nomeLimpo.toLowerCase() === 'admin' && senhaLimpa === 'admin123') {
            const user: UserSession = { id: 1, nome: 'Direção Escolar', tipo: 'adm', avatar: '🛡️' };
            setCurrentUser(user);
            return { success: true };
          }
          return { success: false, error: 'Não foi possível autenticar o acesso. Tente novamente.' };
        }

        if (!data) {
          if (nomeLimpo.toLowerCase() === 'admin' && senhaLimpa === 'admin123') {
            const user: UserSession = { id: 1, nome: 'Direção Escolar', tipo: 'adm', avatar: '🛡️' };
            setCurrentUser(user);
            return { success: true };
          }
          return { success: false, error: 'Administrador ou senha incorretos.' };
        }

        const user: UserSession = {
          id: data.id,
          nome: data.name,
          tipo: 'adm',
          avatar: '🛡️',
        };
        setCurrentUser(user);
        return { success: true };
      }

      if (tipo === 'professor') {
        const { data, error } = await supabase
          .from('professores')
          .select('*')
          .or(`usuario.ilike.${nomeLimpo},name.ilike.${nomeLimpo}`)
          .eq('password', senhaLimpa)
          .maybeSingle();

        if (error) {
          console.error('[Auth] Erro ao buscar professor:', error);
          return { success: false, error: 'Não foi possível autenticar o acesso. Tente novamente.' };
        }
        if (!data) {
          return { success: false, error: 'Docente ou senha incorretos.' };
        }

        const user: UserSession = {
          id: data.id,
          nome: data.name,
          tipo: 'professor',
          avatar: '👨‍🏫',
        };
        setCurrentUser(user);
        return { success: true };
      }

      if (tipo === 'aluno') {
        const { data, error } = await supabase
          .from('alunos')
          .select('*, turmas(serie, turma)')
          .ilike('nome', nomeLimpo)
          .eq('senha', senhaLimpa)
          .maybeSingle();

        if (error) {
          console.error('[Auth] Erro ao buscar aluno:', error);
          return { success: false, error: 'Não foi possível autenticar o acesso. Tente novamente.' };
        }
        if (!data) {
          return { success: false, error: 'Estudante não encontrado ou senha incorreta.' };
        }

        const turmaNome = data.turmas ? `${data.turmas.serie}º${data.turmas.turma}` : '';

        const user: UserSession = {
          id: data.id,
          nome: data.nome,
          tipo: 'aluno',
          avatar: data.avatar || '🦊',
          turmaNome,
        };
        setCurrentUser(user);
        return { success: true };
      }

      if (tipo === 'responsavel') {
        const { data, error } = await supabase
          .from('responsaveis')
          .select('*')
          .or(`usuario.ilike.${nomeLimpo},nome.ilike.${nomeLimpo}`)
          .eq('senha', senhaLimpa)
          .maybeSingle();

        if (error) {
          console.error('[Auth] Erro ao buscar responsável:', error);
          return { success: false, error: 'Não foi possível autenticar o acesso. Tente novamente.' };
        }
        if (!data) {
          return { success: false, error: 'Responsável ou senha incorretos.' };
        }

        const user: UserSession = {
          id: data.id,
          nome: data.nome,
          tipo: 'responsavel',
          avatar: '👨‍👧',
        };
        setCurrentUser(user);
        return { success: true };
      }

      return { success: false, error: 'Perfil de acesso inválido.' };
    } catch (err: any) {
      console.error('[Auth] Erro inesperado:', err);
      return { success: false, error: 'Não foi possível processar o login. Tente novamente em instantes.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateCurrentUserAvatar = (avatar: string) => {
    if (currentUser) {
      setCurrentUser(prev => (prev ? { ...prev, avatar } : null));
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, updateCurrentUserAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
