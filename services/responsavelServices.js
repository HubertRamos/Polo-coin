import { supabase } from '../config/supabase.js';
import { resolverAvatarAluno } from './avatarService.js';

export async function puxarAlunosDoResponsavel(responsavelId) {
    if (!responsavelId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const { data, error } = await supabase
        .from('alunos')
        .select(`
            id,
            nome,
            password,
            avatar,
            pontos,
            pode_comprar,
            turmas (
                serie,
                turma
            )
        `)
        .eq('responsavel_id', Number(responsavelId))
        .order('nome', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(a => {
        const t = Array.isArray(a.turmas) ? a.turmas[0] : a.turmas;
        return {
            id: a.id,
            aluno_nome: a.nome,
            avatar: resolverAvatarAluno(a.id, a.avatar),
            pontos: a.pontos ?? 0,
            pode_comprar: a.pode_comprar ?? false,
            aluno_senha: a.password,
            serie: t?.serie ?? null,
            turma: t?.turma ?? null
        };
    });
}
