import { useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import CyberButton from '../components/ui/CyberButton';
import SecureCheckout from '../components/ui/SecureCheckout';
import { PLANS, PENDING_CHECKOUT_KEY } from '../constants/plans';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DigitalWorkforceSection() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: string } | null>(null);

  const openCheckout = (plan: (typeof PLANS)[number]) => {
    if (!isAuthenticated) {
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify({ id: plan.id, name: plan.name, price: plan.monthly }));
      navigate('/login?returnUrl=/dashboard');
      return;
    }
    setSelectedPlan({ id: plan.id, name: plan.name, price: plan.monthly });
    setIsCheckoutOpen(true);
  };

  return (
    <section id="workforce" className="py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <h2 className="font-display text-4xl text-frost-white mb-3">Planes</h2>
        <p className="text-ghost-white mb-8">Debes iniciar sesión para contratar. Al iniciar sesión tendrás acceso al dashboard.</p>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`rounded-xl border p-5 ${'popular' in plan && plan.popular ? 'border-cyber-cyan bg-cyber-cyan/5' : 'border-terminal-gray/50 bg-steel-gray/30'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-xl text-frost-white">{plan.name}</h3>
                {'popular' in plan && plan.popular && <span className="text-[10px] font-mono text-cyber-cyan">POPULAR</span>}
              </div>
              <p className="font-mono text-cyber-cyan text-xl mb-4">{plan.monthly}</p>
              <ul className="space-y-2 mb-6 text-sm text-ghost-white">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-matrix-green" />Activación guiada</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-matrix-green" />Dashboard incluido</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-matrix-green" />Soporte y seguimiento</li>
              </ul>
              <CyberButton className="w-full" onClick={() => openCheckout(plan)}>
                <Lock className="w-4 h-4" />
                CONTRATAR
              </CyberButton>
            </div>
          ))}
        </div>
      </div>

      {selectedPlan && (
        <SecureCheckout
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedPlan(null);
          }}
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
        />
      )}
    </section>
  );
}
