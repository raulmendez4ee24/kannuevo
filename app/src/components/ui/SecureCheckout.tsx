import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, CheckCircle2, Zap, AlertCircle, X, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface SecureCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  planPrice: string; // base price e.g. '$600'
}

// ── Quiz config ──────────────────────────────────────────────────────────────
interface QuizOption {
  label: string;
  description: string;
  multiplier: number; // added on top of 1.0 base
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'processes',
    question: '¿Cuántos procesos o tareas quieres automatizar?',
    options: [
      { label: '1 a 3', description: 'Empezar con lo básico', multiplier: 0 },
      { label: '4 a 8', description: 'Automatización media', multiplier: 0.5 },
      { label: '9 a 15', description: 'Operación completa', multiplier: 1.0 },
      { label: 'Más de 15', description: 'Transformación total', multiplier: 2.0 },
    ],
  },
  {
    id: 'channels',
    question: '¿Qué canales de comunicación necesitas?',
    options: [
      { label: 'Solo WhatsApp', description: 'Canal principal', multiplier: 0 },
      { label: 'WhatsApp + Email', description: 'Doble canal', multiplier: 0.2 },
      { label: '+ Redes sociales', description: 'Multi-canal', multiplier: 0.45 },
      { label: 'Omnicanal completo', description: 'Todos los canales + CRM', multiplier: 0.8 },
    ],
  },
  {
    id: 'support',
    question: '¿Qué nivel de soporte requieres?',
    options: [
      { label: 'Básico', description: 'Email, respuesta en 48h', multiplier: 0 },
      { label: 'Estándar', description: 'Chat en horario laboral', multiplier: 0.15 },
      { label: 'Prioritario', description: 'Respuesta < 4 horas', multiplier: 0.35 },
      { label: 'Dedicado 24/7', description: 'Agente exclusivo', multiplier: 0.65 },
    ],
  },
];

function parseBasePrice(priceStr: string): number {
  const match = priceStr.match(/\$?([\d,]+)/);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ''), 10);
}

function formatPrice(amount: number): string {
  return '$' + amount.toLocaleString('es-MX');
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SecureCheckout({
  isOpen,
  onClose,
  planId,
  planName,
  planPrice,
}: SecureCheckoutProps) {
  type Step = 'quiz' | 'redirecting' | 'error';

  const { user } = useAuth();
  const [step, setStep] = useState<Step>('quiz');
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [finalPrice, setFinalPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('quiz');
      setQuizStep(0);
      setQuizAnswers([]);
      setFinalPrice(0);
      setError(null);
    }
  }, [isOpen]);

  // ── Quiz handlers ─────────────────────────────────────────────────────────
  const handleQuizAnswer = (optionIndex: number) => {
    const newAnswers = [...quizAnswers, optionIndex];
    if (quizStep < quizQuestions.length - 1) {
      setQuizAnswers(newAnswers);
      setQuizStep(quizStep + 1);
    } else {
      // All questions answered → compute price
      const base = parseBasePrice(planPrice);
      const totalMultiplier = newAnswers.reduce((acc, ansIdx, qIdx) => {
        return acc + quizQuestions[qIdx].options[ansIdx].multiplier;
      }, 1.0);
      const computed = Math.round(base * totalMultiplier / 100) * 100; // round to nearest 100
      setQuizAnswers(newAnswers);
      setFinalPrice(computed);
      setQuizStep(quizQuestions.length); // show result screen
    }
  };

  // ── Stripe Checkout redirect ──────────────────────────────────────────────
  const handleStripeCheckout = async () => {
    setStep('redirecting');
    setError(null);
    try {
      const result = await api.createStripeCheckoutSession({
        planId,
        planName,
        amount: finalPrice * 100, // convert to cents
        customerEmail: user?.email || '',
        organizationId: undefined,
      });
      // Redirect to Stripe-hosted checkout page
      window.location.href = result.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear sesión de pago';
      setError(message);
      setStep('error');
    }
  };

  if (!isOpen) return null;

  const currentQuestion = quizQuestions[quizStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-void-black/80 backdrop-blur-xl" onClick={onClose} />

        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="w-full h-full" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 240, 255, 0.05) 2px, rgba(0, 240, 255, 0.05) 4px)' }} />
        </div>

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-[#0a0f1a] border border-cyber-cyan/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyber-cyan/5">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan/60 to-transparent" />
            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-cyber-cyan/40 rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-cyber-cyan/40 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-cyber-cyan/20 rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-cyber-cyan/20 rounded-br-2xl" />

            <div className="relative p-6">

              {/* ─── STEP: QUIZ (preguntas) ─── */}
              {step === 'quiz' && quizStep < quizQuestions.length && (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-3.5 h-3.5 text-neon-purple" />
                        <span className="font-mono text-[10px] text-neon-purple tracking-widest uppercase">
                          Personaliza tu plan
                        </span>
                      </div>
                      <h2 className="font-display text-xl font-bold text-frost-white">{planName}</h2>
                      <p className="font-mono text-sm text-cyber-cyan">Desde {planPrice}/mes</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-steel-gray/40 text-ghost-white hover:text-frost-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress dots */}
                  <div className="flex items-center gap-2 mb-6">
                    {quizQuestions.map((_, i) => (
                      <div key={i} className="flex-1 flex items-center gap-2">
                        <div className={`h-1 w-full rounded-full transition-all duration-500 ${i < quizStep ? 'bg-matrix-green' : i === quizStep ? 'bg-cyber-cyan' : 'bg-steel-gray/60'}`} />
                      </div>
                    ))}
                    <span className="font-mono text-[10px] text-ghost-white/50 ml-1 whitespace-nowrap">
                      {quizStep + 1}/{quizQuestions.length}
                    </span>
                  </div>

                  {/* Question */}
                  <motion.div
                    key={quizStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="font-display text-base font-semibold text-frost-white mb-4">
                      {currentQuestion.question}
                    </p>

                    <div className="space-y-2">
                      {currentQuestion.options.map((opt, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleQuizAnswer(i)}
                          className="w-full flex items-center justify-between p-4 bg-void-black/40 border border-terminal-gray/40 rounded-xl hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 transition-all group text-left"
                        >
                          <div>
                            <p className="font-mono text-sm text-frost-white group-hover:text-cyber-cyan transition-colors">{opt.label}</p>
                            <p className="text-xs text-ghost-white/60 mt-0.5">{opt.description}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-terminal-gray group-hover:text-cyber-cyan transition-colors shrink-0 ml-3" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}

              {/* ─── STEP: QUIZ RESULT (precio calculado) ─── */}
              {step === 'quiz' && quizStep === quizQuestions.length && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-4"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-matrix-green" />
                        <span className="font-mono text-[10px] text-matrix-green tracking-widest uppercase">
                          Tu precio personalizado
                        </span>
                      </div>
                      <h2 className="font-display text-xl font-bold text-frost-white">{planName}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-steel-gray/40 text-ghost-white hover:text-frost-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price reveal */}
                  <div className="bg-void-black/60 border border-cyber-cyan/20 rounded-2xl p-6 mb-5 text-center">
                    <p className="font-mono text-xs text-ghost-white/60 mb-2 tracking-widest uppercase">Mensualidad</p>
                    <motion.p
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                      className="font-mono text-4xl font-bold text-cyber-cyan"
                    >
                      {formatPrice(finalPrice)}
                    </motion.p>
                    <p className="font-mono text-xs text-ghost-white/50 mt-1">/mes · MXN</p>
                  </div>

                  {/* Summary of choices */}
                  <div className="space-y-2 mb-5">
                    {quizQuestions.map((q, qi) => (
                      <div key={qi} className="flex items-center justify-between text-xs px-3 py-2 bg-steel-gray/20 rounded-lg">
                        <span className="text-ghost-white/60">{q.question.split('?')[0]}</span>
                        <span className="font-mono text-frost-white ml-2">{q.options[quizAnswers[qi]]?.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stripe security badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#635BFF]/10 border border-[#635BFF]/20 rounded-lg mb-5">
                    <Shield className="w-4 h-4 text-[#635BFF]" />
                    <span className="font-mono text-[10px] text-[#635BFF] tracking-wider">
                      Pago seguro procesado por Stripe
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setQuizStep(0); setQuizAnswers([]); }}
                      className="flex-1 py-3 border border-terminal-gray/40 text-ghost-white font-mono text-xs tracking-widest hover:border-terminal-gray transition-colors rounded-xl"
                    >
                      RECALCULAR
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleStripeCheckout}
                      className="flex-1 py-3 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-xs tracking-widest hover:bg-cyber-cyan/20 transition-colors rounded-xl flex items-center justify-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      PAGAR CON STRIPE
                      <ExternalLink className="w-3 h-3" />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ─── STEP: REDIRECTING ─── */}
              {step === 'redirecting' && (
                <div className="py-14 text-center">
                  <div className="relative w-20 h-20 mx-auto mb-8">
                    <motion.div className="absolute inset-0 border border-[#635BFF]/30 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                    <motion.div className="absolute inset-2 border border-cyber-cyan/40 rounded-full" animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                    <div className="absolute inset-4 bg-[#635BFF]/10 rounded-full flex items-center justify-center">
                      <Loader2 className="w-7 h-7 text-[#635BFF] animate-spin" />
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-bold text-frost-white mb-2">Redirigiendo a Stripe</h3>
                  <p className="font-mono text-xs text-ghost-white/60">Conectando con el procesador de pago seguro...</p>
                </div>
              )}

              {/* ─── STEP: ERROR ─── */}
              {step === 'error' && (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-error-crimson/10 rounded-full flex items-center justify-center border border-error-crimson/30">
                    <AlertCircle className="w-8 h-8 text-error-crimson" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-frost-white mb-2">Error</h3>
                  <p className="font-mono text-xs text-error-crimson/80 mb-6">{error}</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={onClose}
                      className="px-6 py-2 border border-terminal-gray/40 text-ghost-white font-mono text-xs tracking-widest hover:border-terminal-gray transition-colors rounded-xl"
                    >
                      CERRAR
                    </button>
                    <button
                      onClick={handleStripeCheckout}
                      className="px-6 py-2 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-xs tracking-widest hover:bg-cyber-cyan/20 transition-colors rounded-xl"
                    >
                      REINTENTAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <motion.p
            className="text-center font-mono text-[8px] text-terminal-gray/50 tracking-[0.3em] mt-3 uppercase"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Pago procesado por Stripe · Conexión segura SSL
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
