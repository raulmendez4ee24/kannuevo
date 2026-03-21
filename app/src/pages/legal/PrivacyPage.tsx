import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
          Politica de Privacidad
        </h1>
        <p className="text-ghost-white text-sm mb-10">
          Ultima actualizacion: 21 de marzo de 2026
        </p>

        <div className="space-y-8 text-ghost-white leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              1. Informacion que Recopilamos
            </h2>
            <p className="mb-3">Recopilamos la siguiente informacion:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Datos de cuenta:</strong> nombre, correo electronico, contrasena (cifrada), nombre de organizacion.</li>
              <li><strong>Datos de uso:</strong> interacciones con el dashboard, configuraciones de automatizacion, metricas de rendimiento.</li>
              <li><strong>Datos de integraciones:</strong> tokens de acceso a plataformas conectadas (Meta, Google, etc.), almacenados de forma cifrada.</li>
              <li><strong>Datos de contacto:</strong> informacion proporcionada a traves de formularios de contacto o auditoria.</li>
              <li><strong>Datos de pago:</strong> procesados directamente por Stripe; no almacenamos numeros de tarjeta.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              2. Como Usamos tu Informacion
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar y mejorar nuestros servicios de automatizacion.</li>
              <li>Gestionar tu cuenta y suscripcion.</li>
              <li>Conectar con plataformas de terceros (Meta, Google) segun tu autorizacion.</li>
              <li>Enviar comunicaciones relacionadas con el servicio.</li>
              <li>Generar metricas y reportes para tu organizacion.</li>
              <li>Cumplir con obligaciones legales.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              3. Datos de Facebook e Instagram
            </h2>
            <p className="mb-3">
              Cuando conectas tu cuenta de Meta (Facebook/Instagram), accedemos a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Informacion basica de tus paginas de Facebook.</li>
              <li>Mensajes de Messenger e Instagram Direct (para responder a traves de chatbots).</li>
              <li>Publicaciones y comentarios (para gestion de contenido).</li>
              <li>Metricas de rendimiento de paginas y publicaciones.</li>
            </ul>
            <p className="mt-3">
              <strong>No vendemos, compartimos ni transferimos datos de Meta a terceros.</strong>{' '}
              Los datos se usan exclusivamente para proporcionar los servicios de automatizacion
              que configuras en tu dashboard.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              4. Almacenamiento y Seguridad
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Los datos se almacenan en servidores seguros con cifrado en transito (TLS) y en reposo.</li>
              <li>Las contrasenas se almacenan usando hash bcrypt.</li>
              <li>Los tokens de acceso a plataformas se cifran antes de almacenarse.</li>
              <li>Implementamos controles de acceso basados en roles (RBAC).</li>
              <li>Registramos todas las acciones sensibles en logs de auditoria.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              5. Retencion de Datos
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Datos de cuenta: mientras tu cuenta este activa.</li>
              <li>Datos de integraciones: hasta que desconectes la integracion.</li>
              <li>Logs de auditoria: 90 dias.</li>
              <li>Datos de contacto/auditoria: 12 meses.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              6. Tus Derechos
            </h2>
            <p className="mb-3">Tienes derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Acceder</strong> a tus datos personales.</li>
              <li><strong>Rectificar</strong> informacion incorrecta.</li>
              <li><strong>Eliminar</strong> tus datos (ver <Link to="/data-deletion" className="text-cyber-cyan hover:underline">pagina de eliminacion de datos</Link>).</li>
              <li><strong>Exportar</strong> tus datos en formato portable.</li>
              <li><strong>Revocar</strong> permisos de integraciones en cualquier momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              7. Cookies
            </h2>
            <p>
              Usamos cookies estrictamente necesarias para la autenticacion y sesion.
              No usamos cookies de seguimiento, publicidad ni analitica de terceros.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-frost-white mb-3">
              8. Contacto
            </h2>
            <p>
              Para ejercer tus derechos o preguntas sobre privacidad:{' '}
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
