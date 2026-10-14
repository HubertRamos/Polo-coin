import Form from '../../../components/Form/index.js'
import DashBoard from '../../../components/DashBoard/index.js'
import Header from '../../../components/Header/index.js'
import { linksHeader } from '../constLinks.js'

const root = document.getElementById('root')

// Estado para controlar se o painel de criar turma está aberto ou fechado
let mostrarPainel = false

const inputsTurma = [
    { label: 'Série', placeholder: 'Ex: 3', type: 'number', id: 'serie-input', required: true, min: '1', step: '1' },
    { label: 'Turma', placeholder: 'Ex: A', type: 'text', id: 'turma-input', required: true, maxlength: '1' },
]

async function carregarTurmas() {
    const contentDiv = document.getElementById('dashboard-content')
    if (!contentDiv) return

    try {
        const resposta = await fetch('/turmas')
        const turmas = await resposta.json()

        if (turmas.length === 0) {
            contentDiv.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state__icon">📚</div>
                    <p class="empty-state__text">Nenhuma turma cadastrada ainda.</p>
                    <p style="color: var(--text-muted); font-size: 13px; margin-top: 8px;">Clique em "+ Adicionar" para criar a primeira turma.</p>
                </div>
            `
            return
        }

        contentDiv.innerHTML = turmas.map(turma => `
            <div class="card" data-id="${turma.id}" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <div style="
                                width: 28px;
                                height: 28px;
                                background: linear-gradient(135deg, var(--color-secondary), #7C3AED);
                                border-radius: 6px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 12px;
                                color: white;
                                font-weight: 700;
                            ">
                                ${turma.serie}
                            </div>
                            <strong style="font-size: 15px; color: var(--text-primary);">Turma ${turma.serie}º${turma.turma}</strong>
                        </div>
                        <small style="color: var(--text-secondary); font-size: 12px;">
                            ${turmas.length} turma${turmas.length > 1 ? 's' : ''} cadastrada${turmas.length > 1 ? 's' : ''}
                            · Clique para gerenciar alunos
                        </small>
                    </div>
                    <span class="card-turma__arrow" style="font-size: 20px; flex-shrink: 0;">➔</span>
                </div>
            </div>
        `).join('')

        // Adiciona evento de clique em cada card de turma
        document.querySelectorAll('.card[data-id]').forEach(card => {
            card.addEventListener('click', () => {
                const turmaId = card.getAttribute('data-id')
                window.location.href = `/app/adm/Turmas/alunos.html?turmaId=${turmaId}`
            })
            // Efeito hover comTransition
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)'
                card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            })
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)'
                card.style.boxShadow = ''
            })
        })

    } catch (erro) {
        console.error('Erro ao carregar turmas:', erro)
        contentDiv.innerHTML = `
            <div class="alert alert-danger" style="grid-column: 1 / -1;">
                <span>❌</span>
                <span>Erro ao carregar as turmas do servidor.</span>
            </div>
        `
    }
}

function Render() {
    root.innerHTML = `
        ${Header(linksHeader)}

        <main class="polocoin-main">
            <!-- Cabeçalho da Página -->
            <div class="polocoin-main__header">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: linear-gradient(135deg, var(--color-secondary), #7C3AED);
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <i class="fa-solid fa-users" style="color: white; font-size: 16px;"></i>
                        </div>
                        <div>
                            <h1 class="polocoin-main__title">Turmas</h1>
                            <p class="polocoin-main__subtitle">Gerencie as turmas e seus alunos</p>
                        </div>
                    </div>
                </div>

                <div class="polocoin-main__actions">
                    <button id="btn-add-item" class="btn btn-primary">
                        <i class="fa-solid fa-plus" style="font-size: 10px;"></i>
                        Adicionar Turma
                    </button>
                </div>
            </div>

            <!-- Conteúdo -->
            <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                <!-- Dashboard Principal -->
                <div style="flex: 2; min-width: 300px; width: 100%;">
                    ${DashBoard('Gerenciamento de Turmas', false, false)}
                </div>

                <!-- Painel de Criação -->
                ${mostrarPainel ? `
                    <div style="flex: 1; min-width: 300px; width: 100%;">
                        <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 8px;">
                            <button id="btn-fechar" class="btn btn-danger" style="padding: 6px 12px; font-size: 13px;">
                                <i class="fa-solid fa-xmark" style="font-size: 11px;"></i>
                                Fechar
                            </button>
                        </div>
                        ${Form('Criar Turma', inputsTurma, [])}
                    </div>
                ` : ''}
            </div>

            <!-- Lista de Turmas -->
            <div id="dashboard-content" class="card-grid stagger-children" style="margin-top: 24px;"></div>
        </main>

        <style>
            /* Animações */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .card-grid {
                animation: fadeIn 0.4s ease;
            }

            /* Hover nos cards de turma */
            .card-turma__arrow {
                transition: transform 0.2s ease;
            }

            /* Botões */
            #btn-add-item:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }

            #btn-fechar:hover {
                background: #dc2626;
            }

            /* Input de turma - apenas uma letra */
            #turma-input {
                text-transform: uppercase;
            }
        </style>
    `

    carregarTurmas()

    // Botão "+ Adicionar" do Dashboard abre o painel
    const btnAdd = document.getElementById('btn-add-item')
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            mostrarPainel = true
            Render()
        })
    }

    // Botão "X" fecha o painel
    const btnFechar = document.getElementById('btn-fechar')
    if (btnFechar) {
        btnFechar.addEventListener('click', () => {
            mostrarPainel = false
            Render()
        })
    }

    // Trava para o input de Turma aceitar apenas 1 caractere e sempre maiúsculo
    const turmaInput = document.getElementById('turma-input')
    if (turmaInput) {
        turmaInput.addEventListener('input', (event) => {
            let valor = event.target.value.toUpperCase()
            if (valor.length > 1) {
                valor = valor.charAt(0)
            }
            event.target.value = valor
        })
    }

    // Submissão do formulário de criação de turma
    const formElement = document.getElementById('meu-form')
    if (formElement) {
        formElement.addEventListener('submit', async (event) => {
            event.preventDefault()
            const serie = document.getElementById('serie-input').value.trim()
            const turma = document.getElementById('turma-input').value.trim()

            try {
                const resposta = await fetch('/turmas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ serie: Number(serie), turma: turma })
                })
                const resultado = await resposta.json()

                if (resposta.ok) {
                    // Mostra feedback visual antes do alert
                    const formContainer = formElement.closest('div')
                    if (formContainer) {
                        const feedback = document.createElement('div')
                        feedback.className = 'alert alert-success'
                        feedback.style.marginTop = '12px'
                        feedback.innerHTML = '✓ Turma criada com sucesso!'
                        formContainer.appendChild(feedback)
                        setTimeout(() => feedback.remove(), 3000)
                    }

                    formElement.reset()
                    mostrarPainel = false
                    Render()
                } else {
                    alert(resultado.error || 'Erro ao criar turma.')
                }
            } catch (erro) {
                alert('Não foi possível conectar ao servidor.')
            }
        })
    }
}

window.addEventListener('DOMContentLoaded', Render)
