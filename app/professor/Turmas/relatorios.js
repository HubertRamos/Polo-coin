/**
 * Módulo de Geração e Impressão de Relatórios de Ocorrências (PDF / Impressão)
 * Permite filtrar e imprimir relatórios individuais de alunos ou consolidados da turma.
 */

function formatarDataBR(dataStr) {
    if (!dataStr) return '—';
    if (typeof dataStr === 'string' && dataStr.includes('-')) {
        const [y, m, d] = dataStr.split('T')[0].split('-');
        if (y && m && d) return `${d}/${m}/${y}`;
    }
    try {
        return new Date(dataStr).toLocaleDateString('pt-BR');
    } catch {
        return dataStr;
    }
}

function formatarPeriodo(inicio, fim) {
    if (inicio && fim) return `De ${formatarDataBR(inicio)} até ${formatarDataBR(fim)}`;
    if (inicio) return `A partir de ${formatarDataBR(inicio)}`;
    if (fim) return `Até ${formatarDataBR(fim)}`;
    return 'Todo o histórico';
}

function capitalizar(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Injeta os estilos de impressão específicos para relatórios no documento
function garantirEstilosImpressao() {
    if (document.getElementById('estilo-impressao-relatorios')) return;

    const style = document.createElement('style');
    style.id = 'estilo-impressao-relatorios';
    style.textContent = `
        /* Estilos em tela para o modal de filtros e preview */
        .relatorio-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.65);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            padding: 16px;
            backdrop-filter: blur(3px);
        }

        .relatorio-modal-card {
            background: #ffffff;
            border-radius: 12px;
            width: 100%;
            max-width: 540px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
        }

        .relatorio-modal-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--bg-subtle);
            border-radius: 12px 12px 0 0;
        }

        .relatorio-modal-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .relatorio-modal-footer {
            padding: 14px 20px;
            border-top: 1px solid var(--border-color);
            background: var(--bg-subtle);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            border-radius: 0 0 12px 12px;
        }

        .filtro-grupo {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .filtro-label {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-primary);
        }

        .filtro-row {
            display: flex;
            gap: 12px;
        }

        .filtro-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border-strong);
            border-radius: 6px;
            font-size: 13px;
            color: var(--text-primary);
            outline: none;
            transition: border-color 0.15s;
        }

        .filtro-input:focus {
            border-color: var(--color-primary);
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
        }

        .filtro-radios {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }

        .filtro-radio-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
            cursor: pointer;
        }

        /* Estilos de impressão profissional (A4 / PDF) */
        @media print {
            body * {
                visibility: hidden !important;
            }

            #print-area,
            #print-area * {
                visibility: visible !important;
            }

            #print-area {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10mm 12mm !important;
                background: #ffffff !important;
                color: var(--text-primary) !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                font-size: 11pt !important;
                line-height: 1.4 !important;
            }

            .relatorio-modal-overlay {
                display: none !important;
            }

            .btn,
            header,
            nav,
            .polocoin-header,
            #modal-overlay {
                display: none !important;
            }

            .relatorio-bloco-aluno,
            .relatorio-item-ocorrencia,
            .relatorio-resumo-card {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }

            .page-break {
                page-break-after: always !important;
                break-after: page !important;
            }
        }

        @page {
            size: A4 portrait;
            margin: 12mm 15mm;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Abre o modal de filtros para impressão do histórico de um aluno.
 */
export function abrirModalFiltroRelatorioAluno({ alunoId, alunoNome, alunoAvatar = '🙂', turmaNome, professorNome }) {
    garantirEstilosImpressao();

    const overlay = document.createElement('div');
    overlay.className = 'relatorio-modal-overlay';
    overlay.id = 'modal-filtro-relatorio-aluno';

    overlay.innerHTML = `
        <div class="relatorio-modal-card">
            <div class="relatorio-modal-header">
                <div>
                    <h3 style="margin:0; font-size:16px; font-weight:700; color:var(--text-primary);">
                        <i class="fas fa-print" style="color:var(--color-primary); margin-right:8px;"></i>Imprimir Histórico do Aluno
                    </h3>
                    <small style="color:var(--text-secondary); font-size:12px;">Aluno: <strong>${alunoAvatar} ${alunoNome}</strong> &middot; Turma: ${turmaNome}</small>
                </div>
                <button id="btn-fechar-filtro-aluno" class="btn btn-secondary btn--sm" style="padding:4px 8px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="relatorio-modal-body">
                <div class="filtro-grupo">
                    <label class="filtro-label">📅 Período das Ocorrências</label>
                    <div class="filtro-row">
                        <div style="flex:1;">
                            <small style="color:var(--text-secondary); display:block; margin-bottom:2px; font-size:11px;">Data Inicial</small>
                            <input type="date" id="filtro-aluno-data-inicio" class="filtro-input" />
                        </div>
                        <div style="flex:1;">
                            <small style="color:var(--text-secondary); display:block; margin-bottom:2px; font-size:11px;">Data Final</small>
                            <input type="date" id="filtro-aluno-data-fim" class="filtro-input" />
                        </div>
                    </div>
                </div>

                <div class="filtro-grupo">
                    <label class="filtro-label">🎯 Tipo de Ocorrência</label>
                    <div class="filtro-radios">
                        <label class="filtro-radio-item">
                            <input type="radio" name="filtro-aluno-tipo" value="todas" checked />
                            Todas
                        </label>
                        <label class="filtro-radio-item" style="color:#16a34a; font-weight:600;">
                            <input type="radio" name="filtro-aluno-tipo" value="positiva" />
                            🟢 Apenas Positivas
                        </label>
                        <label class="filtro-radio-item" style="color:#dc2626; font-weight:600;">
                            <input type="radio" name="filtro-aluno-tipo" value="negativa" />
                            🔴 Apenas Negativas
                        </label>
                    </div>
                </div>

                <div class="filtro-grupo">
                    <label class="filtro-label">↕️ Ordenação</label>
                    <div class="filtro-radios">
                        <label class="filtro-radio-item">
                            <input type="radio" name="filtro-aluno-ordem" value="recentes" checked />
                            Mais recentes primeiro
                        </label>
                        <label class="filtro-radio-item">
                            <input type="radio" name="filtro-aluno-ordem" value="antigas" />
                            Mais antigas primeiro
                        </label>
                    </div>
                </div>

                <div style="background:var(--bg-subtle); padding:10px 12px; border-radius:6px; font-size:12px; color:var(--text-secondary);">
                    <i class="fas fa-info-circle" style="color:var(--color-primary); margin-right:4px;"></i>
                    O relatório incluirá ocorrências registradas por <strong>todos os professores</strong> no período selecionado.
                </div>
            </div>

            <div class="relatorio-modal-footer">
                <button id="btn-cancelar-filtro-aluno" class="btn btn-secondary">
                    Cancelar
                </button>
                <button id="btn-confirmar-filtro-aluno" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px;">
                    <i class="fas fa-file-pdf"></i> Gerar e Imprimir PDF
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const fechar = () => overlay.remove();
    overlay.querySelector('#btn-fechar-filtro-aluno').addEventListener('click', fechar);
    overlay.querySelector('#btn-cancelar-filtro-aluno').addEventListener('click', fechar);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });

    overlay.querySelector('#btn-confirmar-filtro-aluno').addEventListener('click', async () => {
        const dataInicio = overlay.querySelector('#filtro-aluno-data-inicio').value;
        const dataFim = overlay.querySelector('#filtro-aluno-data-fim').value;
        const tipo = overlay.querySelector('input[name="filtro-aluno-tipo"]:checked')?.value || 'todas';
        const ordem = overlay.querySelector('input[name="filtro-aluno-ordem"]:checked')?.value || 'recentes';

        fechar();
        await gerarEImprimirRelatorioAluno({ alunoId, dataInicio, dataFim, tipo, ordem, professorEmissor: professorNome });
    });
}

/**
 * Busca os dados filtrados no backend e renderiza o relatório do aluno para impressão.
 */
export async function gerarEImprimirRelatorioAluno({ alunoId, dataInicio, dataFim, tipo, ordem, professorEmissor }) {
    garantirEstilosImpressao();

    try {
        const params = new URLSearchParams();
        if (dataInicio) params.set('dataInicio', dataInicio);
        if (dataFim) params.set('dataFim', dataFim);
        if (tipo && tipo !== 'todas') params.set('tipo', tipo);
        if (ordem) params.set('ordem', ordem);

        const res = await fetch(`/relatorios/aluno/${alunoId}?${params.toString()}`);
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Erro ao carregar dados do relatório.');
        }

        const dados = await res.json();
        const { aluno, estatisticas, ocorrencias, filtrosAplicados } = dados;

        let printArea = document.getElementById('print-area');
        if (!printArea) {
            printArea = document.createElement('div');
            printArea.id = 'print-area';
            printArea.style.display = 'none';
            document.body.appendChild(printArea);
        }

        const dataEmissao = new Date().toLocaleString('pt-BR');
        const periodoTexto = formatarPeriodo(filtrosAplicados.dataInicio, filtrosAplicados.dataFim);

        printArea.innerHTML = `
            <div style="font-family: inherit; color:var(--text-primary); max-width: 800px; margin: 0 auto;">
                <!-- Cabeçalho Institucional -->
                <div style="border-bottom: 2px solid var(--text-primary); padding-bottom: 12px; margin-bottom: 16px; display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h1 style="margin:0; font-size: 22px; font-weight:800; color:var(--text-primary); letter-spacing: -0.5px;">
                            POLOCOIN &bull; RELATÓRIO INDIVIDUAL DE OCORRÊNCIAS
                        </h1>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color:var(--text-secondary);">
                            Sistema Escolar de Recompensas e Ocorrências
                        </p>
                    </div>
                    <div style="text-align: right; font-size: 11px; color:var(--text-secondary);">
                        <div><strong>Emissão:</strong> ${dataEmissao}</div>
                        <div><strong>Emissor:</strong> ${professorEmissor || 'Professor Autorizado'}</div>
                    </div>
                </div>

                <!-- Dados do Aluno -->
                <div style="background:var(--bg-subtle); border: 1px solid var(--border-strong); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
                    <div style="display:flex; flex-wrap:wrap; gap: 16px; justify-content: space-between;">
                        <div>
                            <span style="font-size: 11px; text-transform: uppercase; color:var(--text-secondary); font-weight:700; display:block;">Aluno</span>
                            <span style="font-size: 15px; font-weight: 700; color:var(--text-primary);">${aluno.avatar || '🙂'} ${aluno.nome}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; text-transform: uppercase; color:var(--text-secondary); font-weight:700; display:block;">Turma</span>
                            <span style="font-size: 14px; font-weight: 600; color:var(--text-primary);">${aluno.turma_nome}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; text-transform: uppercase; color:var(--text-secondary); font-weight:700; display:block;">Período Filtrado</span>
                            <span style="font-size: 13px; font-weight: 600; color:var(--text-primary);">${periodoTexto}</span>
                        </div>
                        <div>
                            <span style="font-size: 11px; text-transform: uppercase; color:var(--text-secondary); font-weight:700; display:block;">Filtro de Tipo</span>
                            <span style="font-size: 13px; font-weight: 600; color:var(--text-primary);">${capitalizar(filtrosAplicados.tipo)}</span>
                        </div>
                    </div>
                </div>

                <!-- Lista de Ocorrências -->
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 15px; font-weight: 700; color:var(--text-primary); margin-bottom: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px;">
                        Lista de Ocorrências (${ocorrencias.length})
                    </h2>

                    ${ocorrencias.length === 0 ? `
                        <div style="padding: 20px; text-align:center; color:var(--text-secondary); background:var(--bg-subtle); border-radius:6px; border:1px dashed var(--border-strong);">
                            Nenhuma ocorrência encontrada para os filtros selecionados.
                        </div>
                    ` : `
                        <table style="width:100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">
                            <thead>
                                <tr style="background:var(--bg-subtle); border-bottom: 2px solid var(--border-strong); text-align:left;">
                                    <th style="padding: 8px 10px; width: 15%;">Data / Hora</th>
                                    <th style="padding: 8px 10px; width: 14%;">Tipo</th>
                                    <th style="padding: 8px 10px; width: 16%;">PoloCoins</th>
                                    <th style="padding: 8px 10px; width: 32%;">Descrição / Motivo</th>
                                    <th style="padding: 8px 10px; width: 23%;">Professor Responsável</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ocorrencias.map((oc, idx) => {
                                    const isNeg = oc.tipo === 'negativa' || oc.pontos < 0;
                                    const pontosFormatados = (Number(oc.pontos) > 0 ? `+${oc.pontos}` : `${oc.pontos}`) + ' PoloCoins';
                                    return `
                                        <tr class="relatorio-item-ocorrencia" style="border-bottom: 1px solid var(--border-color); background: ${idx % 2 === 0 ? '#ffffff' : '#fcfcfc'};">
                                            <td style="padding: 8px 10px; vertical-align: top;">
                                                <strong>${formatarDataBR(oc.data)}</strong>
                                                ${oc.hora ? `<br/><small style="color:var(--text-secondary);">${oc.hora}</small>` : ''}
                                            </td>
                                            <td style="padding: 8px 10px; vertical-align: top;">
                                                <span style="display:inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight:700; background: ${isNeg ? '#fee2e2' : '#dcfce7'}; color: ${isNeg ? '#dc2626' : '#16a34a'};">
                                                    ${isNeg ? '🔴 Negativa' : '🟢 Positiva'}
                                                </span>
                                            </td>
                                            <td style="padding: 8px 10px; vertical-align: top; font-weight:700; color: ${isNeg ? '#dc2626' : '#16a34a'};">
                                                ${pontosFormatados}
                                            </td>
                                            <td style="padding: 8px 10px; vertical-align: top;">
                                                <div style="font-weight:600; color:var(--text-primary);">
                                                    ${oc.categoria && oc.categoria !== 'observacao' ? `<strong>${capitalizar(oc.categoria)}:</strong> ` : ''}${oc.valor || ''}
                                                </div>
                                                ${oc.observacao && oc.observacao !== oc.valor ? `<div style="font-size: 11px; color:var(--text-secondary); margin-top:2px;">📝 ${oc.observacao}</div>` : ''}
                                            </td>
                                            <td style="padding: 8px 10px; vertical-align: top; color:var(--text-primary);">
                                                ${capitalizar(oc.professor_nome)}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    `}
                </div>

                <!-- Resumo Estatístico -->
                <div class="relatorio-resumo-card" style="background:var(--bg-subtle); border: 1px solid var(--border-strong); border-radius: 8px; padding: 14px 18px; margin-top: 16px;">
                    <h3 style="margin:0 0 10px 0; font-size: 14px; font-weight: 700; color:var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
                        📊 Resumo Estatístico do Período
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:#16a34a; font-weight:700; display:block;">Ocorrências Positivas</span>
                            <span style="font-size: 18px; font-weight:800; color:#16a34a;">${estatisticas.totalPositivas}</span>
                        </div>
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:#dc2626; font-weight:700; display:block;">Ocorrências Negativas</span>
                            <span style="font-size: 18px; font-weight:800; color:#dc2626;">${estatisticas.totalNegativas}</span>
                        </div>
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:#16a34a; font-weight:700; display:block;">PoloCoins Ganhos</span>
                            <span style="font-size: 18px; font-weight:800; color:#16a34a;">+${estatisticas.polocoinsGanhos}</span>
                        </div>
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:#dc2626; font-weight:700; display:block;">PoloCoins Retirados</span>
                            <span style="font-size: 18px; font-weight:800; color:#dc2626;">-${estatisticas.polocoinsRetirados}</span>
                        </div>
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:var(--text-primary); font-weight:700; display:block;">Saldo Líquido</span>
                            <span style="font-size: 18px; font-weight:800; color:${estatisticas.saldoLiquido >= 0 ? '#16a34a' : '#dc2626'};">
                                ${estatisticas.saldoLiquido > 0 ? `+${estatisticas.saldoLiquido}` : estatisticas.saldoLiquido}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Rodapé -->
                <div style="margin-top: 24px; padding-top: 8px; border-top: 1px solid var(--border-strong); font-size: 10px; color:var(--text-muted); text-align: center;">
                    PoloCoin &bull; Relatório emitido para fins pedagógicos &bull; Registro oficial escolar
                </div>
            </div>
        `;

        // Dispara a impressão / salvamento em PDF
        setTimeout(() => {
            window.print();
        }, 150);

    } catch (err) {
        console.error('Erro ao gerar relatório do aluno:', err);
        alert(`Não foi possível gerar o relatório: ${err.message}`);
    }
}

/**
 * Abre o modal de filtros para impressão do relatório de uma turma.
 */
export function abrirModalFiltroRelatorioTurma({ turmaId, turmaNome, alunos = [], professorNome }) {
    garantirEstilosImpressao();

    const overlay = document.createElement('div');
    overlay.className = 'relatorio-modal-overlay';
    overlay.id = 'modal-filtro-relatorio-turma';

    overlay.innerHTML = `
        <div class="relatorio-modal-card">
            <div class="relatorio-modal-header">
                <div>
                    <h3 style="margin:0; font-size:16px; font-weight:700; color:var(--text-primary);">
                        <i class="fas fa-print" style="color:var(--color-primary); margin-right:8px;"></i>Relatório da Turma
                    </h3>
                    <small style="color:var(--text-secondary); font-size:12px;">Turma: <strong>${turmaNome}</strong> &middot; Total de alunos: ${alunos.length}</small>
                </div>
                <button id="btn-fechar-filtro-turma" class="btn btn-secondary btn--sm" style="padding:4px 8px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="relatorio-modal-body">
                <div class="filtro-grupo">
                    <label class="filtro-label">📅 Período</label>
                    <div class="filtro-row">
                        <div style="flex:1;">
                            <small style="color:var(--text-secondary); display:block; margin-bottom:2px; font-size:11px;">Data Inicial</small>
                            <input type="date" id="filtro-turma-data-inicio" class="filtro-input" />
                        </div>
                        <div style="flex:1;">
                            <small style="color:var(--text-secondary); display:block; margin-bottom:2px; font-size:11px;">Data Final</small>
                            <input type="date" id="filtro-turma-data-fim" class="filtro-input" />
                        </div>
                    </div>
                </div>

                <div class="filtro-grupo">
                    <label class="filtro-label">🎯 Tipo de Ocorrência</label>
                    <div class="filtro-radios">
                        <label class="filtro-radio-item">
                            <input type="radio" name="filtro-turma-tipo" value="todas" checked />
                            Todas
                        </label>
                        <label class="filtro-radio-item" style="color:#16a34a; font-weight:600;">
                            <input type="radio" name="filtro-turma-tipo" value="positiva" />
                            🟢 Positivas
                        </label>
                        <label class="filtro-radio-item" style="color:#dc2626; font-weight:600;">
                            <input type="radio" name="filtro-turma-tipo" value="negativa" />
                            🔴 Negativas
                        </label>
                    </div>
                </div>

                <div class="filtro-grupo">
                    <label class="filtro-label">👥 Alunos</label>
                    <div class="filtro-radios" style="margin-bottom:8px;">
                        <label class="filtro-radio-item">
                            <input type="radio" name="filtro-turma-modo-aluno" value="todos" checked />
                            Todos os alunos
                        </label>
                        <label class="filtro-radio-item">
                            <input type="radio" name="filtro-turma-modo-aluno" value="especifico" />
                            Selecionar aluno específico
                        </label>
                    </div>
                    <select id="filtro-turma-aluno-select" class="filtro-input" style="display:none;">
                        <option value="">Selecione um aluno...</option>
                        ${alunos.map(a => `<option value="${a.id}">${a.avatar || '🙂'} ${a.aluno_nome || a.nome}</option>`).join('')}
                    </select>
                </div>

                <div class="filtro-grupo">
                    <label class="filtro-label">↕️ Ordenação das Ocorrências</label>
                    <div class="filtro-radios">
                        <label class="filtro-radio-item">
                            <input type="radio" name="filtro-turma-ordem" value="recentes" checked />
                            Mais recentes primeiro
                        </label>
                        <label class="filtro-radio-item">
                            <input type="radio" name="filtro-turma-ordem" value="antigas" />
                            Mais antigas primeiro
                        </label>
                    </div>
                </div>

                <div style="background:var(--bg-subtle); padding:10px 12px; border-radius:6px; font-size:12px; color:var(--text-secondary);">
                    <i class="fas fa-info-circle" style="color:var(--color-primary); margin-right:4px;"></i>
                    O relatório consolidado da turma agrupa ocorrências por aluno e inclui dados registrados por <strong>todos os professores</strong>.
                </div>
            </div>

            <div class="relatorio-modal-footer">
                <button id="btn-cancelar-filtro-turma" class="btn btn-secondary">
                    Cancelar
                </button>
                <button id="btn-confirmar-filtro-turma" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px;">
                    <i class="fas fa-file-pdf"></i> Gerar e Imprimir PDF
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const fechar = () => overlay.remove();
    overlay.querySelector('#btn-fechar-filtro-turma').addEventListener('click', fechar);
    overlay.querySelector('#btn-cancelar-filtro-turma').addEventListener('click', fechar);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });

    // Alternar visibilidade do select de aluno
    const radiosModoAluno = overlay.querySelectorAll('input[name="filtro-turma-modo-aluno"]');
    const selectAluno = overlay.querySelector('#filtro-turma-aluno-select');
    radiosModoAluno.forEach(r => {
        r.addEventListener('change', () => {
            selectAluno.style.display = r.value === 'especifico' ? 'block' : 'none';
        });
    });

    overlay.querySelector('#btn-confirmar-filtro-turma').addEventListener('click', async () => {
        const dataInicio = overlay.querySelector('#filtro-turma-data-inicio').value;
        const dataFim = overlay.querySelector('#filtro-turma-data-fim').value;
        const tipo = overlay.querySelector('input[name="filtro-turma-tipo"]:checked')?.value || 'todas';
        const modoAluno = overlay.querySelector('input[name="filtro-turma-modo-aluno"]:checked')?.value || 'todos';
        const alunoId = modoAluno === 'especifico' ? selectAluno.value : null;
        const ordem = overlay.querySelector('input[name="filtro-turma-ordem"]:checked')?.value || 'recentes';

        if (modoAluno === 'especifico' && !alunoId) {
            alert('Por favor, selecione um aluno na lista.');
            return;
        }

        fechar();
        await gerarEImprimirRelatorioTurma({ turmaId, alunoId, dataInicio, dataFim, tipo, ordem, professorEmissor: professorNome });
    });
}

/**
 * Busca os dados filtrados da turma no backend e renderiza o relatório agrupado por aluno para impressão.
 */
export async function gerarEImprimirRelatorioTurma({ turmaId, alunoId, dataInicio, dataFim, tipo, ordem, professorEmissor }) {
    garantirEstilosImpressao();

    try {
        const params = new URLSearchParams();
        if (alunoId) params.set('alunoId', alunoId);
        if (dataInicio) params.set('dataInicio', dataInicio);
        if (dataFim) params.set('dataFim', dataFim);
        if (tipo && tipo !== 'todas') params.set('tipo', tipo);
        if (ordem) params.set('ordem', ordem);

        const res = await fetch(`/relatorios/turma/${turmaId}?${params.toString()}`);
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Erro ao carregar dados do relatório da turma.');
        }

        const dados = await res.json();
        const { turma, filtrosAplicados, alunos, resumoGeral } = dados;

        let printArea = document.getElementById('print-area');
        if (!printArea) {
            printArea = document.createElement('div');
            printArea.id = 'print-area';
            printArea.style.display = 'none';
            document.body.appendChild(printArea);
        }

        const dataEmissao = new Date().toLocaleString('pt-BR');
        const periodoTexto = formatarPeriodo(filtrosAplicados.dataInicio, filtrosAplicados.dataFim);

        printArea.innerHTML = `
            <div style="font-family: inherit; color:var(--text-primary); max-width: 820px; margin: 0 auto;">
                <!-- Cabeçalho Institucional -->
                <div style="border-bottom: 2px solid var(--text-primary); padding-bottom: 12px; margin-bottom: 16px; display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h1 style="margin:0; font-size: 21px; font-weight:800; color:var(--text-primary); letter-spacing: -0.5px;">
                            POLOCOIN &bull; RELATÓRIO DE OCORRÊNCIAS DA TURMA
                        </h1>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color:var(--text-secondary);">
                            Turma: <strong>${turma.turma_nome}</strong> &middot; PoloCoin Educação
                        </p>
                    </div>
                    <div style="text-align: right; font-size: 11px; color:var(--text-secondary);">
                        <div><strong>Data de Emissão:</strong> ${dataEmissao}</div>
                        <div><strong>Professor Emissor:</strong> ${professorEmissor || 'Professor Autorizado'}</div>
                    </div>
                </div>

                <!-- Barra de Metadados e Filtros -->
                <div style="background:var(--bg-subtle); border: 1px solid var(--border-strong); border-radius: 8px; padding: 10px 16px; margin-bottom: 20px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; font-size: 12px;">
                    <div><strong>Turma:</strong> ${turma.turma_nome}</div>
                    <div><strong>Período Selecionado:</strong> ${periodoTexto}</div>
                    <div><strong>Tipo:</strong> ${capitalizar(filtrosAplicados.tipo)}</div>
                    <div><strong>Total de Alunos:</strong> ${alunos.length}</div>
                </div>

                <!-- Corpo do Relatório: Agrupado por Aluno -->
                <div style="margin-bottom: 24px;">
                    ${alunos.length === 0 ? `
                        <div style="padding: 24px; text-align:center; color:var(--text-secondary); background:var(--bg-subtle); border-radius:8px; border:1px dashed var(--border-strong);">
                            Nenhum aluno ou ocorrência encontrada para os filtros selecionados.
                        </div>
                    ` : alunos.map(al => {
                        return `
                            <div class="relatorio-bloco-aluno" style="border: 1px solid var(--border-strong); border-radius: 8px; padding: 14px; margin-bottom: 18px; background: #ffffff;">
                                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 10px;">
                                    <h2 style="margin:0; font-size: 15px; font-weight:800; color:var(--text-primary);">
                                        ALUNO: ${al.aluno_avatar || '🙂'} ${al.aluno_nome}
                                    </h2>
                                    <span style="font-size: 12px; color:var(--text-secondary); font-weight:600;">
                                        ${al.ocorrencias.length} ocorrência(s)
                                    </span>
                                </div>

                                ${al.ocorrencias.length === 0 ? `
                                    <p style="font-size: 12px; color:var(--text-muted); margin: 8px 0; font-style:italic;">
                                        Nenhuma ocorrência registrada no período selecionado.
                                    </p>
                                ` : `
                                    <table style="width:100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px;">
                                        <thead>
                                            <tr style="background:var(--bg-subtle); border-bottom: 1px solid var(--border-strong); text-align:left; color:var(--text-secondary);">
                                                <th style="padding: 6px 8px; width: 16%;">Data / Hora</th>
                                                <th style="padding: 6px 8px; width: 14%;">Tipo</th>
                                                <th style="padding: 6px 8px; width: 14%;">PoloCoins</th>
                                                <th style="padding: 6px 8px; width: 34%;">Descrição / Motivo</th>
                                                <th style="padding: 6px 8px; width: 22%;">Professor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${al.ocorrencias.map(oc => {
                                                const isNeg = oc.tipo === 'negativa' || oc.pontos < 0;
                                                const ptsFmt = (Number(oc.pontos) > 0 ? `+${oc.pontos}` : `${oc.pontos}`) + ' PoloCoins';
                                                return `
                                                    <tr style="border-bottom: 1px solid var(--bg-subtle);">
                                                        <td style="padding: 6px 8px; vertical-align: top;">
                                                            <strong>${formatarDataBR(oc.data)}</strong> ${oc.hora || ''}
                                                        </td>
                                                        <td style="padding: 6px 8px; vertical-align: top;">
                                                            <span style="display:inline-block; padding: 1px 6px; border-radius: 9999px; font-size: 10px; font-weight:700; background: ${isNeg ? '#fee2e2' : '#dcfce7'}; color: ${isNeg ? '#dc2626' : '#16a34a'};">
                                                                ${isNeg ? '🔴 Negativa' : '🟢 Positiva'}
                                                            </span>
                                                        </td>
                                                        <td style="padding: 6px 8px; vertical-align: top; font-weight:700; color: ${isNeg ? '#dc2626' : '#16a34a'};">
                                                            ${ptsFmt}
                                                        </td>
                                                        <td style="padding: 6px 8px; vertical-align: top;">
                                                            <div style="font-weight:600; color:var(--text-primary);">
                                                                ${oc.categoria && oc.categoria !== 'observacao' ? `<strong>${capitalizar(oc.categoria)}:</strong> ` : ''}${oc.valor || ''}
                                                            </div>
                                                            ${oc.observacao && oc.observacao !== oc.valor ? `<div style="font-size: 10px; color:var(--text-secondary);">📝 ${oc.observacao}</div>` : ''}
                                                        </td>
                                                        <td style="padding: 6px 8px; vertical-align: top; color:var(--text-primary);">
                                                            ${capitalizar(oc.professor_nome)}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                `}

                                <!-- Resumo do Aluno -->
                                <div style="background:var(--bg-subtle); border-radius:6px; padding: 6px 12px; display:flex; justify-content:flex-end; gap: 16px; font-size: 12px;">
                                    <span><strong>Positivas:</strong> <span style="color:#16a34a; font-weight:700;">${al.resumo.totalPositivas}</span></span>
                                    <span><strong>Negativas:</strong> <span style="color:#dc2626; font-weight:700;">${al.resumo.totalNegativas}</span></span>
                                    <span><strong>Saldo do Período:</strong> <span style="font-weight:800; color:${al.resumo.saldoLiquido >= 0 ? '#16a34a' : '#dc2626'};">${al.resumo.saldoLiquido > 0 ? `+${al.resumo.saldoLiquido}` : al.resumo.saldoLiquido}</span></span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Resumo Geral da Turma -->
                <div class="relatorio-resumo-card" style="background:var(--bg-subtle); border: 2px solid var(--border-strong); border-radius: 8px; padding: 16px 20px; margin-top: 20px;">
                    <h3 style="margin:0 0 12px 0; font-size: 15px; font-weight: 800; color:var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 6px;">
                        🏛️ RESUMO GERAL DA TURMA
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:var(--text-secondary); font-weight:700; display:block;">Total de Alunos</span>
                            <span style="font-size: 18px; font-weight:800; color:var(--text-primary);">${resumoGeral.totalAlunos}</span>
                        </div>
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:#16a34a; font-weight:700; display:block;">Ocorrências Positivas</span>
                            <span style="font-size: 18px; font-weight:800; color:#16a34a;">${resumoGeral.totalPositivas}</span>
                        </div>
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:#dc2626; font-weight:700; display:block;">Ocorrências Negativas</span>
                            <span style="font-size: 18px; font-weight:800; color:#dc2626;">${resumoGeral.totalNegativas}</span>
                        </div>
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:#16a34a; font-weight:700; display:block;">PoloCoins Concedidos</span>
                            <span style="font-size: 18px; font-weight:800; color:#16a34a;">+${resumoGeral.polocoinsConcedidos}</span>
                        </div>
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:#dc2626; font-weight:700; display:block;">PoloCoins Retirados</span>
                            <span style="font-size: 18px; font-weight:800; color:#dc2626;">-${resumoGeral.polocoinsRetirados}</span>
                        </div>
                        <div style="background:#ffffff; border: 1px solid var(--border-color); border-radius:6px; padding: 8px 12px;">
                            <span style="font-size: 11px; color:var(--text-primary); font-weight:700; display:block;">Saldo Líquido da Turma</span>
                            <span style="font-size: 18px; font-weight:800; color:${resumoGeral.saldoLiquido >= 0 ? '#16a34a' : '#dc2626'};">
                                ${resumoGeral.saldoLiquido > 0 ? `+${resumoGeral.saldoLiquido}` : resumoGeral.saldoLiquido}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Rodapé -->
                <div style="margin-top: 24px; padding-top: 8px; border-top: 1px solid var(--border-strong); font-size: 10px; color:var(--text-muted); text-align: center;">
                    PoloCoin &bull; Relatório emitido para fins pedagógicos &bull; Registro oficial escolar
                </div>
            </div>
        `;

        // Dispara a impressão / salvamento em PDF
        setTimeout(() => {
            window.print();
        }, 150);

    } catch (err) {
        console.error('Erro ao gerar relatório da turma:', err);
        alert(`Não foi possível gerar o relatório da turma: ${err.message}`);
    }
}
