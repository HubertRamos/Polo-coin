import { supabase } from '../config/supabase.js';

/**
 * Busca um professor pelo ID e retorna nome e senha atuais.
 * Retorna null se não encontrado ou se o ID for inválido.
 */
export async function buscarProfessorPorId(id) {
    if (!id) return null;
    try {
        const { data, error } = await supabase
            .from('professores')
            .select('id, name, password')
            .eq('id', Number(id))
            .maybeSingle();

        if (error) {
            console.error('Erro ao buscar professor:', error.message);
            return null;
        }

        return data || null;
    } catch (err) {
        console.error('Erro ao buscar professor:', err);
        return null;
    }
}

/**
 * Atualiza a senha de um professor pelo ID.
 * Retorna true se atualizado, false se não encontrado.
 */
export async function atualizarSenhaProfessor(id, novaSenha) {
    if (!id || !novaSenha) return false;
    try {
        const { data, error } = await supabase
            .from('professores')
            .update({ password: novaSenha.trim() })
            .eq('id', Number(id))
            .select('id');

        if (error) {
            console.error('Erro ao atualizar senha:', error.message);
            return false;
        }

        return Boolean(data && data.length > 0);
    } catch (err) {
        console.error('Erro ao atualizar senha:', err);
        return false;
    }
}
