import { useState } from 'react';
import { CheckCircle2, Copy, X } from 'lucide-react';
function parsePriceToCents(price: string): number {
  const match = price.match(/\$?([\d,]+)/);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, '')) * 100;
}

interface SecureCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  planPrice: string;
}

const SANTANDER_ACCOUNT = '014320200145989015';

export default function SecureCheckout({ isOpen, onClose, planId, planName, planPrice }: SecureCheckoutProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [confirmFunds, setConfirmFunds] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!confirmFunds) {
      setError('Debes confirmar que tienes fondos antes de continuar.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          planName,
          amount: parsePriceToCents(planPrice),
          currency: 'mxn',
          customerEmail: email,
          customerName: name,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardHolder: name,
          expiry,
          cvv,
        }),
      });
      if (!res.ok) throw new Error('No se pudo procesar');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-void-black/80" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-steel-gray/40 border border-cyber-cyan/40 rounded-xl p-6">
        <button onClick={onClose} className="absolute top-3 right-3 text-ghost-white hover:text-frost-white">
          <X className="w-5 h-5" />
        </button>

        {!done ? (
          <>
            <h3 className="font-display text-2xl text-frost-white mb-1">{planName}</h3>
            <p className="font-mono text-cyber-cyan mb-4">{planPrice}</p>
            <div className="p-3 mb-4 bg-matrix-green/10 border border-matrix-green/40 rounded-lg">
              <p className="text-xs text-matrix-green font-mono tracking-wider">CUENTA DESTINO (SANTANDER)</p>
              <p className="text-frost-white font-display text-lg">{SANTANDER_ACCOUNT}</p>
              <p className="text-xs text-ghost-white mt-1">El servicio se activa cuando se acredita el pago. Si no hay fondos, no procede.</p>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" className="w-full px-4 py-3 rounded-lg bg-void-black/50 border border-terminal-gray/50 text-frost-white" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre titular" className="w-full px-4 py-3 rounded-lg bg-void-black/50 border border-terminal-gray/50 text-frost-white" />
              <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="Tarjeta" className="w-full px-4 py-3 rounded-lg bg-void-black/50 border border-terminal-gray/50 text-frost-white" />
              <div className="grid grid-cols-2 gap-3">
                <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/AA" className="w-full px-4 py-3 rounded-lg bg-void-black/50 border border-terminal-gray/50 text-frost-white" />
                <input value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="CVV" className="w-full px-4 py-3 rounded-lg bg-void-black/50 border border-terminal-gray/50 text-frost-white" />
              </div>
              <label className="flex items-start gap-2 text-sm text-ghost-white">
                <input type="checkbox" checked={confirmFunds} onChange={(e) => setConfirmFunds(e.target.checked)} />
                Confirmo que tengo fondos y que pagaré a la cuenta Santander indicada.
              </label>
              {error ? <p className="text-error-crimson text-sm">{error}</p> : null}
              <button disabled={loading} className="w-full px-4 py-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/20 transition-colors disabled:opacity-60">
                {loading ? 'Procesando...' : 'Confirmar pago'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-matrix-green mx-auto mb-3" />
            <p className="font-display text-xl text-frost-white mb-2">Pago registrado</p>
            <p className="text-sm text-ghost-white mb-4">
              Te enviamos confirmación por correo. Cuenta destino: <strong>{SANTANDER_ACCOUNT}</strong>
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(SANTANDER_ACCOUNT)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-terminal-gray/50 text-ghost-white hover:text-frost-white"
            >
              <Copy className="w-4 h-4" />
              Copiar cuenta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
