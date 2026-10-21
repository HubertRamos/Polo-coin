import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import {
  ImportType,
  SpreadsheetValidationSummary,
  RowValidationResult,
  downloadModelo,
  lerArquivoPlanilha,
  validarPlanilhaProfessores,
  validarPlanilhaAlunos,
  validarPlanilhaProdutos,
} from '../../lib/spreadsheetImport';

interface ImportarPlanilhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: ImportType;
  turmaIdPadrao?: number;
  onSuccess?: () => void;
}

type Etapa = 'selecionar' | 'preview' | 'confirmar' | 'resultado';
type FiltroPreview = 'todos' | 'validos' | 'invalidos' | 'duplicados';

export const ImportarPlanilhaModal: React.FC<ImportarPlanilhaModalProps> = ({
  isOpen,
  onClose,
  tipo,
  turmaIdPadrao,
  onSuccess,
}) => {
  const {
    professores,
    turmas,
    alunos,
    responsaveis,
    produtos,
    categorias,
    importarProfessoresEmMassa,
    importarAlunosEmMassa,
    importarProdutosEmMassa,
  } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados do fluxo
  const [etapa, setEtapa] = useState<Etapa>('selecionar');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lendoArquivo, setLendoArquivo] = useState(false);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);

  // Dados validados
  const [resumoValidacao, setResumoValidacao] = useState<SpreadsheetValidationSummary | null>(null);
  const [filtroPreview, setFiltroPreview] = useState<FiltroPreview>('todos');
  const [importarApenasValidos, setImportarApenasValidos] = useState(true);

  // Processamento e resultado final
  const [processando, setProcessando] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<{
    criados: number;
    ignorados: number;
    falhas: number;
    erros: { linha?: number; item: string; motivo: string }[];
  } | null>(null);

  // Reset ao fechar ou reabrir
  const resetarFluxo = () => {
    setEtapa('selecionar');
    setArquivo(null);
    setLendoArquivo(false);
    setErroLeitura(null);
    setResumoValidacao(null);
    setFiltroPreview('todos');
    setImportarApenasValidos(true);
    setProcessando(false);
    setResultadoFinal(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetarFluxo();
    onClose();
  };

  const tituloTipo =
    tipo === 'professores'
      ? 'Professores'
      : tipo === 'alunos'
      ? 'Alunos'
      : 'Produtos da Loja';

  // -------------------------------------------------------------
  // Etapa 1: Seleção de Arquivo e Validação Inicial
  // -------------------------------------------------------------
  const processarArquivoSelecionado = async (file: File) => {
    setArquivo(file);
    setErroLeitura(null);
    setLendoArquivo(true);

    try {
      const { rows } = await lerArquivoPlanilha(file);

      if (rows.length === 0) {
        throw new Error('A planilha não contém linhas de dados preenchidas.');
      }

      let summary: SpreadsheetValidationSummary;

      if (tipo === 'professores') {
        summary = validarPlanilhaProfessores(
          rows,
          professores,
          turmas,
          file.name,
          file.size
        );
      } else if (tipo === 'alunos') {
        summary = validarPlanilhaAlunos(
          rows,
          alunos,
          turmas,
          responsaveis,
          turmaIdPadrao,
          file.name,
          file.size
        );
      } else {
        summary = validarPlanilhaProdutos(
          rows,
          produtos,
          categorias,
          file.name,
          file.size
        );
      }

      setResumoValidacao(summary);
      setEtapa('preview');
      toast.info(`Planilha analisada com sucesso: ${summary.totalLinhas} linhas encontradas.`);
    } catch (err: any) {
      setErroLeitura(err?.message || 'Falha ao processar o arquivo.');
      toast.error(err?.message || 'Erro ao ler arquivo.');
    } finally {
      setLendoArquivo(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processarArquivoSelecionado(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processarArquivoSelecionado(files[0]);
    }
  };

  // -------------------------------------------------------------
  // Etapa 4: Gravação e Execução no Backend
  // -------------------------------------------------------------
  const handleConfirmarImportacao = async () => {
    if (!resumoValidacao || processando) return;

    // Linhas a serem importadas: apenas as válidas
    const linhasParaImportar = resumoValidacao.linhas.filter(r => r.status === 'valido');

    if (linhasParaImportar.length === 0) {
      toast.warning('Nenhum registro válido disponível para importar.');
      return;
    }

    setProcessando(true);
    setEtapa('confirmar');

    try {
      let res;
      if (tipo === 'professores') {
        const dados = linhasParaImportar.map(l => l.dadosValidados!);
        res = await importarProfessoresEmMassa(dados);
      } else if (tipo === 'alunos') {
        const dados = linhasParaImportar.map(l => l.dadosValidados!);
        res = await importarAlunosEmMassa(dados);
      } else {
        const dados = linhasParaImportar.map(l => l.dadosValidados!);
        res = await importarProdutosEmMassa(dados);
      }

      // Adicionar aos erros da resposta os itens que foram rejeitados previamente na validação da planilha
      const errosTotais = [...res.erros];
      resumoValidacao.linhas
        .filter(l => l.status !== 'valido')
        .forEach(l => {
          errosTotais.push({
            linha: l.linha,
            item:
              l.dadosBrutos['Nome Completo'] ||
              l.dadosBrutos['Nome Completo do Aluno'] ||
              l.dadosBrutos['Nome do Produto'] ||
              `Linha ${l.linha}`,
            motivo: l.erros.join('; ') || 'Registro inválido ou duplicado na planilha.',
          });
        });

      setResultadoFinal({
        criados: res.criados,
        ignorados: res.ignorados + resumoValidacao.duplicados,
        falhas: res.falhas + resumoValidacao.invalidos,
        erros: errosTotais,
      });

      setEtapa('resultado');

      if (res.criados > 0) {
        toast.success(`${res.criados} ${tituloTipo.toLowerCase()} cadastrado(s) com sucesso!`);
        if (onSuccess) onSuccess();
      } else {
        toast.warning('Nenhum registro pôde ser cadastrado.');
      }
    } catch (err: any) {
      toast.error('Erro inesperado durante a gravação dos dados.');
    } finally {
      setProcessando(false);
    }
  };

  // Filtragem de linhas na pré-visualização
  const linhasFiltradas = resumoValidacao
    ? resumoValidacao.linhas.filter(r => {
        if (filtroPreview === 'validos') return r.status === 'valido';
        if (filtroPreview === 'invalidos') return r.status === 'invalido';
        if (filtroPreview === 'duplicados') return r.status === 'duplicado';
        return true;
      })
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Importar ${tituloTipo} por Planilha`}
      subtitle="Cadastre múltiplos registros em lote com validação automática"
      maxWidth="860px"
    >
      <div>
        {/* Barra de Progresso das Etapas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: etapa === 'selecionar' ? 'var(--color-primary)' : 'var(--color-success)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              1
            </span>
            <strong style={{ color: etapa === 'selecionar' ? 'var(--color-primary)' : 'var(--text-primary)' }}>
              Selecionar
            </strong>
          </div>

          <span style={{ color: 'var(--text-muted)' }}>➔</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  etapa === 'preview'
                    ? 'var(--color-primary)'
                    : ['confirmar', 'resultado'].includes(etapa)
                    ? 'var(--color-success)'
                    : 'var(--bg-subtle)',
                color: ['preview', 'confirmar', 'resultado'].includes(etapa) ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              2
            </span>
            <strong
              style={{
                color: etapa === 'preview' ? 'var(--color-primary)' : 'var(--text-secondary)',
              }}
            >
              Pré-visualização
            </strong>
          </div>

          <span style={{ color: 'var(--text-muted)' }}>➔</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  etapa === 'confirmar'
                    ? 'var(--color-primary)'
                    : etapa === 'resultado'
                    ? 'var(--color-success)'
                    : 'var(--bg-subtle)',
                color: ['confirmar', 'resultado'].includes(etapa) ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              3
            </span>
            <strong
              style={{
                color:
                  etapa === 'confirmar'
                    ? 'var(--color-primary)'
                    : etapa === 'resultado'
                    ? 'var(--color-success)'
                    : 'var(--text-secondary)',
              }}
            >
              Gravar & Resultado
            </strong>
          </div>
        </div>

        {/* -------------------------------------------------------------
            ETAPA 1: Seleção de Arquivo e Download de Modelos
        ------------------------------------------------------------- */}
        {etapa === 'selecionar' && (
          <div>
            {/* Dropzone de upload */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--border-color)'}`,
                backgroundColor: isDragging ? 'var(--color-primary-soft)' : 'var(--bg-subtle)',
                borderRadius: '14px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />

              <div style={{ fontSize: '38px', marginBottom: '10px' }}>
                {lendoArquivo ? '⏳' : '📂'}
              </div>

              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800 }}>
                {lendoArquivo ? 'Lendo e validando planilha...' : 'Arraste sua planilha aqui ou clique para selecionar'}
              </h4>

              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Formatos aceitos: <strong>Excel (.xlsx, .xls)</strong> e <strong>CSV (.csv)</strong> até 5 MB (máximo 500 linhas)
              </p>

              {arquivo && !lendoArquivo && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '16px',
                    padding: '6px 14px',
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                  }}
                >
                  <span>📄 {arquivo.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    ({(arquivo.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>

            {/* Ações de Download dos Modelos */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                marginTop: '16px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => downloadModelo(tipo, 'xlsx')}
                style={{ fontSize: '12.5px', padding: '7px 14px' }}
                title="Baixar modelo formatado em Excel (.xlsx) com instruções"
              >
                <span>📊</span> Baixar Modelo Excel (.xlsx)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => downloadModelo(tipo, 'csv')}
                style={{ fontSize: '12.5px', padding: '7px 14px' }}
                title="Baixar modelo em CSV (.csv) com codificação UTF-8"
              >
                <span>📄</span> Baixar Modelo CSV (.csv)
              </button>
            </div>

            {/* Alerta de Erro de Leitura */}
            {erroLeitura && (
              <div className="alert alert-danger" style={{ marginTop: '16px', fontSize: '13px' }}>
                <span>⚠️ {erroLeitura}</span>
              </div>
            )}

            {/* Orientações sobre campos e segurança */}
            <div style={{ marginTop: '20px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              <strong>Dicas de importação segura:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: '20px' }}>
                {tipo === 'professores' && (
                  <>
                    <li>Nome Completo é obrigatório. Se o usuário for omitido, ele será gerado automaticamente.</li>
                    <li>Turmas vinculadas devem coincidir com as turmas já criadas (ex: "1A", "1º Ano A").</li>
                    <li>Por segurança, senhas reais nunca devem ser colocadas na planilha. O sistema atribui acesso seguro padrão.</li>
                  </>
                )}
                {tipo === 'alunos' && (
                  <>
                    <li>Nome do Aluno, Turma e Nome do Responsável são campos obrigatórios.</li>
                    <li>Novos alunos iniciam com 0 PoloCoins e avatar padrão de segurança.</li>
                    <li>Se a turma já possuir um aluno com o mesmo nome, a duplicidade será identificada e protegida.</li>
                  </>
                )}
                {tipo === 'produtos' && (
                  <>
                    <li>Nome, Custo em PoloCoins e Categoria são obrigatórios.</li>
                    <li>O custo em PoloCoins deve ser um número inteiro positivo (maior que zero).</li>
                    <li>O estoque é opcional. Se deixar vazio, será considerado estoque ilimitado.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            ETAPA 2 & 3: Pré-visualização e Diagnóstico por Linha
        ------------------------------------------------------------- */}
        {etapa === 'preview' && resumoValidacao && (
          <div>
            {/* Cards de Resumo */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total de Linhas
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900 }}>{resumoValidacao.totalLinhas}</div>
              </div>

              <div
                style={{
                  background: '#f0fdf4',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase' }}>
                  Válidos
                </div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#166534' }}>
                  {resumoValidacao.validos}
                </div>
              </div>

              <div
                style={{
                  background: resumoValidacao.invalidos > 0 ? '#fef2f2' : 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${resumoValidacao.invalidos > 0 ? '#fecaca' : 'var(--border-color)'}`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: resumoValidacao.invalidos > 0 ? '#991b1b' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Com Erros
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 900,
                    color: resumoValidacao.invalidos > 0 ? '#991b1b' : 'inherit',
                  }}
                >
                  {resumoValidacao.invalidos}
                </div>
              </div>

              <div
                style={{
                  background: resumoValidacao.duplicados > 0 ? '#fffbeb' : 'var(--bg-subtle)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1px solid ${resumoValidacao.duplicados > 0 ? '#fde68a' : 'var(--border-color)'}`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: resumoValidacao.duplicados > 0 ? '#92400e' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Duplicidades
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 900,
                    color: resumoValidacao.duplicados > 0 ? '#92400e' : 'inherit',
                  }}
                >
                  {resumoValidacao.duplicados}
                </div>
              </div>
            </div>

            {/* Filtros da Tabela */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className={`btn btn--sm ${filtroPreview === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFiltroPreview('todos')}
                >
                  Todos ({resumoValidacao.totalLinhas})
                </button>
                <button
                  type="button"
                  className={`btn btn--sm ${filtroPreview === 'validos' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFiltroPreview('validos')}
                >
                  Válidos ({resumoValidacao.validos})
                </button>
                {resumoValidacao.invalidos > 0 && (
                  <button
                    type="button"
                    className={`btn btn--sm ${filtroPreview === 'invalidos' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFiltroPreview('invalidos')}
                  >
                    Erros ({resumoValidacao.invalidos})
                  </button>
                )}
                {resumoValidacao.duplicados > 0 && (
                  <button
                    type="button"
                    className={`btn btn--sm ${filtroPreview === 'duplicados' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFiltroPreview('duplicados')}
                  >
                    Duplicados ({resumoValidacao.duplicados})
                  </button>
                )}
              </div>

              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Arquivo: <strong>{resumoValidacao.nomeArquivo}</strong>
              </span>
            </div>

            {/* Tabela de Pré-visualização com Linhas */}
            <div
              className="tabela-wrapper"
              style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}
            >
              <table className="tabela" style={{ fontSize: '12.5px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>Linha</th>
                    <th style={{ width: '100px' }}>Status</th>
                    {tipo === 'professores' && (
                      <>
                        <th>Nome</th>
                        <th>Usuário</th>
                        <th>Turmas</th>
                      </>
                    )}
                    {tipo === 'alunos' && (
                      <>
                        <th>Aluno</th>
                        <th>Turma</th>
                        <th>Responsável</th>
                        <th>Compras Autônomas</th>
                      </>
                    )}
                    {tipo === 'produtos' && (
                      <>
                        <th>Produto</th>
                        <th>Custo</th>
                        <th>Categoria</th>
                        <th>Estoque</th>
                      </>
                    )}
                    <th>Diagnóstico</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        Nenhum registro para o filtro selecionado.
                      </td>
                    </tr>
                  ) : (
                    linhasFiltradas.map((r, idx) => {
                      const isValido = r.status === 'valido';
                      const isDuplicado = r.status === 'duplicado';

                      return (
                        <tr
                          key={idx}
                          style={{
                            backgroundColor: isValido
                              ? undefined
                              : isDuplicado
                              ? '#fffbeb'
                              : '#fef2f2',
                          }}
                        >
                          <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                            #{r.linha}
                          </td>
                          <td>
                            {isValido && <span className="badge badge-success">Válido</span>}
                            {isDuplicado && <span className="badge badge-warning">Duplicado</span>}
                            {r.status === 'invalido' && <span className="badge badge-danger">Erro</span>}
                          </td>

                          {tipo === 'professores' && (
                            <>
                              <td>
                                <strong>{r.dadosValidados?.nome || r.dadosBrutos['Nome Completo'] || '—'}</strong>
                              </td>
                              <td>
                                <code>@{r.dadosValidados?.usuario || r.dadosBrutos['Usuario de Acesso'] || '—'}</code>
                              </td>
                              <td>
                                {r.dadosValidados?.turmasNomes.join(', ') || r.dadosBrutos['Turmas Vinculadas'] || 'Nenhuma'}
                              </td>
                            </>
                          )}

                          {tipo === 'alunos' && (
                            <>
                              <td>
                                <strong>{r.dadosValidados?.nome || r.dadosBrutos['Nome Completo do Aluno'] || '—'}</strong>
                              </td>
                              <td>{r.dadosValidados?.turmaNome || r.dadosBrutos['Turma'] || '—'}</td>
                              <td>{r.dadosValidados?.nomeResponsavel || r.dadosBrutos['Nome do Responsavel'] || '—'}</td>
                              <td>
                                {r.dadosValidados?.podeComprar ? (
                                  <span className="badge badge-info">Liberado</span>
                                ) : (
                                  <span className="badge badge-neutral">Com aprovação</span>
                                )}
                              </td>
                            </>
                          )}

                          {tipo === 'produtos' && (
                            <>
                              <td>
                                <strong>{r.dadosValidados?.nome || r.dadosBrutos['Nome do Produto'] || '—'}</strong>
                              </td>
                              <td>
                                <span style={{ fontWeight: 800, color: 'var(--color-coin-dark)' }}>
                                  🪙 {r.dadosValidados?.custoPontos ?? r.dadosBrutos['Custo em PoloCoins'] ?? '—'}
                                </span>
                              </td>
                              <td>{r.dadosValidados?.categoria || r.dadosBrutos['Categoria'] || '—'}</td>
                              <td>
                                {r.dadosValidados?.estoque !== undefined
                                  ? `${r.dadosValidados.estoque} unid.`
                                  : 'Ilimitado'}
                              </td>
                            </>
                          )}

                          <td>
                            {r.erros.length > 0 ? (
                              <div style={{ color: 'var(--color-danger)', fontSize: '11.5px' }}>
                                {r.erros.map((e, ei) => (
                                  <div key={ei}>• {e}</div>
                                ))}
                              </div>
                            ) : r.avisos.length > 0 ? (
                              <div style={{ color: 'var(--color-warning)', fontSize: '11.5px' }}>
                                {r.avisos.map((a, ai) => (
                                  <div key={ai}>ℹ️ {a}</div>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-success)', fontSize: '11.5px' }}>
                                ✓ Pronto para gravar
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Aviso sobre linhas inválidas/duplicadas */}
            {(resumoValidacao.invalidos > 0 || resumoValidacao.duplicados > 0) && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>ℹ️</span>
                <span>
                  Foram encontradas <strong>{resumoValidacao.invalidos + resumoValidacao.duplicados} linha(s)</strong> com erros ou duplicidades. Elas serão desconsideradas na gravação para proteger a integridade do banco de dados.
                </span>
              </div>
            )}

            {/* Botões de Ação Pré-visualização */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEtapa('selecionar')}
              >
                ← Escolher Outro Arquivo
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={resumoValidacao.validos === 0}
                  onClick={() => setEtapa('confirmar')}
                >
                  Continuar com {resumoValidacao.validos} Válido(s) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            ETAPA 4: Confirmação Explícita Antes da Gravação
        ------------------------------------------------------------- */}
        {etapa === 'confirmar' && resumoValidacao && (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🛡️</div>

            <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 900 }}>
              Confirmar Gravação de Dados
            </h3>

            <div
              style={{
                maxWidth: '560px',
                margin: '0 auto 20px',
                background: 'var(--bg-subtle)',
                borderRadius: '12px',
                padding: '18px',
                border: '1px solid var(--border-color)',
                textAlign: 'left',
                fontSize: '13.5px',
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: '0 0 10px' }}>
                Você está prestes a cadastrar <strong>{resumoValidacao.validos} {tituloTipo.toLowerCase()}</strong> no PoloCoin.
              </p>

              {resumoValidacao.invalidos + resumoValidacao.duplicados > 0 && (
                <p style={{ margin: '0 0 10px', color: 'var(--color-warning)' }}>
                  ⚠️ <strong>Atenção:</strong> Foram encontradas{' '}
                  <strong>{resumoValidacao.invalidos + resumoValidacao.duplicados} linha(s)</strong> inválidas ou duplicadas que <strong>NÃO</strong> serão importadas.
                </p>
              )}

              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Os novos registros serão persistidos no banco de dados e sincronizados imediatamente na interface. Nenhum registro existente será sobrescrito silenciosamente.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEtapa('preview')}
                disabled={processando}
              >
                ← Voltar e Revisar
              </button>

              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmarImportacao}
                disabled={processando || resumoValidacao.validos === 0}
              >
                {processando ? 'Gravando no servidor...' : `Confirmar Importação de ${resumoValidacao.validos} Registro(s)`}
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            ETAPA 5: Relatório Final de Resultados
        ------------------------------------------------------------- */}
        {etapa === 'resultado' && resultadoFinal && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {resultadoFinal.criados > 0 ? '🎉' : '⚠️'}
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 900 }}>
                {resultadoFinal.criados > 0
                  ? 'Importação Concluída com Sucesso!'
                  : 'Nenhum registro pôde ser gravado'}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Resumo da operação executada no sistema PoloCoin
              </p>
            </div>

            {/* Painel de Resultados */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  background: '#f0fdf4',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase' }}>
                  Criados com Sucesso
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#166534' }}>
                  {resultadoFinal.criados}
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Ignorados / Duplicados
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900 }}>
                  {resultadoFinal.ignorados}
                </div>
              </div>

              <div
                style={{
                  background: resultadoFinal.falhas > 0 ? '#fef2f2' : 'var(--bg-subtle)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: `1px solid ${resultadoFinal.falhas > 0 ? '#fecaca' : 'var(--border-color)'}`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: resultadoFinal.falhas > 0 ? '#991b1b' : 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Falhas de Gravação
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: resultadoFinal.falhas > 0 ? '#991b1b' : 'inherit',
                  }}
                >
                  {resultadoFinal.falhas}
                </div>
              </div>
            </div>

            {/* Detalhes de Linhas com Erros / Ignoradas */}
            {resultadoFinal.erros.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, marginBottom: '8px' }}>
                  Detalhamento de Linhas com Observações ({resultadoFinal.erros.length}):
                </h4>
                <div
                  style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    padding: '8px',
                    fontSize: '12px',
                  }}
                >
                  {resultadoFinal.erros.map((err, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '6px 8px',
                        borderBottom: i < resultadoFinal.erros.length - 1 ? '1px solid var(--border-color)' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <span>
                        {err.linha && <strong>Linha #{err.linha}: </strong>}
                        <strong>{err.item}</strong> — {err.motivo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetarFluxo}
              >
                Importar Outra Planilha
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClose}
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
