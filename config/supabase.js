import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Tenta ler o arquivo .env manualmente caso o ambiente não tenha carregado via dotenv
function carregarEnvManual() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx !== -1) {
                    const key = trimmed.slice(0, eqIdx).trim();
                    let val = trimmed.slice(eqIdx + 1).trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            }
        }
    } catch {
        // Silencioso se não conseguir ler arquivo
    }
}

carregarEnvManual();

function resolveSupabaseConfig() {
    let url = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '';
    let key = (
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABASE_KEY ||
        ''
    ).trim();

    // Remove aspas ou espaços extras acidentais
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1).trim();
    }
    if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
        url = url.slice(1, -1).trim();
    }

    // Se a chave não foi definida mas o SUPABASE_URL parece ser uma chave (ex: sb_publishable_...)
    if (!key && url.startsWith('sb_')) {
        key = url;
        url = '';
    }

    // Analisa se a chave é um token JWT válido do Supabase e extrai o project-ref
    let keyProjectRef = null;
    let isJwt = false;
    if (key && key.includes('.')) {
        try {
            const parts = key.split('.');
            if (parts.length >= 2) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                if (payload && payload.ref) {
                    keyProjectRef = payload.ref;
                    isJwt = true;
                }
            }
        } catch {
            // Não é um JWT decodificável
        }
    }

    // Se temos o ref extraído da própria chave:
    if (keyProjectRef) {
        // Se a URL estiver vazia, ou se a URL atual apontar para outro projeto (ex: o de demonstração mihlwguvjfobgkfrojub)
        // atualiza automaticamente para a URL correta do projeto da chave!
        const urlRefMatch = url.match(/https?:\/\/([a-z0-9_-]+)\.supabase\.co/i);
        const currentUrlRef = urlRefMatch ? urlRefMatch[1] : null;

        if (!url || (currentUrlRef && currentUrlRef !== keyProjectRef)) {
            console.log(`[SUPABASE] 🔄 Sincronizando: Chave pertence ao projeto "${keyProjectRef}".`);
            url = `https://${keyProjectRef}.supabase.co`;
        }
    }

    // Se a URL fornecida for apenas o project-ref (ex: mihlwguvjfobgkfrojub)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url && /^[a-z0-9]{15,35}$/i.test(url)) {
            url = `https://${url}.supabase.co`;
        } else {
            url = 'https://mihlwguvjfobgkfrojub.supabase.co';
        }
    }

    const isPlaceholder = !key ||
        key === 'public-anon-key' ||
        key.includes('your-anon') ||
        key.includes('SUA_CHAVE') ||
        key.includes('sua-chave');

    const looksLikePassword = !isJwt && !key.startsWith('sb_') && key.length < 50 && !isPlaceholder;

    if (isPlaceholder) {
        console.warn('\n' + '='.repeat(68));
        console.warn('⚠️  [AVISO SUPABASE] Chave do Supabase não configurada no arquivo .env!');
        console.warn('👉 Para o banco de dados funcionar completamente:');
        console.warn('   1. Abra o arquivo .env na raiz do projeto');
        console.warn('   2. Adicione sua SUPABASE_URL e sua SUPABASE_ANON_KEY');
        console.warn('   (Pegue em: Supabase Dashboard > Project Settings > API > anon key)');
        console.warn('='.repeat(68) + '\n');
        key = 'public-anon-key';
    } else if (looksLikePassword) {
        console.warn('\n' + '='.repeat(68));
        console.warn('⚠️  [ATENÇÃO SUPABASE] O valor em SUPABASE_ANON_KEY não parece ser uma chave API!');
        console.warn('👉 Você provavelmente colocou a senha do banco ou o ID do projeto.');
        console.warn('   A chave API do Supabase (anon key) é um texto muito longo que começa');
        console.warn('   com "eyJhbGci..." (geralmente tem mais de 100 caracteres).');
        console.warn('   Pegue em: Supabase Dashboard > Project Settings > API > Project API keys > "anon"');
        console.warn('='.repeat(68) + '\n');
    }

    return {
        url,
        key,
        projectRef: keyProjectRef,
        isConfigured: !isPlaceholder && !looksLikePassword
    };
}

const { url: supabaseUrl, key: supabaseKey, projectRef, isConfigured } = resolveSupabaseConfig();

export const supabaseProjectRef = projectRef;
export const isSupabaseConfigured = isConfigured;

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

export default supabase;
