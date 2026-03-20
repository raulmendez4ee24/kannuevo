import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import CyberCard from '../components/ui/CyberCard';
import CyberButton from '../components/ui/CyberButton';
import {
  Search,
  GitBranch,
  Rocket,
  Activity,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  details: string[];
  time: string;
}

const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Diagnostico del cuello de botella',
    description: 'Identificamos donde se te van horas, prospectos, seguimiento o control.',
    icon: Search,
    details: [
      'Revision del flujo actual',
      'Deteccion del trabajo repetitivo',
      'Definicion del caso de uso mas rentable',
    ],
    time: '20-30 min',
  },
  {
    number: '02',
    title: 'Mapa del proceso ideal',
    description: 'Diseñamos como debe responder, escalar, registrar y reportar el sistema.',
    icon: GitBranch,
    details: [
      'Reglas del flujo',
      'Integraciones necesarias',
      'Criterios de handoff a humano',
    ],
    time: '24-48h',
  },
  {
    number: '03',
    title: 'Piloto funcional',
    description: 'Levantamos una version operativa para probarla con tu caso real.',
    icon: Rocket,
    details: [
      'Configuracion inicial',
      'Pruebas en entorno real',
      'Ajustes sobre conversaciones o tareas',
    ],
    time: '72h',
  },
  {
    number: '04',
    title: 'Activacion con monitoreo',
    description: 'El sistema entra a produccion con visibilidad de resultados y alertas.',
    icon: Activity,
    details: [
      'Deploy a produccion',
      'Panel de actividad',
      'Alertas y control de operacion',
    ],
    time: 'Semana 1',
  },
  {
    number: '05',
    title: 'Optimizacion continua',
    description: 'Se mejora con datos reales para aumentar conversion y bajar carga operativa.',
    icon: BarChart3,
    details: [
      'Revision de metricas',
      'Ajustes del flujo',
      'Expansion a mas procesos',
    ],
    time: 'Continuo',
  },
];

export default function ProcessSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="process" className="relative py-24 lg:py-32" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-void-black via-steel-gray/20 to-void-black" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full font-mono text-[10px] text-cyber-cyan tracking-widest mb-4">
            PROCESO
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-frost-white mb-4">
            Como entramos a tu <span className="text-gradient">operacion</span>
          </h2>
          <p className="text-ghost-white text-lg max-w-3xl mx-auto">
            No vendemos humo. Entramos por un cuello de botella concreto, lo automatizamos
            y despues escalamos con datos.
          </p>
        </motion.div>

        <div className="hidden lg:block">
          <div className="grid grid-cols-5 gap-4 mb-8">
            {processSteps.map((step, index) => {
              const isActive = activeStep === index;
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.1 }}
                  className={isActive ? 'relative cursor-pointer transition-all duration-300 scale-105' : 'relative cursor-pointer transition-all duration-300 opacity-70 hover:opacity-100'}
                  onClick={() => setActiveStep(index)}
                >
                  <div className={isActive ? 'p-4 rounded-lg border transition-all duration-300 bg-cyber-cyan/10 border-cyber-cyan shadow-cyber-glow' : 'p-4 rounded-lg border transition-all duration-300 bg-steel-gray/30 border-terminal-gray/50'}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={isActive ? 'font-mono text-lg font-bold text-cyber-cyan' : 'font-mono text-lg font-bold text-ghost-white'}>
                        {step.number}
                      </span>
                      <div className={isActive ? 'text-cyber-cyan' : 'text-ghost-white'}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="font-display font-semibold text-frost-white text-sm mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs text-ghost-white line-clamp-2">
                      {step.description}
                    </p>
                  </div>

                  {index < processSteps.length - 1 && (
                    <div className="absolute top-1/2 -right-2 w-4 h-px bg-terminal-gray">
                      <ChevronRight className="absolute -right-2 -top-2 w-4 h-4 text-terminal-gray" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-6"
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-cyber-cyan/10 rounded-xl flex items-center justify-center flex-shrink-0 text-cyber-cyan">
                {(() => {
                  const Icon = processSteps[activeStep].icon;
                  return <Icon className="w-8 h-8" />;
                })()}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-xs text-cyber-cyan tracking-wider">
                    PASO {processSteps[activeStep].number}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-ghost-white">
                    <Clock className="w-3 h-3" />
                    {processSteps[activeStep].time}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-frost-white mb-3">
                  {processSteps[activeStep].title}
                </h3>
                <p className="text-ghost-white mb-4">
                  {processSteps[activeStep].description}
                </p>
                <ul className="grid grid-cols-3 gap-3">
                  {processSteps[activeStep].details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm text-ghost-white">
                      <CheckCircle2 className="w-4 h-4 text-matrix-green flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:hidden space-y-4">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.1 }}
              >
                <CyberCard className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyber-cyan/10 rounded-lg flex items-center justify-center flex-shrink-0 text-cyber-cyan">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-cyber-cyan">{step.number}</span>
                      <span className="text-xs text-ghost-white flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {step.time}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-frost-white mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-ghost-white">
                      {step.description}
                    </p>
                  </div>
                </CyberCard>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-16 grid md:grid-cols-2 gap-6"
        >
          <div className="bg-steel-gray/20 border border-error-crimson/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-error-crimson" />
              <span className="font-mono text-sm text-error-crimson tracking-wider">ANTES</span>
            </div>
            <h3 className="font-display text-xl font-semibold text-frost-white mb-4">
              Operacion manual tipica
            </h3>
            <ul className="space-y-3">
              {[
                'Prospectos que escriben y nadie sigue a tiempo',
                'Cobranza, agenda y recordatorios hechos a mano',
                'Gerencia sin claridad real de que paso hoy',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-ghost-white">
                  <span className="text-error-crimson mt-1">x</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-steel-gray/20 border border-matrix-green/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-matrix-green" />
              <span className="font-mono text-sm text-matrix-green tracking-wider">DESPUES</span>
            </div>
            <h3 className="font-display text-xl font-semibold text-frost-white mb-4">
              Sistema operativo con IA
            </h3>
            <ul className="space-y-3">
              {[
                'Respuesta automatica y seguimiento consistente',
                'Citas, cobranza y reportes corriendo sin perseguir gente',
                'Panel, monitoreo y decisiones con mas control',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-ghost-white">
                  <CheckCircle2 className="w-4 h-4 text-matrix-green mt-1 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="mt-10 text-center"
        >
          <CyberButton
            href="#audit"
            variant="primary"
            size="lg"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            EMPEZAR CON UN PROCESO
          </CyberButton>
        </motion.div>
      </div>
    </section>
  );
}
