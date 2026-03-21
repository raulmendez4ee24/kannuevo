import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          Terminos y Condiciones
        </h1>
        <p className="text-ghost-white text-sm mb-10">
          Ultima actualizacion: 21 de marzo de 2026
        </p>

        <div className="space-y-8 text-ghost-white leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              1. Aceptacion de los Terminos
            </h2>
            <p>
              Al acceder o utilizar los servicios de KAN Logic Systems (&quot;KAN Logic&quot;, &quot;nosotros&quot;),
              aceptas estar sujeto a estos Terminos y Condiciones. Si no estas de acuerdo con alguna
              parte de estos terminos, no debes usar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              2. Descripcion del Servicio
            </h2>
            <p>
              KAN Logic proporciona servicios de automatizacion empresarial con inteligencia artificial,
              incluyendo pero no limitado a: chatbots para WhatsApp y redes sociales, agentes de voz,
              agentes autonomos, paginas web personalizadas, y herramientas de gestion de clientes
              y operaciones.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              3. Cuentas de Usuario
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Debes proporcionar informacion veraz y actualizada al crear tu cuenta.</li>
              <li>Eres responsable de mantener la confidencialidad de tus credenciales de acceso.</li>
              <li>Debes notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.</li>
              <li>Nos reservamos el derecho de suspender o cancelar cuentas que violen estos terminos.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              4. Uso Aceptable
            </h2>
            <p className="mb-3">No puedes usar nuestros servicios para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Enviar spam o mensajes no solicitados.</li>
              <li>Actividades ilegales o fraudulentas.</li>
              <li>Interferir con el funcionamiento de nuestros sistemas.</li>
              <li>Recopilar datos de otros usuarios sin su consentimiento.</li>
              <li>Violar derechos de propiedad intelectual de terceros.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              5. Pagos y Facturacion
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Los precios de los planes se muestran en pesos mexicanos (MXN) e incluyen IVA.</li>
              <li>Los pagos se procesan de forma segura a traves de Stripe.</li>
              <li>Las suscripciones se renuevan automaticamente segun el periodo contratado.</li>
              <li>Puedes cancelar tu suscripcion en cualquier momento desde tu dashboard.</li>
              <li>No se realizan reembolsos por periodos parciales de servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              6. Propiedad Intelectual
            </h2>
            <p>
              Todo el contenido, diseno, codigo y tecnologia de KAN Logic es propiedad de
              KAN Logic Systems. Los chatbots, automatizaciones y configuraciones creadas
              para tu organizacion son de tu propiedad, pero la tecnologia subyacente
              permanece siendo nuestra.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              7. Integraciones con Terceros
            </h2>
            <p>
              Nuestros servicios se integran con plataformas de terceros como Meta (Facebook,
              Instagram, WhatsApp), Google, Stripe y otros. El uso de estas integraciones esta
              sujeto a los terminos y politicas de cada plataforma. KAN Logic no es responsable
              por cambios o interrupciones en servicios de terceros.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              8. Limitacion de Responsabilidad
            </h2>
            <p>
              KAN Logic no sera responsable por danos indirectos, incidentales o consecuentes
              derivados del uso de nuestros servicios. Nuestra responsabilidad total no excedera
              el monto pagado por el usuario en los ultimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              9. Modificaciones
            </h2>
            <p>
              Nos reservamos el derecho de modificar estos terminos en cualquier momento.
              Los cambios significativos seran notificados por correo electronico con al
              menos 30 dias de anticipacion.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              10. Contacto
            </h2>
            <p>
              Para preguntas sobre estos terminos, contactanos en:{' '}
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
