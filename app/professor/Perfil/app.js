import Header from "../../../components/Header/index.js"

const root = document.getElementById("root")

function Render() {
    root.innerHTML = `
        ${Header({ 'Turmas': ['/app/professor/Turmas/index.html'], 'Meu Perfil': ['/app/professor/Perfil/index.html'], 'Sair': ['/app/'] })}

        <main class="polocoin-main">
            <div class="polocoin-main__header">
                <div>
                    <h1 class="polocoin-main__title">Meu Perfil</h1>
                    <p class="polocoin-main__subtitle">Altere sua senha e gerencie suas turmas</p>
                </div>
            </div>

            <div class="polocoin-main__layout" style="flex-direction: column;">
                <!-- Card Alterar Senha -->
                <div class="card" style="flex: 1; min-width: 300px;">
                    <h2 class="card__title-lg">Alterar Senha</h2>

                    <div style="margin-bottom: 15px;">
                        <label class="form-label" for="senha-atual">Senha Atual</label>
                        <input type="password" id="senha-atual" class="form-input" placeholder="Digite sua senha atual" />
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label class="form-label" for="nova-senha">Nova Senha</label>
                        <input type="password" id="nova-senha" class="form-input" placeholder="Digite a nova senha" />
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label class="form-label" for="confirmar-senha">Confirmar Nova Senha</label>
                        <input type="password" id="confirmar-senha" class="form-input" placeholder="Confirme a nova senha" />
                    </div>

                    <button id="btn-salvar" class="btn btn-primary" disabled>Salvar Senha</button>
                    <p id="mensagem-senha" class="mensagem-senha"></p>
                </div>

                <!-- Card Turmas -->
                <div class="card" style="flex: 1; min-width: 300px;">
                    <h2 class="card__title-lg">Turmas Vinculadas</h2>

                    <div class="turma-list-section">
                        <h3 class="turma-list-section__title">
                            <i class="fas fa-link"></i>
                            Turmas vinculadas a você
                        </h3>
                        <div id="turmas-list">
                            <p class="loading-text">Carregando turmas...</p>
                        </div>
                    </div>

                    <div class="turma-list-section">
                        <h3 class="turma-list-section__title">
                            <i class="fas fa-plus"></i>
                            Turmas disponíveis para vincular
                        </h3>
                        <div id="disponiveis-content"></div>
                    </div>
                </div>
            </div>
        </main>
    `

    carregarUsuario()
    carregarTurmas()
    vincularEventos()
}

async function carregarUsuario() {
    const usuario = sessionStorage.getItem('poloUser')
    if (!usuario) {
        window.location.href = '/index.html'
        return
    }
}

async function carregarTurmas() {
    const usuario = JSON.parse(sessionStorage.getItem('poloUser'))
    const professorId = usuario?.id

    if (!professorId) return

    try {
        const resposta = await fetch(`/professor/turmas?id=${professorId}&_=${Date.now()}`)
        const dados = await resposta.json()

        const turmasVinculadas = dados.vinculadas || []
        const todasTurmas = dados.disponiveis || []

        // Renderiza turmas vinculadas
        const turmasList = document.getElementById('turmas-list')
        const idsVinculados = turmasVinculadas.map(t => t.turma_id)

        if (turmasVinculadas.length === 0) {
            turmasList.innerHTML = `<p class="empty-text">Nenhuma turma vinculada.</p>`
        } else {
            turmasList.innerHTML = turmasVinculadas.map(turma => `
                <div class="turma-item turma-item--vinculada">
                    <span class="turma-item__nome">${turma.serie}º${turma.turma}</span>
                    <div class="turma-item__actions">
                        <button data-turma-id="${turma.turma_id}"
                            class="btn-turma btn-turma--desvincula">
                            Desvincular
                        </button>
                    </div>
                </div>
            `).join('')
        }

        // Renderiza turmas disponíveis
        const disponiveisContent = document.getElementById('disponiveis-content')
        const turmasDisponiveis = todasTurmas.filter(t => !idsVinculados.includes(t.id))

        if (turmasDisponiveis.length === 0) {
            disponiveisContent.innerHTML = `<p class="empty-text">Todas as turmas já estão vinculadas.</p>`
        } else {
            disponiveisContent.innerHTML = turmasDisponiveis.map(turma => `
                <div class="turma-item turma-item--disponivel">
                    <span class="turma-item__nome">${turma.serie}º${turma.turma}</span>
                    <div class="turma-item__actions">
                        <button data-turma-id="${turma.id}"
                            class="btn-turma btn-turma--vincula">
                            Vincular
                        </button>
                    </div>
                </div>
            `).join('')
        }

        // Vincula eventos dos botões
        document.querySelectorAll('.btn-turma').forEach(btn => {
            if (btn.textContent.trim() === 'Vincular') {
                btn.addEventListener('click', async () => {
                    const turmaId = btn.getAttribute('data-turma-id')
                    await vincularTurma(professorId, turmaId, btn)
                })
            }
            if (btn.textContent.trim() === 'Desvincular') {
                btn.addEventListener('click', async () => {
                    const turmaId = btn.getAttribute('data-turma-id')
                    await desvincularTurma(professorId, turmaId, btn)
                })
            }
        })

    } catch (erro) {
        console.error("Erro ao carregar turmas:", erro)
        document.getElementById('turmas-list').innerHTML = `<div class="alert alert-danger">Erro ao carregar turmas.</div>`
    }
}

async function vincularTurma(professorId, turmaId, btn) {
    const originalText = btn.textContent
    btn.textContent = 'Vinculando...'
    btn.classList.add('btn-turma--loading')
    btn.disabled = true

    try {
        const resposta = await fetch('/professor/turmas/vincular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ professorId, turmaId })
        })

        const dados = await resposta.json()

        if (resposta.ok) {
            alert(dados.message || 'Turma vinculada com sucesso!')
            carregarTurmas()
        } else {
            alert(dados.error || 'Erro ao vincular turma.')
            btn.textContent = originalText
            btn.classList.remove('btn-turma--loading')
            btn.disabled = false
        }
    } catch (erro) {
        alert('Erro de conexão.')
        btn.textContent = originalText
        btn.classList.remove('btn-turma--loading')
        btn.disabled = false
    }
}

async function desvincularTurma(professorId, turmaId, btn) {
    if (!confirm('Deseja realmente desvincular esta turma?')) return

    const originalText = btn.textContent
    btn.textContent = 'Desvinculando...'
    btn.classList.add('btn-turma--loading')
    btn.disabled = true

    try {
        const resposta = await fetch('/professor/turmas/desvincular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ professorId, turmaId })
        })

        const dados = await resposta.json()

        if (resposta.ok) {
            alert(dados.message || 'Turma desvinculada com sucesso!')
            carregarTurmas()
        } else {
            alert(dados.error || 'Erro ao desvincular turma.')
            btn.textContent = originalText
            btn.classList.remove('btn-turma--loading')
            btn.disabled = false
        }
    } catch (erro) {
        alert('Erro de conexão.')
        btn.textContent = originalText
        btn.classList.remove('btn-turma--loading')
        btn.disabled = false
    }
}

function vincularEventos() {
    const senhaAtual = document.getElementById('senha-atual')
    const novaSenha = document.getElementById('nova-senha')
    const confirmarSenha = document.getElementById('confirmar-senha')
    const btnSalvar = document.getElementById('btn-salvar')
    const mensagem = document.getElementById('mensagem-senha')

    function atualizarBotao() {
        const temSenhaAtual = senhaAtual.value.trim().length > 0
        const temNovaSenha = novaSenha.value.trim().length > 0
        const senhasCoincidem = novaSenha.value === confirmarSenha.value
        btnSalvar.disabled = !(temSenhaAtual && temNovaSenha && senhasCoincidem)
    }

    senhaAtual.addEventListener('input', atualizarBotao)
    novaSenha.addEventListener('input', atualizarBotao)
    confirmarSenha.addEventListener('input', atualizarBotao)

    btnSalvar.addEventListener('click', async () => {
        const usuario = JSON.parse(sessionStorage.getItem('poloUser'))

        mensagem.textContent = ''
        mensagem.className = 'mensagem-senha'
        btnSalvar.disabled = true
        btnSalvar.textContent = 'Salvando...'
        btnSalvar.classList.add('btn-primary--loading')

        try {
            const resposta = await fetch('/professor/senha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: usuario.id,
                    senhaAtual: senhaAtual.value.trim(),
                    novaSenha: novaSenha.value.trim()
                })
            })

            const dados = await resposta.json()

            if (resposta.ok) {
                mensagem.textContent = dados.message
                mensagem.className = 'mensagem-senha mensagem-senha--success'
                senhaAtual.value = ''
                novaSenha.value = ''
                confirmarSenha.value = ''
                setTimeout(() => {
                    mensagem.textContent = ''
                    btnSalvar.textContent = 'Salvar Senha'
                    btnSalvar.classList.remove('btn-primary--loading')
                    btnSalvar.disabled = true
                    atualizarBotao()
                }, 2000)
            } else {
                mensagem.textContent = dados.error || 'Erro ao atualizar senha.'
                mensagem.className = 'mensagem-senha mensagem-senha--error'
                btnSalvar.textContent = 'Salvar Senha'
                btnSalvar.classList.remove('btn-primary--loading')
                btnSalvar.disabled = false
                atualizarBotao()
            }
        } catch (erro) {
            mensagem.textContent = 'Erro de conexão. Verifique se o servidor está rodando.'
            mensagem.className = 'mensagem-senha mensagem-senha--error'
            btnSalvar.textContent = 'Salvar Senha'
            btnSalvar.classList.remove('btn-primary--loading')
            btnSalvar.disabled = false
            atualizarBotao()
        }
    })
}

window.addEventListener("DOMContentLoaded", Render)
