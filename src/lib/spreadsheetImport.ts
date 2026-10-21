import * as XLSX from 'xlsx';
import { Professor, Aluno, Turma, Responsavel, Produto, Categoria } from '../types';
import { normalizarIdentificador, normalizarUsuario } from './duplicateValidation';

export type ImportType = 'professores' | 'alunos' | 'produtos';

export interface RowValidationResult<T = any> {
  linha: number; // 1-indexed spreadsheet line (header is line 1, data starts line 2)
  dadosBrutos: Record<string, any>;
  dadosValidados?: T;
  status: 'valido' | 'invalido' | 'duplicado';
  erros: string[];
  avisos: string[];
}

export interface SpreadsheetValidationSummary<T = any> {
  totalLinhas: number;
  validos: number;
  invalidos: number;
  duplicados: number;
  linhas: RowValidationResult<T>[];
  nomeArquivo: string;
  tamanhoArquivo: number;
}

export interface ProfessorImportData {
  nome: string;
  usuario: string;
  senha?: string;
  turmasNomes: string[];
  turmasIds: number[];
}

export interface AlunoImportData {
  nome: string;
  turmaId: number;
  turmaNome: string;
  nomeResponsavel: string;
  podeComprar: boolean;
  senha?: string;
  matricula?: string;
}

export interface ProdutoImportData {
  nome: string;
  custoPontos: number;
  categoria: string;
  estoque?: number;
  codigo?: string;
}

// Limites seguros de upload
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ROWS_ALLOWED = 500; // Limite de 500 registros por importação

// Helper para normalizar strings (sem acentos, minúsculas, sem espaços extras)
export function normalizarTexto(txt: string): string {
  if (!txt) return '';
  return txt
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// -------------------------------------------------------------
// Modelos de Planilha para Download (XLSX e CSV)
// -------------------------------------------------------------
export function gerarModeloPlanilha(tipo: ImportType, formato: 'xlsx' | 'csv'): Blob {
  const wb = XLSX.utils.book_new();

  if (tipo === 'professores') {
    const dados = [
      ['Nome Completo', 'Usuario de Acesso', 'Turmas Vinculadas', 'Senha Inicial'],
      ['Maria Eduarda Santos', 'maria.santos', '1A, 2B', ''],
      ['Carlos Roberto Silva', 'carlos.silva', '3A', ''],
      ['Ana Paula Oliveira', 'anapaula', '', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(dados);
    ws['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 22 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Professores');

    // Aba de instruções
    const instrucoes = [
      ['Instruções para Preenchimento do Cadastro de Professores'],
      [''],
      ['Campo', 'Obrigatório?', 'Descrição e Regras'],
      ['Nome Completo', 'Sim', 'Nome completo do docente. Dois professores podem ter o mesmo nome, desde que tenham usuários diferentes.'],
      ['Usuario de Acesso', 'Não', 'Identificador único de login (se vazio, será gerado automaticamente). Não pode ser duplicado.'],
      ['Turmas Vinculadas', 'Não', 'Turmas que o professor leciona separadas por vírgula (ex: "1A, 2B" ou "1º Ano A").'],
      ['Senha Inicial', 'Não', 'Senha inicial temporária. Se deixar em branco, o sistema definirá "123". Nunca coloque senhas reais de produção aqui.'],
    ];
    const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
    XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instrucoes');
  } else if (tipo === 'alunos') {
    const dados = [
      ['Nome Completo do Aluno', 'Matricula Escolar', 'Turma', 'Nome do Responsavel', 'Compras Autonomas', 'Senha Inicial'],
      ['Lucas Gabriel Pereira', 'MAT-2024-001', '1º Ano A', 'Mariana Pereira', 'Sim', ''],
      ['Beatriz Costa Ribeiro', 'MAT-2024-002', '1A', 'Fernando Ribeiro', 'Não', ''],
      ['Lucas Gabriel Pereira', 'MAT-2024-003', '2º Ano B', 'Juliana Alves', 'Sim', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(dados);
    ws['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 24 }, { wch: 20 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Alunos');

    const instrucoes = [
      ['Instruções para Preenchimento do Cadastro de Alunos'],
      [''],
      ['Campo', 'Obrigatório?', 'Descrição e Regras'],
      ['Nome Completo do Aluno', 'Sim', 'Nome completo do estudante. Alunos em turmas diferentes podem ter o mesmo nome.'],
      ['Matricula Escolar', 'Não', 'Identificador único global do aluno (ex: MAT-2024-001). Se informada, nenhuma outra pessoa pode ter a mesma matrícula.'],
      ['Turma', 'Sim', 'Identificação da turma cadastrada na escola (ex: "1º Ano A", "1A").'],
      ['Nome do Responsavel', 'Sim', 'Nome do responsável legal. Se já existir, será vinculado automaticamente; caso contrário, será criado.'],
      ['Compras Autonomas', 'Não', 'Permissão para compras diretas: "Sim" ou "Não" (padrão: Sim). Se "Não", requer autorização dos pais.'],
      ['Senha Inicial', 'Não', 'Senha de acesso do aluno (padrão: "123"). O saldo inicial será 0 PoloCoins.'],
    ];
    const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
    XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instrucoes');
  } else if (tipo === 'produtos') {
    const dados = [
      ['Nome do Produto', 'Codigo / SKU', 'Custo em PoloCoins', 'Categoria', 'Estoque Disponivel'],
      ['Caderno Universitário 100 Fls', 'SKU-CAD-01', '35', 'Papelaria', '50'],
      ['Squeeze Térmico PoloCoin', 'SKU-SQZ-02', '60', 'Geral', '25'],
      ['Marca-Texto Neon (Kit)', 'SKU-MRC-03', '20', 'Papelaria', ''],
      ['Fone de Ouvido Dobrável', 'SKU-FON-04', '150', 'Eletrônicos', '10'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(dados);
    ws['!cols'] = [{ wch: 32 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');

    const instrucoes = [
      ['Instruções para Preenchimento do Cadastro de Produtos'],
      [''],
      ['Campo', 'Obrigatório?', 'Descrição e Regras'],
      ['Nome do Produto', 'Sim', 'Nome comercial da recompensa.'],
      ['Codigo / SKU', 'Não', 'Código único do produto (ex: SKU-001). Se informado, deve ser exclusivo.'],
      ['Custo em PoloCoins', 'Sim', 'Valor inteiro em PoloCoins maior que zero.'],
      ['Categoria', 'Sim', 'Categoria do item (ex: Papelaria, Geral, Esportes, Eletrônicos).'],
      ['Estoque Disponivel', 'Não', 'Quantidade inteira em estoque (>= 0). Se em branco, estoque ilimitado.'],
    ];
    const wsInstrucoes = XLSX.utils.aoa_to_sheet(instrucoes);
    XLSX.utils.book_append_sheet(wb, wsInstrucoes, 'Instrucoes');
  }

  if (formato === 'csv') {
    const sheetName = wb.SheetNames[0];
    const csvContent = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName], { FS: ';' });
    // Adicionar BOM UTF-8 (\uFEFF) para garantir que Excel e editores brasileiros abram sem corromper acentos
    const bomCsv = '\uFEFF' + csvContent;
    return new Blob([bomCsv], { type: 'text/csv;charset=utf-8;' });
  } else {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}

export function downloadModelo(tipo: ImportType, formato: 'xlsx' | 'csv') {
  const blob = gerarModeloPlanilha(tipo, formato);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `modelo_cadastro_${tipo}_polocoin.${formato}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// -------------------------------------------------------------
// Leitura e Parsing de Arquivo (.xlsx ou .csv)
// -------------------------------------------------------------
export async function lerArquivoPlanilha(
  file: File
): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  // 1. Validação de tamanho
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `O arquivo selecionado (${(file.size / 1024 / 1024).toFixed(1)} MB) excede o limite máximo permitido de 5 MB.`
    );
  }

  // 2. Validação de extensão
  const extensao = file.name.split('.').pop()?.toLowerCase();
  if (!extensao || !['xlsx', 'xls', 'csv'].includes(extensao)) {
    throw new Error('Formato de arquivo não suportado. Por favor, envie um arquivo Excel (.xlsx) ou CSV (.csv).');
  }

  // 3. Leitura como ArrayBuffer
  const buffer = await file.arrayBuffer();

  // 4. Parser com SheetJS (lê tanto xlsx quanto csv com suporte UTF-8)
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'array', codepage: 65001 });
  } catch (err: any) {
    throw new Error(
      'Não foi possível ler o arquivo. Certifique-se de que não esteja corrompido ou protegido por senha.'
    );
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('A planilha selecionada está vazia ou não contém abas legíveis.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Converter para array de objetos com cabeçalhos da primeira linha
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('A planilha está completamente vazia.');
  }

  // A primeira linha contém os cabeçalhos
  const rawHeaders = rawRows[0] as string[];
  const headers = rawHeaders.map(h => String(h || '').trim());

  if (headers.filter(Boolean).length === 0) {
    throw new Error('Cabeçalhos não encontrados na primeira linha da planilha.');
  }

  // Processar linhas de dados ignorando linhas completamente vazias ao final
  const rows: Record<string, any>[] = [];
  for (let i = 1; i < rawRows.length; i++) {
    const rowValues = rawRows[i] as any[];
    // Verificar se a linha possui algum conteúdo
    const temConteudo = Array.isArray(rowValues) && rowValues.some(val => String(val || '').trim() !== '');
    if (!temConteudo) continue;

    const rowObj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = rowValues[colIdx] !== undefined ? String(rowValues[colIdx]).trim() : '';
    });
    rows.push(rowObj);
  }

  if (rows.length > MAX_ROWS_ALLOWED) {
    throw new Error(
      `A planilha contém ${rows.length} linhas de dados, excedendo o limite máximo de ${MAX_ROWS_ALLOWED} registros por importação.`
    );
  }

  return { headers, rows };
}

// -------------------------------------------------------------
// Validação: Professores
// -------------------------------------------------------------
export function validarPlanilhaProfessores(
  rows: Record<string, any>[],
  existingProfessores: Professor[],
  existingTurmas: Turma[],
  nomeArquivo: string,
  tamanhoArquivo: number
): SpreadsheetValidationSummary<ProfessorImportData> {
  const resultados: RowValidationResult<ProfessorImportData>[] = [];
  const usuariosNoArquivo = new Set<string>();

  rows.forEach((row, index) => {
    const linha = index + 2; // Linha 1 = cabeçalho
    const erros: string[] = [];
    const avisos: string[] = [];

    // Mapeamento flexível de cabeçalhos
    const rawNome =
      row['Nome Completo'] ||
      row['Nome'] ||
      row['nome'] ||
      row['Professor'] ||
      '';
    const rawUsuario =
      row['Usuario de Acesso'] ||
      row['Usuário de Acesso'] ||
      row['Usuario'] ||
      row['usuario'] ||
      row['Username'] ||
      row['username'] ||
      '';
    const rawTurmas =
      row['Turmas Vinculadas'] ||
      row['Turmas'] ||
      row['turmas'] ||
      '';
    const rawSenha =
      row['Senha Inicial'] ||
      row['Senha'] ||
      row['senha'] ||
      '';

    const nome = String(rawNome).trim();
    if (!nome) {
      erros.push('O campo "Nome Completo" é obrigatório.');
    } else if (nome.length < 3) {
      erros.push('O nome do professor deve ter pelo menos 3 caracteres.');
    }

    // Gerar ou validar usuário único
    let usuarioInput = String(rawUsuario).trim();
    let usuario = normalizarUsuario(usuarioInput);

    if (!usuario && nome) {
      const baseUser = normalizarUsuario(nome.replace(/\s+/g, '.'));
      usuario = baseUser;
      let counter = 2;
      while (
        usuariosNoArquivo.has(usuario) ||
        existingProfessores.some(p => normalizarUsuario(p.usuario) === usuario)
      ) {
        usuario = `${baseUser}${counter}`;
        counter++;
      }
      avisos.push(`Usuário não informado. Será gerado automaticamente como "@${usuario}".`);
    }

    // Resolver turmas vinculadas
    const turmasIds: number[] = [];
    const turmasNomesValidadas: string[] = [];
    if (rawTurmas) {
      const pedacos = String(rawTurmas)
        .split(/[,;/]/)
        .map(t => t.trim())
        .filter(Boolean);

      for (const pedaco of pedacos) {
        const turmaEncontrada = encontrarTurmaPorTexto(pedaco, existingTurmas);
        if (turmaEncontrada) {
          if (!turmasIds.includes(turmaEncontrada.id)) {
            turmasIds.push(turmaEncontrada.id);
            turmasNomesValidadas.push(`${turmaEncontrada.serie}º Ano ${turmaEncontrada.turma}`);
          }
        } else {
          erros.push(`Turma "${pedaco}" não foi encontrada no cadastro escolar.`);
        }
      }
    }

    // Detecção de duplicidades: O identificador único de professor é o 'usuario'
    let status: 'valido' | 'invalido' | 'duplicado' = 'valido';

    if (usuario) {
      // 1. Duplicado dentro da própria planilha
      if (usuariosNoArquivo.has(usuario)) {
        status = 'duplicado';
        erros.push(`Usuário "@${usuario}" está duplicado dentro desta mesma planilha.`);
      } else {
        usuariosNoArquivo.add(usuario);
      }

      // 2. Conflito com professor já existente no sistema
      const jaExisteNoBanco = existingProfessores.some(
        p => normalizarUsuario(p.usuario) === usuario
      );
      if (jaExisteNoBanco) {
        status = 'duplicado';
        erros.push(`Já existe um professor cadastrado com o usuário de acesso "@${usuario}".`);
      }
    }

    if (erros.length > 0 && status !== 'duplicado') {
      status = 'invalido';
    }

    const dadosValidados: ProfessorImportData | undefined =
      status === 'valido'
        ? {
            nome,
            usuario,
            senha: rawSenha ? String(rawSenha).trim() : '123',
            turmasNomes: turmasNomesValidadas,
            turmasIds,
          }
        : undefined;

    resultados.push({
      linha,
      dadosBrutos: row,
      dadosValidados,
      status,
      erros,
      avisos,
    });
  });

  return {
    totalLinhas: rows.length,
    validos: resultados.filter(r => r.status === 'valido').length,
    invalidos: resultados.filter(r => r.status === 'invalido').length,
    duplicados: resultados.filter(r => r.status === 'duplicado').length,
    linhas: resultados,
    nomeArquivo,
    tamanhoArquivo,
  };
}

// -------------------------------------------------------------
// Validação: Alunos
// -------------------------------------------------------------
export function validarPlanilhaAlunos(
  rows: Record<string, any>[],
  existingAlunos: Aluno[],
  existingTurmas: Turma[],
  existingResponsaveis: Responsavel[],
  turmaIdPadrao: number | undefined,
  nomeArquivo: string,
  tamanhoArquivo: number
): SpreadsheetValidationSummary<AlunoImportData> {
  const resultados: RowValidationResult<AlunoImportData>[] = [];
  const matriculasNoArquivo = new Set<string>();
  const alunosPorTurmaNoArquivo = new Set<string>();

  rows.forEach((row, index) => {
    const linha = index + 2;
    const erros: string[] = [];
    const avisos: string[] = [];

    const rawNome =
      row['Nome Completo do Aluno'] ||
      row['Nome Completo'] ||
      row['Nome do Aluno'] ||
      row['Nome'] ||
      row['Aluno'] ||
      '';
    const rawMatricula =
      row['Matricula Escolar'] ||
      row['Matrícula Escolar'] ||
      row['Matricula'] ||
      row['Matrícula'] ||
      '';
    const rawTurma =
      row['Turma'] ||
      row['Turma/Ano'] ||
      row['Classe'] ||
      row['turma'] ||
      '';
    const rawResponsavel =
      row['Nome do Responsavel'] ||
      row['Nome do Responsável'] ||
      row['Responsavel'] ||
      row['Responsável'] ||
      row['Pais'] ||
      '';
    const rawPodeComprar =
      row['Compras Autonomas'] ||
      row['Compras Autônomas'] ||
      row['Pode Comprar'] ||
      row['pode_comprar'] ||
      '';
    const rawSenha =
      row['Senha Inicial'] ||
      row['Senha'] ||
      row['senha'] ||
      '';

    const nome = String(rawNome).trim();
    if (!nome) {
      erros.push('O campo "Nome Completo do Aluno" é obrigatório.');
    } else if (nome.length < 3) {
      erros.push('O nome do aluno deve conter no mínimo 3 caracteres.');
    }

    const matricula = String(rawMatricula).trim() || undefined;
    const matNorm = normalizarIdentificador(matricula);

    // Resolução da Turma
    let turmaSelecionada: Turma | null = null;
    const textoTurma = String(rawTurma).trim();

    if (textoTurma) {
      turmaSelecionada = encontrarTurmaPorTexto(textoTurma, existingTurmas);
      if (!turmaSelecionada) {
        erros.push(`Turma "${textoTurma}" não foi encontrada no sistema.`);
      }
    } else if (turmaIdPadrao) {
      turmaSelecionada = existingTurmas.find(t => t.id === turmaIdPadrao) || null;
      if (turmaSelecionada) {
        avisos.push(`Turma não especificada na planilha. Será utilizada a turma ativa "${turmaSelecionada.serie}º ${turmaSelecionada.turma}".`);
      }
    } else {
      erros.push('O campo "Turma" é obrigatório.');
    }

    // Validação do Responsável
    const nomeResponsavel = String(rawResponsavel).trim();
    if (!nomeResponsavel) {
      erros.push('O campo "Nome do Responsável" é obrigatório para o vínculo familiar.');
    } else {
      const respExistente = existingResponsaveis.find(
        r => normalizarIdentificador(r.nome) === normalizarIdentificador(nomeResponsavel)
      );
      if (respExistente) {
        avisos.push(`Responsável "${respExistente.nome}" já existe e será vinculado.`);
      } else {
        avisos.push(`Novo responsável "${nomeResponsavel}" será cadastrado com login de acesso.`);
      }
    }

    // Regra de Compras Autônomas
    let podeComprar = true;
    if (rawPodeComprar) {
      const strPode = normalizarTexto(String(rawPodeComprar));
      if (['nao', 'n', 'false', '0', 'bloqueado', 'bloqueada'].includes(strPode)) {
        podeComprar = false;
      }
    }

    // Detecção de Duplicidades:
    let status: 'valido' | 'invalido' | 'duplicado' = 'valido';

    // 1. Matrícula escolar única (se informada)
    if (matNorm) {
      if (matriculasNoArquivo.has(matNorm)) {
        status = 'duplicado';
        erros.push(`Matrícula escolar "${matricula}" está duplicada dentro desta planilha.`);
      } else {
        matriculasNoArquivo.add(matNorm);
      }

      const matriculaExisteNoBanco = existingAlunos.some(
        a => a.matricula && normalizarIdentificador(a.matricula) === matNorm
      );
      if (matriculaExisteNoBanco) {
        status = 'duplicado';
        erros.push(`A matrícula escolar "${matricula}" já está vinculada a outro(a) aluno(a) no sistema.`);
      }
    }

    // 2. Aluno com mesmo nome na MESMA turma (evita dupla matrícula na mesma turma)
    // OBS: Dois alunos com mesmo nome em turmas diferentes são PERMITIDOS!
    if (nome && turmaSelecionada) {
      const chaveAlunoTurma = `${turmaSelecionada.id}___${normalizarIdentificador(nome)}`;
      if (alunosPorTurmaNoArquivo.has(chaveAlunoTurma)) {
        status = 'duplicado';
        erros.push(`Aluno "${nome}" para a turma ${turmaSelecionada.serie}º ${turmaSelecionada.turma} está duplicado na planilha.`);
      } else {
        alunosPorTurmaNoArquivo.add(chaveAlunoTurma);
      }

      const jaExisteNaTurma = existingAlunos.some(
        a => a.turmaId === turmaSelecionada!.id && normalizarIdentificador(a.nome) === normalizarIdentificador(nome)
      );
      if (jaExisteNaTurma) {
        status = 'duplicado';
        erros.push(`O aluno "${nome}" já está matriculado na turma ${turmaSelecionada.serie}º ${turmaSelecionada.turma}.`);
      }
    }

    if (erros.length > 0 && status !== 'duplicado') {
      status = 'invalido';
    }

    const dadosValidados: AlunoImportData | undefined =
      status === 'valido' && turmaSelecionada
        ? {
            nome,
            matricula,
            turmaId: turmaSelecionada.id,
            turmaNome: `${turmaSelecionada.serie}º Ano ${turmaSelecionada.turma}`,
            nomeResponsavel,
            podeComprar,
            senha: rawSenha ? String(rawSenha).trim() : '123',
          }
        : undefined;

    resultados.push({
      linha,
      dadosBrutos: row,
      dadosValidados,
      status,
      erros,
      avisos,
    });
  });

  return {
    totalLinhas: rows.length,
    validos: resultados.filter(r => r.status === 'valido').length,
    invalidos: resultados.filter(r => r.status === 'invalido').length,
    duplicados: resultados.filter(r => r.status === 'duplicado').length,
    linhas: resultados,
    nomeArquivo,
    tamanhoArquivo,
  };
}

// -------------------------------------------------------------
// Validação: Produtos
// -------------------------------------------------------------
export function validarPlanilhaProdutos(
  rows: Record<string, any>[],
  existingProdutos: Produto[],
  existingCategorias: Categoria[],
  nomeArquivo: string,
  tamanhoArquivo: number
): SpreadsheetValidationSummary<ProdutoImportData> {
  const resultados: RowValidationResult<ProdutoImportData>[] = [];
  const codigosNoArquivo = new Set<string>();
  const produtosPorCatNoArquivo = new Set<string>();

  rows.forEach((row, index) => {
    const linha = index + 2;
    const erros: string[] = [];
    const avisos: string[] = [];

    const rawNome =
      row['Nome do Produto'] ||
      row['Nome'] ||
      row['Produto'] ||
      row['Item'] ||
      '';
    const rawCodigo =
      row['Codigo / SKU'] ||
      row['Código / SKU'] ||
      row['Codigo'] ||
      row['Código'] ||
      row['SKU'] ||
      row['sku'] ||
      '';
    const rawCusto =
      row['Custo em PoloCoins'] ||
      row['Custo'] ||
      row['Pontos'] ||
      row['PoloCoins'] ||
      row['Preço'] ||
      row['Preco'] ||
      '';
    const rawCategoria =
      row['Categoria'] ||
      row['categoria'] ||
      '';
    const rawEstoque =
      row['Estoque Disponivel'] ||
      row['Estoque Disponível'] ||
      row['Estoque'] ||
      row['Qtd'] ||
      row['Quantidade'] ||
      '';

    const nome = String(rawNome).trim();
    if (!nome) {
      erros.push('O campo "Nome do Produto" é obrigatório.');
    } else if (nome.length < 2) {
      erros.push('O nome do produto deve ter pelo menos 2 caracteres.');
    }

    const codigo = String(rawCodigo).trim() || undefined;
    const codNorm = normalizarIdentificador(codigo);

    // Custo em PoloCoins
    const custoNum = Number(String(rawCusto).replace(',', '.').trim());
    if (isNaN(custoNum) || custoNum <= 0 || !Number.isInteger(custoNum)) {
      erros.push('O "Custo em PoloCoins" deve ser um número inteiro positivo maior que zero.');
    }

    // Categoria
    let categoria = String(rawCategoria).trim();
    if (!categoria) {
      categoria = 'Geral';
      avisos.push('Categoria não informada. Será atribuída como "Geral".');
    } else {
      const catExistente = existingCategorias.find(
        c => normalizarIdentificador(c.nome) === normalizarIdentificador(categoria)
      );
      if (catExistente) {
        categoria = catExistente.nome; // Manter a grafia oficial
      } else {
        avisos.push(`A categoria "${categoria}" será cadastrada automaticamente no sistema.`);
      }
    }

    // Estoque
    let estoque: number | undefined = undefined;
    if (rawEstoque !== undefined && String(rawEstoque).trim() !== '') {
      const estoqueNum = Number(String(rawEstoque).trim());
      if (isNaN(estoqueNum) || estoqueNum < 0 || !Number.isInteger(estoqueNum)) {
        erros.push('O "Estoque Disponível" deve ser um número inteiro maior ou igual a zero.');
      } else {
        estoque = estoqueNum;
      }
    } else {
      avisos.push('Estoque não informado (será considerado ilimitado).');
    }

    // Detecção de Duplicidades:
    let status: 'valido' | 'invalido' | 'duplicado' = 'valido';

    // 1. Código / SKU único (se fornecido)
    if (codNorm) {
      if (codigosNoArquivo.has(codNorm)) {
        status = 'duplicado';
        erros.push(`Código / SKU "${codigo}" está duplicado dentro desta planilha.`);
      } else {
        codigosNoArquivo.add(codNorm);
      }

      const codigoExisteNoBanco = existingProdutos.some(
        p => p.codigo && normalizarIdentificador(p.codigo) === codNorm
      );
      if (codigoExisteNoBanco) {
        status = 'duplicado';
        erros.push(`Já existe um produto com o código / SKU "${codigo}" cadastrado na loja.`);
      }
    }

    // 2. Nome na mesma categoria (evita itens duplicados gerando estoques inconsistentes)
    // Produtos em categorias diferentes com nomes iguais são permitidos se não tiverem o mesmo código.
    if (nome) {
      const chaveProd = `${normalizarIdentificador(categoria)}___${normalizarIdentificador(nome)}`;
      if (produtosPorCatNoArquivo.has(chaveProd)) {
        status = 'duplicado';
        erros.push(`Produto "${nome}" na categoria "${categoria}" já está listado nesta planilha.`);
      } else {
        produtosPorCatNoArquivo.add(chaveProd);
      }

      const jaExisteNoBanco = existingProdutos.some(
        p =>
          normalizarIdentificador(p.categoria || 'Geral') === normalizarIdentificador(categoria) &&
          normalizarIdentificador(p.nome) === normalizarIdentificador(nome)
      );
      if (jaExisteNoBanco) {
        status = 'duplicado';
        erros.push(`O produto "${nome}" na categoria "${categoria}" já está cadastrado na loja.`);
      }
    }

    if (erros.length > 0 && status !== 'duplicado') {
      status = 'invalido';
    }

    const dadosValidados: ProdutoImportData | undefined =
      status === 'valido'
        ? {
            nome,
            codigo,
            custoPontos: custoNum,
            categoria,
            estoque,
          }
        : undefined;

    resultados.push({
      linha,
      dadosBrutos: row,
      dadosValidados,
      status,
      erros,
      avisos,
    });
  });

  return {
    totalLinhas: rows.length,
    validos: resultados.filter(r => r.status === 'valido').length,
    invalidos: resultados.filter(r => r.status === 'invalido').length,
    duplicados: resultados.filter(r => r.status === 'duplicado').length,
    linhas: resultados,
    nomeArquivo,
    tamanhoArquivo,
  };
}

// -------------------------------------------------------------
// Helper para identificação de Turmas
// Resolve com segurança "1A", "1ºA", "1º Ano A", "1-A", "1 A"
// -------------------------------------------------------------
function encontrarTurmaPorTexto(texto: string, turmas: Turma[]): Turma | null {
  if (!texto) return null;
  const limpo = normalizarTexto(texto).replace(/\s+/g, '');

  // 1. Procura match exato por formato `${serie}ºano${turma}`
  for (const t of turmas) {
    const format1 = normalizarTexto(`${t.serie}ºano${t.turma}`).replace(/\s+/g, '');
    const format2 = normalizarTexto(`${t.serie}${t.turma}`).replace(/\s+/g, '');
    const format3 = normalizarTexto(`${t.serie}º${t.turma}`).replace(/\s+/g, '');
    const format4 = normalizarTexto(`${t.serie}ano${t.turma}`).replace(/\s+/g, '');

    if (
      limpo === format1 ||
      limpo === format2 ||
      limpo === format3 ||
      limpo === format4 ||
      limpo === `${t.serie}-${normalizarTexto(t.turma)}`
    ) {
      return t;
    }
  }

  // 2. Extrair número (série) e letra (turma) via regex
  const match = limpo.match(/(\d+)\D*([a-z])/i);
  if (match) {
    const num = Number(match[1]);
    const letra = match[2].toUpperCase();
    const candidatas = turmas.filter(t => t.serie === num && t.turma.toUpperCase() === letra);
    if (candidatas.length === 1) {
      return candidatas[0];
    }
  }

  return null;
}
