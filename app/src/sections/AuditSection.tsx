import { useState } from 'react';
import CyberButton from '../components/ui/CyberButton';

export default function AuditSection() {
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          businessName,
          businessType: 'general',
          priorities: ['ventas', 'operacion'],
        }),
      });
      if (!res.ok) throw new Error('fail');
      alert('Auditoría enviada. Te contactamos por correo.');
      setEmail('');
      setBusinessName('');
    } catch {
      alert('No se pudo enviar. Intenta de nuevo.');
    }
  }

  return (
    <section id="audit" className="py-20 lg:py-24">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
        <h2 className="font-display text-4xl text-frost-white mb-3">Auditoría IA</h2>
        <p className="text-ghost-white mb-8">Te damos un plan de acción claro para automatizar y crecer.</p>

        <form onSubmit={handleSubmit} className="bg-steel-gray/30 border border-terminal-gray/50 rounded-xl p-6 space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white"
          />
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Nombre del negocio"
            className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white"
          />
          <CyberButton className="w-full" variant="primary">
            ENVIAR AUDITORIA
          </CyberButton>
        </form>
      </div>
    </section>
  );
}
