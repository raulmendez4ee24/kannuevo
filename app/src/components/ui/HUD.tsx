import { Cpu } from 'lucide-react';
import { handleAnchorClick } from '../../utils/scroll';

interface HUDProps {
  currentSection?: string;
}

const links = [
  { label: 'INICIO', href: '#hero' },
  { label: 'SERVICIOS', href: '#services' },
  { label: 'PROCESO', href: '#process' },
  { label: 'AUDITORIA', href: '#audit' },
  { label: 'CONTACTO', href: '#contact' },
];

export default function HUD({ currentSection = 'INICIO' }: HUDProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-terminal-gray/30 backdrop-blur bg-void-black/70">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <a href="#hero" onClick={(e) => handleAnchorClick(e, '#hero')} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg border border-cyber-cyan/60 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-cyber-cyan" />
          </div>
          <div>
            <div className="font-display text-frost-white leading-none">KAN LOGIC</div>
            <div className="font-mono text-[10px] text-ghost-white/80 tracking-widest">ARQUITECTURA IA</div>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-4">
          {links.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleAnchorClick(e, item.href)}
              className={`font-mono text-xs tracking-wider hover:text-cyber-cyan transition-colors ${
                currentSection === item.label ? 'text-cyber-cyan' : 'text-ghost-white'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
