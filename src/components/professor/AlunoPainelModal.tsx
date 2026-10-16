import React, { useState } from 'react';
import { Aluno, Turma } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { CATEGORIAS_AVALIACAO } from '../../data/categoriasAvaliacao';

interface AlunoPainelModalProps {
  aluno: Aluno | null;
  turma: Turma | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AlunoPainelModal: React.FC<AlunoPainelModalProps> = ({
  aluno,
  turma,
  isOpen,
  onClose,
}) => {
  const { avaliacoes, addAvaliacao } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [tipoAvaliacao, setTipoAvaliacao] = useState<'positiva' | 'negativa'>('positiva');
  const [categoriaSel, setCategoriaSel] = useState<string>(CATEGORIAS_AVALIACAO[0].nome);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>('');
  const [pontos, setPontos] = useState<number>(20);
  const [observacao, setObservacao] = useState<string>('');

  if (!aluno) return null;

  const historicoAluno = avaliacoes.filter(av => av.alunoId === aluno.id);

  const categoriaAtual = CATEGORIAS_AVALIACAO.find(c => c.nome === categoriaSel) || CATEGORIAS_AVALIACAO[0];
  const opcoesFiltradas = categoriaAtual.opcoes.filter(op => op.tipo === tipoAvaliacao);

  const handleSelectOpcao = (opcao: typeof categoriaAtual.opcoes[0]) => {
    setOpcaoSelecionada(opcao.valor);
    setPontos(opcao.pontos);
    if (!observacao) {
      setObservacao(opcao.descricao);
    }
  };

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pontos <= 0) {
      toast.warning('O valor de pontos deve ser maior que zero.');
      return;
    }

    const valorFinal = opcaoSelecionada || (tipoAvaliacao === 'positiva' ? 'Destaque' : 'Aviso');

    await addAvaliacao(
      aluno.id,
      categoriaSel,
      valorFinal,
      Number(pontos),
      tipoAvaliacao,
      observacao.trim(),
      currentUser?.id,
      currentUser?.nome
    );

    toast.success(
      tipoAvaliacao === 'positiva'
        ? `+${pontos} PoloCoins atribuídos a ${aluno.nome}!`
        : `Ocorrência registrada para ${aluno.nome}.`
    );

    // Reset form
    setOpcaoSelecionada('');
    setObservacao('');
    setPontos(20);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Painel de Avaliação — ${aluno.nome}`}
      subtitle={`Turma ${turma?.serie}º Ano ${turma?.turma}`}
      maxWidth="680px"
    >
      <div>
        {/* Cartão de Identificação do Aluno */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)',
            padding: '14px 18px',
            borderRadius: '14px',
            marginBottom: '18px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>{aluno.avatar}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>{aluno.nome}</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {aluno.pode_comprar ? '✓ Compras Liberadas' : '⏸ Compras Pausadas'}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>
              SALDO ATUAL
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-coin-dark)' }}>
              🪙 {aluno.pontos} <span style={{ fontSize: '12px' }}>PoloCoins</span>
            </span>
          </div>
        </div>

        {/* Formulário de Avaliação */}
        <form onSubmit={handleSubmeter} style={{ marginBottom: '24px' }}>
          {/* Seletor Positiva vs Negativa */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              className={`btn ${tipoAvaliacao === 'positiva' ? 'btn-success' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px' }}
              onClick={() => {
                setTipoAvaliacao('positiva');
                setOpcaoSelecionada('');
              }}
            >
              🌟 Atribuir Pontos Positivos
            </button>
            <button
              type="button"
              className={`btn ${tipoAvaliacao === 'negativa' ? 'btn-danger' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '10px' }}
              onClick={() => {
                setTipoAvaliacao('negativa');
                setOpcaoSelecionada('');
              }}
            >
              ⚠️ Registrar Ocorrência / Negativa
            </button>
          </div>

          {/* Selecionar Categoria */}
          <div className="form-group">
            <label className="form-label">Categoria de Avaliação</label>
            <select
              className="form-select"
              value={categoriaSel}
              onChange={e => {
                setCategoriaSel(e.target.value);
                setOpcaoSelecionada('');
              }}
            >
              {CATEGORIAS_AVALIACAO.map(cat => (
                <option key={cat.nome} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Botões rápidos da categoria */}
          <div style={{ marginBottom: '14px' }}>
            <label className="form-label">Selecione o Motivo / Opção Rápida</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {opcoesFiltradas.map(op => {
                const isSelected = opcaoSelecionada === op.valor;
                return (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => handleSelectOpcao(op)}
                    style={{
                      background: isSelected ? op.cor : 'var(--bg-subtle)',
                      color: isSelected ? '#fff' : 'var(--text-primary)',
                      border: `1.5px solid ${op.cor}`,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{op.label}</span>
                    <span
                      style={{
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      {tipoAvaliacao === 'positiva' ? `+${op.pontos}` : `-${op.pontos}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantidade de Pontos */}
          <div className="form-group">
            <label className="form-label">PoloCoins a {tipoAvaliacao === 'positiva' ? 'Atribuir' : 'Deduzir'}</label>
            <input
              type="number"
              min="1"
              max="500"
              className="form-input"
              value={pontos}
              onChange={e => setPontos(Number(e.target.value))}
              required
            />
          </div>

          {/* Observação */}
          <div className="form-group">
            <label className="form-label">Observação Pedagógica (visível para o responsável)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Descreva o contexto ou comportamento observado..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="submit" className={`btn ${tipoAvaliacao === 'positiva' ? 'btn-success' : 'btn-danger'}`}>
              {tipoAvaliacao === 'positiva' ? 'Confirmar Atribuição de Pontos' : 'Registrar Ocorrência'}
            </button>
          </div>
        </form>

        {/* Histórico Recente do Aluno */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 800 }}>
            Histórico Recente de Avaliações ({historicoAluno.length})
          </h4>
          {historicoAluno.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Nenhuma avaliação registrada ainda para este aluno.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {historicoAluno.map(av => (
                <div
                  key={av.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--bg-subtle)',
                    borderLeft: `4px solid ${av.tipo === 'positiva' ? 'var(--color-success)' : 'var(--color-danger)'}`,
                    fontSize: '13px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong>
                      {av.tipo === 'positiva' ? '🌟 Ganho:' : '⚠️ Ocorrência:'} {av.valor} ({av.categoria})
                    </strong>
                    <span
                      style={{
                        fontWeight: 900,
                        color: av.tipo === 'positiva' ? 'var(--color-success)' : 'var(--color-danger)',
                      }}
                    >
                      {av.tipo === 'positiva' ? `+${av.pontos}` : `-${av.pontos}`} PoloCoins
                    </span>
                  </div>
                  {av.observacao && (
                    <p style={{ margin: '2px 0 4px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      "{av.observacao}"
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Registrado por {av.professorNome || 'Professor'}</span>
                    <span>
                      {av.data} às {av.hora}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
