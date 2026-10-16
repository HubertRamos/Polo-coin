import React, { useState } from 'react';
import { Turma, Aluno } from '../../types';
import { useData } from '../../context/DataContext';
import { Modal } from '../common/Modal';

interface RelatorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  turma: Turma | null;
  alunoEspecifico?: Aluno | null;
}

export const RelatorioModal: React.FC<RelatorioModalProps> = ({
  isOpen,
  onClose,
  turma,
  alunoEspecifico,
}) => {
  const { avaliacoes, alunos } = useData();

  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'positiva' | 'negativa'>('todas');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  if (!isOpen) return null;

  // Filter evaluations
  const turmaAlunosIds = alunoEspecifico
    ? [alunoEspecifico.id]
    : turma
    ? alunos.filter(a => a.turmaId === turma.id).map(a => a.id)
    : [];

  const avaliacoesFiltradas = avaliacoes.filter(av => {
    if (!turmaAlunosIds.includes(av.alunoId)) return false;
    if (filtroTipo !== 'todas' && av.tipo !== filtroTipo) return false;
    if (dataInicio && av.data < dataInicio) return false;
    if (dataFim && av.data > dataFim) return false;
    return true;
  });

  const totalPositivas = avaliacoesFiltradas.filter(av => av.tipo === 'positiva').length;
  const totalNegativas = avaliacoesFiltradas.filter(av => av.tipo === 'negativa').length;
  const totalPontosPositivos = avaliacoesFiltradas
    .filter(av => av.tipo === 'positiva')
    .reduce((sum, av) => sum + av.pontos, 0);

  const handlePrint = () => {
    window.print();
  };

  const titulo = alunoEspecifico
    ? `Relatório de Ocorrências: ${alunoEspecifico.nome}`
    : `Relatório da Turma ${turma?.serie}º Ano ${turma?.turma}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titulo}
      subtitle="Extrato escolar de pontos e observações pedagógicas"
      maxWidth="780px"
    >
      <div>
        {/* Filtros do Relatório */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '16px',
            flexWrap: 'wrap',
            background: 'var(--bg-subtle)',
            padding: '12px',
            borderRadius: '12px',
          }}
        >
          <div style={{ flex: 1, minWidth: '130px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Tipo</label>
            <select
              className="form-select form-input--sm"
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value as any)}
            >
              <option value="todas">Todas as Avaliações</option>
              <option value="positiva">Apenas Positivas (+)</option>
              <option value="negativa">Apenas Negativas (-)</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '130px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Data Início</label>
            <input
              type="date"
              className="form-input form-input--sm"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '130px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Data Fim</label>
            <input
              type="date"
              className="form-input form-input--sm"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
            />
          </div>
        </div>

        {/* Resumo Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
          <div style={{ background: '#ecfdf5', padding: '10px 14px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>
              Positivas
            </span>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#047857' }}>
              {totalPositivas} registros (+{totalPontosPositivos} pts)
            </div>
          </div>
          <div style={{ background: '#fef2f2', padding: '10px 14px', borderRadius: '10px', border: '1px solid #fecaca' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
              Ocorrências Negativas
            </span>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#b91c1c' }}>
              {totalNegativas} registros
            </div>
          </div>
          <div style={{ background: '#eef2ff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #c7d2fe' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#3730a3', textTransform: 'uppercase' }}>
              Total de Itens
            </span>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#4338ca' }}>
              {avaliacoesFiltradas.length} eventos
            </div>
          </div>
        </div>

        {/* Tabela de Ocorrências */}
        {avaliacoesFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📄</div>
            <div className="empty-state__text">Nenhuma ocorrência encontrada para o filtro.</div>
          </div>
        ) : (
          <div className="tabela-wrapper" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Aluno</th>
                  <th>Categoria</th>
                  <th>Motivo</th>
                  <th>Pontos</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {avaliacoesFiltradas.map(av => {
                  const aluno = alunos.find(a => a.id === av.alunoId);
                  return (
                    <tr key={av.id}>
                      <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {av.data} {av.hora}
                      </td>
                      <td>
                        <strong>{aluno?.nome || 'Aluno'}</strong>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{av.categoria}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: av.tipo === 'positiva' ? '#059669' : '#dc2626' }}>
                          {av.valor}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: av.tipo === 'positiva' ? '#059669' : '#dc2626' }}>
                          {av.tipo === 'positiva' ? `+${av.pontos}` : `-${av.pontos}`}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {av.observacao || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            🖨️ Imprimir Relatório
          </button>
        </div>
      </div>
    </Modal>
  );
};
