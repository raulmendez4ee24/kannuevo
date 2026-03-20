import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import CyberCard from '../components/ui/CyberCard';
import CyberButton from '../components/ui/CyberButton';
import {
  MessageSquare,
  Bot,
  Mic,
  Globe,
  ArrowRight,
  CheckCircle2,
  Layers3,
  Package,
  Sparkles,
} from 'lucide-react';

interface ServiceLine {
  icon: typeof MessageSquare;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  pricing: string;
  cta: string;
}

const serviceLines: ServiceLine[] = [
  {
    icon: MessageSquare,
    eyebrow: 'CHATBOTS',
    title: 'Chatbots para WhatsApp y canales de mensaje',
    description:
      'La linea mas facil de vender: responde preguntas, captura leads, agenda y sigue prospectos.',
    bullets: [
      'FAQ, catalogo, citas y pedidos',
      'Seguimiento automatico',
      'Puede vender solo o en combo con web',
    ],
    pricing: 'Desde $800 MXN/mes',
    cta: 'VER CHATBOTS',
  },
  {
    icon: Mic,
    eyebrow: 'VOZ',
    title: 'Agentes de voz para llamadas y agenda',
    description:
      'Para negocios que quieren atender por telefono, calificar prospectos y confirmar citas sin recepcionista pegada al telefono.',
    bullets: [
      'Recepcionista virtual 24/7',
      'Agenda y confirmacion por llamada',
      'Ideal para clinicas, despachos y servicios',
    ],
    pricing: 'Desde $1,500 MXN/mes',
    cta: 'VER AGENTES DE VOZ',
  },
  {
    icon: Bot,
    eyebrow: 'AUTONOMOS',
    title: 'Agentes autonomos para procesos completos',
    description:
      'Para empresas que ya no solo quieren responder mensajes: quieren ejecutar trabajo real en navegador, sistemas y operaciones internas.',
    bullets: [
      'Reportes, documentos y seguimiento',
      'Integraciones y procesos multi-paso',
      'Mas valor, mas ticket, mas retencion',
    ],
    pricing: 'Desde $1,000 MXN/mes',
    cta: 'VER AGENTES IA',
  },
  {
    icon: Globe,
    eyebrow: 'WEBS',
    title: 'Paginas web personalizadas que convierten',
    description:
      'No son solo paginas bonitas. Son sitios para captar leads, mostrar autoridad y conectarse con tu automatizacion.',
    bullets: [
      'Landing pages y sitios completos',
      'Tienda, citas o plataforma segun el caso',
      'Perfecto para vender junto con chatbot',
    ],
    pricing: 'Desde $3,000 MXN setup',
    cta: 'VER PAGINAS WEB',
  },
];

const packageSignals = [
  {
    icon: Layers3,
    label: 'Captacion',
    value: 'Leads y respuesta 24/7',
  },
  {
    icon: Package,
    label: 'Conversion',
    value: 'Seguimiento y cierre',
  },
  {
    icon: Sparkles,
    label: 'Operacion',
    value: 'Menos carga y mas control',
  },
];

export default function ServicesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="services" className="relative py-24 lg:py-32" ref={ref}>
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-0 left-1/4 w-[420px] h-[420px] ambient-glow opacity-60" />
      <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] ambient-glow ambient-glow--purple opacity-50" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-full font-mono text-[10px] text-neon-purple tracking-widest mb-4">
            SOLUCIONES
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-frost-white mb-4">
            Lo que tu negocio puede <span className="text-gradient">automatizar hoy</span>
          </h2>
          <p className="text-ghost-white text-lg max-w-3xl mx-auto">
            Chatbots, agentes de voz, agentes autonomos y paginas web personalizadas para
            captar leads, atender clientes y operar procesos con menos friccion.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {serviceLines.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.08 * index }}
              >
                <CyberCard className="h-full bg-steel-gray/25">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-cyber-cyan/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-cyber-cyan" />
                    </div>
                    <p className="font-mono text-[10px] text-cyber-cyan tracking-widest">{service.eyebrow}</p>
                  </div>

                  <h3 className="font-display text-2xl font-bold text-frost-white mb-3">
                    {service.title}
                  </h3>
                  <p className="text-sm text-ghost-white mb-5">
                    {service.description}
                  </p>

                  <ul className="space-y-2 mb-5">
                    {service.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-sm text-ghost-white">
                        <CheckCircle2 className="w-4 h-4 text-matrix-green flex-shrink-0 mt-0.5" />
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-terminal-gray/50">
                    <p className="font-mono text-[10px] text-neon-purple tracking-widest mb-1">DESDE</p>
                    <p className="text-frost-white font-semibold mb-4">{service.pricing}</p>
                    <CyberButton
                      href="/catalogo.html"
                      variant="secondary"
                      size="sm"
                      className="w-full justify-center"
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      {service.cta}
                    </CyberButton>
                  </div>
                </CyberCard>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 }}
          >
            <CyberCard className="h-full border-cyber-cyan/20 bg-steel-gray/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cyber-cyan/10 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-cyber-cyan" />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-cyber-cyan tracking-widest">LO QUE RESUELVE</p>
                  <h3 className="font-display text-2xl font-bold text-frost-white">
                    Automatiza atencion, ventas y operacion desde el primer contacto.
                  </h3>
                </div>
              </div>

              <p className="text-ghost-white mb-6 max-w-2xl">
                La propuesta es simple: responder rapido, dar seguimiento, vender mejor y
                quitar carga repetitiva a tu equipo sin meter complejidad innecesaria.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {packageSignals.map((signal) => (
                  <div key={signal.label} className="rounded-xl border border-terminal-gray/50 bg-void-black/40 p-4">
                    <signal.icon className="w-5 h-5 text-cyber-cyan mb-3" />
                    <p className="font-mono text-xs text-ghost-white mb-1">{signal.label}</p>
                    <p className="font-display text-xl font-bold text-frost-white">{signal.value}</p>
                  </div>
                ))}
              </div>
            </CyberCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15 }}
          >
            <CyberCard className="h-full border-matrix-green/20 bg-steel-gray/20">
              <p className="font-mono text-[10px] text-matrix-green tracking-widest mb-4">POR QUE KAN LOGIC</p>
              <div className="space-y-4">
                {[
                  'Tus clientes pueden recibir respuesta por WhatsApp, voz o web sin depender del horario.',
                  'Los sistemas pueden agendar, seguir prospectos, cobrar, reportar y ejecutar tareas repetitivas.',
                  'Puedes empezar con una solucion puntual o crecer a un sistema completo.',
                  'Todo se integra con tus procesos para que vendas mas y operes con mas control.',
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-matrix-green flex-shrink-0 mt-0.5" />
                    <p className="text-ghost-white text-sm">{item}</p>
                  </div>
                ))}
              </div>

              <CyberButton
                href="/catalogo.html"
                variant="primary"
                size="md"
                className="w-full justify-center mt-6"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                ABRIR CATALOGO COMPLETO
              </CyberButton>
            </CyberCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
