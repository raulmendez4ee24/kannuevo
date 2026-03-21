import { Cpu, Github, Linkedin, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { handleAnchorClick } from '../utils/scroll';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    servicios: [
      { label: 'Casos de uso', href: '#services' },
      { label: 'Planes', href: '#workforce' },
      { label: 'Auditoria IA', href: '#audit' },
      { label: 'Catalogo', href: '/catalogo.html' },
    ],
    empresa: [
      { label: 'FAQ', href: '#faq' },
      { label: 'Proceso', href: '#process' },
      { label: 'Contacto', href: '#contact' },
    ],
  };

  const socialLinks = [
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Github, href: '#', label: 'GitHub' },
  ];

  return (
    <footer className="relative pt-16 pb-8 border-t border-terminal-gray/30">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 hidden sm:block w-[600px] h-px bg-gradient-to-r from-transparent via-cyber-cyan/50 to-transparent" />
      
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <a href="#hero" onClick={(e) => handleAnchorClick(e, '#hero')} className="flex items-center gap-3 mb-4 group">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-2 border-cyber-cyan rounded-lg group-hover:shadow-cyber-glow transition-shadow duration-300" />
                <div className="absolute inset-2 bg-cyber-cyan/20 rounded group-hover:bg-cyber-cyan/30 transition-colors" />
                <Cpu className="absolute inset-0 m-auto w-5 h-5 text-cyber-cyan" />
              </div>
              <div>
                <div className="font-display font-bold text-lg tracking-tight text-frost-white group-hover:text-cyber-cyan transition-colors">
                  KAN LOGIC
                </div>
                <div className="font-mono text-[10px] text-ghost-white tracking-widest">
                  ARQUITECTURA IA
                </div>
              </div>
            </a>
            <p className="text-ghost-white text-sm max-w-xs mb-6">
              Automatizacion de procesos con IA para atencion, seguimiento y operacion 24/7.
            </p>
            
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  onClick={(e) => {
                    if (social.href === '#') e.preventDefault();
                  }}
                  aria-label={social.label}
                  className="w-9 h-9 bg-steel-gray/50 border border-terminal-gray/50 rounded-lg flex items-center justify-center text-ghost-white hover:text-cyber-cyan hover:border-cyber-cyan/50 hover:bg-cyber-cyan/10 transition-all"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs text-ghost-white tracking-widest mb-4">
              SOLUCIONES
            </h4>
            <ul className="space-y-2">
              {footerLinks.servicios.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => link.href.startsWith('#') ? handleAnchorClick(e, link.href) : undefined}
                    className="text-sm text-ghost-white hover:text-cyber-cyan transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-ghost-white tracking-widest mb-4">
              EMPRESA
            </h4>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => link.href.startsWith('#') ? handleAnchorClick(e, link.href) : undefined}
                    className="text-sm text-ghost-white hover:text-cyber-cyan transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-ghost-white tracking-widest mb-4">
              LEGAL
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-ghost-white hover:text-cyber-cyan transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-ghost-white hover:text-cyber-cyan transition-colors">
                  Terminos
                </Link>
              </li>
              <li>
                <Link to="/data-deletion" className="text-sm text-ghost-white hover:text-cyber-cyan transition-colors">
                  Eliminacion de datos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-terminal-gray/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-ghost-white">
            <span>© {currentYear} Kan Logic Systems</span>
            <span className="hidden md:inline text-terminal-gray">|</span>
            <span className="hidden md:inline font-mono text-cyber-cyan">v2.0.26</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-xs text-ghost-white">
              <span className="w-1.5 h-1.5 bg-matrix-green rounded-full animate-pulse" />
              TODOS LOS SISTEMAS OPERATIVOS
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
