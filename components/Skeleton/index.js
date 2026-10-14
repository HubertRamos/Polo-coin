/**
 * Componente Skeleton - Estados de Carregamento Fluido
 * 
 * Responsabilidade:
 * - Substituir telas brancas ou textos "Carregando..." por esqueletos animados
 * - Prevenir layout shifts e transmitir sensação de alta velocidade
 * - Reutilizável em listas de alunos, produtos, turmas e ocorrências
 */

export function SkeletonBox({ width = '100%', height = '16px', radius = '6px', className = '', style = '' } = {}) {
    return `<div class="polocoin-skeleton ${className}" style="width:${width}; height:${height}; border-radius:${radius}; ${style}"></div>`;
}

export function SkeletonCircle({ size = '40px', className = '', style = '' } = {}) {
    return `<div class="polocoin-skeleton ${className}" style="width:${size}; height:${size}; min-width:${size}; border-radius:50%; ${style}"></div>`;
}

export function SkeletonCardAluno(count = 4) {
    return Array.from({ length: count }).map(() => `
        <div class="card polocoin-skeleton-card" style="padding: 16px; cursor: default;">
            <div style="display: flex; align-items: center; gap: 12px;">
                ${SkeletonCircle({ size: '44px' })}
                <div style="flex: 1; min-width: 0;">
                    ${SkeletonBox({ width: '60%', height: '16px', style: 'margin-bottom: 6px;' })}
                    ${SkeletonBox({ width: '40%', height: '12px' })}
                </div>
                ${SkeletonBox({ width: '70px', height: '24px', radius: '12px' })}
            </div>
        </div>
    `).join('');
}

export function SkeletonCardTurma(count = 3) {
    return Array.from({ length: count }).map(() => `
        <div class="card polocoin-skeleton-card" style="padding: 20px; cursor: default;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    ${SkeletonCircle({ size: '42px' })}
                    <div>
                        ${SkeletonBox({ width: '130px', height: '18px', style: 'margin-bottom: 6px;' })}
                        ${SkeletonBox({ width: '90px', height: '12px' })}
                    </div>
                </div>
                ${SkeletonBox({ width: '24px', height: '24px', radius: '50%' })}
            </div>
        </div>
    `).join('');
}

export function SkeletonCardProduto(count = 6) {
    return Array.from({ length: count }).map(() => `
        <div class="card polocoin-skeleton-card" style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between; height: 140px;">
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    ${SkeletonBox({ width: '65%', height: '18px' })}
                    ${SkeletonBox({ width: '50px', height: '20px' })}
                </div>
                ${SkeletonBox({ width: '40%', height: '13px' })}
            </div>
            ${SkeletonBox({ width: '100%', height: '36px', radius: '8px' })}
        </div>
    `).join('');
}

export function SkeletonCardOcorrencia(count = 3) {
    return Array.from({ length: count }).map(() => `
        <div class="card polocoin-skeleton-card" style="padding: 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${SkeletonCircle({ size: '36px' })}
                    <div>
                        ${SkeletonBox({ width: '120px', height: '15px', style: 'margin-bottom: 4px;' })}
                        ${SkeletonBox({ width: '80px', height: '12px' })}
                    </div>
                </div>
                ${SkeletonBox({ width: '80px', height: '12px' })}
            </div>
            ${SkeletonBox({ width: '100%', height: '42px', radius: '6px', style: 'margin-bottom: 10px;' })}
            <div style="display: flex; justify-content: space-between;">
                ${SkeletonBox({ width: '60px', height: '14px' })}
                ${SkeletonBox({ width: '70px', height: '14px' })}
            </div>
        </div>
    `).join('');
}

export const Skeleton = {
    Box: SkeletonBox,
    Circle: SkeletonCircle,
    CardAluno: SkeletonCardAluno,
    CardTurma: SkeletonCardTurma,
    CardProduto: SkeletonCardProduto,
    CardOcorrencia: SkeletonCardOcorrencia
};

export default Skeleton;
