import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react';

export default function DataDeletionPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await fetch('/api/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), reason: reason.trim() }),
      });
    } catch {
      // Even if the API call fails, show success to avoid leaking account existence
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-void-black text-frost-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-cyber-cyan hover:underline text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <h1 className="font-display text-4xl font-bold text-cyber-cyan mb-2">
          Eliminacion de Datos
        </h1>
        <p className="text-ghost-white text-sm mb-10">
          Solicita la eliminacion de tus datos personales
        </p>

        <div className="space-y-8 text-ghost-white leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              Tu Derecho a la Eliminacion
            </h2>
            <p>
              Tienes derecho a solicitar la eliminacion completa de tus datos personales
              almacenados por KAN Logic Systems. Esto incluye datos de cuenta, configuraciones,
              tokens de integracion y logs asociados.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              Que se Elimina
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tu cuenta de usuario y credenciales.</li>
              <li>Datos de organizacion asociados.</li>
              <li>Tokens y credenciales de integraciones (Meta, Google, etc.).</li>
              <li>Configuraciones de automatizacion y chatbots.</li>
              <li>Historial de conversaciones almacenado.</li>
              <li>Logs de auditoria con tu informacion.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              Proceso
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Completa el formulario abajo o envia un correo a mendez@kanlogic.lat.</li>
              <li>Verificaremos tu identidad por correo electronico.</li>
              <li>Tus datos seran eliminados en un plazo maximo de 30 dias.</li>
              <li>Recibiras una confirmacion por correo cuando el proceso se complete.</li>
            </ul>
          </section>

          {submitted ? (
            <div className="rounded-xl border border-matrix-green/40 bg-matrix-green/10 p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-matrix-green mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-frost-white mb-2">
                Solicitud Recibida
              </h3>
              <p className="text-ghost-white">
                Recibiras un correo de verificacion en las proximas 24 horas.
                Tus datos seran eliminados dentro de 30 dias habiles.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
                Solicitar Eliminacion
              </h2>

              <div>
                <label htmlFor="email" className="block font-mono text-xs text-cyber-cyan tracking-widest mb-2">
                  CORREO ELECTRONICO
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-steel-gray/50 border border-terminal-gray rounded-lg px-4 py-3 text-frost-white placeholder:text-ghost-white/40 focus:border-cyber-cyan focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block font-mono text-xs text-cyber-cyan tracking-widest mb-2">
                  MOTIVO (OPCIONAL)
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe por que deseas eliminar tus datos"
                  rows={3}
                  className="w-full bg-steel-gray/50 border border-terminal-gray rounded-lg px-4 py-3 text-frost-white placeholder:text-ghost-white/40 focus:border-cyber-cyan focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-error-crimson/20 border border-error-crimson text-error-crimson rounded-lg hover:bg-error-crimson/30 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? 'Enviando...' : 'Solicitar Eliminacion'}
              </button>
            </form>
          )}

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              Contacto Directo
            </h2>
            <p>
              Tambien puedes solicitar la eliminacion de datos enviando un correo a:{' '}
              <a href="mailto:mendez@kanlogic.lat" className="text-cyber-cyan hover:underline">
                mendez@kanlogic.lat
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-terminal-gray/50 text-sm text-ghost-white/60">
          <p>KAN Logic Systems - Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
