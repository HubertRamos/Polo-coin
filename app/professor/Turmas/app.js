import Header from "../../../components/Header/index.js"
import CardTurma from "../../../components/CardTurma/index.js"
import { SkeletonCardTurma } from "../../../components/Skeleton/index.js"
import Toast from "../../../components/Toast/index.js"

const root = document.getElementById("root")

async function carregarTurmas() {
    const contentDiv = document.getElementById("dashboard-content")
    if (!contentDiv) return

    // Estado inicial com Skeleton Loading
    contentDiv.innerHTML = SkeletonCardTurma(3)

    const usuario = JSON.parse(sessionStorage.getItem("poloUser") || "{}")
    const professorId = usuario?.id

    if (!professorId) {
        contentDiv.innerHTML = `<div class="alert alert-danger">Sessão expirada. Faça login novamente.</div>`
        Toast.warning("Faça login novamente para ver suas turmas.")
        return
    }

    try {
        const resposta = await fetch(`/professor/turmas?id=${professorId}&_=${Date.now()}`)
        const dados = await resposta.json()

        const turmasVinculadas = dados.vinculadas || []

        if (turmasVinculadas.length === 0) {
            contentDiv.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px;">
                    <div class="empty-state__icon">🏫</div>
                    <h3 style="font-size: 16px; color: var(--text-primary); margin-bottom: 6px;">Nenhuma turma vinculada</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">Você ainda não possui turmas atribuídas pela coordenação.</p>
                </div>
            `
            return
        }

        contentDiv.innerHTML = turmasVinculadas.map(turma => CardTurma({ turma })).join('')

        document.querySelectorAll(".card-turma[data-id]").forEach(card => {
            const navegar = () => {
                const turmaId = card.getAttribute("data-id")
                window.location.href = `/app/professor/Turmas/alunos.html?turmaId=${turmaId}`
            }

            card.addEventListener("click", navegar)
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    navegar()
                }
            })
        })
    } catch (erro) {
        console.error("Erro ao carregar turmas:", erro)
        contentDiv.innerHTML = `<div class="alert alert-danger">Erro ao carregar as turmas do servidor.</div>`
        Toast.error("Não foi possível carregar suas turmas. Verifique sua conexão.")
    }
}

function Render() {
    root.innerHTML = `
        ${Header({ 'Turmas': ['/app/professor/Turmas/index.html'], 'Meu Perfil': ['/app/professor/Perfil/index.html'], 'Sair':['/app/'] })}

        <main class="polocoin-main">
            <div class="polocoin-main__header">
                <div>
                    <h1 class="polocoin-main__title">Minhas Turmas</h1>
                    <p class="polocoin-main__subtitle">Gerencie as turmas vinculadas ao seu professor</p>
                </div>
            </div>

            <div id="dashboard-content" class="card-grid stagger-children"></div>
        </main>
    `

    carregarTurmas()
}

window.addEventListener("DOMContentLoaded", Render)
