/**
 * Gerenciador de Ocorrências Personalizadas (Experimental)
 * 
 * Regras:
 * - Armazenamento exclusivamente local no navegador via localStorage ('ocorrencias_personalizadas').
 * - Classificação estrutural de tipo intrínseca a cada ocorrência ('positiva' ou 'negativa').
 * - Campo 'categoria' removido conforme novas diretrizes.
 * - Campo 'tipo' é obrigatório em toda ocorrência (🟢 Positiva / 🔴 Negativa).
 * - O professor não escolhe manualmente o tipo no momento do lançamento: o tipo é obtido automaticamente da ocorrência.
 * - Validação: título obrigatório (1-100 caracteres), descrição opcional (0-500 caracteres), tipo obrigatório.
 * - Suporta migração automática de dados legados (default seguro: 'negativa' se indeterminado).
 * - Modal informativo exibido na primeira criação ("⚠️ Ocorrência Local").
 * - Observação discreta recorrente sobre armazenamento local próxima ao botão "➕ Nova Ocorrência".
 * - Badges visuais claras diferenciando tipo (🟢 Positiva / 🔴 Negativa) e origem (⭐ Personalizada).
 */

export const STORAGE_KEY = 'ocorrencias_personalizadas';
export const AVISO_PRIMEIRA_VEZ_KEY = 'ocorrencia_personalizada_aviso_visto';

/**
 * Lê todas as ocorrências personalizadas do localStorage com migração automática para 'tipo'.
 * @returns {Array} Lista de ocorrências personalizadas
 */
export function obterOcorrenciasPersonalizadas() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        let precisouMigrar = false;
        const listaMigrada = parsed.map(item => {
            if (!item || typeof item !== 'object') return item;
            
            // Migração de registros legados sem 'tipo'
            if (!item.tipo) {
                precisouMigrar = true;
                const texto = `${item.titulo || ''} ${item.descricao || ''} ${item.categoria || ''}`.toLowerCase();
                const palavrasNegativas = [
                    'não', 'nao', 'atraso', 'atrasado', 'bagunça', 'bagunca', 'danificou',
                    'falta', 'desrespeito', 'inadequado', 'sem', 'prejuízo', 'conflito', 'desinteressado'
                ];
                const temPalavraNegativa = palavrasNegativas.some(p => texto.includes(p));

                let tipoInferido = 'negativa'; // Padrão seguro de migração
                if (!temPalavraNegativa && Number(item.pontos) > 0) {
                    tipoInferido = 'positiva';
                }

                return {
                    ...item,
                    tipo: tipoInferido
                };
            }

            // Normaliza valor do tipo
            const tipoNormal = String(item.tipo).toLowerCase().trim() === 'positiva' ? 'positiva' : 'negativa';
            if (tipoNormal !== item.tipo) {
                precisouMigrar = true;
                return {
                    ...item,
                    tipo: tipoNormal
                };
            }

            return item;
        });

        if (precisouMigrar) {
            gravarOcorrenciasPersonalizadas(listaMigrada);
        }

        return listaMigrada;
    } catch (e) {
        console.error('Erro ao ler ocorrencias_personalizadas do localStorage:', e);
        return [];
    }
}

/**
 * Salva a lista inteira no localStorage.
 * @param {Array} lista
 */
export function gravarOcorrenciasPersonalizadas(lista) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (e) {
        console.error('Erro ao gravar no localStorage:', e);
        throw new Error('Falha ao salvar no armazenamento local do navegador.');
    }
}

/**
 * Verifica se o professor já visualizou o aviso informativo inicial.
 */
export function jaViuAvisoLocal() {
    try {
        return localStorage.getItem(AVISO_PRIMEIRA_VEZ_KEY) === 'true';
    } catch {
        return false;
    }
}

/**
 * Registra que o aviso informativo inicial foi lido e aceito.
 */
export function marcarAvisoLocalComoVisto() {
    try {
        localStorage.setItem(AVISO_PRIMEIRA_VEZ_KEY, 'true');
    } catch (e) {
        console.warn('Não foi possível gravar confirmação do aviso no localStorage:', e);
    }
}

/**
 * Valida os dados de uma ocorrência personalizada.
 * @param {Object} dados { titulo, descricao, tipo }
 * @returns {Object} { valido: boolean, erro?: string, tituloLimpo: string, descLimpa: string, tipoLimpo: string }
 */
export function validarOcorrenciaPersonalizada(dados = {}) {
    const tituloLimpo = (dados.titulo || '').trim();
    const descLimpa = (dados.descricao || '').trim();
    const tipoBruto = (dados.tipo || '').toLowerCase().trim();

    if (!tituloLimpo) {
        return { valido: false, erro: 'O título da ocorrência é obrigatório e não pode conter apenas espaços.' };
    }

    if (tituloLimpo.length > 100) {
        return { valido: false, erro: `O título deve conter no máximo 100 caracteres (atual: ${tituloLimpo.length}).` };
    }

    if (descLimpa.length > 500) {
        return { valido: false, erro: `A descrição deve conter no máximo 500 caracteres (atual: ${descLimpa.length}).` };
    }

    if (tipoBruto !== 'positiva' && tipoBruto !== 'negativa') {
        return { valido: false, erro: 'O tipo da ocorrência é obrigatório. Selecione 🟢 Positiva ou 🔴 Negativa.' };
    }

    let pontosLimpos = 20;
    if (dados.pontos !== undefined && dados.pontos !== null && String(dados.pontos).trim() !== '') {
        const p = parseInt(dados.pontos, 10);
        if (isNaN(p) || p <= 0) {
            return { valido: false, erro: 'A quantidade de PoloCoins deve ser um número inteiro maior que zero.' };
        }
        if (p > 1000) {
            return { valido: false, erro: 'A quantidade máxima permitida é de 1000 PoloCoins.' };
        }
        pontosLimpos = p;
    } else {
        pontosLimpos = tipoBruto === 'negativa' ? 10 : 20;
    }

    return {
        valido: true,
        tituloLimpo,
        descLimpa,
        tipoLimpo: tipoBruto,
        pontosLimpos
    };
}

/**
 * Cria e salva uma nova ocorrência personalizada no localStorage com tipo obrigatório e pontos definidos.
 * @param {Object} dados { titulo, descricao, tipo, pontos }
 * @returns {Object} Item criado
 */
export function salvarNovaOcorrenciaPersonalizada(dados) {
    const validacao = validarOcorrenciaPersonalizada(dados);
    if (!validacao.valido) {
        throw new Error(validacao.erro);
    }

    const lista = obterOcorrenciasPersonalizadas();
    const agora = new Date().toISOString();

    const novoItem = {
        id: 'oc_pers_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        titulo: validacao.tituloLimpo,
        descricao: validacao.descLimpa,
        tipo: validacao.tipoLimpo,
        pontos: validacao.pontosLimpos,
        criadoEm: agora,
        atualizadoEm: agora,
        isPersonalizada: true
    };

    lista.unshift(novoItem);
    gravarOcorrenciasPersonalizadas(lista);

    return novoItem;
}

/**
 * Atualiza uma ocorrência personalizada existente.
 * @param {string} id
 * @param {Object} dados
 * @returns {Object} Item atualizado
 */
export function atualizarOcorrenciaPersonalizada(id, dados) {
    if (!id) throw new Error('ID da ocorrência é obrigatório.');

    const validacao = validarOcorrenciaPersonalizada(dados);
    if (!validacao.valido) {
        throw new Error(validacao.erro);
    }

    const lista = obterOcorrenciasPersonalizadas();
    const idx = lista.findIndex(item => String(item.id) === String(id));

    if (idx === -1) {
        throw new Error('Ocorrência personalizada não encontrada.');
    }

    const itemAtualizado = {
        ...lista[idx],
        titulo: validacao.tituloLimpo,
        descricao: validacao.descLimpa,
        tipo: validacao.tipoLimpo,
        pontos: validacao.pontosLimpos,
        atualizadoEm: new Date().toISOString(),
        isPersonalizada: true
    };
    delete itemAtualizado.categoria; // Remove categoria legada

    lista[idx] = itemAtualizado;
    gravarOcorrenciasPersonalizadas(lista);

    return itemAtualizado;
}

/**
 * Remove uma ocorrência personalizada do localStorage.
 * @param {string} id
 */
export function removerOcorrenciaPersonalizada(id) {
    if (!id) throw new Error('ID da ocorrência é obrigatório.');

    const lista = obterOcorrenciasPersonalizadas();
    const novaLista = lista.filter(item => String(item.id) !== String(id));

    if (novaLista.length === lista.length) {
        throw new Error('Ocorrência personalizada não encontrada.');
    }

    gravarOcorrenciasPersonalizadas(novaLista);
    return true;
}

/**
 * Exibe um alerta flutuante (toast) com boa experiência para o usuário.
 * @param {string} mensagem
 * @param {'success'|'danger'|'warning'|'info'} tipo
 */
export function exibirFeedbackOcorrencia(mensagem, tipo = 'success') {
    const idToast = 'toast-ocorrencia-feedback';
    let toast = document.getElementById(idToast);
    if (!toast) {
        toast = document.createElement('div');
        toast.id = idToast;
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 9999;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.18);
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
            max-width: 90vw;
        `;
        document.body.appendChild(toast);
    }

    const cores = {
        success: { bg: 'var(--color-success)', color: '#ffffff' },
        danger:  { bg: 'var(--color-danger)', color: '#ffffff' },
        warning: { bg: 'var(--color-coin)', color: '#ffffff' },
        info:    { bg: 'var(--color-primary)', color: '#ffffff' },
    };

    const cfg = cores[tipo] || cores.success;
    toast.style.backgroundColor = cfg.bg;
    toast.style.color = cfg.color;
    toast.innerHTML = `<span>${mensagem}</span>`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
    }, 4000);
}

/**
 * Exibe o Modal Informativo obrigatório de primeira vez.
 * @param {Function} onEntendi Callback executado ao clicar em "Entendi"
 */
export function abrirModalAvisoLocal(onEntendi = () => {}) {
    const idModal = 'modal-aviso-ocorrencia-local';
    const existente = document.getElementById(idModal);
    if (existente) existente.remove();

    const modal = document.createElement('div');
    modal.id = idModal;
    modal.className = 'modal-overlay';
    modal.style.zIndex = '3500';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 480px; border-radius: 12px; overflow: hidden; animation: fadeIn 0.25s ease;" role="dialog" aria-labelledby="aviso-local-titulo">
            <div style="background: linear-gradient(135deg, var(--color-coin), var(--color-coin-dark)); padding: 18px 20px; color: #ffffff; display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">⚠️</span>
                <div>
                    <h2 id="aviso-local-titulo" style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">⚠️ Ocorrência Local</h2>
                    <small style="opacity: 0.9; font-size: 12px;">Funcionalidade experimental</small>
                </div>
            </div>

            <div class="modal-body" style="padding: 20px; font-size: 14px; color: var(--text-primary); line-height: 1.6;">
                <p style="margin: 0 0 12px 0; font-weight: 600; color: var(--text-primary);">
                    Esta ocorrência será salva apenas neste navegador.
                </p>

                <p style="margin: 0 0 8px 0; color: var(--text-secondary); font-size: 13px;">
                    Ela poderá desaparecer caso:
                </p>

                <ul style="margin: 0 0 16px 0; padding-left: 20px; color: var(--text-secondary); font-size: 13px; list-style: none;">
                    <li>• Os dados do navegador sejam apagados.</li>
                    <li>• O cache seja limpo.</li>
                    <li>• O navegador seja reinstalado.</li>
                    <li>• O sistema seja acessado em outro computador.</li>
                    <li>• O usuário utilize outro navegador.</li>
                </ul>

                <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #92400E; display: flex; gap: 8px; align-items: flex-start;">
                    <span style="font-size: 14px;">ℹ️</span>
                    <span>Essas ocorrências não são sincronizadas com o servidor.</span>
                </div>
            </div>

            <div style="padding: 14px 20px; background: var(--bg-subtle); border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
                <button id="btn-aviso-local-entendi" type="button" class="btn btn-primary" style="padding: 8px 22px; font-weight: 600;">
                    Entendi
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const btnEntendi = modal.querySelector('#btn-aviso-local-entendi');
    btnEntendi?.focus();

    btnEntendi?.addEventListener('click', () => {
        marcarAvisoLocalComoVisto();
        modal.remove();
        onEntendi();
    });
}

/**
 * Abre o Modal de Criação ou Edição de Ocorrência Personalizada.
 * Contém o campo obrigatório de Tipo (🟢 Positiva / 🔴 Negativa) e remove Categoria.
 * @param {Object|null} itemParaEditar Objeto se for edição, ou null se for criação
 * @param {Function} onSalvo Callback após salvar com sucesso
 */
/**
 * Abre o Modal de Criação ou Edição de Ocorrência Personalizada.
 * Contém o campo obrigatório de Tipo (🟢 Positiva / 🔴 Negativa) e remove Categoria.
 * O botão de salvar é fixado no rodapé com alto contraste e visibilidade garantida.
 * @param {Object|null} itemParaEditar Objeto se for edição, ou null se for criação
 * @param {Function} onSalvo Callback após salvar com sucesso
 */
export function abrirModalCriarOuEditarOcorrencia(itemParaEditar = null, onSalvo = () => {}) {
    const isEdicao = Boolean(itemParaEditar && itemParaEditar.id);
    const idModal = 'modal-form-ocorrencia-personalizada';
    const existente = document.getElementById(idModal);
    if (existente) existente.remove();

    const tituloAtual = itemParaEditar?.titulo || '';
    const descAtual = itemParaEditar?.descricao || '';
    const tipoAtual = itemParaEditar?.tipo || 'positiva';
    const pontosAtual = itemParaEditar?.pontos !== undefined ? itemParaEditar.pontos : (tipoAtual === 'negativa' ? 10 : 20);

    const modal = document.createElement('div');
    modal.id = idModal;
    modal.className = 'modal-overlay';
    modal.style.zIndex = '3000';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 520px; width: 100%; border-radius: 14px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background: #ffffff; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: fadeIn 0.2s ease;" role="dialog" aria-labelledby="modal-op-title">
            <div class="modal-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; background: #ffffff;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;">${isEdicao ? '✏️' : '➕'}</span>
                    <div>
                        <h2 id="modal-op-title" class="modal-title" style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-primary);">
                            ${isEdicao ? 'Editar Ocorrência Personalizada' : 'Nova Ocorrência Personalizada'}
                        </h2>
                    </div>
                </div>
                <button id="btn-fechar-modal-op" type="button" class="btn btn-ghost" style="padding: 6px 10px; font-size: 16px; color: var(--text-secondary); border: none; background: transparent; cursor: pointer; border-radius: 6px;" aria-label="Fechar">
                    ✕
                </button>
            </div>

            <form id="form-ocorrencia-personalizada" style="margin: 0; display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;">
                <div class="modal-body" style="padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; flex: 1; min-height: 0;">
                    <!-- Aviso recorrente discreto -->
                    <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px; font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                        <span>ℹ️</span>
                        <span>Ocorrências personalizadas são armazenadas apenas localmente neste navegador.</span>
                    </div>

                    <!-- Mensagem de erro de validação -->
                    <div id="op-erro-validacao" class="alert alert-danger" style="display: none; font-size: 12px; padding: 8px 12px; margin: 0;"></div>

                    <!-- Campo Obrigatório: Tipo da Ocorrência -->
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid var(--border-strong);">
                        <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
                            Tipo da ocorrência <span style="color: var(--color-danger);">*</span>
                        </label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <label class="label-tipo-card" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; border: 2px solid ${tipoAtual === 'positiva' ? 'var(--color-success)' : 'var(--border-color)'}; background: ${tipoAtual === 'positiva' ? '#ecfdf5' : '#ffffff'}; cursor: pointer; transition: all 0.2s;">
                                <input type="radio" name="op-tipo" value="positiva" ${tipoAtual === 'positiva' ? 'checked' : ''} style="cursor: pointer;" />
                                <div>
                                    <strong style="display: block; font-size: 13px; color: #16a34a;">🟢 Positiva</strong>
                                    <small style="font-size: 11px; color: var(--text-secondary);">Atitude exemplar ou colaborativa</small>
                                </div>
                            </label>
                            <label class="label-tipo-card" style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; border: 2px solid ${tipoAtual === 'negativa' ? 'var(--color-danger)' : 'var(--border-color)'}; background: ${tipoAtual === 'negativa' ? '#fef2f2' : '#ffffff'}; cursor: pointer; transition: all 0.2s;">
                                <input type="radio" name="op-tipo" value="negativa" ${tipoAtual === 'negativa' ? 'checked' : ''} style="cursor: pointer;" />
                                <div>
                                    <strong style="display: block; font-size: 13px; color: #dc2626;">🔴 Negativa</strong>
                                    <small style="font-size: 11px; color: var(--text-secondary);">Infração ou não entrega</small>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Campo Obrigatório: Quantidade de PoloCoins (Pontos) -->
                    <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid var(--border-strong);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label for="op-input-pontos" style="font-size: 12px; font-weight: 700; color: var(--text-primary);">
                                Pontos da ocorrência (PoloCoins) <span style="color: var(--color-danger);">*</span>
                            </label>
                            <span id="op-sinal-pontos" style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${tipoAtual === 'negativa' ? '#fee2e2' : '#dcfce7'}; color: ${tipoAtual === 'negativa' ? '#b91c1c' : '#15803d'};">
                                ${tipoAtual === 'negativa' ? '🔴 Subtrai PoloCoins (-)' : '🟢 Adiciona PoloCoins (+)'}
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <input
                                id="op-input-pontos"
                                type="number"
                                min="1"
                                max="1000"
                                placeholder="Ex: 20"
                                value="${pontosAtual}"
                                class="form-input"
                                style="width: 140px; box-sizing: border-box; font-size: 14px; font-weight: 700; padding: 8px 12px; border: 1px solid var(--border-strong); border-radius: 6px;"
                                required
                            />
                            <span style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">
                                PoloCoins por lançamento
                            </span>
                        </div>
                        <small style="display: block; font-size: 11px; color: var(--text-secondary); margin-top: 5px;">
                            Defina a pontuação que o aluno receberá (+) ou perderá (-) ao registrar esta ocorrência.
                        </small>
                    </div>

                    <!-- Título -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <label for="op-input-titulo" style="font-size: 12px; font-weight: 700; color: var(--text-primary);">
                                Título da ocorrência <span style="color: var(--color-danger);">*</span>
                            </label>
                            <span id="op-contador-titulo" style="font-size: 11px; color: var(--text-muted);">${tituloAtual.length}/100</span>
                        </div>
                        <input
                            id="op-input-titulo"
                            type="text"
                            maxlength="100"
                            placeholder="Ex: Ajudou a organizar a biblioteca, Danificou material da sala..."
                            value="${tituloAtual.replace(/"/g, '&quot;')}"
                            class="form-input"
                            style="width: 100%; box-sizing: border-box; font-size: 13px; padding: 9px 12px; border: 1px solid var(--border-strong); border-radius: 6px;"
                            required
                        />
                    </div>

                    <!-- Descrição -->
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <label for="op-input-desc" style="font-size: 12px; font-weight: 700; color: var(--text-primary);">
                                Descrição da ocorrência <span style="font-size: 11px; font-weight: 400; color: var(--text-secondary);">(opcional)</span>
                            </label>
                            <span id="op-contador-desc" style="font-size: 11px; color: var(--text-muted);">${descAtual.length}/500</span>
                        </div>
                        <textarea
                            id="op-input-desc"
                            maxlength="500"
                            rows="3"
                            placeholder="Detalhes adicionais sobre como ou quando esta ocorrência se aplica..."
                            class="form-input"
                            style="width: 100%; box-sizing: border-box; font-size: 13px; font-family: inherit; resize: vertical; padding: 8px 12px; border: 1px solid var(--border-strong); border-radius: 6px;"
                        >${descAtual}</textarea>
                    </div>
                </div>

                <!-- Rodapé sempre visível com botão Salvar destacado -->
                <div class="modal-footer" style="padding: 14px 20px; border-top: 1px solid var(--border-color); background: var(--bg-subtle); display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-shrink: 0; position: sticky; bottom: 0; z-index: 10;">
                    <button id="btn-cancelar-modal-op" type="button" class="btn btn-secondary" style="padding: 9px 18px; font-size: 13px; font-weight: 600; border-radius: 8px; border: 1px solid var(--border-strong); background: #ffffff; color: var(--text-secondary); cursor: pointer;">
                        Cancelar
                    </button>
                    <button id="btn-salvar-modal-op" type="submit" style="background: #16a34a; color: #ffffff; padding: 11px 24px; font-size: 14px; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 3px 10px rgba(22,163,74,0.35); transition: background 0.15s ease;">
                        <span style="font-size: 16px;">💾</span>
                        <span>${isEdicao ? 'Salvar Alterações' : 'Salvar Ocorrência'}</span>
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    const inputTitulo = modal.querySelector('#op-input-titulo');
    const inputDesc = modal.querySelector('#op-input-desc');
    const inputPontos = modal.querySelector('#op-input-pontos');
    const sinalPontosBadge = modal.querySelector('#op-sinal-pontos');
    const contadorTitulo = modal.querySelector('#op-contador-titulo');
    const contadorDesc = modal.querySelector('#op-contador-desc');
    const erroDiv = modal.querySelector('#op-erro-validacao');
    const btnFechar = modal.querySelector('#btn-fechar-modal-op');
    const btnCancelar = modal.querySelector('#btn-cancelar-modal-op');
    const form = modal.querySelector('#form-ocorrencia-personalizada');
    const radioLabels = modal.querySelectorAll('.label-tipo-card');

    // Foco automático no título
    inputTitulo?.focus();

    // Destaque visual interativo nos cards de tipo e atualização do sinal dos pontos
    modal.querySelectorAll('input[name="op-tipo"]').forEach(radio => {
        radio.addEventListener('change', () => {
            radioLabels.forEach(lbl => {
                const r = lbl.querySelector('input');
                if (r.checked) {
                    lbl.style.borderColor = r.value === 'positiva' ? 'var(--color-success)' : 'var(--color-danger)';
                    lbl.style.backgroundColor = r.value === 'positiva' ? '#ecfdf5' : '#fef2f2';
                } else {
                    lbl.style.borderColor = 'var(--border-color)';
                    lbl.style.backgroundColor = '#ffffff';
                }
            });

            if (radio.checked) {
                if (radio.value === 'negativa') {
                    sinalPontosBadge.textContent = '🔴 Subtrai PoloCoins (-)';
                    sinalPontosBadge.style.background = '#fee2e2';
                    sinalPontosBadge.style.color = '#b91c1c';
                    if (!isEdicao && inputPontos.value === '20') {
                        inputPontos.value = '10';
                    }
                } else {
                    sinalPontosBadge.textContent = '🟢 Adiciona PoloCoins (+)';
                    sinalPontosBadge.style.background = '#dcfce7';
                    sinalPontosBadge.style.color = '#15803d';
                    if (!isEdicao && inputPontos.value === '10') {
                        inputPontos.value = '20';
                    }
                }
            }
        });
    });

    // Contadores em tempo real
    inputTitulo?.addEventListener('input', () => {
        contadorTitulo.textContent = `${inputTitulo.value.length}/100`;
    });
    inputDesc?.addEventListener('input', () => {
        contadorDesc.textContent = `${inputDesc.value.length}/500`;
    });

    const fechar = () => modal.remove();
    btnFechar?.addEventListener('click', fechar);
    btnCancelar?.addEventListener('click', fechar);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fechar();
    });

    // Submissão do formulário
    form?.addEventListener('submit', (e) => {
        e.preventDefault();

        const titulo = inputTitulo.value;
        const descricao = inputDesc.value;
        const tipo = modal.querySelector('input[name="op-tipo"]:checked')?.value || '';
        const pontos = inputPontos.value;

        const validacao = validarOcorrenciaPersonalizada({ titulo, descricao, tipo, pontos });
        if (!validacao.valido) {
            erroDiv.textContent = validacao.erro;
            erroDiv.style.display = 'block';
            return;
        }
        erroDiv.style.display = 'none';

        try {
            let resultado;
            const primeiraVez = !jaViuAvisoLocal();

            if (isEdicao) {
                resultado = atualizarOcorrenciaPersonalizada(itemParaEditar.id, {
                    titulo,
                    descricao,
                    tipo,
                    pontos: validacao.pontosLimpos
                });
                exibirFeedbackOcorrencia('✓ Ocorrência atualizada com sucesso', 'success');
            } else {
                resultado = salvarNovaOcorrenciaPersonalizada({
                    titulo,
                    descricao,
                    tipo,
                    pontos: validacao.pontosLimpos
                });
                exibirFeedbackOcorrencia('✓ Ocorrência criada com sucesso', 'success');
            }

            fechar();

            // Se for a primeira vez criando, exibe o modal de aviso informativo
            if (!isEdicao && primeiraVez) {
                abrirModalAvisoLocal(() => {
                    onSalvo(resultado);
                });
            } else {
                onSalvo(resultado);
            }
        } catch (err) {
            erroDiv.textContent = err.message || 'Erro ao salvar ocorrência.';
            erroDiv.style.display = 'block';
        }
    });
}

/**
 * Exibe confirmação antes de excluir ocorrência personalizada.
 * @param {string} id
 * @param {Function} onSucesso
 */
export function confirmarExclusaoOcorrencia(id, onSucesso = () => {}) {
    const lista = obterOcorrenciasPersonalizadas();
    const item = lista.find(o => String(o.id) === String(id));
    const nomeOcorrencia = item ? `"${item.titulo}"` : '';

    const msg = nomeOcorrencia 
        ? `Deseja realmente remover esta ocorrência personalizada (${nomeOcorrencia})?`
        : 'Deseja realmente remover esta ocorrência personalizada?';

    const confirmou = window.confirm(msg);
    if (!confirmou) return;

    try {
        removerOcorrenciaPersonalizada(id);
        exibirFeedbackOcorrencia('✓ Ocorrência removida com sucesso', 'success');
        onSucesso();
    } catch (err) {
        alert(err.message || 'Erro ao remover ocorrência.');
    }
}

/**
 * Renderiza o painel seletor com Ocorrências Padrão e Ocorrências Personalizadas.
 * Exibe visualmente o tipo (🟢 Positiva / 🔴 Negativa com badges coloridas).
 * O tipo é intrínseco à ocorrência: o professor NÃO escolhe manualmente positiva/negativa.
 * 
 * @param {HTMLElement} container Elemento DOM onde o seletor será renderizado
 * @param {Object} options Opções de configuração
 * @returns {Object} Controle com método atualizar()
 */
export function renderSeletorOcorrencias(container, {
    categoriasPadrao = [],
    onSelecionarOcorrencia = () => {},
    tituloSecao = "Opções de Ocorrência"
} = {}) {
    if (!container) return;

    let ocorrenciaSelecionada = null;

    function renderizar() {
        const personalizadas = obterOcorrenciasPersonalizadas();

        // Extrai todas as ocorrências padrão com seus tipos explícitos
        const todasOpcoesPadrao = [];
        categoriasPadrao.forEach(cat => {
            (cat.opcoes || []).forEach(op => {
                const tipoDefinido = (op.tipo || '').toLowerCase().trim() === 'negativa' ? 'negativa' : 'positiva';
                todasOpcoesPadrao.push({
                    ...op,
                    categoriaNome: cat.nome,
                    tipo: tipoDefinido,
                    descricao: op.descricao || op.label || op.valor
                });
            });
        });

        const padraoPositivas = todasOpcoesPadrao.filter(o => o.tipo === 'positiva');
        const padraoNegativas = todasOpcoesPadrao.filter(o => o.tipo === 'negativa');

        const isItemSelecionado = (idOrValor) => {
            if (!ocorrenciaSelecionada) return false;
            return String(ocorrenciaSelecionada.identificador) === String(idOrValor);
        };

        container.innerHTML = `
            <div class="seletor-ocorrencias-wrapper" style="display: flex; flex-direction: column; gap: 14px;">
                <!-- Cabeçalho de Ações e Aviso Recorrente -->
                <div style="background: #ffffff; padding: 12px 14px; border-radius: 8px; border: 1px solid var(--border-color); box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <span style="font-size: 13px; font-weight: 700; color: var(--text-primary);">${tituloSecao}</span>
                            <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">
                                1. Selecione uma ocorrência abaixo. 2. Confirme e salve no botão <strong>"💾 Salvar Ocorrência no Aluno"</strong>.
                            </div>
                        </div>
                        <button id="btn-nova-ocorrencia-pers" type="button" class="btn btn-primary btn--sm" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 7px 14px; border-radius: 6px; background: var(--color-secondary); color: #ffffff; border: none; cursor: pointer; box-shadow: 0 2px 5px rgba(139,92,246,0.3);">
                            <span>➕</span> Nova Ocorrência
                        </button>
                    </div>

                    <!-- Aviso Recorrente Discreto -->
                    <div style="margin-top: 10px; padding: 6px 10px; background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 6px; font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 13px;">ℹ️</span>
                        <span>Ocorrências personalizadas são armazenadas apenas localmente neste navegador.</span>
                    </div>
                </div>

                <!-- Seção 1: Ocorrências Padrão do Sistema -->
                <div class="bloco-ocorrencias-padrao" style="background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                            <span>📋</span> Ocorrências padrão
                        </h4>
                        <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">Classificadas por tipo</span>
                    </div>

                    <!-- Subgrupo: Ocorrências Positivas -->
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                            <span style="font-size: 11px; font-weight: 700; background: #DCFCE7; color: #15803D; padding: 2px 8px; border-radius: 9999px;">
                                🟢 Ocorrências Positivas (${padraoPositivas.length})
                            </span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${padraoPositivas.map(op => {
                                const sel = isItemSelecionado(op.valor);
                                return `
                                    <button
                                        type="button"
                                        class="btn-opcao-padrao"
                                        data-categoria="${op.categoriaNome.toLowerCase()}"
                                        data-valor="${op.valor}"
                                        data-label="${op.label}"
                                        data-descricao="${op.descricao.replace(/"/g, '&quot;')}"
                                        data-tipo="positiva"
                                        data-pontos="${op.pontos || 20}"
                                        title="Clique para selecionar: Positiva (+${op.pontos} PoloCoins)"
                                        style="padding: 7px 11px; font-size: 12px; font-weight: 600; border-radius: 6px; border: ${sel ? '2px solid #16a34a' : '1px solid #bbf7d0'}; background: ${sel ? '#dcfce7' : '#f0fdf4'}; color: #166534; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; transform: ${sel ? 'scale(1.03)' : 'none'}; box-shadow: ${sel ? '0 0 0 3px rgba(22,163,74,0.25)' : 'none'};"
                                    >
                                        <span>${sel ? '✓ 🟢' : '🟢'} ${op.label}</span>
                                        <small style="opacity: 0.9; font-size: 10px; font-weight: 600; background: ${sel ? '#bbf7d0' : '#dcfce7'}; padding: 1px 5px; border-radius: 3px;">
                                            +${op.pontos}p
                                        </small>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Subgrupo: Ocorrências Negativas -->
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                            <span style="font-size: 11px; font-weight: 700; background: #FEE2E2; color: #B91C1C; padding: 2px 8px; border-radius: 9999px;">
                                🔴 Ocorrências Negativas (${padraoNegativas.length})
                            </span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${padraoNegativas.map(op => {
                                const sel = isItemSelecionado(op.valor);
                                return `
                                    <button
                                        type="button"
                                        class="btn-opcao-padrao"
                                        data-categoria="${op.categoriaNome.toLowerCase()}"
                                        data-valor="${op.valor}"
                                        data-label="${op.label}"
                                        data-descricao="${op.descricao.replace(/"/g, '&quot;')}"
                                        data-tipo="negativa"
                                        data-pontos="${op.pontos || 10}"
                                        title="Clique para selecionar: Negativa (-${op.pontos} PoloCoins)"
                                        style="padding: 7px 11px; font-size: 12px; font-weight: 600; border-radius: 6px; border: ${sel ? '2px solid #dc2626' : '1px solid #fecaca'}; background: ${sel ? '#fee2e2' : '#fef2f2'}; color: #991b1b; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; transform: ${sel ? 'scale(1.03)' : 'none'}; box-shadow: ${sel ? '0 0 0 3px rgba(220,38,38,0.25)' : 'none'};"
                                    >
                                        <span>${sel ? '✓ 🔴' : '🔴'} ${op.label}</span>
                                        <small style="opacity: 0.9; font-size: 10px; font-weight: 600; background: ${sel ? '#fecaca' : '#fee2e2'}; padding: 1px 5px; border-radius: 3px;">
                                            -${op.pontos}p
                                        </small>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Seção 2: Ocorrências Personalizadas do Navegador -->
                <div class="bloco-ocorrencias-personalizadas" style="background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                            <span>⭐</span> Ocorrências personalizadas
                            <span style="font-size: 11px; font-weight: 600; background: #FEF3C7; color: #B45309; padding: 2px 7px; border-radius: 9999px;">
                                ${personalizadas.length}
                            </span>
                        </h4>
                        <span style="font-size: 11px; color: var(--color-coin-dark); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                            ⭐ Personalizada / 🏠 Local
                        </span>
                    </div>

                    ${personalizadas.length === 0 ? `
                        <div style="padding: 16px; border: 1px dashed var(--border-strong); border-radius: 8px; text-align: center; background: var(--bg-subtle);">
                            <div style="font-size: 20px; margin-bottom: 4px;">📝</div>
                            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: var(--text-secondary);">
                                Nenhuma ocorrência personalizada criada ainda.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: var(--text-muted);">
                                Clique no botão <strong>➕ Nova Ocorrência</strong> acima para adicionar ocorrências personalizadas neste navegador.
                            </p>
                        </div>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${personalizadas.map(item => {
                                const isPos = (item.tipo || '').toLowerCase().trim() === 'positiva';
                                const sel = isItemSelecionado(item.id);
                                const badgeTipoHtml = isPos
                                    ? `<span style="font-size: 10.5px; font-weight: 700; background: #DCFCE7; color: #15803D; border: 1px solid #bbf7d0; padding: 1px 7px; border-radius: 4px;">🟢 Positiva</span>`
                                    : `<span style="font-size: 10.5px; font-weight: 700; background: #FEE2E2; color: #B91C1C; border: 1px solid #fecaca; padding: 1px 7px; border-radius: 4px;">🔴 Negativa</span>`;

                                return `
                                    <div
                                        class="card-ocorrencia-personalizada"
                                        data-id="${item.id}"
                                        style="padding: 10px 12px; border-radius: 8px; border: ${sel ? '2px solid var(--color-primary-dark)' : (isPos ? '1px solid #bbf7d0' : '1px solid #fecaca')}; background: ${sel ? '#eff6ff' : (isPos ? '#f0fdf4' : '#fff5f5')}; display: flex; justify-content: space-between; align-items: center; gap: 10px; transition: all 0.2s; box-shadow: ${sel ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none'};"
                                    >
                                        <div
                                            class="btn-selecionar-personalizada"
                                            data-id="${item.id}"
                                            title="Clique para selecionar esta ocorrência personalizada (${isPos ? 'Positiva' : 'Negativa'})"
                                            style="flex: 1; cursor: pointer; min-width: 0;"
                                        >
                                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap;">
                                                <span style="font-size: 10px; font-weight: 700; background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; padding: 1px 6px; border-radius: 4px;">
                                                    ${sel ? '✓ ⭐ Selecionada' : '⭐ Personalizada'}
                                                </span>
                                                ${badgeTipoHtml}
                                                <small style="font-size: 10px; font-weight: 600; background: ${isPos ? '#dcfce7' : '#fee2e2'}; color: ${isPos ? '#166534' : '#991b1b'}; padding: 1px 5px; border-radius: 3px; border: 1px solid ${isPos ? '#bbf7d0' : '#fecaca'};">
                                                    ${isPos ? '+' : '-'}${item.pontos || (isPos ? 20 : 10)}p
                                                </small>
                                                <strong style="font-size: 13px; color: var(--text-primary);">${item.titulo}</strong>
                                            </div>
                                            ${item.descricao ? `
                                                <p style="margin: 0; font-size: 11.5px; color: var(--text-secondary); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                    ${item.descricao}
                                                </p>
                                            ` : ''}
                                        </div>

                                        <!-- Ações exclusivas de ocorrências personalizadas: Edição e Exclusão -->
                                        <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                                            <button
                                                type="button"
                                                class="btn-editar-personalizada"
                                                data-id="${item.id}"
                                                title="Editar ocorrência personalizada"
                                                style="background: #ffffff; border: 1px solid var(--border-color); color: var(--color-primary); border-radius: 6px; padding: 5px 8px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background 0.15s;"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                type="button"
                                                class="btn-excluir-personalizada"
                                                data-id="${item.id}"
                                                title="Excluir ocorrência personalizada"
                                                style="background: #ffffff; border: 1px solid var(--border-color); color: var(--color-danger); border-radius: 6px; padding: 5px 8px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background 0.15s;"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- Seção 3: Painel de Confirmação e Botão SALVAR OCORRÊNCIA -->
                <div id="painel-salvamento-ocorrencia-wrapper">
                    ${!ocorrenciaSelecionada ? `
                    ` : `
                        <div id="box-confirmacao-salvar" style="padding: 16px 18px; background: #f0fdf4; border: 2px solid #16a34a; border-radius: 10px; box-shadow: 0 4px 16px rgba(22,163,74,0.18); animation: fadeIn 0.2s ease;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
                                <div>
                                    <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; background: #dcfce7; padding: 2px 8px; border-radius: 9999px;">
                                        ✓ Ocorrência Pronta para Registro
                                    </span>
                                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                                        <strong style="font-size: 15px; color: var(--text-primary);">${ocorrenciaSelecionada.label || ocorrenciaSelecionada.valor}</strong>
                                        <span style="font-size: 11.5px; font-weight: 700; padding: 3px 9px; border-radius: 5px; background: ${ocorrenciaSelecionada.tipo === 'negativa' ? '#fee2e2' : '#dcfce7'}; color: ${ocorrenciaSelecionada.tipo === 'negativa' ? '#b91c1c' : '#15803d'};">
                                            ${ocorrenciaSelecionada.tipo === 'negativa' ? '🔴 Negativa (-' + ocorrenciaSelecionada.pontos + ' PoloCoins)' : '🟢 Positiva (+' + ocorrenciaSelecionada.pontos + ' PoloCoins)'}
                                        </span>
                                        ${ocorrenciaSelecionada.isPersonalizada ? '<span style="font-size: 11px; font-weight: 600; background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px;">⭐ Personalizada</span>' : ''}
                                    </div>
                                    ${ocorrenciaSelecionada.descricao ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${ocorrenciaSelecionada.descricao}</div>` : ''}
                                </div>
                                <button id="btn-cancelar-selecao-oc" type="button" style="background: #ffffff; border: 1px solid var(--border-strong); border-radius: 6px; padding: 4px 10px; font-size: 11.5px; color: var(--text-secondary); cursor: pointer;">
                                    ✕ Desmarcar
                                </button>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 140px; gap: 12px; margin-bottom: 14px;">
                                <div>
                                    <label for="input-obs-adicional-seletor" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                                        Observação / Detalhe complementar (opcional):
                                    </label>
                                    <input
                                        id="input-obs-adicional-seletor"
                                        type="text"
                                        placeholder="Ex: Demonstrou dedicação na aula prática..."
                                        class="form-input form-input--sm"
                                        style="width: 100%; box-sizing: border-box; background: #ffffff; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 6px;"
                                    />
                                </div>
                                <div>
                                    <label for="input-pontos-confirmacao" style="display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                                        PoloCoins:
                                    </label>
                                    <input
                                        id="input-pontos-confirmacao"
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value="${ocorrenciaSelecionada.pontos}"
                                        class="form-input form-input--sm"
                                        style="width: 100%; box-sizing: border-box; background: #ffffff; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 6px; font-weight: 700; text-align: center;"
                                        title="Altere aqui se desejar pontuação diferente para este registro"
                                    />
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                                <div style="font-size: 12px; color: #15803d; font-weight: 600;">
                                    Classificação automática: ${ocorrenciaSelecionada.tipo === 'negativa' ? '🔴 Negativa' : '🟢 Positiva'}
                                </div>
                                <button id="btn-salvar-ocorrencia-confirmada" type="button" style="background: #16a34a; color: #ffffff; padding: 12px 26px; font-size: 14px; font-weight: 700; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(22,163,74,0.35); transition: background 0.15s ease;">
                                    <span style="font-size: 18px;">💾</span>
                                    <span>Salvar Ocorrência no Aluno</span>
                                </button>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;

        // Eventos
        // 1. Botão "➕ Nova Ocorrência"
        const btnNova = container.querySelector("#btn-nova-ocorrencia-pers");
        btnNova?.addEventListener("click", (e) => {
            e.preventDefault();
            abrirModalCriarOuEditarOcorrencia(null, () => {
                renderizar();
            });
        });

        // 2. Botões de ocorrências padrão (seleciona e ativa o botão Salvar)
        container.querySelectorAll(".btn-opcao-padrao").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const categoria = btn.getAttribute("data-categoria");
                const valor = btn.getAttribute("data-valor");
                const label = btn.getAttribute("data-label");
                const descricao = btn.getAttribute("data-descricao") || label;
                const tipo = btn.getAttribute("data-tipo") || 'positiva';
                const pontos = parseInt(btn.getAttribute("data-pontos"), 10) || (tipo === 'negativa' ? 10 : 20);

                ocorrenciaSelecionada = {
                    identificador: valor,
                    categoria,
                    valor,
                    label,
                    descricao,
                    tipo,
                    pontos,
                    isPersonalizada: false
                };
                renderizar();

                // Foco suave na caixa de salvamento
                const box = container.querySelector("#box-confirmacao-salvar");
                box?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        });

        // 3. Cards de ocorrências personalizadas (seleciona e ativa o botão Salvar)
        container.querySelectorAll(".btn-selecionar-personalizada").forEach(card => {
            card.addEventListener("click", (e) => {
                e.preventDefault();
                const id = card.getAttribute("data-id");
                const item = personalizadas.find(p => String(p.id) === String(id));
                if (!item) return;

                const tipo = (item.tipo || 'negativa').toLowerCase().trim() === 'positiva' ? 'positiva' : 'negativa';
                ocorrenciaSelecionada = {
                    identificador: item.id,
                    categoria: tipo === 'positiva' ? 'elogio' : 'conduta',
                    valor: item.titulo,
                    label: item.titulo,
                    descricao: item.descricao || "",
                    tipo,
                    pontos: item.pontos || (tipo === 'negativa' ? 10 : 20),
                    isPersonalizada: true,
                    item
                };
                renderizar();

                // Foco suave na caixa de salvamento
                const box = container.querySelector("#box-confirmacao-salvar");
                box?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        });

        // 4. Botão Salvar Ocorrência Confirmada (no perfil do aluno)
        const btnSalvar = container.querySelector("#btn-salvar-ocorrencia-confirmada");
        btnSalvar?.addEventListener("click", (e) => {
            e.preventDefault();
            if (!ocorrenciaSelecionada) return;

            const inputObs = container.querySelector("#input-obs-adicional-seletor");
            const obsAdicional = inputObs ? inputObs.value.trim() : "";
            const inputPts = container.querySelector("#input-pontos-confirmacao");
            const ptsFinal = inputPts ? (Math.abs(parseInt(inputPts.value, 10)) || ocorrenciaSelecionada.pontos) : ocorrenciaSelecionada.pontos;

            const dadosParaEnviar = {
                ...ocorrenciaSelecionada,
                pontos: ptsFinal,
                observacaoAdicional: obsAdicional
            };

            onSelecionarOcorrencia(dadosParaEnviar);
        });

        // 5. Botão Desmarcar Ocorrência
        const btnDesmarcar = container.querySelector("#btn-cancelar-selecao-oc");
        btnDesmarcar?.addEventListener("click", (e) => {
            e.preventDefault();
            ocorrenciaSelecionada = null;
            renderizar();
        });

        // 6. Botão de Editar ocorrência personalizada
        container.querySelectorAll(".btn-editar-personalizada").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                const item = personalizadas.find(p => String(p.id) === String(id));
                if (!item) return;

                abrirModalCriarOuEditarOcorrencia(item, () => {
                    renderizar();
                });
            });
        });

        // 7. Botão de Excluir ocorrência personalizada
        container.querySelectorAll(".btn-excluir-personalizada").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                confirmarExclusaoOcorrencia(id, () => {
                    if (ocorrenciaSelecionada && String(ocorrenciaSelecionada.identificador) === String(id)) {
                        ocorrenciaSelecionada = null;
                    }
                    renderizar();
                });
            });
        });
    }

    renderizar();
    return {
        atualizar: renderizar
    };
}
