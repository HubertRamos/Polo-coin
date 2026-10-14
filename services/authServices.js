import { supabase } from '../config/supabase.js';
import { resolverAvatarAluno } from './avatarService.js';

/**
 * Mapeia cada tabela para o nome da coluna de identificação.
 * admins / professores usam 'name'; alunos / responsaveis usam 'nome'.
 */
const COLUNA_NOME = {
    admins: 'name',
    professores: 'name',
    alunos: 'nome',
    responsaveis: 'nome',
};

/**
 * Login unificado: verifica na tabela correspondente ao tipo escolhido
 * e retorna o match com o tipo de usuário.
 * Retorna null se nenhum usuário for encontrado ou em caso de credenciais inválidas.
 */
export async function login(nome, senha, tipo) {
    if (!nome || !senha || !tipo) {
        return null;
    }

    const nomeLimpo = nome.trim();
    const senhaLimpa = senha.trim();

    const mapa = {
        adm: 'admins',
        professor: 'professores',
        aluno: 'alunos',
        responsavel: 'responsaveis',
    };

    const tabela = mapa[tipo];
    if (!tabela) return null;

    const coluna = COLUNA_NOME[tabela] || 'name';

    try {
        const { data, error } = await supabase
            .from(tabela)
            .select(`id, ${coluna}`)
            .eq(coluna, nomeLimpo)
            .eq('password', senhaLimpa)
            .maybeSingle();

        if (error) {
            console.error(`Erro ao autenticar usuário na tabela ${tabela}:`, error.message);
            return null;
        }

        if (!data) {
            return null;
        }

        return {
            id: data.id,
            name: data[coluna],
            nome: data[coluna],
            avatar: tipo === 'aluno' ? resolverAvatarAluno(data.id, data.avatar) : undefined,
            tipo
        };
    } catch (err) {
        console.error('Exceção capturada no login:', err);
        return null;
    }
}
