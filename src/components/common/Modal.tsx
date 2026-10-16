import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '550px',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('polocoin-modal-open');
    } else {
      document.body.classList.remove('polocoin-modal-open');
    }
    return () => {
      document.body.classList.remove('polocoin-modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="polocoin-modal-overlay polocoin-modal-overlay--visible"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="polocoin-modal-container" style={{ maxWidth }}>
        <div className="polocoin-modal-header">
          <div>
            <h3 className="polocoin-modal-title">{title}</h3>
            {subtitle && <p className="polocoin-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="polocoin-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="polocoin-modal-body">{children}</div>
        {footer && <div className="polocoin-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
