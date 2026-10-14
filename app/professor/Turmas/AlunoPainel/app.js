import Header from "../../../components/Header/index.js"
import AlunoAvatar from "../../../components/AlunoAvatar/index.js"
import { renderSeletorOcorrencias } from "../../../components/OcorrenciasPersonalizadas/index.js"

const root = document.getElementById("root")

const params = new URLSearchParams(window.location.search)
const alunoId = params.get("alunoId")
const turmaId = params.get("turmaId")

const sessionUser = JSON.parse(sessionStorage.getItem("poloUser") || "{}")
const professorId = sessionUser.id || null

const categoriasAvaliacao = [
    {
        nome: "Comportamento",
        opcoes: [
            { valor: "produtivo",      label: "Produtivo",     cor: "var(--color-success)" },
            { valor: "bagunça",        label: "Bagunça",       cor: "var(--color-danger)" },
            { valor: "calmo",          label: "Calmo",         cor: "var(--color-primary)" },
            { valor: "agitado",        label: "Agitado",       cor: "var(--color-coin)" },
            { valor: "participativo",  label: "Participativo",cor: "var(--color-secondary)" },
            { valor: "desmotivado",    label: "Desmotivado",   cor: "#6B7280" },
        ],
    },
    {
        nome: "Comprometimento",
        opcoes: [
            { valor: "comprometido",   label: "Comprometido",  cor: "var(--color-success)" },
            { valor: "desinteressado", label: "Desinteressado",cor: "var(--color-danger)" },
            { valor: "proativo",       label: "Proativo",     cor: "var(--color-primary)" },
            { valor: "indiferente",    label: "Indiferente",  cor: "var(--color-coin)" },
        ],
    },
    {
        nome: "Social",
        opcoes: [
            { valor: "colaborador",    label: "Colaborador",   cor: "var(--color-success)" },
            { valor: "isolado",        label: "Isolado",       cor: "#6B7280" },
            { valor: "líder",          label: "Líder",         cor: "var(--color-secondary)" },
            { valor: "conflituante",   label: "Conflituante", cor: "var(--color-danger)" },
        ],
    },
    {
        nome: "Entrega",
        opcoes: [
            { valor: "no prazo",       label: "No prazo",      cor: "var(--color-success)" },
            { valor: "atrasado",       label: "Atrasado",      cor: "var(--color-coin)" },
            { valor: "não entregou",   label: "Não entregou", cor: "var(--color-danger)" },
            { valor: "antecipou",      label: "Antecipou",     cor: "var(--color-primary)" },
        ],
    },
]

let avaliacoes = []

async function carregarDadosDoAluno() {
    const contentDiv = document.getElementById("painel-conteudo")
    if (!contentDiv || !alunoId) return

    try {
        let turmaEncontrada = null
        let alunoEncontrado = null

        if (turmaId) {
            const turmaResp = await fetch(`/turmas/${turmaId}`)
            if (turmaResp.ok) {
                turmaEncontrada = await turmaResp.json()
            }
        }

        if (!turmaEncontrada) {
            const turmas = await fetch("/turmas").then(r => r.json())
            for (const t of turmas) {
                const alunos = await fetch(`/turmas/${t.id}/alunos`).then(r => r.json())
                const a = alunos.find(al => al.id == alunoId)
                if (a) { alunoEncontrado = a; turmaEncontrada = t; break }
            }
        } else {
            const alunos = await fetch(`/turmas/${turmaId}/alunos`).then(r => r.json())
            alunoEncontrado = alunos.find(a => a.id == alunoId)
        }

        if (!alunoEncontrado) {
            contentDiv.innerHTML = `<div class="alert alert-danger">Aluno não encontrado.</div>`
            return
        }

        avaliacoes = await fetch(`/avaliacoes/${alunoId}`).then(r => r.json())

        contentDiv.innerHTML = `
            <div class="card card--lg">
                <div class="card__header">
                    <h2 class="card__title-lg">Painel do Aluno</h2>
                    ${AlunoAvatar({ aluno: alunoEncontrado, tamanho: 'grande', formato: 'avatar-only' })}
                </div>
                <hr class="card__divider" />
                <div class="card__info-grid">
                    <div class="card__info-item">
                        <span class="card__info-label">Nome</span>
                        <span class="card__info-value">${AlunoAvatar({ aluno: alunoEncontrado, tamanho: 'pequeno', formato: 'inline' })}</span>
                    </div>
                    <div class="card__info-item">
                        <span class="card__info-label">Responsável</span>
                        <span class="card__info-value">${alunoEncontrado.responsavel_nome}</span>
                    </div>
                    <div class="card__info-item">
                        <span class="card__info-label">Turma</span>
                        <span class="card__info-value">${turmaEncontrada ? `${turmaEncontrada.serie}º ${turmaEncontrada.turma}` : "N/A"}</span>
                    </div>
                </div>

                <div class="card__section">
                    <h3 class="card__section-title">
                        <i class="fas fa-history"></i>
                        Registros anteriores
                    </h3>
                    ${avaliacoes.length === 0
                        ? '<p class="card__empty">Nenhuma avaliação ainda.</p>'
                        : avaliacoes.map(av => `
                            <div class="avaliacao-item" style="border-left-color: ${getCorByValor(av.categoria, av.valor)};">
                                <div class="avaliacao-item__header">
                                    <span class="avaliacao-item__categoria">${capitalizar(av.categoria)}</span>
                                    <span class="avaliacao-item__valor">${av.valor}</span>
                                </div>
                                <div style="margin-top:2px;">
                                    <span style="font-size:11px; font-weight:700; color:${(av.tipo === 'negativa' || Number(av.pontos) < 0) ? '#dc2626' : '#16a34a'};">
                                        ${(av.tipo === 'negativa' || Number(av.pontos) < 0) ? '🔴 Ocorrência Negativa' : '🟢 Ocorrência Positiva'}
                                    </span>
                                </div>
                                ${av.professor_nome ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:2px;"><strong>Professor:</strong> ${capitalizar(av.professor_nome)}</div>` : ''}
                                ${av.pontos !== undefined ? `<div style="font-size:12px; font-weight:600; color:${(Number(av.pontos) < 0) ? '#dc2626' : '#16a34a'}; margin-top:2px;">${(Number(av.pontos) > 0 ? '+' : '') + av.pontos} PoloCoins</div>` : ''}
                                ${av.observacao ? `<p class="avaliacao-item__obs">📝 ${av.observacao}</p>` : ""}
                                <small class="avaliacao-item__data">${av.data} ${av.hora}</small>
                            </div>
                        `).join('')}
                </div>

                <div class="card__section">
                    <h3 class="card__section-title">
                        <i class="fas fa-list-check"></i>
                        Opções de Ocorrência
                    </h3>

                    <!-- Seletor com Ocorrências Padrão e Personalizadas (Tipo Automático e Inerente) -->
                    <div id="painel-seletor-ocorrencias"></div>
                </div>

                <div class="card__section card__section--obs">
                    <h3 class="card__section-title">
                        <i class="fas fa-pen"></i>
                        Nova Ocorrência / Observação Manual
                    </h3>
                    <div style="background:var(--bg-subtle); padding:10px 12px; border-radius:6px; border:1px solid var(--border-color); margin-bottom:12px;">
                        <label style="display:block; font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:6px;">
                            Tipo da observação avulsa <span style="color:var(--color-danger);">*</span>
                        </label>
                        <div style="display:flex; gap:16px; align-items:center;">
                            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:13px; font-weight:600; color:#16a34a;">
                                <input type="radio" name="painel-tipo-ocorrencia" value="positiva" checked />
                                🟢 Positiva
                            </label>
                            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:13px; font-weight:600; color:#dc2626;">
                                <input type="radio" name="painel-tipo-ocorrencia" value="negativa" />
                                🔴 Negativa
                            </label>
                        </div>
                    </div>
                    <div class="obs-form">
                        <input id="obs-input" type="text" placeholder="ex: Participação em aula, Atraso, etc."
                            class="form-input" />
                        <div class="obs-form__date-time">
                            <input id="pts-input" type="number" min="0" placeholder="PoloCoins (ex: 10)" class="form-input form-input--sm" />
                            <input id="data-input" type="date" class="form-input form-input--sm" />
                            <input id="hora-input" type="time" class="form-input form-input--sm" />
                        </div>
                        <p id="obs-aviso" class="alert alert-danger alert--sm" style="display: none;">
                            Preencha a observação para registrar.
                        </p>
                        <button id="btn-registrar-obs" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            Registrar ocorrência
                        </button>
                    </div>
                </div>
            </div>
        `

        const seletorContainer = document.getElementById("painel-seletor-ocorrencias")
        if (seletorContainer) {
            renderSeletorOcorrencias(seletorContainer, {
                categoriasPadrao: categoriasAvaliacao,
                tituloSecao: "Escolha uma Ocorrência",
                onSelecionarOcorrencia: async (oc) => {
                    const pid = professorId
                    const tipo = oc.tipo === 'negativa' ? 'negativa' : 'positiva'
                    const pontos = oc.pontos || (tipo === 'negativa' ? 10 : 20)

                    if (!pid) { alert("Professor não logado."); return }

                    try {
                        const res = await fetch("/avaliacoes", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                alunoId,
                                professorId: pid,
                                categoria: oc.categoria || 'Geral',
                                valor: oc.valor || oc.label,
                                pontos: pontos,
                                tipo: tipo,
                                observacao: oc.observacaoAdicional 
                                    ? `${oc.valor || oc.label} — ${oc.observacaoAdicional}`
                                    : (oc.descricao ? `${oc.valor || oc.label} — ${oc.descricao}` : "")
                            }),
                        })
                        const data = await res.json()
                        if (res.ok) {
                            const sinal = tipo === 'negativa' ? '-' : '+'
                            const badge = oc.isPersonalizada ? '⭐ Personalizada' : 'Padrão'
                            const tipoLabel = tipo === 'negativa' ? '🔴 NEGATIVA' : '🟢 POSITIVA'
                            alert(`Registrado como ${tipoLabel} (${sinal}${pontos} PoloCoins) [${badge}]: ${oc.label || oc.valor}`)
                            carregarDadosDoAluno()
                        } else {
                            alert(data.error || "Erro ao registrar.")
                        }
                    } catch (erro) {
                        alert("Não foi possível conectar ao servidor.")
                    }
                }
            })
        }

        document.getElementById("btn-registrar-obs").addEventListener("click", async () => {
            const obs = document.getElementById("obs-input").value.trim()
            const pts = Math.abs(parseInt(document.getElementById("pts-input").value) || 0)
            const tipo = document.querySelector('input[name="painel-tipo-ocorrencia"]:checked')?.value || 'positiva'
            const data = document.getElementById("data-input").value
            const hora = document.getElementById("hora-input").value
            const aviso = document.getElementById("obs-aviso")

            if (!obs) { aviso.style.display = "block"; return }
            aviso.style.display = "none"

            if (!professorId) { alert("Professor não logado."); return }

            try {
                const res = await fetch("/avaliacoes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ alunoId, professorId, categoria: "observacao", valor: obs, pontos: pts, tipo, observacao: `${obs} — ${data} ${hora}` }),
                })
                const dataRes = await res.json()
                if (res.ok) {
                    alert(`Ocorrência registrada como ${tipo.toUpperCase()}!`)
                    document.getElementById("obs-input").value = ""
                    document.getElementById("pts-input").value = ""
                    carregarDadosDoAluno()
                } else {
                    alert(dataRes.error || "Erro ao registrar.")
                }
            } catch (erro) {
                alert("Não foi possível conectar ao servidor.")
            }
        })
    } catch (erro) {
        console.error("Erro:", erro)
        contentDiv.innerHTML = `<div class="alert alert-danger">Erro ao carregar os dados do aluno.</div>`
    }
}

function capitalizar(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

function getCorByValor(cat, val) {
    for (const c of categoriasAvaliacao) {
        const op = c.opcoes.find(o => o.valor === val)
        if (op) return op.cor
    }
    return "var(--color-primary)"
}

function Render() {
    root.innerHTML = `
        ${Header({ 'Turmas': ['/app/professor/Turmas/index.html'] })}

        <div class="back-link">
            <a href="/app/professor/Turmas/alunos.html?turmaId=${turmaId || ""}">
                <i class="fas fa-arrow-left"></i>
                Voltar para Alunos
            </a>
        </div>

        <main class="polocoin-main">
            <div class="polocoin-main__layout" style="justify-content: center;">
                <div class="polocoin-main__section polocoin-main__section--centered" style="flex: 1; min-width: 300px; max-width: 700px;">
                    <div id="painel-conteudo"></div>
                </div>
            </div>
        </main>
    `

    carregarDadosDoAluno()
}

window.addEventListener("DOMContentLoaded", Render)
