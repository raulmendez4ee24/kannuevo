import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, CheckCircle2, Cpu, Zap, Fingerprint, AlertCircle, X, CreditCard, ChevronRight } from 'lucide-react';

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
  type Step = 'quiz' | 'form' | 'processing' | 'success';

  const [step, setStep] = useState<Step>('quiz');
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [finalPrice, setFinalPrice] = useState(0);

  // Payment form
  const [customerEmail, setCustomerEmail] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityLevel, setSecurityLevel] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep('quiz');
      setQuizStep(0);
      setQuizAnswers([]);
      setFinalPrice(0);
      setCustomerEmail('');
      setCardHolder('');
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setError(null);
      setSecurityLevel(0);
      setIsProcessing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let level = 0;
    const cardDigits = cardNumber.replace(/\s/g, '').length;
    if (cardDigits >= 13 && cardDigits <= 19) level += 25;
    if (expiry.length === 5 && /^\d{2}\/\d{2}$/.test(expiry)) level += 25;
    if (cvv.length >= 3) level += 25;
    if (cardHolder.length > 3) level += 25;
    setSecurityLevel(level);
  }, [cardNumber, expiry, cvv, cardHolder]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) return v.substring(0, 2) + '/' + v.substring(2, 4);
    return v;
  };

  const getCardType = () => {
    const num = cardNumber.replace(/\s/g, '');
    if (num.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(num)) return 'MASTERCARD';
    if (/^3[47]/.test(num)) return 'AMEX';
    return null;
  };

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

  // ── Payment submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail || !customerEmail.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }
    if (securityLevel < 100) {
      setError('Por favor completa todos los campos de tu tarjeta');
      return;
    }
    setIsProcessing(true);
    setStep('processing');
    setError(null);
    try {
      const amount = finalPrice * 100; // centavos
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          planName,
          amount,
          currency: 'mxn',
          customerEmail,
          customerName: cardHolder,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardHolder,
          expiry,
          cvv,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(
          data.error === 'FAILED_TO_PROCESS_PAYMENT'
            ? 'Error al procesar el pago. Verifica los datos e intenta de nuevo.'
            : 'Error al procesar el pago'
        );
        setIsProcessing(false);
        setStep('form');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setStep('success');
      } else {
        setError('Error al procesar el pago');
        setIsProcessing(false);
        setStep('form');
      }
    } catch (err: any) {
      setError('Error de conexión. Intenta de nuevo.');
      setIsProcessing(false);
      setStep('form');
    }
  };

  if (!isOpen) return null;

  const currentQuestion = quizQuestions[quizStep];
  const isFormReady = securityLevel === 100 && customerEmail.includes('@') && !isProcessing;
  const cardType = getCardType();

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
                      onClick={() => setStep('form')}
                      className="flex-1 py-3 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-xs tracking-widest hover:bg-cyber-cyan/20 transition-colors rounded-xl"
                    >
                      CONTINUAR AL PAGO →
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ─── STEP: FORM ─── */}
              {step === 'form' && (
                <>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Lock className="w-3.5 h-3.5 text-cyber-cyan" />
                        <span className="font-mono text-[10px] text-cyber-cyan tracking-widest uppercase">Pago Seguro</span>
                      </div>
                      <h2 className="font-display text-xl font-bold text-frost-white">{planName}</h2>
                      <p className="font-mono text-2xl font-bold text-cyber-cyan mt-0.5">
                        {formatPrice(finalPrice)}<span className="text-xs text-ghost-white font-normal">/mes</span>
                      </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-steel-gray/40 text-ghost-white hover:text-frost-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Security bar */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] text-ghost-white/60 tracking-wider uppercase">Seguridad</span>
                      <span className="font-mono text-[9px] text-cyber-cyan">{securityLevel}%</span>
                    </div>
                    <div className="h-0.5 bg-steel-gray/60 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyber-cyan to-matrix-green rounded-full"
                        animate={{ width: `${securityLevel}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="block font-mono text-[10px] text-ghost-white/70 tracking-wider uppercase mb-1.5">Correo electrónico</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        className="w-full px-4 py-3 bg-void-black/60 border border-terminal-gray/40 rounded-xl text-frost-white font-mono text-sm placeholder-ghost-white/25 focus:border-cyber-cyan/60 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-ghost-white/70 tracking-wider uppercase mb-1.5">Número de tarjeta</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          className="w-full px-4 py-3 bg-void-black/60 border border-terminal-gray/40 rounded-xl text-frost-white font-mono text-base tracking-widest placeholder-ghost-white/25 focus:border-cyber-cyan/60 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/20 transition-all pr-20"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {cardType ? (
                            <span className="font-mono text-[10px] font-bold text-cyber-cyan bg-cyber-cyan/10 px-2 py-0.5 rounded">{cardType}</span>
                          ) : (
                            <CreditCard className="w-4 h-4 text-terminal-gray" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono text-[10px] text-ghost-white/70 tracking-wider uppercase mb-1.5">Vencimiento</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full px-4 py-3 bg-void-black/60 border border-terminal-gray/40 rounded-xl text-frost-white font-mono text-base tracking-widest placeholder-ghost-white/25 focus:border-cyber-cyan/60 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-ghost-white/70 tracking-wider uppercase mb-1.5">CVV</label>
                        <input
                          type="password"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full px-4 py-3 bg-void-black/60 border border-terminal-gray/40 rounded-xl text-frost-white font-mono text-base tracking-widest placeholder-ghost-white/25 focus:border-cyber-cyan/60 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/20 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-ghost-white/70 tracking-wider uppercase mb-1.5">Nombre en la tarjeta</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        placeholder="TAL COMO APARECE EN LA TARJETA"
                        className="w-full px-4 py-3 bg-void-black/60 border border-terminal-gray/40 rounded-xl text-frost-white font-mono text-sm tracking-wider placeholder-ghost-white/25 focus:border-cyber-cyan/60 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/20 transition-all"
                      />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="font-mono text-xs text-red-400">{error}</span>
                      </motion.div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={!isFormReady}
                      whileHover={isFormReady ? { scale: 1.01 } : {}}
                      whileTap={isFormReady ? { scale: 0.99 } : {}}
                      className={`
                        w-full relative overflow-hidden px-6 py-4 rounded-xl font-mono text-sm tracking-widest uppercase transition-all mt-2
                        ${isFormReady
                          ? 'bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                          : 'bg-steel-gray/20 border border-terminal-gray/30 text-ghost-white/30 cursor-not-allowed'}
                      `}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        Confirmar pago
                      </span>
                    </motion.button>
                  </form>

                  <div className="mt-5 flex items-center justify-center gap-5 pt-4 border-t border-terminal-gray/20">
                    {[
                      { icon: Shield, label: 'AES-256' },
                      { icon: Fingerprint, label: 'Encriptado' },
                      { icon: Lock, label: 'SSL/TLS' },
                    ].map((badge, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-terminal-gray">
                        <badge.icon className="w-3 h-3" />
                        <span className="font-mono text-[9px] tracking-wider">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ─── STEP: PROCESSING ─── */}
              {step === 'processing' && (
                <div className="py-14 text-center">
                  <div className="relative w-20 h-20 mx-auto mb-8">
                    <motion.div className="absolute inset-0 border border-cyber-cyan/30 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                    <motion.div className="absolute inset-2 border border-neon-purple/40 rounded-full" animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                    <div className="absolute inset-4 bg-cyber-cyan/10 rounded-full flex items-center justify-center">
                      <Cpu className="w-7 h-7 text-cyber-cyan animate-pulse" />
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-bold text-frost-white mb-2">Procesando pago</h3>
                  <p className="font-mono text-xs text-ghost-white/60">Verificando y encriptando datos...</p>
                </div>
              )}

              {/* ─── STEP: SUCCESS ─── */}
              {step === 'success' && (
                <div className="py-10 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="relative w-20 h-20 mx-auto mb-6"
                  >
                    <div className="absolute inset-0 bg-matrix-green/20 rounded-full blur-xl" />
                    <div className="relative w-full h-full bg-matrix-green/10 rounded-full flex items-center justify-center border border-matrix-green/50">
                      <CheckCircle2 className="w-9 h-9 text-matrix-green" />
                    </div>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{ top: '50%', left: '50%', backgroundColor: i % 2 === 0 ? '#00F0FF' : '#00FF88' }}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{ x: Math.cos((i * Math.PI) / 4) * 60, y: Math.sin((i * Math.PI) / 4) * 60, opacity: 0, scale: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    ))}
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-matrix-green/10 border border-matrix-green/30 rounded-full mb-4">
                      <Zap className="w-3 h-3 text-matrix-green" />
                      <span className="font-mono text-[10px] text-matrix-green tracking-widest uppercase">Pago Exitoso</span>
                    </div>
                    <h3 className="font-display text-2xl font-bold text-frost-white mb-2">¡Listo!</h3>
                    <p className="font-mono text-sm text-ghost-white/70 mb-6">
                      Tu pago fue procesado correctamente.<br />Recibirás una confirmación en tu correo.
                    </p>
                    <div className="bg-steel-gray/20 border border-terminal-gray/30 rounded-xl p-4 mb-6 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-ghost-white/60">Plan</span>
                        <span className="font-mono text-sm text-frost-white">{planName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-ghost-white/60">Total</span>
                        <span className="font-mono text-lg text-cyber-cyan font-bold">{formatPrice(finalPrice)}/mes</span>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="px-8 py-3 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan font-mono text-sm tracking-widest hover:bg-cyber-cyan/20 transition-colors rounded-xl"
                    >
                      Cerrar
                    </button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          <motion.p
            className="text-center font-mono text-[8px] text-terminal-gray/50 tracking-[0.3em] mt-3 uppercase"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Encriptación AES-256 · Conexión segura SSL
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
