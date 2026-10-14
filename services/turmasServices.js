import { supabase } from '../config/supabase.js';

export async function criarTurma(serie, turma) {
    const serieLimpa = serie ? Number(serie) : null;
    const turmaLimpa = turma ? turma.trim().toUpperCase() : '';

    if (!serieLimpa || !turmaLimpa) {
        throw new Error('CAMPOS_VAZIOS');
    }

    // Verifica se a turma já existe no banco (mesma série e mesma turma, ex: 3 e 'A')
    const { data: existente, error: errExist } = await supabase
        .from('turmas')
        .select('id')
        .eq('serie', serieLimpa)
        .eq('turma', turmaLimpa)
        .maybeSingle();

    if (errExist) {
        throw new Error(errExist.message);
    }

    if (existente) {
        throw new Error('DUPLICADO');
    }

    // Insere se não existir
    const { error: errInsert } = await supabase
        .from('turmas')
        .insert([{ serie: serieLimpa, turma: turmaLimpa }]);

    if (errInsert) {
        if (errInsert.code === '23505') {
            throw new Error('DUPLICADO');
        }
        throw new Error(errInsert.message);
    }
}

export async function puxarTurmas() {
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
