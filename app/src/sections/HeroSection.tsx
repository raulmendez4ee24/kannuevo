import { Bot, Calendar, Clock, Cpu, Eye, FileText, Globe, MessageSquare, Shield, TrendingUp, Users, Zap } from 'lucide-react';
import CyberButton from '../components/ui/CyberButton';

export default function HeroSection() {
  const pills = [
    { icon: Bot, text: 'Agente Autónomo' },
    { icon: Clock, text: '24/7 Sin Pausas' },
    { icon: TrendingUp, text: 'ROI 3-8x' },
    { icon: MessageSquare, text: 'WhatsApp 24/7' },
    { icon: Calendar, text: 'Agenda Automática' },
    { icon: Globe, text: 'Navegación Web' },
    { icon: FileText, text: 'Reportes Automáticos' },
    { icon: Zap, text: 'Misiones Completas' },
    { icon: Shield, text: 'Reglas y Auditoría' },
    { icon: Cpu, text: 'Operación sin API' },
    { icon: Eye, text: 'Detección Visual' },
    { icon: Users, text: 'CRM Automático' },
  ];

  return (
    <section id="hero" className="relative py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <span className="font-mono text-xs text-cyber-cyan tracking-widest">ARQUITECTURA IA PARA NEGOCIOS</span>
        <h1 className="font-display text-4xl lg:text-6xl text-frost-white mt-4 mb-4">
          Empleados digitales que <span className="text-gradient">sí trabajan</span>
        </h1>
        <p className="text-ghost-white max-w-2xl mb-8">
          Atienden, venden y operan procesos en automático. Sin vueltas, con resultados y con trazabilidad.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          {pills.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-3 py-1.5 bg-steel-gray/40 border border-terminal-gray/50 rounded-full text-sm text-ghost-white">
              <item.icon className="w-3.5 h-3.5 text-cyber-cyan" />
              {item.text}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <CyberButton href="#workforce" variant="primary" size="lg">
            VER PLANES
          </CyberButton>
          <CyberButton href="#audit" variant="secondary" size="lg">
            INICIAR AUDITORIA
          </CyberButton>
        </div>
      </div>
    </section>
  );
}
