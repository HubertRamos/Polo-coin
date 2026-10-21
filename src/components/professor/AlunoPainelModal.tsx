import React, { useState, useEffect } from 'react';
import { Aluno, Turma } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { CATEGORIAS_AVALIACAO } from '../../data/categoriasAvaliacao';
import {
  CustomOccurrenceTemplate,
  obterModelosDoProfessor,
  salvarModeloPersonalizado,
  validarCamposOcorrencia,
} from '../../lib/customOccurrencesStorage';

interface AlunoPainelModalProps {
  aluno: Aluno | null;
  turma: Turma | null;
  isOpen: boolean;
  onClose: () => void;
}

type ModoOrigem = 'padrao' | 'meus-modelos' | 'personalizada-agora';

export const AlunoPainelModal: React.FC<AlunoPainelModalProps> = ({
  aluno,
  turma,
  isOpen,
  onClose,
}) => {
  const { avaliacoes, addAvaliacao } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const professorId = currentUser?.id || 1;

  const [tipoAvaliacao, setTipoAvaliacao] = useState<'positiva' | 'negativa'>('positiva');
  const [modoOrigem, setModoOrigem] = useState<ModoOrigem>('padrao');

  // Ocorrência padrão
  const [categoriaSel, setCategoriaSel] = useState<string>(CATEGORIAS_AVALIACAO[0].nome);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>('');

  // Modelos personalizados salvos
  const [modelosSalvos, setModelosSalvos] = useState<CustomOccurrenceTemplate[]>([]);
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState<string>('');

  // Nova ocorrência criada no momento
  const [nomePersonalizado, setNomePersonalizado] = useState<string>('');
  const [salvarParaDepois, setSalvarParaDepois] = useState<boolean>(true);

  // Campos comuns
  const [pontos, setPontos] = useState<number>(20);
  const [observacao, setObservacao] = useState<string>('');
  const [erroCustom, setErroCustom] = useState<string>('');

  // Carrega modelos locais sempre que o modal abre ou o tipo muda
  useEffect(() => {
    if (isOpen) {
      const list = obterModelosDoProfessor(professorId);
      setModelosSalvos(list);
    }
  }, [isOpen, professorId]);

  if (!aluno) return null;

  const historicoAluno = avaliacoes.filter(av => av.alunoId === aluno.id);

  const categoriaAtual = CATEGORIAS_AVALIACAO.find(c => c.nome === categoriaSel) || CATEGORIAS_AVALIACAO[0];
  const opcoesFiltradas = categoriaAtual.opcoes.filter(op => op.tipo === tipoAvaliacao);

  const modelosDoTipo = modelosSalvos.filter(m => m.tipo === tipoAvaliacao);

  const handleSelectOpcaoPadrao = (opcao: typeof categoriaAtual.opcoes[0]) => {
    setOpcaoSelecionada(opcao.valor);
    setPontos(opcao.pontos);
    if (!observacao) {
      setObservacao(opcao.descricao);
    }
  };

  const handleSelectModeloSalvo = (modelo: CustomOccurrenceTemplate) => {
    setModeloSelecionadoId(modelo.id);
    setPontos(modelo.pontos);
    if (!observacao) {
      setObservacao(modelo.nome);
    }
  };

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroCustom('');

    let valorFinal = '';
    let categoriaFinal = categoriaSel;
    const pontosNum = Number(pontos);

    if (modoOrigem === 'personalizada-agora') {
      const validacao = validarCamposOcorrencia(nomePersonalizado, tipoAvaliacao, pontosNum);
      if (!validacao.valido) {
        setErroCustom(validacao.erro || 'Preencha os campos obrigatórios da ocorrência.');
        return;
      }
      valorFinal = nomePersonalizado.trim();
      categoriaFinal = 'Personalizada';

      // Se o professor optou por salvar para reutilizar futuramente
      if (salvarParaDepois) {
        const resSalvar = salvarModeloPersonalizado(professorId, {
          nome: valorFinal,
          tipo: tipoAvaliacao,
          pontos: pontosNum,
        });
        if (resSalvar.success) {
          // Atualiza lista em memória
          setModelosSalvos(obterModelosDoProfessor(professorId));
        } else {
          console.warn('[PoloCoin] Aviso ao persistir modelo no localStorage:', resSalvar.error);
        }
      }
    } else if (modoOrigem === 'meus-modelos') {
      const modelo = modelosSalvos.find(m => m.id === modeloSelecionadoId);
      if (!modelo) {
        setErroCustom('Selecione um dos seus modelos salvos ou crie um novo.');
        return;
      }
      valorFinal = modelo.nome;
      categoriaFinal = 'Personalizada';
    } else {
      // Modo padrão
      if (!opcaoSelecionada) {
        setErroCustom('Selecione uma das opções rápidas de ocorrência.');
        return;
      }
      valorFinal = opcaoSelecionada;
      categoriaFinal = categoriaSel;
    }

    if (!pontosNum || pontosNum <= 0) {
      setErroCustom('O valor de PoloCoins deve ser maior que zero.');
      return;
    }

    await addAvaliacao(
      aluno.id,
      categoriaFinal,
      valorFinal,
      pontosNum,
      tipoAvaliacao,
      observacao.trim(),
      currentUser?.id,
      currentUser?.nome
    );

    toast.success(
      tipoAvaliacao === 'positiva'
        ? `+${pontosNum} PoloCoins atribuídos a ${aluno.nome}!`
        : `Ocorrência registrada para ${aluno.nome} (-${pontosNum} PoloCoins).`
    );

    // Reset form
    setOpcaoSelecionada('');
    setModeloSelecionadoId('');
    setNomePersonalizado('');
    setObservacao('');
    setPontos(20);
    setErroCustom('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Painel de Avaliação — ${aluno.nome}`}
      subtitle={`Turma ${turma?.serie}º Ano ${turma?.turma}`}
      maxWidth="720px"
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
                setModeloSelecionadoId('');
                setErroCustom('');
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
                setModeloSelecionadoId('');
                setErroCustom('');
              }}
            >
              ⚠️ Registrar Ocorrência Negativa
            </button>
          </div>

          {/* Abas de Origem da Ocorrência: Padrões vs Meus Modelos vs Criar Agora */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: 'var(--bg-subtle)',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '16px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className={`btn ${modoOrigem === 'padrao' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '7px 10px',
                borderRadius: '8px',
                fontWeight: 700,
              }}
              onClick={() => {
                setModoOrigem('padrao');
                setErroCustom('');
              }}
            >
              🏷️ Ocorrências Padrão
            </button>

            <button
              type="button"
              className={`btn ${modoOrigem === 'meus-modelos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '7px 10px',
                borderRadius: '8px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onClick={() => {
                setModoOrigem('meus-modelos');
                setErroCustom('');
              }}
            >
              <span>⭐ Meus Modelos Salvos</span>
              {modelosDoTipo.length > 0 && (
                <span
                  style={{
                    background: modoOrigem === 'meus-modelos' ? 'rgba(255,255,255,0.3)' : 'var(--bg-surface)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 800,
                  }}
                >
                  {modelosDoTipo.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`btn ${modoOrigem === 'personalizada-agora' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '7px 10px',
                borderRadius: '8px',
                fontWeight: 700,
              }}
              onClick={() => {
                setModoOrigem('personalizada-agora');
                setErroCustom('');
              }}
            >
              ✍️ Criar Personalizada
            </button>
          </div>

          {/* MODO 1: Ocorrências Padrão do Sistema */}
          {modoOrigem === 'padrao' && (
            <>
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
                        onClick={() => handleSelectOpcaoPadrao(op)}
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
            </>
          )}

          {/* MODO 2: Meus Modelos Salvos */}
          {modoOrigem === 'meus-modelos' && (
            <div style={{ marginBottom: '14px' }}>
              <label className="form-label">
                Seus Modelos de Ocorrência ({modelosDoTipo.length} {tipoAvaliacao === 'positiva' ? 'positivos' : 'negativos'} disponíveis)
              </label>

              {modelosDoTipo.length === 0 ? (
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Você ainda não possui modelos salvos para ocorrências {tipoAvaliacao === 'positiva' ? 'positivas' : 'negativas'}.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn--sm"
                    onClick={() => setModoOrigem('personalizada-agora')}
                  >
                    <span>➕</span> Criar Ocorrência Personalizada Agora
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {modelosDoTipo.map(m => {
                    const isSelected = modeloSelecionadoId === m.id;
                    const cor = m.tipo === 'positiva' ? 'var(--color-success)' : 'var(--color-danger)';
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModeloSalvo(m)}
                        style={{
                          background: isSelected ? (m.tipo === 'positiva' ? '#10B981' : '#EF4444') : 'var(--bg-subtle)',
                          color: isSelected ? '#fff' : 'var(--text-primary)',
                          border: `1.5px solid ${cor}`,
                          padding: '8px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.15)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{m.tipo === 'positiva' ? '🌟' : '⚠️'}</span>
                        <span>{m.nome}</span>
                        <span
                          style={{
                            background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                            padding: '1px 6px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}
                        >
                          {m.tipo === 'positiva' ? `+${m.pontos}` : `-${m.pontos}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODO 3: Criar Ocorrência Personalizada Agora */}
          {modoOrigem === 'personalizada-agora' && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">
                  Descrição da Ocorrência <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Ajudou na organização da sala, Participou ativamente..."
                  value={nomePersonalizado}
                  onChange={e => setNomePersonalizado(e.target.value)}
                  required
                />
              </div>

              {/* Checkbox Salvar para usar depois */}
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={salvarParaDepois}
                    onChange={e => setSalvarParaDepois(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
                    💾 <strong>Salvar para usar depois</strong> (armazenar localmente como modelo permanente)
                  </span>
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginLeft: '22px' }}>
                  Se desmarcado, a ocorrência será aplicada apenas nesta avaliação sem ser guardada como modelo.
                </span>
              </div>
            </div>
          )}

          {/* Quantidade de Pontos */}
          <div className="form-group">
            <label className="form-label">
              PoloCoins a {tipoAvaliacao === 'positiva' ? 'Atribuir (Ganho)' : 'Deduzir (Penalidade)'} 🪙
            </label>
            <input
              type="number"
              min="1"
              max="500"
              className="form-input"
              value={pontos}
              onChange={e => setPontos(Number(e.target.value))}
              required
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {tipoAvaliacao === 'positiva'
                ? `O saldo de ${aluno.nome} aumentará em +${pontos || 0} PoloCoins.`
                : `O saldo de ${aluno.nome} diminuirá em -${pontos || 0} PoloCoins (não ficará negativo).`}
            </span>
          </div>

          {/* Observação */}
          <div className="form-group">
            <label className="form-label">Observação Pedagógica Adicional (opcional)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Descreva detalhes ou contexto adicional..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
            />
          </div>

          {erroCustom && (
            <div className="alert alert-danger" style={{ marginBottom: '14px', fontSize: '12.5px' }}>
              <span>⚠️ {erroCustom}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="submit" className={`btn ${tipoAvaliacao === 'positiva' ? 'btn-success' : 'btn-danger'}`}>
              {tipoAvaliacao === 'positiva' ? '🌟 Confirmar Atribuição de Pontos' : '⚠️ Registrar Ocorrência'}
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
