
import Form from "../../components/Form/index.js"
import Toast from "../../components/Toast/index.js"
import { setButtonLoading } from "../../components/Button/index.js"

const root = document.getElementById("root")

const inputsLogin = [
    { label: "Tipo de Usuário", type: "select", id: "tipo-usuario-input", required: true, options: [
        { value: "adm", text: "Administrador" },
        { value: "professor", text: "Professor" },
        { value: "aluno", text: "Aluno" },
        { value: "responsavel", text: "Responsável" }
    ]},
    { label: "Identificação / Nome", placeholder: "Digite seu nome ou usuário", type: "text", id: "usuario-input", required: true },
    { label: "Senha", placeholder: "Digite sua senha", type: "password", id: "senha-input", required: true },
]

function Render() {
    root.innerHTML = `
        <div class="login-card">
            <div class="login-card__logo" aria-hidden="true">🪙</div>
            <h1 class="login-card__title">PoloCoin</h1>
            <p class="login-card__subtitle">Sistema escolar de pontuação e recompensas</p>
            ${Form("Entrar", inputsLogin, [], null, null, { hideTitle: true })}
            <p class="login-card__footer">Feito para escolas que valorizam o mérito ✨</p>
        </div>
    `

    const formElement = document.getElementById("meu-form")
    if (formElement) {
        formElement.addEventListener("submit", async (event) => {
            event.preventDefault()
            
            const submitBtn = formElement.querySelector("button[type='submit']")
            const tipo = document.getElementById("tipo-usuario-input").value
            const usuario = document.getElementById("usuario-input").value.trim()
            const senha = document.getElementById("senha-input").value.trim()

            if (!usuario || !senha) {
                Toast.warning("Preencha todos os campos para entrar.")
                return
            }

            fazerLogin(tipo, usuario, senha, submitBtn)
        })
    }
}

window.addEventListener("DOMContentLoaded", Render)

async function fazerLogin(tipo, usuario, senha, submitBtn) {
    if (submitBtn) setButtonLoading(submitBtn, true, "Entrando...")

    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: usuario, senha, tipo }),
        })

        const data = await res.json()

        if (!res.ok) {
            Toast.error(data.error || 'Credenciais inválidas. Verifique nome e senha.')
            if (submitBtn) setButtonLoading(submitBtn, false)
            return
        }

        // Login bem-sucedido — salva os dados na sessão e redireciona
        sessionStorage.setItem('poloUser', JSON.stringify(data.user))
        Toast.success(`Bem-vindo(a), ${data.user.nome}!`)

        // Pequeno delay para exibir o toast antes de redirecionar
        setTimeout(() => {
            const base = '/app/'
            if (data.user.tipo === 'adm') {
                window.location.href = `${base}adm/Produtos/index.html`
            } else if (data.user.tipo === 'professor') {
                window.location.href = `${base}professor/Turmas/index.html`
            } else if (data.user.tipo === 'aluno') {
                window.location.href = `${base}aluno/index.html`
            } else if (data.user.tipo === 'responsavel') {
                window.location.href = `${base}responsavel/index.html`
            } else {
                window.location.href = `${base}index.html`
            }
        }, 500)
    } catch (err) {
        console.error(err)
        Toast.error('Não foi possível conectar ao servidor. Tente novamente.')
        if (submitBtn) setButtonLoading(submitBtn, false)
    }
}
