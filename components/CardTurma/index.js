/**
 * Componente CardTurma - Card Padronizado de Turma
 *
 * Responsabilidade:
 * - Exibir uma turma vinculada ao professor
 * - Acessível por teclado (role="button", tabindex="0", Enter/Space)
 * - Transição suave de hover e indicador visual claro
 */

export default function CardTurma({
    turma = {},
    onClick = '',
    className = '',
    style = ''
} = {}) {
    const id = turma.turma_id || turma.id || '';
    const serie = turma.serie || '';
    const nomeTurma = turma.turma || '';
    const titulo = `Turma ${serie}º ${nomeTurma}`;

    return `
        <div
            class="card card-turma card--hover ${className}"
            data-id="${id}"
            tabindex="0"
            role="button"
            aria-label="Abrir ${titulo}"
            ${onClick ? `onclick="${onClick}"` : ''}
            style="cursor: pointer; ${style}"
        >
            <div class="card__header-row card-turma__row">
                <div class="card-turma__grupo">
                    <div class="card__icon card__icon--blue card-turma__icon">
                        <i class="fas fa-users" aria-hidden="true"></i>
                    </div>
                    <div class="card__body">
                        <strong class="card__title">${titulo}</strong>
                        <small class="card__meta">Clique para gerenciar alunos e ocorrências</small>
                    </div>
                </div>
                <div class="card__arrow card__arrow--blue">
                    <i class="fas fa-arrow-right" aria-hidden="true"></i>
                </div>
            </div>
        </div>
    `.trim();
}
