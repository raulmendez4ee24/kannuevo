import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronDown, HelpCircle, MessageSquare, Shield, Zap } from 'lucide-react';

const faqs = [
  {
    question: 'Que incluye el precio mensual?',
    answer:
      'Incluye la operacion del sistema, monitoreo, soporte y el alcance definido del plan. La promesa comercial es precio fijo, sin sorpresas ni cobros escondidos por uso.',
  },
  {
    question: 'Necesito tener sistemas o CRM para empezar?',
    answer:
      'No. Podemos arrancar con WhatsApp y procesos simples, o integrarnos con lo que ya uses. Si no existe API, tambien podemos operar via navegador o flujos alternos.',
  },
  {
    question: 'Esto reemplaza a mi equipo?',
    answer:
      'No necesariamente. El objetivo es quitar trabajo repetitivo, tiempos muertos y tareas operativas para que tu equipo se enfoque en cierre, supervision y servicio.',
  },
  {
    question: 'Cuanto tardan en activarlo?',
    answer:
      'Los casos express pueden activarse en dias. Los proyectos mas complejos requieren auditoria, roadmap e implementacion por fases segun integraciones y procesos.',
  },
  {
    question: 'Se cobra antes o despues de la auditoria?',
    answer:
      'Primero revisamos el caso, el proceso y el alcance. La auditoria va antes del cobro para evitar venderte un plan que no corresponde y para definir bien implementacion, tiempos y precio.',
  },
  {
    question: 'Que pasa si algo falla?',
    answer:
      'Hay monitoreo, alertas y trazabilidad. En planes altos agregamos politicas, auditoria, SLA y capacidades de auto-reparacion para mantener continuidad operativa.',
  },
  {
    question: 'Como se si esto me conviene?',
    answer:
      'Si hoy pierdes prospectos por no responder, si haces seguimiento manual, si tu equipo repite tareas todos los dias o si no tienes visibilidad clara de la operacion, ya hay ROI potencial.',
  },
];

export default function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 lg:py-32" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-void-black via-steel-gray/10 to-void-black" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-3 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full font-mono text-[10px] text-cyber-cyan tracking-widest mb-4">
            FAQ
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-frost-white mb-4">
            Dudas que <span className="text-gradient">frenan la compra</span>
          </h2>
          <p className="text-ghost-white text-lg max-w-2xl mx-auto">
            La landing tiene que quitar objeciones antes de que el cliente salga a pensarlo.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {[
              {
                icon: MessageSquare,
                title: 'Sin tecnicismos',
                text: 'El cliente no necesita entender IA. Necesita entender que se le va trabajo operativo.',
              },
              {
                icon: Shield,
                title: 'Sin miedo al riesgo',
                text: 'Seguridad, monitoreo y control deben sentirse visibles en la pagina.',
              },
              {
                icon: Zap,
                title: 'Sin confusion comercial',
                text: 'Una oferta clara convierte mejor que un catalogo infinito de servicios mezclados.',
              },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-xl border border-terminal-gray/50 bg-steel-gray/25">
                <item.icon className="w-5 h-5 text-cyber-cyan mb-3" />
                <h3 className="font-display text-xl font-semibold text-frost-white mb-2">{item.title}</h3>
                <p className="text-sm text-ghost-white">{item.text}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.question}
                  className={`rounded-xl border transition-all ${
                    isOpen
                      ? 'border-cyber-cyan bg-cyber-cyan/5 shadow-cyber-glow'
                      : 'border-terminal-gray/50 bg-steel-gray/20'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 text-cyber-cyan flex-shrink-0 mt-0.5" />
                      <span className="font-display text-lg font-semibold text-frost-white">
                        {faq.question}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-cyber-cyan transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 md:pl-[52px]">
                      <p className="text-sm text-ghost-white leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
