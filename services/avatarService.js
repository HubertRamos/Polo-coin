import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase.js';

export const AVATAR_PADRAO = '🙂';

export const CATEGORIAS_AVATARES = [
    {
        id: 'rostos',
        nome: 'Rostos',
        icone: '😀',
        avatares: [
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️',
            '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋',
            '😛', '😜', '🤪', '🤓', '😎', '🥸', '🥳', '🤩', '🤠'
        ]
    },
    {
        id: 'animais',
        nome: 'Animais',
        icone: '🐶',
        avatares: [
            '🐱', '🐶', '🐺', '🦊', '🦝', '🦁', '🐯', '🐨', '🐼', '🐻',
            '🐸', '🐵', '🦄', '🦖', '🦕', '🐙', '🐬', '🐳', '🦅', '🦉',
            '🐝', '🦋', '🐢', '🐧'
        ]
    },
    {
        id: 'jogos',
        nome: 'Jogos',
        icone: '🎮',
        avatares: [
            '🎮', '🕹️', '👾', '🎲', '♟️', '🎯', '🎳', '🎪', '🪄', '🧩',
            '🃏', '🀄'
        ]
    },
    {
        id: 'esportes',
        nome: 'Esportes',
        icone: '⚽',
        avatares: [
            '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓',
            '🏸', '🥊', '🥋', '🛹', '⛸️', '🚴', '🏆', '🥇'
        ]
    },
    {
        id: 'tecnologia',
        nome: 'Tecnologia',
        icone: '🤖',
        avatares: [
            '🤖', '🚀', '🛸', '💻', '🛰️', '🔬', '🔭', '📡', '🔋', '⚡',
            '⚙️', '🖥️'
        ]
    },
    {
        id: 'criatividade',
        nome: 'Criatividade',
        icone: '🎨',
        avatares: [
            '🎨', '🎭', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎸',
            '📚', '✍️', '✏️', '💡'
        ]
    },
    {
        id: 'diversao',
        nome: 'Diversão',
        icone: '🎉',
        avatares: [
            '🔥', '💎', '👑', '⭐', '🌟', '🌈', '🍕', '🍔', '🍿', '🍦',
            '🍩', '🍭', '🎈', '🎁', '🧁', '🍪', '🌞', '🌙'
        ]
    }
];

// Set plano com todos os avatares permitidos
export const TODOS_AVATARES = new Set(
    CATEGORIAS_AVATARES.flatMap(cat => cat.avatares)
);

// Fallback de persistência local (assegura compatibilidade mesmo antes da migration SQL)
const ARQUIVO_FALLBACK = process.env.VERCEL
    ? path.resolve('/tmp/alunos_avatars.json')
    : path.resolve('data/alunos_avatars.json');
let cacheAvataresLocal = null;

function carregarCacheLocal() {
    if (cacheAvataresLocal !== null) return cacheAvataresLocal;
    try {
        if (!fs.existsSync(path.dirname(ARQUIVO_FALLBACK))) {
            fs.mkdirSync(path.dirname(ARQUIVO_FALLBACK), { recursive: true });
        }
        if (fs.existsSync(ARQUIVO_FALLBACK)) {
            const raw = fs.readFileSync(ARQUIVO_FALLBACK, 'utf8');
            cacheAvataresLocal = JSON.parse(raw);
        } else {
            cacheAvataresLocal = {};
        }
    } catch (e) {
        console.warn('[AvatarService] Erro ao carregar cache local de avatares:', e.message);
        cacheAvataresLocal = {};
    }
    return cacheAvataresLocal;
}

function salvarCacheLocal(alunoId, avatar) {
    try {
        const cache = carregarCacheLocal();
        cache[String(alunoId)] = avatar;
        if (!fs.existsSync(path.dirname(ARQUIVO_FALLBACK))) {
            fs.mkdirSync(path.dirname(ARQUIVO_FALLBACK), { recursive: true });
        }
        fs.writeFileSync(ARQUIVO_FALLBACK, JSON.stringify(cache, null, 2), 'utf8');
    } catch (e) {
        console.warn('[AvatarService] Erro ao persistir cache local de avatar:', e.message);
    }
}

// Checagem dinâmica de suporte à coluna no Supabase
let suporteColunaAvatar = null;
export async function checarSuporteAvatar() {
    if (suporteColunaAvatar !== null) return suporteColunaAvatar;
    try {
        const { error } = await supabase.from('alunos').select('avatar').limit(1);
        suporteColunaAvatar = !error;
    } catch {
        suporteColunaAvatar = false;
    }
    return suporteColunaAvatar;
}

/**
 * Valida se o avatar informado é válido.
 * Não permite links, texto livre longo, tags, etc. Apenas emojis/opções pré-definidas.
 */
export function validarAvatar(avatar) {
    if (!avatar || typeof avatar !== 'string') return false;
    const limpo = avatar.trim();
    if (!limpo) return false;
    if (limpo.length > 20) return false; // Bloqueia URLs ou textos longos
    // Verifica se está na lista de permitidos
    return TODOS_AVATARES.has(limpo) || limpo === '👤' || limpo === '🙂';
}

/**
 * Retorna o avatar de um aluno, combinando DB, cache de fallback e valor padrão.
 */
export function resolverAvatarAluno(alunoId, avatarDb = null) {
    if (avatarDb && typeof avatarDb === 'string' && avatarDb.trim()) {
        return avatarDb.trim();
    }
    if (alunoId) {
        const cache = carregarCacheLocal();
        const doCache = cache[String(alunoId)];
        if (doCache && typeof doCache === 'string' && doCache.trim()) {
            return doCache.trim();
        }
    }
    return AVATAR_PADRAO;
}

/**
 * Atualiza o avatar do aluno no banco e no cache.
 */
export async function salvarAvatarAluno(alunoId, avatar) {
    if (!alunoId || isNaN(Number(alunoId))) {
        throw new Error('ID_OBRIGATORIO');
    }
    const idNum = Number(alunoId);

    const avatarLimpo = (avatar || '').trim();
    if (!validarAvatar(avatarLimpo)) {
        throw new Error('AVATAR_INVALIDO');
    }

    // Salva no cache local de persistência
    salvarCacheLocal(idNum, avatarLimpo);

    // Tenta atualizar no Supabase se coluna estiver disponível
    const temColuna = await checarSuporteAvatar();
    if (temColuna) {
        const { error } = await supabase
            .from('alunos')
            .update({ avatar: avatarLimpo })
            .eq('id', idNum);

        if (error) {
            console.warn('[AvatarService] Erro ao atualizar avatar no Supabase:', error.message);
        }
    }

    return { id: idNum, avatar: avatarLimpo };
}
