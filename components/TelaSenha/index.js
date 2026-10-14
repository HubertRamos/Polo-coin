import Header from '../Header/index.js'

export default async function TelaEditarSenha(root, alunoId) {
    const user = JSON.parse(sessionStorage.getItem('poloUser') || '{}')

    root.innerHTML = `
        <main class="container-center polocoin-main__section--centered">
            <div class="tela-header">
                <div class="tela-header__icon tela-header__icon--blue">
                    <span class="tela-header__emoji">🔒</span>
                </div>
                <div class="tela-header__info">
                    <h1 class="tela-header__title">Alterar Senha</h1>
                    <p class="tela-header__subtitle">Atualize sua senha de acesso</p>
                </div>
            </div>

            <div class="card" style="padding: 20px;">
                ${user.senha ? '' : '<div class="alert alert-success" style="margin-bottom: 16px;">Você ainda não tem senha definida.</div>'}

                <form class="form" id="form-senha">
                    ${user.senha ? `
                        <div>
                            <label class="form-label">Senha Atual</label>
                            <input type="password" id="senha-atual" class="form-input" required />
                        </div>
                    ` : ''}

                    <div>
                        <label class="form-label">Nova Senha</label>
                        <input type="password" id="senha-nova" class="form-input" placeholder="Mínimo 4 caracteres" minlength="4" required />
                    </div>

                    <div>
                        <label class="form-label">Confirmar Nova Senha</label>
                        <input type="password" id="senha-confirm" class="form-input" placeholder="Repita a nova senha" required />
                    </div>

                    <button type="submit" class="btn btn-primary">Salvar Senha</button>

                    <p id="msg-senha" class="form-message"></p>
                </form>
            </div>
        </main>
    `

    const form = document.getElementById('form-senha')
    const msg = document.getElementById('msg-senha')

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const senhaAtual = document.getElementById('senha-atual')?.value || ''
        const senhaNova = document.getElementById('senha-nova').value.trim()
        const senhaConfirm = document.getElementById('senha-confirm').value.trim()

        if (senhaNova !== senhaConfirm) {
            msg.textContent = 'As senhas não coincidem.'
            msg.className = 'alert alert-danger'
            return
        }

        if (senhaNova.length < 4) {
            msg.textContent = 'A senha deve ter no mínimo 4 caracteres.'
            msg.className = 'alert alert-danger'
            return
        }

        msg.textContent = 'Salvando...'
        msg.className = 'alert alert-neutral'

        try {
            const resposta = await fetch('/aluno/senha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: alunoId,
                    senhaAtual,
                    novaSenha: senhaNova,
                }),
            })

            const resultado = await resposta.json()

            if (resposta.ok) {
                msg.textContent = '✅ Senha alterada com sucesso!'
                msg.className = 'alert alert-success'

                form.reset()

                user.senha = senhaNova
                sessionStorage.setItem('poloUser', JSON.stringify(user))

                setTimeout(() => {
                    msg.textContent = ''
                }, 3000)
            } else {
                msg.textContent = resultado.error || 'Erro ao alterar senha.'
                msg.className = 'alert alert-danger'
            }
        } catch (erro) {
            console.error('Erro:', erro)
            msg.textContent = 'Erro de conexão. Tente novamente.'
            msg.className = 'alert alert-danger'
        }
    })
}
