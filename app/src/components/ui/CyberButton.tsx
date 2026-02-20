import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { handleAnchorClick } from '../../utils/scroll';

interface CyberButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit';
}

export default function CyberButton({
  children,
  href,
  onClick,
  icon,
  className = '',
  size = 'md',
  variant = 'primary',
  type = 'button',
}: CyberButtonProps) {
  const sizeClasses =
    size === 'sm'
      ? 'px-3 py-2 text-xs'
      : size === 'lg'
      ? 'px-6 py-3 text-sm'
      : 'px-4 py-2 text-sm';

  const variantClasses =
    variant === 'primary'
      ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/20'
      : 'bg-neon-purple/10 border-neon-purple text-neon-purple hover:bg-neon-purple/20';

  const baseClass = `inline-flex items-center gap-2 justify-center border rounded-lg font-mono tracking-wider transition-all ${sizeClasses} ${variantClasses} ${className}`;

  if (href?.startsWith('#')) {
    return (
      <a href={href} onClick={(e) => handleAnchorClick(e, href)} className={baseClass}>
        {icon}
        {children}
      </a>
    );
  }

  if (href) {
    return (
      <Link to={href} className={baseClass} onClick={onClick}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={baseClass}>
      {icon}
      {children}
    </button>
  );
}
