import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import InteractiveSphere from '../components/three/InteractiveSphere';
import CyberButton from '../components/ui/CyberButton';
import {
  Zap,
  ChevronRight,
  Bot,
  Clock,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Mic,
  MonitorSmartphone,
  Globe,
} from 'lucide-react';

const featurePills = [
  { icon: MessageSquare, text: 'Chatbots para WhatsApp' },
  { icon: Mic, text: 'Agentes de Voz' },
  { icon: Bot, text: 'Agentes Autonomos' },
  { icon: Globe, text: 'Paginas Web Personalizadas' },
];

const proofCards = [
  {
    label: 'CAPTACION',
    title: 'Paginas que convierten',
    copy: 'Sitios pensados para vender, captar leads y conectar con WhatsApp.',
  },
  {
    label: 'ATENCION',
    title: 'Chatbots y voz 24/7',
    copy: 'Tus clientes reciben respuesta por texto o llamada sin depender del horario.',
  },
  {
    label: 'OPERACION',
    title: 'Agentes que ejecutan',
    copy: 'Automatizan tareas reales, seguimiento, reportes y procesos internos.',
  },
];

export default function HeroSection() {
  const [typedText, setTypedText] = useState('');
  const fullText = 'SISTEMAS CON IA QUE CAPTAN, RESPONDEN Y VENDEN POR TI';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        index++;
        setTypedText(fullText.slice(0, index));
      } else {
        clearInterval(interval);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 pb-12 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] ambient-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] ambient-glow ambient-glow--purple" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="order-2 lg:order-1"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full">
                <Bot className="w-4 h-4 text-cyber-cyan" />
                <span className="font-mono text-[10px] text-cyber-cyan tracking-widest">
                  SISTEMAS QUE HACEN TRABAJO REAL
                </span>
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight mb-4"
            >
              <span className="text-frost-white">SISTEMAS CON IA</span>
              <br />
              <span className="text-gradient">QUE CAPTAN,</span>
              <br />
              <span className="text-frost-white">RESPONDEN Y</span>
              <br />
              <span className="text-cyber-cyan">VENDEN POR TI</span>
            </motion.h1>

            <motion.div variants={itemVariants} className="mb-8">
              <span className="font-mono text-sm text-ghost-white tracking-wider">
                <span className="text-cyber-cyan">{'>'}</span> {typedText}
                <span className="animate-pulse text-cyber-cyan">_</span>
              </span>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-ghost-white/85 text-lg max-w-2xl mb-6 leading-relaxed"
            >
              Diseñamos chatbots, agentes de voz, automatizaciones y paginas web enfocadas
              en generar leads, atender clientes 24/7 y convertir oportunidades en ventas reales.
            </motion.p>

            <motion.div variants={itemVariants} className="grid sm:grid-cols-3 gap-3 mb-8 max-w-3xl">
              {proofCards.map((card) => (
                <div key={card.title} className="rounded-xl border border-terminal-gray/50 bg-steel-gray/35 p-4">
                  <p className="font-mono text-[10px] text-cyber-cyan tracking-widest mb-2">{card.label}</p>
                  <h2 className="font-display text-lg font-semibold text-frost-white mb-2">{card.title}</h2>
                  <p className="text-sm text-ghost-white">{card.copy}</p>
                </div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-8">
              {featurePills.map((item) => (
                <span
                  key={item.text}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-steel-gray/50 border border-terminal-gray/50 rounded-full text-sm text-ghost-white"
                >
                  <item.icon className="w-3.5 h-3.5 text-cyber-cyan" />
                  {item.text}
                </span>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4 mb-10">
              <CyberButton
                href="#services"
                variant="primary"
                size="lg"
                icon={<Zap className="w-4 h-4" />}
              >
                VER 4 SOLUCIONES
              </CyberButton>
              <CyberButton
                href="/catalogo.html"
                variant="secondary"
                size="lg"
                icon={<MonitorSmartphone className="w-4 h-4" />}
              >
                VER CATALOGO
              </CyberButton>
              <CyberButton
                href="#audit"
                variant="secondary"
                size="lg"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                PEDIR DIAGNOSTICO
              </CyberButton>
            </motion.div>

            <motion.div variants={itemVariants} className="grid sm:grid-cols-3 gap-6 max-w-2xl">
              {[
                { value: '4', label: 'LINEAS DE VENTA' },
                { value: '24/7', label: 'ATENCION CONTINUA' },
                { value: 'FIJO', label: 'PLANES Y PAQUETES' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-px h-10 bg-gradient-to-b from-cyber-cyan to-neon-purple" />
                  <div>
                    <div className="font-mono text-xl font-bold text-cyber-cyan">{stat.value}</div>
                    <div className="font-mono text-[10px] text-ghost-white tracking-wider">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
            className="order-1 lg:order-2 h-[360px] sm:h-[420px] lg:h-[640px] relative"
          >
            <InteractiveSphere />

            <div className="absolute top-8 right-2 sm:right-0 lg:right-6 rounded-xl border border-cyber-cyan/30 bg-void-black/70 backdrop-blur-md p-4 w-[min(240px,calc(100%-1rem))]">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-cyber-cyan" />
                <span className="font-mono text-[10px] text-cyber-cyan tracking-widest">OBJETIVO</span>
              </div>
              <p className="text-sm text-frost-white mb-2">Vender mas y quitar carga operativa.</p>
              <div className="space-y-2">
                {['Captar', 'Responder', 'Vender', 'Operar'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-ghost-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-matrix-green" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-6 left-2 sm:left-0 lg:left-6 rounded-xl border border-neon-purple/30 bg-void-black/70 backdrop-blur-md p-4 w-[min(260px,calc(100%-1rem))]">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-neon-purple" />
                <span className="font-mono text-[10px] text-neon-purple tracking-widest">QUE PUEDES VENDER</span>
              </div>
              <p className="text-sm text-ghost-white">
                Chatbots, agentes de voz, agentes autonomos y paginas web como sistema completo o por separado.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] text-ghost-white tracking-widest">EXPLORAR</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronRight className="w-4 h-4 text-cyber-cyan rotate-90" />
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void-black to-transparent pointer-events-none" />
    </section>
  );
}
