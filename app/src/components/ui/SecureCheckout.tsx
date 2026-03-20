import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Cpu, AlertCircle, X, ExternalLink, CreditCard } from 'lucide-react';

interface SecureCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  planPrice: string;
  billingLabel?: 'monthly' | 'one_time';
}

function parseBasePrice(priceStr: string): number {
  const match = priceStr.match(/\$?([\d,]+)/);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ''), 10);
}

function formatPrice(amount: number): string {
  return '$' + amount.toLocaleString('es-MX');
}

function getCheckoutErrorMessage(code?: string): string {
  if (code === 'PAYMENT_NOT_CONFIGURED') {
    return 'Stripe no esta configurado todavia en el servidor.';
  }
  if (code === 'FAILED_TO_CREATE_CHECKOUT_SESSION') {
    return 'No se pudo abrir Stripe Checkout. Intenta de nuevo en unos segundos.';
  }
  if (code === 'INVALID_PAYMENT_REQUEST') {
    return 'La solicitud de pago no paso validacion. Revisa tus datos.';
  }
  return 'No se pudo iniciar el checkout. Intenta de nuevo.';
}

export default function SecureCheckout({
  isOpen,
  onClose,
  planId,
  planName,
  planPrice,
  billingLabel = 'monthly',
}: SecureCheckoutProps) {
  type Step = 'form' | 'processing';

  const [step, setStep] = useState<Step>('form');
  const [finalPrice, setFinalPrice] = useState(parseBasePrice(planPrice));
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityLevel, setSecurityLevel] = useState(25);

  useEffect(() => {
    if (!isOpen) return;
    setStep('form');
    setFinalPrice(parseBasePrice(planPrice));
    setCustomerEmail('');
    setCustomerName('');
    setError(null);
    setIsProcessing(false);
    setSecurityLevel(25);
  }, [isOpen, planPrice]);

  useEffect(() => {
    let level = 25;
    if (customerEmail.includes('@')) level += 35;
    if (customerName.trim().length >= 2) level += 40;
    setSecurityLevel(level);
  }, [customerEmail, customerName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerEmail || !customerEmail.includes('@')) {
      setError('Por favor ingresa un email valido.');
      return;
    }

    if (customerName.trim().length < 2) {
      setError('Por favor ingresa tu nombre o el nombre del contacto.');
      return;
    }

    setIsProcessing(true);
    setStep('processing');
    setError(null);

    try {
      const response = await fetch('/api/payment/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          planName,
          amount: finalPrice * 100,
          currency: 'mxn',
          customerEmail,
          customerName: customerName.trim(),
          billingLabel,
          returnHash: window.location.hash || '#/workforce',
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.url) {
        setError(getCheckoutErrorMessage(data?.error));
        setIsProcessing(false);
        setStep('form');
        return;
      }

      window.location.assign(data.url);
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
      setIsProcessing(false);
      setStep('form');
    }
  };

  if (!isOpen) return null;

  const isFormReady = customerEmail.includes('@') && customerName.trim().length >= 2 && !isProcessing;
  const billingSuffix = billingLabel === 'monthly'
    ? <span className="text-xs text-ghost-white font-normal">/mes</span>
    : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="absolute inset-0 bg-void-black/80 backdrop-blur-xl"
          onClick={() => {
            if (!isProcessing) onClose();
          }}
        />

        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div
            className="w-full h-full"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 240, 255, 0.05) 2px, rgba(0, 240, 255, 0.05) 4px)',
            }}
          />
        </div>

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative overflow-hidden rounded-2xl border border-cyber-cyan/20 bg-[#0a0f1a] shadow-2xl shadow-cyber-cyan/5">
            <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan/60 to-transparent" />
            <div className="absolute left-0 top-0 h-6 w-6 rounded-tl-2xl border-l border-t border-cyber-cyan/40" />
            <div className="absolute right-0 top-0 h-6 w-6 rounded-tr-2xl border-r border-t border-cyber-cyan/40" />
            <div className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-2xl border-b border-l border-cyber-cyan/20" />
            <div className="absolute bottom-0 right-0 h-6 w-6 rounded-br-2xl border-b border-r border-cyber-cyan/20" />

            <div className="relative p-6">
              {step === 'form' && (
                <>
                  <div className="mb-5 flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-cyber-cyan" />
                        <span className="font-mono text-[10px] uppercase tracking-widest text-cyber-cyan">
                          Pago con Stripe
                        </span>
                      </div>
                      <h2 className="font-display text-xl font-bold text-frost-white">{planName}</h2>
                      <p className="mt-0.5 font-mono text-2xl font-bold text-cyber-cyan">
                        {formatPrice(finalPrice)}
                        {billingSuffix}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-lg p-2 text-ghost-white transition-colors hover:bg-steel-gray/40 hover:text-frost-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-5">
                    <div className="mb-4 rounded-xl border border-cyber-cyan/20 bg-void-black/60 p-4">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-ghost-white/60">
                        Resumen
                      </p>
                      <p className="font-mono text-lg font-bold text-cyber-cyan">
                        {formatPrice(finalPrice)}
                        {billingSuffix}
                      </p>
                      <p className="mt-1 text-xs text-ghost-white/60">
                        Seras redirigido a Stripe Checkout para completar el cobro de forma segura.
                      </p>
                    </div>

                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-ghost-white/60">
                        Seguridad
                      </span>
                      <span className="font-mono text-[9px] text-cyber-cyan">{securityLevel}%</span>
                    </div>
                    <div className="h-0.5 overflow-hidden rounded-full bg-steel-gray/60">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyber-cyan to-matrix-green"
                        animate={{ width: `${securityLevel}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-ghost-white/70">
                        Correo electronico
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value.trim())}
                        placeholder="tu@correo.com"
                        required
                        className="w-full rounded-xl border border-terminal-gray/40 bg-void-black/60 px-4 py-3 font-mono text-sm text-frost-white placeholder-ghost-white/25 transition-all focus:border-cyber-cyan/60 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/20"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-ghost-white/70">
                        Nombre del contacto
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nombre y apellido"
                        required
                        className="w-full rounded-xl border border-terminal-gray/40 bg-void-black/60 px-4 py-3 font-mono text-sm text-frost-white placeholder-ghost-white/25 transition-all focus:border-cyber-cyan/60 focus:outline-none focus:ring-1 focus:ring-cyber-cyan/20"
                      />
                    </div>

                    <div className="rounded-xl border border-terminal-gray/30 bg-steel-gray/15 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-cyber-cyan" />
                        <p className="font-mono text-[10px] uppercase tracking-widest text-cyber-cyan">
                          Tarjeta capturada por Stripe
                        </p>
                      </div>
                      <p className="text-xs leading-relaxed text-ghost-white/70">
                        Esta app ya no solicita numero de tarjeta, CVV ni vencimiento en tu propio frontend.
                        El cobro se hace en la pagina hospedada de Stripe y el resultado regresa por webhook.
                      </p>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                        <span className="font-mono text-xs text-red-400">{error}</span>
                      </motion.div>
                    )}

                    <motion.button
                      type="submit"
                      disabled={!isFormReady}
                      whileHover={isFormReady ? { scale: 1.01 } : {}}
                      whileTap={isFormReady ? { scale: 0.99 } : {}}
                      className={`mt-2 w-full overflow-hidden rounded-xl px-6 py-4 font-mono text-sm uppercase tracking-widest transition-all ${
                        isFormReady
                          ? 'border border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/20 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                          : 'cursor-not-allowed border border-terminal-gray/30 bg-steel-gray/20 text-ghost-white/30'
                      }`}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Ir a Stripe Checkout
                      </span>
                    </motion.button>
                  </form>

                  <div className="mt-5 flex items-center justify-center gap-5 border-t border-terminal-gray/20 pt-4">
                    {[
                      { icon: Shield, label: 'Stripe Hosted' },
                      { icon: Lock, label: 'SSL/TLS' },
                      { icon: CreditCard, label: 'Webhook Sync' },
                    ].map((badge) => (
                      <div key={badge.label} className="flex items-center gap-1.5 text-terminal-gray">
                        <badge.icon className="h-3 w-3" />
                        <span className="font-mono text-[9px] tracking-wider">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 'processing' && (
                <div className="py-14 text-center">
                  <div className="relative mx-auto mb-8 h-20 w-20">
                    <motion.div
                      className="absolute inset-0 rounded-full border border-cyber-cyan/30"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                      className="absolute inset-2 rounded-full border border-neon-purple/40"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="absolute inset-4 flex items-center justify-center rounded-full bg-cyber-cyan/10">
                      <Cpu className="h-7 w-7 animate-pulse text-cyber-cyan" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-display text-lg font-bold text-frost-white">
                    Abriendo Stripe Checkout
                  </h3>
                  <p className="font-mono text-xs text-ghost-white/60">
                    Estamos creando tu sesion segura y redirigiendo a Stripe...
                  </p>
                </div>
              )}
            </div>
          </div>

          <motion.p
            className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.3em] text-terminal-gray/50"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Stripe Checkout · Webhook seguro · Sin capturar tarjeta localmente
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
