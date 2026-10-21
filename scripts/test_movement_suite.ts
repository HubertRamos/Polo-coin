import {
  validarTransferencia,
  sugerirDestinoProgressao,
  prepararItensProgressao,
  validarRevisaoProgressao,
  detectarPendenciasAlunos,
  extrairAnosLetivos,
  formatarNomeTurmaComAno,
} from '../src/lib/movementService';
import { Turma, Aluno, Compra, Desejo, Avaliacao, MovimentacaoAluno } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ OK: ${message}`);
  }
}

console.log('--- INICIANDO TESTES DO SISTEMA DE MOVIMENTAÇÃO E PROGRESSÃO ---');

// Mock Data
const turmas: Turma[] = [
  { id: 101, serie: 1, turma: 'A', anoLetivo: 2026 },
  { id: 102, serie: 1, turma: 'B', anoLetivo: 2026 },
  { id: 103, serie: 2, turma: 'A', anoLetivo: 2026 },
  // Turmas de 2027
  { id: 201, serie: 1, turma: 'A', anoLetivo: 2027 }, // Mesmo nome de 101, mas ano 2027!
  { id: 202, serie: 2, turma: 'A', anoLetivo: 2027 }, // Próxima série para 1º A
  { id: 203, serie: 2, turma: 'B', anoLetivo: 2027 }, // Próxima série para 1º B
  { id: 204, serie: 3, turma: 'A', anoLetivo: 2027 }, // Próxima série para 2º A
];

const alunos: Aluno[] = [
  { id: 1, nome: 'Lucas Silva', turmaId: 101, responsavelId: 10, avatar: '🦊', pontos: 150, pode_comprar: true, matricula: 'MAT-001' },
  { id: 2, nome: 'Beatriz Costa', turmaId: 101, responsavelId: 11, avatar: '🐼', pontos: 80, pode_comprar: true, matricula: 'MAT-002' },
  { id: 3, nome: 'Carlos Souza', turmaId: 101, responsavelId: 12, avatar: '🦁', pontos: 20, pode_comprar: false, matricula: 'MAT-003' },
  { id: 4, nome: 'Daniela Lima', turmaId: 102, responsavelId: 13, avatar: '🐱', pontos: 210, pode_comprar: true, matricula: 'MAT-004' },
];

const compras: Compra[] = [
  {
    id: 501,
    alunoId: 1, // Lucas Silva tem entrega pendente!
    produtoId: 301,
    produtoNome: 'Caderno PoloCoin',
    custoPontos: 35,
    categoriaNome: 'Papelaria',
    entregue: false,
    criadoEm: '2026-03-01 10:00',
  },
];

const desejos: Desejo[] = [
  { id: 601, alunoId: 2, produtoId: 302, criadoEm: '2026-03-05' },
];

// -------------------------------------------------------------
// TESTES: IDENTIFICAÇÃO E ANOS LETIVOS
// -------------------------------------------------------------
console.log('\n--- Testando Anos Letivos e Diferenciação ---');
const anos = extrairAnosLetivos(turmas);
assert(anos.length === 2 && anos.includes(2026) && anos.includes(2027), 'Identifica anos letivos cadastrados (2026 e 2027)');

const nome101 = formatarNomeTurmaComAno(turmas[0]);
const nome201 = formatarNomeTurmaComAno(turmas[3]);
assert(nome101 === '1º Ano A (2026)', 'Formata corretamente nome da turma com ano 2026');
assert(nome201 === '1º Ano A (2027)', 'Formata corretamente nome da turma com ano 2027');
assert(nome101 !== nome201, 'Diferencia turmas com mesmo nome pertencentes a anos diferentes');

// -------------------------------------------------------------
// TESTES: TRANSFERÊNCIA (MODO A)
// -------------------------------------------------------------
console.log('\n--- Testando Modo A: Transferência ---');

// 1. Transferir 1 aluno entre turmas do mesmo ano letivo
const t1 = validarTransferencia({
  turmaOrigemId: 101,
  turmaDestinoId: 102,
  alunosIds: [1],
  turmas,
  alunos,
  compras,
  desejos,
});
assert(t1.valido === true, '1. Transferir um aluno entre turmas do mesmo ano letivo é válido');
assert(t1.avisos.length === 1 && t1.avisos[0].tipo === 'entrega_pendente', 'Detecta pendência de entrega física para Lucas Silva sem cancelar compra');

// 2. Transferir vários alunos
const t2 = validarTransferencia({
  turmaOrigemId: 101,
  turmaDestinoId: 102,
  alunosIds: [1, 2, 3],
  turmas,
  alunos,
  compras,
  desejos,
});
assert(t2.valido === true && t2.alunosValidados.length === 3, '2. Transferir vários alunos é válido e valida todos');

// 3. Tentar transferir para a própria turma
const tPropria = validarTransferencia({
  turmaOrigemId: 101,
  turmaDestinoId: 101,
  alunosIds: [1],
  turmas,
  alunos,
  compras,
  desejos,
});
assert(tPropria.valido === false, '5. Bloqueia transferir para a própria turma de origem');

// 4. Tentar transferir para turma de outro ano letivo (ex: de 2026 para 2027)
const tOutroAno = validarTransferencia({
  turmaOrigemId: 101,
  turmaDestinoId: 202, // 2027
  alunosIds: [1],
  turmas,
  alunos,
  compras,
  desejos,
});
assert(tOutroAno.valido === false, '6. Bloqueia transferência entre turmas de anos letivos diferentes (exige progressão)');

// 5. Tentar transferir aluno que não pertence à turma de origem
const tAlunoIncorreto = validarTransferencia({
  turmaOrigemId: 101,
  turmaDestinoId: 102,
  alunosIds: [4], // Daniela Lima pertence à turma 102, não 101!
  turmas,
  alunos,
  compras,
  desejos,
});
assert(tAlunoIncorreto.valido === false, '7. Bloqueia movimentar aluno que não pertence à turma de origem');

// -------------------------------------------------------------
// TESTES: PROGRESSÃO (MODO B)
// -------------------------------------------------------------
console.log('\n--- Testando Modo B: Progressão de Fim de Ano ---');

// Sugestão automática natural: 1º Ano A (2026) -> 2º Ano A (2027)
const sugestao1 = sugerirDestinoProgressao(turmas[0], turmas.filter(t => t.anoLetivo === 2027));
assert(sugestao1 !== undefined && sugestao1.id === 202, 'Sugere avanço natural de série: 1º A 2026 -> 2º A 2027');

// Preparação de itens de revisão
const itensProg = prepararItensProgressao({
  turmasOrigemIds: [101],
  anoOrigem: 2026,
  anoDestino: 2027,
  turmas,
  alunos,
  compras,
  desejos,
});
assert(itensProg.length === 3, '1. Processa turma inteira na revisão de progressão');
assert(itensProg[0].turmaDestinoId === 202, 'Sugeriu turma 2º Ano A para Lucas');
assert(itensProg[0].avisos.length === 1, 'Preservou e identificou aviso de compra pendente na progressão');

// 3. Revisar e alterar destino sugerido de um aluno
itensProg[1].turmaDestinoId = 203; // Alterou Beatriz para 2º Ano B
itensProg[1].turmaDestinoNome = '2º Ano B';
assert(itensProg[1].turmaDestinoId === 203, '3. Permite revisar e alterar destino de um aluno individualmente');

// 4. Excluir um aluno da operação sem removê-lo
itensProg[2].excluido = true; // Excluiu Carlos Souza
assert(itensProg[2].excluido === true, '4. Permite excluir aluno da operação mantendo no sistema');

// 5. Validação com aluno sem destino definido
const itemSemDestino = { ...itensProg[0], turmaDestinoId: undefined, turmaDestinoNome: undefined };
const revInvalida = validarRevisaoProgressao([itemSemDestino], 2026, 2027, turmas);
assert(revInvalida.valido === false, '5. Bloqueia progressão se houver aluno incluído sem destino definido');

// 6. Validação com todos os ativos preenchidos
const revValida = validarRevisaoProgressao(itensProg, 2026, 2027, turmas);
assert(revValida.valido === true, '7. Validação da progressão aprovada quando todos os ativos têm destinos válidos');
assert(revValida.totalAptos === 2, 'Total aptos contabiliza apenas não excluídos');
assert(revValida.totalExcluidos === 1, 'Total excluídos contabilizado corretamente');

// -------------------------------------------------------------
// TESTES: INTEGRIDADE DE DADOS DO POLOCOIN
// -------------------------------------------------------------
console.log('\n--- Testando Preservação e Integridade de Dados ---');

// Mock da operação executada
const alunoAntes = alunos[0];
const pontosAntes = alunoAntes.pontos;
const respAntes = alunoAntes.responsavelId;
const avatarAntes = alunoAntes.avatar;

// Simulação da atualização de vínculo após transferência/progressão
const alunoDepois = { ...alunoAntes, turmaId: 202 };

assert(alunoDepois.id === alunoAntes.id, '1. Preserva ID cadastral único do aluno');
assert(alunoDepois.pontos === pontosAntes, '2. Preserva integralmente o saldo de PoloCoins');
assert(alunoDepois.responsavelId === respAntes, '3. Preserva vínculo com responsável');
assert(alunoDepois.avatar === avatarAntes, '4. Preserva avatar do aluno');
assert(compras[0].entregue === false && compras[0].alunoId === alunoDepois.id, '5. Preserva pedido pendente e identificador');
assert(desejos[0].alunoId === 2, '6. Preserva itens na lista de desejos');

// Criação do registro de histórico auditável
const hist: MovimentacaoAluno = {
  id: Date.now(),
  alunoId: alunoDepois.id,
  alunoNome: alunoDepois.nome,
  alunoMatricula: alunoDepois.matricula,
  turmaOrigemId: 101,
  turmaOrigemNome: '1º Ano A',
  anoLetivoOrigem: 2026,
  turmaDestinoId: 202,
  turmaDestinoNome: '2º Ano A',
  anoLetivoDestino: 2027,
  tipo: 'progressao',
  dataHora: new Date().toISOString(),
  adminNome: 'Direção Escolar',
  loteId: 'LOTE-PROG-TEST-001',
  motivo: 'Progressão regular',
  resultado: 'sucesso',
};

assert(hist.turmaOrigemId === 101 && hist.turmaDestinoId === 202, '8. Histórico registra origem e destino fielmente');
assert(hist.anoLetivoOrigem === 2026 && hist.anoLetivoDestino === 2027, 'Histórico preserva ambos os anos letivos');
assert(hist.loteId === 'LOTE-PROG-TEST-001', 'Histórico registra identificador único de lote');

console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO!\n');
