import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Modal } from '../common/Modal';
import {
  CustomOccurrenceTemplate,
  obterModelosDoProfessor,
  salvarModeloPersonalizado,
  excluirModeloPersonalizado,
  validarCamposOcorrencia,
} from '../../lib/customOccurrencesStorage';

const MODELOS_SUGERIDOS = [
  { nome: 'Ajudou um colega', tipo: 'positiva' as const, pontos: 25 },
  { nome: 'Participou ativamente da aula', tipo: 'positiva' as const, pontos: 20 },
  { nome: 'Entregou a atividade no prazo', tipo: 'positiva' as const, pontos: 20 },
  { nome: 'Esqueceu o material', tipo: 'negativa' as const, pontos: 10 },
  { nome: 'Não realizou a atividade', tipo: 'negativa' as const, pontos: 15 },
  { nome: 'Desrespeitou os combinados da turma', tipo: 'negativa' as const, pontos: 20 },
];

export const OcorrenciasProfessorTab: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const professorId = currentUser?.id || 1;

  const [modelos, setModelos] = useState<CustomOccurrenceTemplate[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'positiva' | 'negativa'>('todas');
  const [busca, setBusca] = useState('');

  // Modal states
  const [modalAberto, setModalAberto] = useState(false);
  const [modeloEditando, setModeloEditando] = useState<CustomOccurrenceTemplate | null>(null);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formTipo, setFormTipo] = useState<'positiva' | 'negativa'>('positiva');
  const [formPontos, setFormPontos] = useState<number | string>(20);
  const [formSalvar, setFormSalvar] = useState(true);
  const [formErro, setFormErro] = useState('');

  // Carrega os modelos salvos exclusivos deste professor
  const recarregarModelos = () => {
    const list = obterModelosDoProfessor(professorId);
    setModelos(list);
  };

  useEffect(() => {
    recarregarModelos();
  }, [professorId]);

  const abrirModalNovo = () => {
    setModeloEditando(null);
    setFormNome('');
    setFormTipo('positiva');
    setFormPontos(20);
    setFormSalvar(true);
    setFormErro('');
    setModalAberto(true);
  };

  const abrirModalEditar = (modelo: CustomOccurrenceTemplate) => {
    setModeloEditando(modelo);
    setFormNome(modelo.nome);
    setFormTipo(modelo.tipo);
    setFormPontos(modelo.pontos);
    setFormSalvar(true);
    setFormErro('');
    setModalAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErro('');

    const pontosNum = Number(formPontos);
    const validacao = validarCamposOcorrencia(formNome, formTipo, pontosNum);
    if (!validacao.valido) {
      setFormErro(validacao.erro || 'Erro na validação.');
      return;
    }

    if (!formSalvar && !modeloEditando) {
      toast.info('Para registrar modelos permanentes, mantenha a opção "Salvar para usar depois" ativada.');
      setModalAberto(false);
      return;
    }

    const res = salvarModeloPersonalizado(professorId, {
      id: modeloEditando?.id,
      nome: formNome,
      tipo: formTipo,
      pontos: pontosNum,
    });

    if (!res.success) {
      setFormErro(res.error || 'Não foi possível salvar o modelo.');
      toast.error(res.error || 'Erro ao salvar modelo.');
      return;
    }

    toast.success(
      modeloEditando
        ? 'Modelo atualizado com sucesso no seu navegador!'
        : 'Nova ocorrência personalizada salva com sucesso!'
    );
    setModalAberto(false);
    recarregarModelos();
  };

  const handleExcluir = (modelo: CustomOccurrenceTemplate) => {
    if (window.confirm(`Deseja realmente excluir o modelo "${modelo.nome}"? Esta ação removerá o modelo do seu navegador.`)) {
      const res = excluirModeloPersonalizado(professorId, modelo.id);
      if (res.success) {
        toast.info('Modelo excluído com sucesso.');
        recarregarModelos();
      } else {
        toast.error(res.error || 'Erro ao excluir modelo.');
      }
    }
  };

  const handleAdicionarSugerido = (sug: typeof MODELOS_SUGERIDOS[0]) => {
    const res = salvarModeloPersonalizado(professorId, {
      nome: sug.nome,
      tipo: sug.tipo,
      pontos: sug.pontos,
    });
    if (res.success) {
      toast.success(`Modelo "${sug.nome}" adicionado com sucesso!`);
      recarregarModelos();
    } else {
      toast.error(res.error || 'Erro ao adicionar modelo sugerido.');
    }
  };

  const modelosFiltrados = useMemo(() => {
    return modelos.filter(m => {
      const matchTipo = filtroTipo === 'todas' || m.tipo === filtroTipo;
      const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase());
      return matchTipo && matchBusca;
    });
  }, [modelos, filtroTipo, busca]);

  const contagemPositivas = useMemo(() => modelos.filter(m => m.tipo === 'positiva').length, [modelos]);
  const contagemNegativas = useMemo(() => modelos.filter(m => m.tipo === 'negativa').length, [modelos]);

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Ocorrências Personalizadas</h1>
          <p className="polocoin-main__subtitle">
            Crie e gerencie seus próprios modelos de ocorrência com pontuação personalizada para avaliar seus alunos
          </p>
        </div>
        <div>
          <button type="button" className="btn btn-primary" onClick={abrirModalNovo}>
            <span>➕</span> Nova Ocorrência Personalizada
          </button>
        </div>
      </div>

      {/* Aviso de Isolamento e Privacidade Local */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '14px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '24px' }}>🔒</span>
        <div style={{ fontSize: '13px', color: 'var(--text-color)', lineHeight: '1.45' }}>
          <strong>Privacidade e Isolamento Local Obrigatório:</strong> Seus modelos personalizados são salvos
          exclusivamente no armazenamento local deste navegador (<code style={{ fontSize: '12px' }}>localStorage</code>)
          e vinculados unicamente ao seu login. Eles <strong>não</strong> são enviados ao banco de dados nem
          compartilhados com outros professores.
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}
      >
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '28px' }}>📋</span>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL DE MODELOS</div>
            <div style={{ fontSize: '22px', fontWeight: 900 }}>{modelos.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '28px' }}>🌟</span>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>OCORRÊNCIAS POSITIVAS</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-success)' }}>
              {contagemPositivas}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>OCORRÊNCIAS NEGATIVAS</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-danger)' }}>
              {contagemNegativas}
            </div>
          </div>
        </div>
      </div>

      {/* Sugestões Rápidas de Modelos (se professor tiver poucos ou quiser inspiração) */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>💡 Sugestões Rápidas para o seu dia a dia</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Clique em qualquer sugestão para adicioná-la instantaneamente aos seus modelos salvos:
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {MODELOS_SUGERIDOS.map((sug, idx) => {
            const jaExiste = modelos.some(
              m => m.nome.trim().toLowerCase() === sug.nome.trim().toLowerCase() && m.tipo === sug.tipo
            );
            return (
              <button
                key={idx}
                type="button"
                disabled={jaExiste}
                onClick={() => handleAdicionarSugerido(sug)}
                className={`btn ${jaExiste ? 'btn-secondary' : 'btn-secondary'}`}
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  opacity: jaExiste ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title={jaExiste ? 'Você já possui este modelo salvo' : 'Clique para salvar nos seus modelos'}
              >
                <span>{sug.tipo === 'positiva' ? '🌟' : '⚠️'}</span>
                <span>{sug.nome}</span>
                <span
                  style={{
                    fontWeight: 800,
                    color: sug.tipo === 'positiva' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                >
                  {sug.tipo === 'positiva' ? `+${sug.pontos}` : `-${sug.pontos}`}
                </span>
                {jaExiste && <span style={{ fontSize: '10px' }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn ${filtroTipo === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '12px' }}
            onClick={() => setFiltroTipo('todas')}
          >
            Todas ({modelos.length})
          </button>
          <button
            type="button"
            className={`btn ${filtroTipo === 'positiva' ? 'btn-success' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '12px' }}
            onClick={() => setFiltroTipo('positiva')}
          >
            🌟 Positivas ({contagemPositivas})
          </button>
          <button
            type="button"
            className={`btn ${filtroTipo === 'negativa' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '12px' }}
            onClick={() => setFiltroTipo('negativa')}
          >
            ⚠️ Negativas ({contagemNegativas})
          </button>
        </div>

        <div style={{ flex: '1', maxWidth: '280px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Buscar nos seus modelos..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ padding: '7px 12px', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Lista de Modelos */}
      {modelosFiltrados.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>📝</div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 800 }}>
            {modelos.length === 0
              ? 'Nenhuma ocorrência personalizada cadastrada'
              : 'Nenhum modelo corresponde aos filtros'}
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', marginInline: 'auto' }}>
            {modelos.length === 0
              ? 'Crie seus próprios tipos de ocorrência para avaliar seus alunos rapidamente no dia a dia.'
              : 'Experimente limpar o campo de busca ou selecionar "Todas".'}
          </p>
          {modelos.length === 0 && (
            <button type="button" className="btn btn-primary" onClick={abrirModalNovo}>
              <span>➕</span> Criar Minha Primeira Ocorrência
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {modelosFiltrados.map(m => (
            <div
              key={m.id}
              className="card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `4px solid ${m.tipo === 'positiva' ? 'var(--color-success)' : 'var(--color-danger)'}`,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    className={`badge ${m.tipo === 'positiva' ? 'badge-success' : 'badge-danger'}`}
                    style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>{m.tipo === 'positiva' ? '🌟 Positiva' : '⚠️ Negativa'}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 900,
                      color: m.tipo === 'positiva' ? 'var(--color-success)' : 'var(--color-danger)',
                    }}
                  >
                    {m.tipo === 'positiva' ? `+${m.pontos}` : `-${m.pontos}`}{' '}
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PoloCoins</span>
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 800, color: 'var(--text-color)' }}>
                  {m.nome}
                </h3>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {m.atualizadoEm ? 'Atualizado recentemente' : 'Salvo localmente'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn--sm"
                    onClick={() => abrirModalEditar(m)}
                    title="Editar modelo"
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn--sm"
                    onClick={() => handleExcluir(m)}
                    title="Excluir modelo"
                    style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--color-danger)' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={modeloEditando ? 'Editar Ocorrência Personalizada' : 'Nova Ocorrência Personalizada'}
        subtitle="Defina o nome, tipo e a pontuação em PoloCoins para reutilizar em suas avaliações"
      >
        <form onSubmit={handleSalvar}>
          {/* Nome / Descrição */}
          <div className="form-group">
            <label className="form-label">
              Nome da Ocorrência <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Ajudou um colega, Participou ativamente da aula..."
              value={formNome}
              onChange={e => setFormNome(e.target.value)}
              required
              autoFocus
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Descrição clara e concisa da atitude do aluno (mínimo 3 caracteres).
            </span>
          </div>

          {/* Tipo (Positiva vs Negativa) */}
          <div className="form-group">
            <label className="form-label">
              Tipo de Ocorrência <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${formTipo === 'positiva' ? 'btn-success' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', gap: '6px' }}
                onClick={() => setFormTipo('positiva')}
              >
                <span>🌟</span> Positiva (Acrescenta PoloCoins)
              </button>
              <button
                type="button"
                className={`btn ${formTipo === 'negativa' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'center', gap: '6px' }}
                onClick={() => setFormTipo('negativa')}
              >
                <span>⚠️</span> Negativa (Desconta PoloCoins)
              </button>
            </div>
          </div>

          {/* Quantidade de PoloCoins */}
          <div className="form-group">
            <label className="form-label">
              Quantidade de PoloCoins 🪙 <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              max="500"
              step="1"
              className="form-input"
              placeholder="Ex: 20"
              value={formPontos}
              onChange={e => setFormPontos(e.target.value)}
              required
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {formTipo === 'positiva'
                ? 'O aluno receberá esta quantidade exata de PoloCoins.'
                : 'Esta quantidade de PoloCoins será descontada do saldo do aluno (respeitando saldo mínimo 0).'}
            </span>
          </div>

          {/* Opção Salvar para usar depois */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '12px 14px',
              borderRadius: '12px',
              marginBottom: '16px',
              border: '1px solid var(--border-color)',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formSalvar}
                onChange={e => setFormSalvar(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '12.5px' }}>
                <strong style={{ display: 'block', color: 'var(--text-color)' }}>
                  Salvar para usar depois (Reutilizável)
                </strong>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                  Armazena este modelo com segurança no seu navegador para uso em avaliações futuras.
                </span>
              </div>
            </label>
          </div>

          {/* Mensagem de Erro de Validação */}
          {formErro && (
            <div className="alert alert-danger" style={{ marginBottom: '14px', fontSize: '12.5px' }}>
              <span>⚠️ {formErro}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalAberto(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {modeloEditando ? 'Salvar Alterações' : 'Salvar Modelo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
