import AlunoAvatar from '../AlunoAvatar/index.js';
import { SkeletonCardOcorrencia } from '../Skeleton/index.js';

export default async function TelaOcorrencias(root, alunoId) {
    root.innerHTML = `
        <div class="resp-dashboard">
            <div class="resp-header">
                <h1 class="resp-header__title">Ocorrências</h1>
                <p class="resp-header__subtitle">Visualização das ocorrências registradas</p>
            </div>

            <div id="obs-loading" style="margin-top: 16px;">
                ${SkeletonCardOcorrencia(3)}
            </div>

            <div id="obs-content" style="display: none;"></div>
        </div>
    `

    try {
        const resposta = await fetch(`/aluno/ocorrencias?id=${alunoId}`)
        const ocorrencias = await resposta.json()

        document.getElementById('obs-loading').style.display = 'none'
        const content = document.getElementById('obs-content')

        if (ocorrencias.length === 0) {
            content.innerHTML = `
                <div class="resp-secao">
                    <div class="resp-secao__header">
                        <div class="resp-secao__icon resp-secao__icon--purple">✅</div>
                        <h2 class="resp-secao__title">Nenhuma ocorrência</h2>
                    </div>
                    <div class="empty-block">
                        <div class="empty-block__icon">🎉</div>
                        <p class="empty-block__text">Parabéns! Nenhuma ocorrência negativa foi registrada.</p>
                    </div>
                </div>
            `
            content.style.display = 'block'
            return
        }


        content.innerHTML = `
            <div class="resp-secao">
                <div class="resp-secao__header">
                    <div class="resp-secao__icon resp-secao__icon--orange">⚠️</div>
                    <h2 class="resp-secao__title">Ocorrências Negativas</h2>
                    <span class="resp-secao__count">${ocorrencias.length} ocorrência${ocorrencias.length > 1 ? 's' : ''}</span>
                </div>
                <div class="ocorrencias-grid">
                    ${ocorrencias.map(oc => `
                        <div class="ocorrencia-card" style="border-left-color: ${getCorOcorrencia(oc.valor)};">
                            <div class="ocorrencia-card__top">
                                <div class="ocorrencia-card__info">
                                    ${AlunoAvatar({ avatar: oc.aluno_avatar, nome: oc.aluno_nome, tamanho: 'pequeno', formato: 'avatar-only' })}
                                    <div>
                                        <strong class="ocorrencia-card__aluno">${AlunoAvatar({ avatar: oc.aluno_avatar, nome: oc.aluno_nome, tamanho: 'mini', formato: 'inline' })}</strong>
                                        <span class="ocorrencia-card__meta">
                                            ${oc.serie || '?'}º${oc.turma || '?'} · ${oc.categoria || 'Geral'}
                                        </span>
                                    </div>
                                </div>
                                <span class="ocorrencia-card__data">${formatarDataHora(oc.data, oc.hora)}</span>
                            </div>
                            <div class="ocorrencia-card__observacao">
                                <p>"${oc.observacao || oc.valor || 'Sem observação'}"</p>
                            </div>
                            <div class="ocorrencia-card__detalhes">
                                <span><strong>Pontos:</strong> ${oc.pontos ?? '—'}</span>
                                <span><strong>Valor:</strong> ${oc.valor || '—'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
        content.style.display = 'block'
    } catch (erro) {
        console.error('Erro ao carregar ocorrências:', erro)
        const content = document.getElementById('obs-content')
        content.innerHTML = `
            <div class="resp-secao">
                <div class="empty-block">
                    <p class="alert alert-danger" style="text-align: center; padding: 20px;">Erro ao carregar ocorrências. Tente novamente.</p>
                </div>
            </div>
        `
        content.style.display = 'block'
    }
}

function getCorOcorrencia(valor) {
    const cores = {
        'bagunça': 'var(--color-coin)',
        'desmotivado': 'var(--text-secondary)',
        'não entregou': 'var(--color-danger)',
        'conflituante': 'var(--color-danger)',
        'isolado': '#a855f7',
        'desinteressado': 'var(--text-secondary)',
        'indiferente': 'var(--text-secondary)',
        'atrasado': '#eab308',
    }
    return cores[valor?.toLowerCase()] || 'var(--color-primary)'
}

function formatarDataHora(data, hora) {
    if (!data) return 'Data não informada'
    try {
        return new Date(data + (hora ? 'T' + hora : 'T00:00'))
            .toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
        return `${data} ${hora || ''}`
    }
}
