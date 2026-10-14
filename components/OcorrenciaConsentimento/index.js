import AlunoAvatar from '../AlunoAvatar/index.js';

/**
 * Componente de consentimento em 2 etapas para ocorrências negativas:
 * 
 * ETAPA 1 (Popup 1):
 * - Mostra ocorrências passo a passo com navegação anterior/próxima e checkbox individual.
 * - Exibe: Data, Descrição, PoloCoins removidos, Professor responsável.
 * 
 * ETAPA 2 (Popup 2 - Novo):
 * - Popup de Ciência e Confirmação consolidado de todas as ocorrências negativas.
 * - Exibe aviso de destaque e leitura recomendada.
 * - Lista todas as ocorrências com Data, Descrição, PoloCoins removidos e Professor responsável.
 * - Checkbox obrigatório: "Declaro que li e estou ciente das ocorrências negativas apresentadas acima."
 * - Botões: [ Voltar ] (retorna para o Popup 1) e [ Confirmar Ciência ] (habilitado após checkbox).
 */

const style = {
    container: `
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #f0f4ff 0%, var(--bg-subtle) 100%);
        padding: 20px;
    `,
    popup: `
        background: white;
        padding: 28px 30px;
        border-radius: 16px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        max-width: 580px;
        width: 100%;
        border: 1px solid var(--border-color);
    `,
    headerCircle: `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        background: #fef2f2;
        border-radius: 50%;
        margin-bottom: 12px;
    `,
    title: `
        color: var(--text-primary);
        margin: 0 0 6px 0;
        font-size: 18px;
    `,
    subtitle: `
        color: var(--text-secondary);
        font-size: 13px;
        margin: 0;
        line-height: 1.4;
    `,
    progressBar: `
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-subtle);
        border-radius: 8px;
        padding: 10px 14px;
        margin-bottom: 18px;
        font-size: 12px;
    `,
    progressLabel: `
        color: var(--text-secondary);
    `,
    progressValue: `
        font-weight: 600;
        color: var(--color-primary);
    `,
    cardContainer: `
        background: var(--bg-subtle);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 8px;
    `,
    cardHeader: `
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
    `,
    studentInfo: `
        display: flex;
        align-items: center;
        gap: 10px;
    `,
    icon: `
        font-size: 24px;
    `,
    studentName: `
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 600;
    `,
    studentMeta: `
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 2px;
    `,
    dateBadge: `
        font-size: 11px;
        color: var(--text-secondary);
        background: white;
        padding: 4px 10px;
        border-radius: 20px;
        white-space: nowrap;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    `,
    badge: `
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 20px;
        padding: 5px 12px;
        margin-bottom: 12px;
    `,
    badgeDot: `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    `,
    badgeText: `
        color: #dc2626;
        font-weight: 600;
        font-size: 13px;
    `,
    observation: `
        background: white;
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 14px;
        border: 1px solid var(--border-color);
    `,
    obsText: `
        color: var(--text-primary);
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
    `,
    details: `
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 16px;
        padding: 0 2px;
    `,
    labelContainer: `
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 12px 16px;
        background: #eff6ff;
        border-radius: 10px;
        border: 2px solid #bfdbfe;
        transition: all 0.2s;
    `,
    labelContainerChecked: `
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        padding: 12px 16px;
        background: #dcfce7;
        border-radius: 10px;
        border: 2px solid #86efac;
        transition: all 0.2s;
    `,
    checkbox: `
        width: 18px;
        height: 18px;
        accent-color: var(--color-primary);
        cursor: pointer;
    `,
    labelText: `
        font-size: 14px;
        color: var(--text-primary);
        font-weight: 500;
    `,
    navigation: `
        display: flex;
        gap: 12px;
        margin-top: 20px;
    `,
    navBtn: `
        flex: 1;
        padding: 14px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    `,
    navPrev: `
        background: white;
        border: 1.5px solid var(--border-color);
        color: var(--text-secondary);
    `,
    navNext: `
        background: var(--color-primary);
        border: none;
        color: white;
    `,
    navFinish: `
        background: var(--color-success);
        border: none;
        color: white;
    `,
    message: `
        text-align: center;
        font-size: 12px;
        min-height: 18px;
        margin-top: 10px;
    `,
    emptyState: `
        text-align: center;
        padding: 40px 20px;
        color: var(--text-muted);
    `
};

/**
 * Retorna o ícone baseado na categoria
 */
function getIcon(categoria) {
    const icons = {
        'comportamento': '🧠',
        'entrega': '📦',
        'comprometimento': '🎯',
        'social': '🤝',
        'Geral': '📋'
    };
    return icons[categoria?.toLowerCase()] || '📌';
}

/**
 * Retorna a cor do badge baseada no valor da ocorrência
 */
function getBadgeColor(valor) {
    const cores = {
        'bagunça':       'var(--color-coin)',
        'desmotivado':   'var(--text-secondary)',
        'não entregou':  'var(--color-danger)',
        'conflituante':  'var(--color-danger)',
        'isolado':       '#a855f7',
        'desinteressado':'var(--text-secondary)',
        'indiferente':   'var(--text-secondary)',
        'atrasado':      '#eab308'
    };
    return cores[valor?.toLowerCase()] || 'var(--color-primary)';
}

/**
 * Formata data e hora
 */
function formatarDataHora(data, hora) {
    if (!data) return 'Data não informada';
    try {
        return new Date(data + (hora ? 'T' + hora : 'T00:00'))
            .toLocaleString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
    } catch {
        return `${data} ${hora || ''}`;
    }
}

/**
 * Formata data simples (DD/MM/YYYY)
 */
function formatarDataSimples(data, hora) {
    if (!data) return 'Data não informada';
    try {
        const d = new Date(data + (hora ? 'T' + hora : 'T00:00'));
        if (isNaN(d.getTime())) return data;
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return data;
    }
}

/**
 * Formata exibição dos PoloCoins removidos
 */
function formatarPontosRemovidos(pontos) {
    if (pontos === null || pontos === undefined) return '0 PoloCoins';
    const num = Number(pontos);
    if (num < 0) return `${num} PoloCoins`;
    if (num > 0) return `-${num} PoloCoins`;
    return '0 PoloCoins';
}

/**
 * POPUP 1: Componente de visualização passo-a-passo
 */
export default function OcorrenciaConsentimento({ ocorrencias, indiceAtual = 0, consentimentos = {} }) {
    if (!ocorrencias || ocorrencias.length === 0) {
        return `
            <div style="${style.container}">
                <div style="${style.popup}">
                    <div style="${style.emptyState}">
                        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                        <h2 style="color: var(--text-primary); font-size: 16px; margin: 0 0 8px 0;">Nenhuma ocorrência</h2>
                        <p style="font-size: 13px;">Parabéns! Seus filhos não têm ocorrências negativas registradas.</p>
                    </div>
                    <div style="margin-top: 20px;">
                        <button id="btn-entrar"
                            style="
                                width: 100%;
                                background: var(--color-success);
                                color: white;
                                border: none;
                                padding: 14px;
                                border-radius: 10px;
                                font-weight: 600;
                                font-size: 14px;
                                cursor: pointer;
                                transition: opacity 0.2s;
                            "
                        >
                            Entrar no sistema
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    const idx = indiceAtual;
    const cons = consentimentos;
    const oc = ocorrencias[idx];
    const total = ocorrencias.length;
    const atual = idx + 1;
    const checkId = `check-${oc.avaliacao_id}`;
    const checked = cons[oc.avaliacao_id] ? 'checked' : '';

    const canPrev = idx > 0;
    const isLast = idx === total - 1;
    const allConsented = ocorrencias.every(o => cons[o.avaliacao_id]);
    const canFinish = isLast && allConsented;

    return `
        <div style="${style.container}" role="dialog" aria-modal="true" aria-labelledby="popup1-title">
            <div style="${style.popup}">
                <!-- Cabeçalho -->
                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="${style.headerCircle}">
                        <span style="font-size: 24px;">📋</span>
                    </div>
                    <h2 id="popup1-title" style="${style.title}">
                        Ocorrência Negativa ${atual} de ${total}
                    </h2>
                    <p style="${style.subtitle}">
                        Leia cuidadosamente e confirme que concorda em receber esta informação.
                    </p>
                </div>

                <!-- Barra de progresso -->
                <div style="${style.progressBar}">
                    <span style="${style.progressLabel}">Progresso</span>
                    <span style="${style.progressValue}">
                        ${atual} / ${total}
                    </span>
                </div>

                <!-- Indicadores de navegação -->
                <div style="display: flex; gap: 6px; margin-bottom: 16px; justify-content: center;">
                    ${ocorrencias.map((_, i) => `
                        <div style="
                            width: 12px;
                            height: 12px;
                            border-radius: 50%;
                            background: ${i === idx ? 'var(--color-primary)' : (i < idx ? 'var(--color-success)' : 'var(--border-color)')};
                            transition: all 0.3s;
                            cursor: ${i < idx ? 'pointer' : 'default'};
                        "
                            onclick="window.navegarOcorrencia(${i})"
                            title="${i < idx ? 'Voltar' : (i === idx ? 'Atual' : 'Pendente')}"
                        ></div>
                    `).join('')}
                </div>

                <!-- Conteúdo da ocorrência -->
                <div style="${style.cardContainer}">
                    <div style="${style.cardHeader}">
                        <div style="${style.studentInfo}">
                            <span style="${style.icon}">${getIcon(oc.categoria)}</span>
                            <div>
                                <div style="${style.studentName}">${AlunoAvatar({ avatar: oc.aluno_avatar, nome: oc.aluno_nome, tamanho: 'mini', formato: 'inline' })}</div>
                                <div style="${style.studentMeta}">
                                    ${oc.serie || '?'}º${oc.turma || '?'} · ${oc.categoria || 'Geral'}
                                </div>
                            </div>
                        </div>
                        <span style="${style.dateBadge}">
                            📅 ${formatarDataHora(oc.data, oc.hora)}
                        </span>
                    </div>

                    <!-- Badge de valor -->
                    <div style="${style.badge}">
                        <span style="${style.badgeDot}" style="background: ${getBadgeColor(oc.valor)}"></span>
                        <span style="${style.badgeText}">${oc.valor || '—'}</span>
                    </div>

                    <!-- Observação / Descrição -->
                    <div style="${style.observation}">
                        <p style="${style.obsText}">"${oc.observacao || oc.valor || 'Sem observação adicional'}"</p>
                    </div>

                    <!-- Detalhes: PoloCoins removidos e Professor responsável -->
                    <div style="${style.details}">
                        <span style="color: #dc2626; font-weight: 600;">
                            🪙 ${formatarPontosRemovidos(oc.pontos)}
                        </span>
                        <span style="color: var(--text-secondary);">
                            Registrada por: <strong>${oc.professor_nome || 'Professor'}</strong>
                        </span>
                    </div>
                </div>

                <!-- Checkbox de consentimento da ocorrência atual -->
                <label id="${checkId}-label"
                    style="${checked ? style.labelContainerChecked : style.labelContainer}"
                >
                    <input type="checkbox"
                        id="${checkId}"
                        data-avaliacao-id="${oc.avaliacao_id}"
                        ${checked}
                        style="${style.checkbox}"
                    >
                    <span style="${style.labelText}">
                        ✓ Li e me responsabilizo, estando ciente desta informação.
                    </span>
                </label>

                <p id="mensagem" style="${style.message}"></p>

                <!-- Navegação -->
                <div style="${style.navigation}">
                    <button id="btn-anterior"
                        ${canPrev ? '' : 'disabled'}
                        style="${style.navBtn} ${style.navPrev} ${canPrev ? '' : 'opacity: 0.5; cursor: not-allowed;'}"
                    >
                        <span style="font-size: 16px;">◀</span>
                        Anterior
                    </button>
                    ${isLast ? `
                        <button id="btn-finalizar"
                            ${canFinish ? '' : 'disabled'}
                            style="${style.navBtn} ${style.navFinish} ${canFinish ? '' : 'opacity: 0.5; cursor: not-allowed;'}"
                        >
                            Confirmar Ocorrências ▶
                        </button>
                    ` : `
                        <button id="btn-proximo"
                            style="${style.navBtn} ${style.navNext}"
                        >
                            Próximo
                            <span style="font-size: 16px;">▶</span>
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

/**
 * POPUP 2: Confirmação de Ciência das Ocorrências
 */
export function PopupConfirmacaoCiencia({ ocorrencias, cienciaConfirmada = false }) {
    const total = ocorrencias.length;

    return `
        <div style="${style.container}" role="dialog" aria-modal="true" aria-labelledby="popup2-title">
            <div style="${style.popup}; max-width: 620px;">
                <!-- Cabeçalho com Alerta Visual -->
                <div style="text-align: center; margin-bottom: 16px;">
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #fef2f2; border: 2px solid #fecaca; border-radius: 50%; margin-bottom: 12px;">
                        <span style="font-size: 26px;">⚠️</span>
                    </div>
                    <h2 id="popup2-title" style="color: #991b1b; margin: 0 0 6px 0; font-size: 20px; font-weight: 700;">
                        Confirmação de Ciência das Ocorrências
                    </h2>
                </div>

                <!-- Texto de Destaque -->
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid var(--color-coin); border-radius: 10px; padding: 14px 16px; margin-bottom: 18px;">
                    <p style="margin: 0 0 6px 0; font-size: 13.5px; font-weight: 600; color: #92400e; line-height: 1.5;">
                        Você está confirmando que tomou conhecimento das ocorrências negativas registradas para este aluno.
                    </p>
                    <p style="margin: 0 0 6px 0; font-size: 13px; color: #b45309; line-height: 1.4;">
                        Recomendamos a leitura cuidadosa de cada ocorrência antes de prosseguir.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #78350f; line-height: 1.4;">
                        Esta confirmação indica apenas que você visualizou as informações apresentadas.
                    </p>
                </div>

                <!-- Subtítulo da lista -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 13px; font-weight: 700; color: var(--text-primary);">
                        📋 Ocorrências a reconhecer (${total})
                    </span>
                    <span style="font-size: 12px; color: var(--text-secondary);">
                        Role para revisar todas
                    </span>
                </div>

                <!-- Listagem Consolidada de Ocorrências Negativas -->
                <div id="lista-ocorrencias-ciencia" style="max-height: 260px; overflow-y: auto; padding-right: 4px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 10px;">
                    ${ocorrencias.map(oc => `
                        <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-left: 4px solid var(--color-danger); border-radius: 8px; padding: 12px 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px;">
                                <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">
                                    📅 ${formatarDataSimples(oc.data, oc.hora)}
                                </span>
                                <span style="font-size: 12px; font-weight: 700; color: #dc2626;">
                                    🪙 ${formatarPontosRemovidos(oc.pontos)}
                                </span>
                            </div>
                            <div style="font-size: 13.5px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                                ${oc.observacao || oc.valor || 'Ocorrência registrada'}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 12px; color: var(--text-secondary); margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border-color);">
                                <span>
                                    Aluno: <strong>${AlunoAvatar({ avatar: oc.aluno_avatar, nome: oc.aluno_nome, tamanho: 'mini', formato: 'inline' })}</strong> ${oc.serie ? `(${oc.serie}º${oc.turma || ''})` : ''}
                                </span>
                                <span>
                                    Registrada por: <strong>${oc.professor_nome || 'Professor'}</strong>
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Confirmação Obrigatória -->
                <label id="label-ciencia-obrigatoria"
                    style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        cursor: pointer;
                        padding: 14px 16px;
                        background: ${cienciaConfirmada ? '#dcfce7' : 'var(--bg-subtle)'};
                        border: 2px solid ${cienciaConfirmada ? '#86efac' : 'var(--border-strong)'};
                        border-radius: 10px;
                        transition: all 0.2s;
                        margin-bottom: 20px;
                    "
                >
                    <input type="checkbox"
                        id="check-ciencia-obrigatoria"
                        ${cienciaConfirmada ? 'checked' : ''}
                        style="width: 20px; height: 20px; accent-color: var(--color-success); cursor: pointer;"
                    >
                    <span style="font-size: 13.5px; font-weight: 600; color: var(--text-primary); user-select: none;">
                        Declaro que li e estou ciente das ocorrências negativas apresentadas acima.
                    </span>
                </label>

                <!-- Botões de Ação -->
                <div style="display: flex; gap: 12px;">
                    <button id="btn-voltar-ciencia"
                        style="
                            flex: 1;
                            padding: 13px;
                            border-radius: 10px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            background: white;
                            border: 1.5px solid var(--border-strong);
                            color: var(--text-secondary);
                            transition: all 0.2s;
                        "
                    >
                        ← Voltar
                    </button>
                    <button id="btn-confirmar-ciencia"
                        ${cienciaConfirmada ? '' : 'disabled'}
                        style="
                            flex: 1.5;
                            padding: 13px;
                            border-radius: 10px;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: ${cienciaConfirmada ? 'pointer' : 'not-allowed'};
                            background: var(--color-success);
                            border: none;
                            color: white;
                            opacity: ${cienciaConfirmada ? '1' : '0.5'};
                            transition: all 0.2s;
                        "
                    >
                        Confirmar Ciência ✓
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Gerencia o fluxo completo de consentimento (Etapa 1: individual -> Etapa 2: confirmação de ciência)
 */
export function gerenciarConsentimento(root, ocorrencias, onFinish) {
    if (!ocorrencias || ocorrencias.length === 0) {
        onFinish();
        return;
    }

    let etapa = 1; // 1 = Popup 1 (navegação passo a passo), 2 = Popup 2 (Ciência e Confirmação)
    let indiceAtual = 0;
    let consentimentos = {};
    let cienciaConfirmada = false;

    function renderizar() {
        if (etapa === 1) {
            renderizarPopup1();
        } else {
            renderizarPopup2();
        }
    }

    function renderizarPopup1() {
        const popupHtml = OcorrenciaConsentimento({ 
            ocorrencias, 
            indiceAtual,
            consentimentos
        });

        root.innerHTML = popupHtml;

        const btnProximo = document.getElementById('btn-proximo');
        const btnAnterior = document.getElementById('btn-anterior');
        const btnFinalizar = document.getElementById('btn-finalizar');
        const mensagem = document.getElementById('mensagem');
        const checkId = `check-${ocorrencias[indiceAtual].avaliacao_id}`;
        const check = document.getElementById(checkId);
        const label = document.getElementById(`${checkId}-label`);

        // Checkbox da ocorrência atual
        if (check) {
            check.addEventListener('change', () => {
                const avaliacao_id = parseInt(check.dataset.avaliacaoId);
                
                if (check.checked) {
                    consentimentos[avaliacao_id] = true;
                    if (label) {
                        label.style.background = '#dcfce7';
                        label.style.borderColor = '#86efac';
                    }
                    if (mensagem) mensagem.textContent = '';
                } else {
                    delete consentimentos[avaliacao_id];
                    if (label) {
                        label.style.background = '#eff6ff';
                        label.style.borderColor = '#bfdbfe';
                    }
                }

                // Re-renderiza para atualizar estado dos botões e da barra
                renderizar();
            });
        }

        // Navegação Próximo
        if (btnProximo) {
            btnProximo.addEventListener('click', () => {
                if (indiceAtual < ocorrencias.length - 1) {
                    indiceAtual++;
                    renderizar();
                }
            });
        }

        // Navegação Anterior
        if (btnAnterior) {
            btnAnterior.addEventListener('click', () => {
                if (indiceAtual > 0) {
                    indiceAtual--;
                    renderizar();
                }
            });
        }

        // Botão Finalizar / Avançar para Popup 2
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => {
                const allConsented = ocorrencias.every(oc => consentimentos[oc.avaliacao_id]);
                if (allConsented) {
                    // Avança para o Popup 2 (Confirmação de Ciência)
                    etapa = 2;
                    renderizar();
                }
            });
        }

        // Navegação por dots
        window.navegarOcorrencia = function(indice) {
            if (indice >= 0 && indice < ocorrencias.length) {
                indiceAtual = indice;
                renderizar();
            }
        };

        // Suporte para fechar em caso de tela sem ocorrências
        const btnEntrar = document.getElementById('btn-entrar');
        if (btnEntrar) {
            btnEntrar.addEventListener('click', () => {
                root.innerHTML = '';
                onFinish();
            });
        }
    }

    function renderizarPopup2() {
        const popupHtml = PopupConfirmacaoCiencia({
            ocorrencias,
            cienciaConfirmada
        });

        root.innerHTML = popupHtml;

        const checkCiencia = document.getElementById('check-ciencia-obrigatoria');
        const labelCiencia = document.getElementById('label-ciencia-obrigatoria');
        const btnConfirmar = document.getElementById('btn-confirmar-ciencia');
        const btnVoltar = document.getElementById('btn-voltar-ciencia');

        // Checkbox de confirmação explícita
        if (checkCiencia) {
            checkCiencia.focus();
            checkCiencia.addEventListener('change', () => {
                cienciaConfirmada = checkCiencia.checked;

                if (cienciaConfirmada) {
                    labelCiencia.style.background = '#dcfce7';
                    labelCiencia.style.borderColor = '#86efac';
                    btnConfirmar.disabled = false;
                    btnConfirmar.style.opacity = '1';
                    btnConfirmar.style.cursor = 'pointer';
                } else {
                    labelCiencia.style.background = 'var(--bg-subtle)';
                    labelCiencia.style.borderColor = 'var(--border-strong)';
                    btnConfirmar.disabled = true;
                    btnConfirmar.style.opacity = '0.5';
                    btnConfirmar.style.cursor = 'not-allowed';
                }
            });
        }

        // Botão Voltar (retorna ao Popup 1)
        if (btnVoltar) {
            btnVoltar.addEventListener('click', () => {
                etapa = 1;
                renderizar();
            });
        }

        // Botão Confirmar Ciência (envia os consentimentos e finaliza)
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', async () => {
                if (!cienciaConfirmada) return;

                btnConfirmar.disabled = true;
                btnConfirmar.textContent = '⏳ Salvando...';

                try {
                    const idsParaConsentir = ocorrencias.map(oc => oc.avaliacao_id);

                    await fetch('/responsavel/consentir-avaliacoes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ avaliacoes_ids: idsParaConsentir })
                    });
                } catch (e) {
                    console.error('Erro ao salvar consentimento:', e);
                }

                root.innerHTML = '';
                onFinish();
            });
        }
    }

    renderizar();
}
