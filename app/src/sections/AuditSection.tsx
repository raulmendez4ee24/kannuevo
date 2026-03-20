import { motion, useInView } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import CyberButton from '../components/ui/CyberButton';
import CyberCard from '../components/ui/CyberCard';
import { CheckCircle2, Shield, Target, Zap } from 'lucide-react';

const priorityOptions = [
  'Responder WhatsApp',
  'Agendar citas',
  'Dar seguimiento a leads',
  'Cobranza y recordatorios',
  'Reportes automaticos',
  'Pedidos y postventa',
];

const businessTypes = [
  { value: 'negocio_local', label: 'Negocio local' },
  { value: 'pyme', label: 'PyME' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'empresa', label: 'Empresa' },
];

export default function AuditSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    whatsapp: '',
    businessName: '',
    businessType: 'pyme',
    monthlyLeads: '',
    monthlyRevenue: '',
    selectedPlan: '',
    priorities: ['Responder WhatsApp', 'Dar seguimiento a leads'],
  });

  useEffect(() => {
    const handlePlanSelected = (event: Event) => {
      const customEvent = event as CustomEvent<{ planName?: string }>;
      const planName = customEvent.detail?.planName?.trim();
      if (!planName) return;

      setIsSubmitted(false);
      setFormData((current) => ({
        ...current,
        selectedPlan: planName,
      }));
    };

    window.addEventListener('kanlogic:audit-plan-selected', handlePlanSelected as EventListener);
    return () => window.removeEventListener('kanlogic:audit-plan-selected', handlePlanSelected as EventListener);
  }, []);

  const canSubmit = useMemo(
    () =>
      formData.email.trim().length > 0 &&
      formData.businessName.trim().length > 1 &&
      formData.priorities.length > 0,
    [formData],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('fail');
      setIsSubmitted(true);
      setFormData({
        email: '',
        whatsapp: '',
        businessName: '',
        businessType: 'pyme',
        monthlyLeads: '',
        monthlyRevenue: '',
        selectedPlan: '',
        priorities: ['Responder WhatsApp', 'Dar seguimiento a leads'],
      });
    } catch {
      alert('No se pudo enviar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function togglePriority(priority: string) {
    setFormData((current) => {
      const exists = current.priorities.includes(priority);
      if (exists) {
        return {
          ...current,
          priorities: current.priorities.filter((item) => item !== priority),
        };
      }
      return {
        ...current,
        priorities: [...current.priorities, priority],
      };
    });
  }

  return (
    <section id="audit" className="relative py-24 lg:py-32" ref={ref}>
      <div className="absolute inset-0 grid-bg opacity-25" />
      <div className="absolute top-1/3 left-0 w-[420px] h-[420px] ambient-glow opacity-50" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-3 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full font-mono text-[10px] text-cyber-cyan tracking-widest mb-4">
            DIAGNOSTICO
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-frost-white mb-4">
            Dinos donde se atora tu <span className="text-gradient">operacion</span>
          </h2>
          <p className="text-ghost-white text-lg max-w-3xl mx-auto">
            No te vendemos por vender. Primero entendemos que tarea repetitiva, fuga o cuello
            de botella te esta costando mas.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <CyberCard className="bg-steel-gray/25">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-cyber-cyan" />
                <div>
                  <p className="font-mono text-[10px] text-cyber-cyan tracking-widest">QUE RECIBES</p>
                  <h3 className="font-display text-2xl font-bold text-frost-white">
                    Claridad comercial y operativa
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  'Que proceso conviene automatizar primero',
                  'Que plan hace sentido para tu nivel de operacion',
                  'Que se puede implementar rapido y que requiere roadmap',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-matrix-green flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-ghost-white">{item}</p>
                  </div>
                ))}
              </div>
            </CyberCard>

            <CyberCard className="bg-steel-gray/25">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-neon-purple" />
                <div>
                  <p className="font-mono text-[10px] text-neon-purple tracking-widest">SEÑALES DE FIT</p>
                  <h3 className="font-display text-2xl font-bold text-frost-white">
                    Cuando esto vale la pena
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  'Tu equipo repite lo mismo todos los dias',
                  'Pierdes prospectos por tardar en responder',
                  'No hay seguimiento consistente a clientes',
                  'No tienes visibilidad clara de lo que paso en la operacion',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-matrix-green flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-ghost-white">{item}</p>
                  </div>
                ))}
              </div>
            </CyberCard>

            <div className="rounded-xl border border-matrix-green/30 bg-matrix-green/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-matrix-green" />
                <span className="font-mono text-[10px] text-matrix-green tracking-widest">ENFOQUE</span>
              </div>
              <p className="text-sm text-ghost-white">
                La mejor landing no presume IA. Hace sentir que ya encontraste a quien
                te puede quitar una parte del caos operativo.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15 }}
          >
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-6 md:p-8 space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="audit-email" className="block font-mono text-xs text-ghost-white mb-2">Correo</label>
                    <input
                      id="audit-email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tu@empresa.com"
                      className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="audit-whatsapp" className="block font-mono text-xs text-ghost-white mb-2">WhatsApp</label>
                    <input
                      id="audit-whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+52 33..."
                      className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="audit-business-name" className="block font-mono text-xs text-ghost-white mb-2">Nombre del negocio</label>
                    <input
                      id="audit-business-name"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="KAN Logic"
                      className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="audit-business-type" className="block font-mono text-xs text-ghost-white mb-2">Tipo de negocio</label>
                    <select
                      id="audit-business-type"
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white"
                    >
                      {businessTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="audit-selected-plan" className="block font-mono text-xs text-ghost-white mb-2">Plan de interes</label>
                    <input
                      id="audit-selected-plan"
                      value={formData.selectedPlan}
                      onChange={(e) => setFormData({ ...formData, selectedPlan: e.target.value })}
                      placeholder="Ej. Growth o Chatbot para WhatsApp"
                      className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="audit-monthly-leads" className="block font-mono text-xs text-ghost-white mb-2">Leads al mes</label>
                    <input
                      id="audit-monthly-leads"
                      value={formData.monthlyLeads}
                      onChange={(e) => setFormData({ ...formData, monthlyLeads: e.target.value })}
                      placeholder="Ej. 50-100"
                      className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="audit-monthly-revenue" className="block font-mono text-xs text-ghost-white mb-2">Ingresos mensuales</label>
                    <input
                      id="audit-monthly-revenue"
                      value={formData.monthlyRevenue}
                      onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                      placeholder="Ej. 200k-500k MXN"
                      className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/50"
                    />
                  </div>
                </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono text-xs text-ghost-white mb-3">Que quieres automatizar primero</label>
                    <div className="flex flex-wrap gap-3">
                      {priorityOptions.map((priority) => {
                      const active = formData.priorities.includes(priority);
                      return (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => togglePriority(priority)}
                          className={`px-3 py-2 rounded-full border font-mono text-xs tracking-wide transition-all ${
                            active
                              ? 'border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan'
                              : 'border-terminal-gray/50 bg-void-black/40 text-ghost-white'
                          }`}
                        >
                          {priority}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <CyberButton
                  className="w-full"
                  variant="primary"
                  size="lg"
                  type="submit"
                >
                  {isSubmitting ? 'ENVIANDO...' : 'QUIERO MI DIAGNOSTICO'}
                </CyberButton>
              </form>
            ) : (
              <CyberCard className="h-full flex flex-col items-center justify-center text-center py-14">
                <div className="w-16 h-16 bg-matrix-green/20 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-8 h-8 text-matrix-green" />
                </div>
                <h3 className="font-display text-2xl font-bold text-frost-white mb-3">
                  Diagnostico enviado
                </h3>
                <p className="text-ghost-white max-w-md">
                  Ya tenemos tu contexto. El siguiente paso es revisar el caso, contactarte y
                  proponerte el arranque correcto antes de cobrar.
                </p>
              </CyberCard>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
