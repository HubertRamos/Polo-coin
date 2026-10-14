import Form from '../../../components/Form/index.js'
import DashBoard from '../../../components/DashBoard/index.js'
import UploadFile from '../../../components/UploadFile/index.js'
import Header from '../../../components/Header/index.js'
import { linksHeader } from '../constLinks.js'

const root = document.getElementById('root')

// Estado para controlar se o painel de cadastro/upload está aberto ou fechado e se está em modo de edição
let mostrarPainel = false
let professorEmEdicao = null

async function carregarDashboard() {
    const contentDiv = document.getElementById('dashboard-content')
    if (!contentDiv) return

    try {
        const resposta = await fetch('/professores')
        const professores = await resposta.json()

        if (professores.length === 0) {
            contentDiv.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state__icon">👨‍🏫</div>
                    <p class="empty-state__text">Nenhum professor cadastrado ainda.</p>
                    <p style="color: var(--text-muted); font-size: 13px; margin-top: 8px;">Clique em "+ Adicionar Professor" para criar o primeiro.</p>
                </div>
            `
            return
        }

        contentDiv.innerHTML = professores.map(prof => `
            <div class="card" style="padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: linear-gradient(135deg, var(--color-coin), var(--color-coin-dark));
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        flex-shrink: 0;
                    ">
                        👨
                    </div>
                    <div style="min-width: 0;">
                        <strong style="font-size: 14px; color: var(--text-primary); display: block;">
                            ${prof.name}
                        </strong>
                        <small style="color: var(--text-secondary); font-size: 12px;">
                            Professor ID: ${prof.id}
                        </small>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <span class="badge badge-neutral" style="font-size: 11px;">ID: ${prof.id}</span>
                    <button class="btn btn-secondary btn-editar-prof" data-id="${prof.id}" data-name="${(prof.name || '').replace(/"/g, '&quot;')}" style="padding: 5px 12px; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                        <i class="fa-solid fa-pen-to-square"></i> Editar
                    </button>
                </div>
            </div>
        `).join('')

        // Adiciona listeners nos botões de edição de cada professor
        contentDiv.querySelectorAll('.btn-editar-prof').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id')
                const name = btn.getAttribute('data-name')
                professorEmEdicao = { id, name }
                mostrarPainel = true
                Render()
                // Rola suavemente até o formulário
                const formDiv = document.getElementById('meu-form')
                if (formDiv) formDiv.scrollIntoView({ behavior: 'smooth' })
            })
        })

    } catch (erro) {
        console.error('Erro ao carregar dashboard:', erro)
        contentDiv.innerHTML = `
            <div class="alert alert-danger" style="grid-column: 1 / -1;">
                <span>❌</span>
                <span>Erro ao carregar os dados do servidor.</span>
            </div>
        `
    }
}

function Render() {
    const isEdicao = Boolean(professorEmEdicao && professorEmEdicao.id)

    const inputsAtuais = isEdicao ? [
        { label: 'Nome', placeholder: 'Nome do professor', type: 'text', id: 'name-input', required: true, value: professorEmEdicao.name || '' },
        { label: 'Senha', placeholder: 'Nova senha (deixe em branco para manter a atual)', type: 'password', id: 'password-input', required: false, value: '' },
    ] : [
        { label: 'Nome', placeholder: 'Nome do professor', type: 'text', id: 'name-input', required: true, value: '' },
        { label: 'Senha', placeholder: 'Senha de acesso', type: 'password', id: 'password-input', required: true, value: '' },
    ]

    const tituloFormulario = isEdicao ? 'Editar Professor' : 'Cadastrar Professor'
    const textoBotao = isEdicao ? 'Salvar Alterações' : 'Cadastrar Professor'

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
                            background: linear-gradient(135deg, var(--color-coin), var(--color-coin-dark));
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <i class="fa-solid fa-chalkboard-user" style="color: white; font-size: 16px;"></i>
                        </div>
                        <div>
                            <h1 class="polocoin-main__title">Professores</h1>
                            <p class="polocoin-main__subtitle">Gerencie os professores da escola</p>
                        </div>
                    </div>
                </div>

                <div class="polocoin-main__actions">
                    <button id="btn-add-item" class="btn btn-primary">
                        <i class="fa-solid fa-plus" style="font-size: 10px;"></i>
                        Adicionar Professor
                    </button>
                </div>
            </div>

            <!-- Conteúdo -->
            <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                <!-- Dashboard Principal -->
                <div style="flex: 2; min-width: 300px; width: 100%;">
                    ${DashBoard('Tabela de Professores', false, false)}
                </div>

                <!-- Painel de Cadastro/Edição e Upload -->
                ${mostrarPainel ? `
                    <div style="flex: 1; min-width: 300px; width: 100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            ${isEdicao ? `
                                <span class="badge badge-info" style="font-size: 12px; padding: 4px 8px;">
                                    <i class="fa-solid fa-pen" style="font-size: 10px; margin-right: 4px;"></i>
                                    Editando ID: ${professorEmEdicao.id}
                                </span>
                            ` : `<span></span>`}
                            <button id="btn-fechar" class="btn btn-danger" style="padding: 6px 12px; font-size: 13px;">
                                <i class="fa-solid fa-xmark" style="font-size: 11px;"></i>
                                Fechar
                            </button>
                        </div>
                        ${Form(tituloFormulario, inputsAtuais, [], textoBotao)}
                        ${!isEdicao ? UploadFile() : ''}
                    </div>
                ` : ''}
            </div>

            <!-- Lista de Professores -->
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

            /* Botões */
            #btn-add-item:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
            }

            #btn-fechar:hover {
                background: #dc2626;
            }

            /* Input de senha */
            #password-input {
                letter-spacing: 2px;
            }
        </style>
    `

    carregarDashboard()

    // Botão "+ Adicionar" do Dashboard abre o painel no modo cadastro
    const btnAdd = document.getElementById('btn-add-item')
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            professorEmEdicao = null
            mostrarPainel = true
            Render()
        })
    }

    // Botão "X" fecha o painel e reseta o modo de edição
    const btnFechar = document.getElementById('btn-fechar')
    if (btnFechar) {
        btnFechar.addEventListener('click', () => {
            professorEmEdicao = null
            mostrarPainel = false
            Render()
        })
    }

    // Lógica do Formulário Comum
    const formElement = document.getElementById('meu-form')
    if (formElement) {
        formElement.addEventListener('submit', async (event) => {
            event.preventDefault()
            const name = document.getElementById('name-input').value.trim()
            const password = document.getElementById('password-input').value.trim()

            enviarParaBackend(name, password, formElement)
        })
    }

    // Lógica de Leitura da Planilha (CSV)
    const fileInput = document.getElementById('csv-file')
    if (fileInput) {
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0]
            if (!file) return

            const reader = new FileReader()
            reader.onload = async function(e) {
                const conteudo = e.target.result
                const linhas = conteudo.split('\n')

                let cadastrados = 0
                let ignorados = 0

                for (let linha of linhas) {
                    if (!linha.trim()) continue

                    const colunas = linha.split(',')
                    if (colunas.length >= 2) {
                        const name = colunas[0].trim()
                        const password = colunas[1].trim()

                        try {
                            const resposta = await fetch('/cadastrar', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name, password })
                            })
                            if (resposta.ok) cadastrados++
                            else ignorados++
                        } catch (err) {
                            console.error('Erro na importação:', err)
                        }
                    }
                }

                // Feedback visual antes do alert
                const uploadArea = fileInput.closest('.upload-area')
                if (uploadArea) {
                    const feedback = document.createElement('div')
                    feedback.className = 'alert alert-success'
                    feedback.style.marginTop = '12px'
                    feedback.innerHTML = `
                        <span>✓</span>
                        <span>Importação concluída! Cadastrados: ${cadastrados} | Duplicados/Ignorados: ${ignorados}</span>
                    `
                    uploadArea.appendChild(feedback)
                    setTimeout(() => feedback.remove(), 4000)
                }

                alert(`Importação concluída!\nCadastrados: ${cadastrados}\nDuplicados/Ignorados: ${ignorados}`)
                fileInput.value = ''
                carregarDashboard()
            }
            reader.readAsText(file)
        })
    }
}

async function enviarParaBackend(name, password, formElement) {
    try {
        const isEdicao = Boolean(professorEmEdicao && professorEmEdicao.id)
        const url = isEdicao ? `/professores/${professorEmEdicao.id}` : '/cadastrar'
        const method = isEdicao ? 'PUT' : 'POST'

        const resposta = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, password })
        })
        const resultado = await resposta.json()

        if (resposta.ok) {
            // Feedback visual
            const formContainer = formElement.closest('div')
            if (formContainer) {
                const feedback = document.createElement('div')
                feedback.className = 'alert alert-success'
                feedback.style.marginTop = '12px'
                feedback.innerHTML = isEdicao
                    ? '✓ Professor atualizado com sucesso!'
                    : '✓ Professor cadastrado com sucesso!'
                formContainer.appendChild(feedback)
                setTimeout(() => feedback.remove(), 3000)
            }

            if (formElement) formElement.reset()
            professorEmEdicao = null
            mostrarPainel = false
            Render()
        } else {
            alert(resultado.error || 'Ocorreu um erro.')
        }
    } catch (erro) {
        alert('Não foi possível conectar ao servidor.')
    }
}

window.addEventListener('DOMContentLoaded', Render)
