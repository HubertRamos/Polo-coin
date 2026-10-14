import { supabase } from '../config/supabase.js';

export async function criarProfessor(name, password) {
    const nomeLimpo = name ? name.trim() : '';
    const senhaLimpa = password ? password.trim() : '';

    if (!nomeLimpo || !senhaLimpa) {
        throw new Error('CAMPOS_VAZIOS');
    }

    // Verifica se o professor já existe no banco
    const { data: existente, error: errExist } = await supabase
        .from('professores')
        .select('id')
        .eq('name', nomeLimpo)
        .maybeSingle();

    if (errExist) {
        throw new Error(errExist.message);
    }

    if (existente) {
        throw new Error('DUPLICADO');
    }

    // Insere se não existir
    const { error: errInsert } = await supabase
        .from('professores')
        .insert([{ name: nomeLimpo, password: senhaLimpa }]);

    if (errInsert) {
        if (errInsert.code === '23505') {
            throw new Error('DUPLICADO');
        }
        throw new Error(errInsert.message);
    }
}

export async function puxarProfessores() {
    const { data, error } = await supabase
        .from('professores')
        .select('id, name')
        .order('name', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }
    return data || [];
}

export async function buscarProfessorPorId(id) {
    if (!id || isNaN(Number(id))) return null;
    const { data, error } = await supabase
        .from('professores')
        .select('id, name')
        .eq('id', Number(id))
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }
    return data || null;
}

export async function atualizarProfessor(id, { name, password }) {
    if (!id || isNaN(Number(id))) {
        throw new Error('ID_OBRIGATORIO');
    }
    const nomeLimpo = name ? name.trim() : '';
    if (!nomeLimpo) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const idNum = Number(id);

    // Verifica se já existe outro professor com este nome
    const { data: existente, error: errExist } = await supabase
        .from('professores')
        .select('id')
        .eq('name', nomeLimpo)
        .neq('id', idNum)
        .maybeSingle();

    if (errExist) {
        throw new Error(errExist.message);
    }
    if (existente) {
        throw new Error('DUPLICADO');
    }

    const updateData = { name: nomeLimpo };
    if (password && password.trim()) {
        updateData.password = password.trim();
    }

    const { data, error } = await supabase
        .from('professores')
        .update(updateData)
        .eq('id', idNum)
        .select('id, name')
        .maybeSingle();

    if (error) {
        if (error.code === '23505') {
            throw new Error('DUPLICADO');
        }
        throw new Error(error.message);
    }

    if (!data) {
        throw new Error('NAO_ENCONTRADO');
    }

    return data;
}
