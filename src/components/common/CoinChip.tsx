import React from 'react';

interface CoinChipProps {
  pontos: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CoinChip: React.FC<CoinChipProps> = ({ pontos, size = 'md', className = '' }) => {
  const sizeClass = size === 'lg' ? 'coin-chip--lg' : '';
  return (
    <span className={`coin-chip ${sizeClass} ${className}`}>
      <span>🪙</span>
      <span>{pontos} PoloCoins</span>
    </span>
  );
};

interface BadgeProps {
  tipo?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'polo';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ tipo = 'neutral', children, className = '' }) => {
  return (
    <span className={`polocoin-badge polocoin-badge--${tipo} ${className}`}>
      {children}
    </span>
  );
};
