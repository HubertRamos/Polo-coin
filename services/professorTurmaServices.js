import { supabase } from '../config/supabase.js';

export async function puxarTurmasDoProfessor(professorId) {
    if (!professorId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const { data, error } = await supabase
        .from('professor_turmas')
        .select(`
            professor_id,
            turma_id,
            turmas (
                serie,
                turma
            )
        `)
        .eq('professor_id', Number(professorId));

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(pt => {
        const t = Array.isArray(pt.turmas) ? pt.turmas[0] : pt.turmas;
        return {
            professor_id: pt.professor_id,
            turma_id: pt.turma_id,
            serie: t?.serie ?? null,
            turma: t?.turma ?? null
        };
    });
}

export async function puxarTodasTurmas() {
    const { data, error } = await supabase
        .from('turmas')
        .select('id, serie, turma')
        .order('serie', { ascending: true })
        .order('turma', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }
    return data || [];
}

export async function vincularTurmaProfessor(professorId, turmaId) {
    if (!professorId || !turmaId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const pId = Number(professorId);
    const tId = Number(turmaId);

    // Evita duplicatas simulando o INSERT IGNORE
    const { data: existente, error: errCheck } = await supabase
        .from('professor_turmas')
        .select('professor_id')
        .eq('professor_id', pId)
        .eq('turma_id', tId)
        .maybeSingle();

    if (errCheck) {
        throw new Error(errCheck.message);
    }

    if (!existente) {
        const { error } = await supabase
            .from('professor_turmas')
            .insert([{ professor_id: pId, turma_id: tId }]);

        if (error && error.code !== '23505') {
            throw new Error(error.message);
        }
    }

    return { success: true, message: 'Turma vinculada com sucesso!' };
}

export async function desvincularTurmaProfessor(professorId, turmaId) {
    if (!professorId || !turmaId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const { error } = await supabase
        .from('professor_turmas')
        .delete()
        .eq('professor_id', Number(professorId))
        .eq('turma_id', Number(turmaId));

    if (error) {
        throw new Error(error.message);
    }

    return { success: true, message: 'Turma desvinculada com sucesso!' };
}
