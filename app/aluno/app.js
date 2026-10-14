import MenuLateral from '/components/MenuLateral/index.js'

const root = document.getElementById('root')
const user = JSON.parse(sessionStorage.getItem('poloUser') || '{}')

const menuConfig = {
    perfil: {
        nome: "Meu Perfil",
        icone: "😀",
        acao: "window.navegarPara('perfil')"
    },
    loja: {
        nome: "Minha Loja",
        icone: "🛒",
        acao: "window.navegarPara('loja')"
    },
    carrinho: {
        nome: "Meu Carrinho",
        icone: "🛍️",
        acao: "window.navegarPara('carrinho')"
    },
    ocorrencias: {
        nome: "Ocorrências",
        icone: "📋",
        acao: "window.navegarPara('ocorrencias')"
    },
    senha: {
        nome: "Alterar Senha",
        icone: "🔒",
        acao: "window.navegarPara('senha')"
    }
}

async function sincronizarAvatarUsuario() {
    if (!user.id) return;
    try {
        const resp = await fetch(`/alunos/${user.id}`);
        if (resp.ok) {
            const dados = await resp.json();
            if (dados && dados.avatar) {
                user.avatar = dados.avatar;
                sessionStorage.setItem('poloUser', JSON.stringify(user));
                const sideAvatar = document.querySelector('#sidebar-aluno-avatar span, .polocoin-sidebar__avatar span');
                if (sideAvatar) sideAvatar.textContent = dados.avatar;
            }
        }
    } catch {
        // Silencioso se offline
    }
}

function renderizarMenu() {
    root.innerHTML = MenuLateral(menuConfig, user)

    if (window.navegarPara) {
        window.navegarPara('loja')
    }

    sincronizarAvatarUsuario();
}

window.addEventListener('DOMContentLoaded', () => {
    if (!user.id) {
        window.location.href = '/index.html'
        return
    }
    renderizarMenu()
})
