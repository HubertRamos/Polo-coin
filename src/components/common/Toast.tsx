import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  tipo: ToastType;
  titulo?: string;
  mensagem: string;
}

interface ToastContextType {
  toast: {
    success: (msg: string, title?: string) => void;
    error: (msg: string, title?: string) => void;
    warning: (msg: string, title?: string) => void;
    info: (msg: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((tipo: ToastType, mensagem: string, titulo?: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, tipo, mensagem, titulo }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toast = {
    success: (msg: string, title = 'Sucesso!') => addToast('success', msg, title),
    error: (msg: string, title = 'Atenção') => addToast('error', msg, title),
    warning: (msg: string, title = 'Aviso') => addToast('warning', msg, title),
    info: (msg: string, title = 'Informação') => addToast('info', msg, title),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="polocoin-toast-container" aria-live="polite">
        {toasts.map(t => {
          const icon =
            t.tipo === 'success' ? '✓' :
            t.tipo === 'error' ? '✕' :
            t.tipo === 'warning' ? '!' : 'ℹ';

          return (
            <div
              key={t.id}
              className={`polocoin-toast polocoin-toast--${t.tipo} polocoin-toast--visible`}
            >
              <div className="polocoin-toast__icon">{icon}</div>
              <div className="polocoin-toast__content">
                {t.titulo && <span className="polocoin-toast__title">{t.titulo}</span>}
                <div className="polocoin-toast__message">{t.mensagem}</div>
              </div>
              <button
                type="button"
                className="polocoin-toast__close"
                onClick={() => removeToast(t.id)}
                aria-label="Fechar notificação"
              >
                ✕
              </button>
              <div className="polocoin-toast__progress" style={{ animationDuration: '4000ms' }} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
