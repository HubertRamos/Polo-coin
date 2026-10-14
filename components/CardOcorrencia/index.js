import AlunoAvatar from '../AlunoAvatar/index.js';

/**
 * CardOcorrencia - Exibe uma ocorrência do aluno (somente leitura).
 * A cor de destaque é passada via variável CSS --ocorrencia-cor.
 */
const cores = {
    'bagunça':       'var(--color-coin)',
    'desmotivado':   'var(--text-secondary)',
    'não entregou':  'var(--color-danger)',
    'conflituante':  'var(--color-danger)',
    'isolado':       '#a855f7',
    'desinteressado':'var(--text-secondary)',
    'indiferente':   'var(--text-secondary)',
    'atrasado':      '#eab308',
}

export default function CardOcorrencia(ocorrencia) {
    const cor = cores[ocorrencia.valor?.toLowerCase()] || 'var(--color-primary)'

    const dataHora = ocorrencia.data
        ? new Date(ocorrencia.data + (ocorrencia.hora ? 'T' + ocorrencia.hora : 'T00:00'))
            .toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Data não informada'

    return `
        <div class="ocorrencia-card" style="--ocorrencia-cor: ${cor}">
            <div class="ocorrencia-card__header">
                <div class="ocorrencia-card__aluno">
                    ${AlunoAvatar({ aluno: ocorrencia, avatar: ocorrencia.aluno_avatar || ocorrencia.avatar, nome: ocorrencia.aluno_nome, tamanho: 'pequeno', formato: 'avatar-only' })}
                    <div>
                        <div class="ocorrencia-card__nome">
                            ${AlunoAvatar({ aluno: ocorrencia, avatar: ocorrencia.aluno_avatar || ocorrencia.avatar, nome: ocorrencia.aluno_nome, tamanho: 'mini', formato: 'inline' })}
                        </div>
                        <div class="ocorrencia-card__meta">
                            ${ocorrencia.serie || '?'}º${ocorrencia.turma || '?'} · ${ocorrencia.categoria || 'Geral'}
                        </div>
                    </div>
                </div>
                <span class="ocorrencia-card__data">${dataHora}</span>
            </div>

            <div class="ocorrencia-card__obs">
                <p>"${ocorrencia.observacao || ocorrencia.valor || 'Sem observação'}"</p>
            </div>

            <div class="ocorrencia-card__detalhes">
                <span class="ocorrencia-card__detalhe"><strong>Pontos:</strong> ${ocorrencia.pontos ?? '—'}</span>
                <span class="ocorrencia-card__detalhe"><strong>Valor:</strong> ${ocorrencia.valor || '—'}</span>
            </div>
        </div>
    `
}
