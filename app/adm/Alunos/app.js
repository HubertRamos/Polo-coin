import Form from '../../../components/Form/index.js'
import DashBoard from '../../../components/DashBoard/index.js'
import Header from '../../../components/Header/index.js'
import AlunoAvatar from '../../../components/AlunoAvatar/index.js'
import { linksHeader } from '../constLinks.js'
import UploadFile from '../../../components/UploadFile/index.js'

const root = document.getElementById('root')

const params = new URLSearchParams(window.location.search)
const turmaId = params.get('turmaId')

let mostrarPainel = false
let alunoEmEdicao = null

async function carregarDadosDaTurmaEAlunos() {
    const contentDiv = document.getElementById('dashboard-content')
    if (!contentDiv) return

    if (!turmaId) {
        contentDiv.innerHTML = `
            <div class="alert alert-danger" style="grid-column: 1 / -1;">
                <span>❌</span>
                <span>Turma não especificada. Volte e selecione uma turma novamente.</span>
            </div>
        `
        return
    }

    try {
        const resposta = await fetch(`/turmas/${turmaId}/alunos`)
        const alunos = await resposta.json()

        if (alunos.length === 0) {
            contentDiv.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state__icon">👤</div>
                    <p class="empty-state__text">Nenhum aluno cadastrado nesta turma ainda.</p>
                    <p style="color: var(--text-muted); font-size: 13px; margin-top: 8px;">Clique em "+ Adicionar Aluno" para incluir o primeiro aluno.</p>
                </div>
            `
            return
        }

        contentDiv.innerHTML = alunos.map(aluno => `
            <div class="card" style="padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${AlunoAvatar({ aluno, tamanho: 'pequeno', formato: 'avatar-only' })}
                        <div style="min-width: 0;">
                            <strong style="font-size: 14px; color: var(--text-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${AlunoAvatar({ aluno, tamanho: 'mini', formato: 'inline' })}
                            </strong>
                            <small style="color: var(--text-secondary); font-size: 12px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                Responsável: ${aluno.responsavel_nome || 'Não informado'}
                            </small>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                    <span class="badge badge-neutral" style="font-size: 11px;">ID: ${aluno.id}</span>
                    <button class="btn btn-secondary btn-editar-aluno" data-id="${aluno.id}" data-nome="${(aluno.aluno_nome || '').replace(/"/g, '&quot;')}" data-resp="${(aluno.responsavel_nome || '').replace(/"/g, '&quot;')}" style="padding: 5px 12px; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                        <i class="fa-solid fa-pen-to-square"></i> Editar
                    </button>
                </div>
            </div>
        `).join('')

        // Adiciona listeners aos botões de edição de cada aluno
        contentDiv.querySelectorAll('.btn-editar-aluno').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id')
                const nome = btn.getAttribute('data-nome')
                const resp = btn.getAttribute('data-resp')

                alunoEmEdicao = {
                    id,
                    aluno_nome: nome,
                    responsavel_nome: resp
                }
                mostrarPainel = true
                Render()

                // Busca dados atualizados do aluno via API
                try {
                    const r = await fetch(`/alunos/${id}`)
                    if (r.ok) {
                        const fresh = await r.json()
                        alunoEmEdicao = {
                            id: fresh.id,
                            aluno_nome: fresh.nome,
                            responsavel_nome: fresh.responsavel_nome,
                            turma_id: fresh.turma_id
                        }
                        const nomeInput = document.getElementById('nome-aluno-input')
                        const respInput = document.getElementById('nome-responsavel-input')
                        if (nomeInput && fresh.nome) nomeInput.value = fresh.nome
                        if (respInput && fresh.responsavel_nome) respInput.value = fresh.responsavel_nome
                    }
                } catch (e) {
                    console.error('Erro ao buscar dados completos do aluno:', e)
                }

                const formDiv = document.getElementById('meu-form')
                if (formDiv) formDiv.scrollIntoView({ behavior: 'smooth' })
            })
        })

    } catch (erro) {
        console.error('Erro ao carregar alunos:', erro)
        contentDiv.innerHTML = `
            <div class="alert alert-danger" style="grid-column: 1 / -1;">
                <span>❌</span>
                <span>Erro ao carregar os alunos do servidor.</span>
            </div>
        `
    }
}

function Render() {
    const isEdicao = Boolean(alunoEmEdicao && alunoEmEdicao.id)

    const inputsAluno = isEdicao ? [
        { label: 'Nome do Aluno', placeholder: 'Nome completo do aluno', type: 'text', id: 'nome-aluno-input', required: true, value: alunoEmEdicao.aluno_nome || '' },
        { label: 'Senha do Aluno', placeholder: 'Nova senha do aluno (em branco para manter)', type: 'password', id: 'senha-aluno-input', required: false, value: '' },
        { label: 'Nome do Responsável', placeholder: 'Nome completo do responsável', type: 'text', id: 'nome-responsavel-input', required: true, value: alunoEmEdicao.responsavel_nome || '' },
        { label: 'Senha do Responsável', placeholder: 'Nova senha do responsável (em branco para manter)', type: 'password', id: 'senha-responsavel-input', required: false, value: '' },
    ] : [
        { label: 'Nome do Aluno', placeholder: 'Nome completo do aluno', type: 'text', id: 'nome-aluno-input', required: true, value: '' },
        { label: 'Senha do Aluno', placeholder: 'Senha de acesso do aluno', type: 'password', id: 'senha-aluno-input', required: true, value: '' },
        { label: 'Nome do Responsável', placeholder: 'Nome completo do responsável', type: 'text', id: 'nome-responsavel-input', required: true, value: '' },
        { label: 'Senha do Responsável', placeholder: 'Senha de acesso do responsável', type: 'password', id: 'senha-responsavel-input', required: true, value: '' },
    ]

    const tituloFormulario = isEdicao ? 'Editar Aluno' : 'Cadastrar Aluno'
    const textoBotao = isEdicao ? 'Salvar Alterações' : 'Cadastrar Aluno'

    root.innerHTML = `
        ${Header(linksHeader)}

        <main class="polocoin-main">
            <!-- Botão voltar -->
            <div style="margin-bottom: 16px;">
                <a href="/app/adm/Turmas/index.html" class="btn btn-ghost" style="font-size: 13px;">
                    <i class="fa-solid fa-arrow-left" style="font-size: 11px; margin-right: 4px;"></i>
                    Voltar para Turmas
                </a>
            </div>

            <!-- Cabeçalho da Página -->
            <div class="polocoin-main__header">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: linear-gradient(135deg, var(--color-success), #059669);
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <i class="fa-solid fa-user-graduate" style="color: white; font-size: 16px;"></i>
                        </div>
                        <div>
                            <h1 class="polocoin-main__title">Alunos da Turma</h1>
                            <p class="polocoin-main__subtitle">Gerencie os alunos desta turma</p>
                        </div>
                    </div>
                </div>

                <div class="polocoin-main__actions">
                    <button id="btn-add-item" class="btn btn-primary">
                        <i class="fa-solid fa-plus" style="font-size: 10px;"></i>
                        Adicionar Aluno
                    </button>
                </div>
            </div>

            <!-- Conteúdo -->
            <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                <!-- Dashboard Principal -->
                <div style="flex: 2; min-width: 300px; width: 100%;">
                    ${DashBoard('Alunos da Turma', false, false)}
                </div>

                <!-- Painel de Criação / Edição -->
                ${mostrarPainel ? `
                    <div style="flex: 1; min-width: 300px; width: 100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            ${isEdicao ? `
                                <span class="badge badge-info" style="font-size: 12px; padding: 4px 8px;">
                                    <i class="fa-solid fa-pen" style="font-size: 10px; margin-right: 4px;"></i>
                                    Editando ID: ${alunoEmEdicao.id}
                                </span>
                            ` : `<span></span>`}
                            <button id="btn-fechar" class="btn btn-danger" style="padding: 6px 12px; font-size: 13px;">
                                <i class="fa-solid fa-xmark" style="font-size: 11px;"></i>
                                Fechar
                            </button>
                        </div>
                        ${Form(tituloFormulario, inputsAluno, [], textoBotao)}
                        ${!isEdicao ? UploadFile() : ''}
                    </div>
                ` : ''}
            </div>

            <!-- Lista de Alunos -->
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

            /* Links */
            a.btn-ghost:hover {
                color: var(--text-primary);
                background: rgba(0, 0, 0, 0.05);
            }
        </style>
    `

    carregarDadosDaTurmaEAlunos()

    const btnAdd = document.getElementById('btn-add-item')
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            alunoEmEdicao = null
            mostrarPainel = true
            Render()
        })
    }

    const btnFechar = document.getElementById('btn-fechar')
    if (btnFechar) {
        btnFechar.addEventListener('click', () => {
            alunoEmEdicao = null
            mostrarPainel = false
            Render()
        })
    }

    const formElement = document.getElementById('meu-form')
    if (formElement) {
        formElement.addEventListener('submit', async (event) => {
            event.preventDefault()
            const nomeAluno = document.getElementById('nome-aluno-input').value.trim()
            const senhaAluno = document.getElementById('senha-aluno-input').value.trim()
            const nomeResponsavel = document.getElementById('nome-responsavel-input').value.trim()
            const senhaResponsavel = document.getElementById('senha-responsavel-input').value.trim()

            const isEdicao = Boolean(alunoEmEdicao && alunoEmEdicao.id)

            try {
                const url = isEdicao ? `/alunos/${alunoEmEdicao.id}` : `/turmas/${turmaId}/alunos`
                const method = isEdicao ? 'PUT' : 'POST'

                const resposta = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nomeAluno,
                        nomeResponsavel,
                        senhaAluno,
                        senhaResponsavel,
                        turmaId
                    })
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
                            ? '✓ Aluno atualizado com sucesso!'
                            : '✓ Aluno cadastrado com sucesso!'
                        formContainer.appendChild(feedback)
                        setTimeout(() => feedback.remove(), 3000)
                    }

                    formElement.reset()
                    alunoEmEdicao = null
                    mostrarPainel = false
                    Render()
                } else {
                    alert(resultado.error || (isEdicao ? 'Erro ao atualizar aluno.' : 'Erro ao cadastrar aluno.'))
                }
            } catch (erro) {
                alert('Não foi possível conectar ao servidor.')
            }
        })
    }

    const fileInput = document.getElementById('csv-file')
    if (fileInput) {
        fileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0]
            if (!file) return

            const reader = new FileReader()

            reader.onload = async function (e) {
                const conteudo = e.target.result
                const linhas = conteudo.split('\n')

                let cadastrados = 0
                let ignorados = 0

                for (const linha of linhas) {
                    if (!linha.trim()) continue

                    const colunas = linha.split(',')

                    if (colunas.length < 4) {
                        ignorados++
                        continue
                    }

                    const nomeAluno = colunas[0].trim()
                    const senhaAluno = colunas[1].trim()
                    const nomeResponsavel = colunas[2].trim()
                    const senhaResponsavel = colunas[3].trim()

                    try {
                        const resposta = await fetch(`/turmas/${turmaId}/alunos`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                nomeAluno,
                                nomeResponsavel,
                                senhaAluno,
                                senhaResponsavel
                            })
                        })

                        if (resposta.ok)
                            cadastrados++
                        else
                            ignorados++

                    } catch (erro) {
                        ignorados++
                    }
                }

                alert(
                    `Importação concluída!\n\n` +
                    `Cadastrados: ${cadastrados}\n` +
                    `Ignorados: ${ignorados}`
                )

                fileInput.value = ''
                await carregarDadosDaTurmaEAlunos()
            }

            reader.readAsText(file)
        })
    }
}

window.addEventListener('DOMContentLoaded', Render)
