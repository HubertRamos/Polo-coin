/**
 * Componente CardAluno - Card Padronizado de Aluno
 *
 * Responsabilidade:
 * - Exibir informações de um aluno com avatar, nome, saldo em PoloCoins e metadados
 * - Usado no painel do professor (lista de turma) e no painel do responsável
 * - Acessível por teclado (role="button", tabindex="0", evento Enter/Space)
 */

import AlunoAvatar from '../AlunoAvatar/index.js';
import Badge from '../Badge/index.js';

export default function CardAluno({
    aluno = {},
    onClick = '',
    mostrarSaldo = true,
    mostrarStatusCompra = false,
    subtitulo = '',
    className = '',
    style = ''
} = {}) {
    const id = aluno.id || '';
    const nome = aluno.aluno_nome || aluno.nome || 'Aluno';
    const pontos = Number(aluno.pontos ?? 0);
    const podeComprar = aluno.pode_comprar ?? false;

    let badgeCompra = '';
    if (mostrarStatusCompra) {
        badgeCompra = podeComprar
            ? Badge({ variant: 'success', text: 'Liberado', icon: '✓' })
            : Badge({ variant: 'warning', text: 'Bloqueado', icon: '🔒' });
    }

    const sub = subtitulo || (aluno.responsavel_nome ? `Resp: ${aluno.responsavel_nome}` : '');

    return `
        <div
            class="card card-aluno card--hover ${className}"
            data-id="${id}"
            tabindex="0"
            role="button"
            aria-label="Ver detalhes de ${nome}"
            ${onClick ? `onclick="${onClick}"` : ''}
            style="cursor: pointer; ${style}"
        >
            <div class="card-aluno__content">
                <div class="card-aluno__info">
                    ${AlunoAvatar({ aluno, tamanho: 'medio', formato: 'avatar-only' })}
                    <div class="card-aluno__identidade">
                        <strong class="card-aluno__nome">${nome}</strong>
                        ${sub ? `<span class="card-aluno__sub">${sub}</span>` : ''}
                    </div>
                </div>

                <div class="card-aluno__meta">
                    ${mostrarSaldo ? `
                        <div class="card-aluno__saldo">
                            <span aria-hidden="true">🪙</span>
                            <span class="card-aluno__saldo-valor">${pontos}</span>
                            <span class="card-aluno__saldo-label">PoloCoins</span>
                        </div>
                    ` : ''}
                    ${badgeCompra}
                </div>
            </div>
        </div>
    `.trim();
}
