import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import CyberCard from '../components/ui/CyberCard';
import CyberButton from '../components/ui/CyberButton';
import SecureCheckout from '../components/ui/SecureCheckout';
import { 
  Bot, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Calculator, 
  Users, 
  RotateCcw,
  FileText,
  Package,
  Receipt,
  HelpCircle,
  Monitor,
  Wrench,
  Globe,
  Download,
  Eye,
  Video,
  CalendarDays,
  Megaphone,
  Link2,
  LayoutDashboard,
  CheckCircle2,
  Zap,
  Shield,
  Cpu
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  features: string[];
  setup: string;
  monthly: string;
  popular?: boolean;
}

const salesFeatures: Feature[] = [
  { icon: MessageSquare, title: 'WhatsApp 24/7', description: 'Responde, califica, captura datos, manda cotización' },
  { icon: Calendar, title: 'Agenda Automática', description: 'Citas, recordatorios, reprogramación sin intervención' },
  { icon: TrendingUp, title: 'Seguimiento Automático', description: '"Te escribo mañana / en 3 días" hasta cerrar' },
  { icon: Calculator, title: 'Cotizador Inteligente', description: 'Preguntas → calcula precio → manda propuesta' },
  { icon: Users, title: 'CRM Automático', description: 'Crea lead, cambia etapa, asigna vendedor, tareas' },
  { icon: RotateCcw, title: 'Recuperación de Ventas', description: 'Reactivar leads fríos con campañas automáticas' },
];

const operationsFeatures: Feature[] = [
  { icon: FileText, title: 'Reportes Automáticos', description: 'Diarios/semanales sin tocar una tecla' },
  { icon: Package, title: 'Captura de Pedidos', description: 'WhatsApp → sistema automáticamente' },
  { icon: Receipt, title: 'Facturación Automática', description: 'Si hay API o portal web, se conecta' },
  { icon: Monitor, title: 'Inventario y Alertas', description: 'Stock bajo, productos top, reorden automático' },
  { icon: HelpCircle, title: 'Soporte Interno', description: 'Tickets, escalación, FAQ + acciones' },
  { icon: Wrench, title: 'Monitoreo y Auto-Repair', description: 'Errores, caídas, alertas, auto-corrección' },
];

const agentFeatures: Feature[] = [
  { icon: Globe, title: 'Navegación Web', description: 'Abre portales, navega menús, llena formularios' },
  { icon: Download, title: 'Gestión de Archivos', description: 'Descarga archivos, sube documentos' },
  { icon: Monitor, title: 'Operación sin API', description: 'Controla PC + browser para sistemas viejos' },
  { icon: Eye, title: 'Detección Visual', description: 'Detecta fallos en pantalla y auto-repara' },
  { icon: Zap, title: 'Misiones Completas', description: 'Ejecuta tareas con evidencia before/after' },
  { icon: Shield, title: 'Reglas y Auditoría', description: 'Operador digital con permisos y trazabilidad' },
];

const marketingFeatures: Feature[] = [
  { icon: Video, title: 'Fábrica de Contenido', description: 'Guion → voz → subtítulos → video 9:16 listo' },
  { icon: CalendarDays, title: 'Calendario de Posts', description: 'Publicaciones + captions + hashtags' },
  { icon: MessageSquare, title: 'Respuestas Auto', description: 'A comentarios/DMs con límites inteligentes' },
  { icon: Megaphone, title: 'Embudo Completo', description: 'Anuncio → WhatsApp → califica → agenda → cierre' },
];

const integrationFeatures: Feature[] = [
  { icon: Cpu, title: 'Detección Inteligente', description: 'Detecta qué le falta al negocio' },
  { icon: Link2, title: 'Recomendación', description: 'Propone 2-3 proveedores con razones' },
  { icon: Zap, title: 'Conexión Automática', description: 'Prueba endpoint, genera workflow en n8n' },
  { icon: Shield, title: 'Monitoreo Continuo', description: 'Fallback y auto-repair siempre activos' },
];

const products: Product[] = [
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'WhatsApp que trabaja por ti',
    description: 'Para negocio local o emprendedor que pierde clientes por no responder a tiempo.',
    features: [
      'Responde WhatsApp 24/7 sin que estés presente',
      'Agenda citas y manda recordatorios solo',
      'Captura leads y nunca pierde un prospecto',
      'Panel para ver qué hizo el sistema cada día',
      'Precio fijo, sin sorpresas',
    ],
    setup: '',
    monthly: '$900 MXN',
  },
  {
    id: 'growth',
    name: 'Growth',
    subtitle: 'Tu negocio opera solo',
    description: 'Para PyME que gasta tiempo en tareas repetitivas que una persona debería estar haciendo.',
    features: [
      'Todo Starter incluido',
      'Cobranza y seguimiento automático de clientes',
      'Reportes semanales sin tocar una tecla',
      '5-15 automatizaciones de tus procesos clave',
      '2-5 integraciones con tus sistemas actuales',
      'Monitoreo y alertas en tiempo real',
      'Precio fijo, sin cobros por uso',
    ],
    setup: '',
    monthly: '$4,500 MXN',
    popular: true,
  },
  {
    id: 'commerce',
    name: 'Commerce',
    subtitle: 'Tu tienda vende aunque estés dormido',
    description: 'Para tienda o e-commerce que quiere vender más sin contratar más personal.',
    features: [
      'Todo Growth incluido',
      'Atención, pedidos y postventa automatizados',
      'Recuperación de carritos abandonados',
      'Reportes de ventas diarios automáticos',
      'Integración con Shopify u otras plataformas',
      'Precio fijo, sin sorpresas',
    ],
    setup: '',
    monthly: '$12,000 MXN',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'Automatización total de tu operación',
    description: 'Para empresa que quiere reducir nómina operativa y profesionalizar sus procesos.',
    features: [
      'Todo Commerce incluido',
      'Auditoría completa de procesos + roadmap',
      'Agente autónomo que usa PC y navegador solo',
      'Control de accesos, auditoría y políticas',
      'SLA garantizado + monitoreo + auto-reparación',
      'Implementación acompañada por nuestro equipo',
    ],
    setup: '',
    monthly: '$50,000 MXN',
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      viewport={{ once: true }}
      className="group p-4 bg-steel-gray/30 border border-terminal-gray/50 rounded-lg hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-cyber-cyan/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-cyber-cyan/20 transition-colors">
          <Icon className="w-5 h-5 text-cyber-cyan" />
        </div>
        <div>
          <h4 className="font-display font-semibold text-frost-white text-sm mb-1 group-hover:text-cyber-cyan transition-colors">
            {feature.title}
          </h4>
          <p className="text-xs text-ghost-white">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
export default function DigitalWorkforceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: string;
    billingLabel?: 'monthly' | 'one_time';
  } | null>(null);

  const openCheckout = (plan: Product) => {
    setSelectedPlan({ id: plan.id, name: plan.name, price: plan.monthly, billingLabel: 'monthly' });
    setIsCheckoutOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutName = params.get('checkoutName');
    const checkoutPrice = params.get('checkoutPrice');

    if (!checkoutName || !checkoutPrice) return;

    const checkoutId = params.get('checkoutId') || checkoutName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const billingLabel = params.get('checkoutBilling') === 'one_time' ? 'one_time' : 'monthly';

    setSelectedPlan({
      id: checkoutId,
      name: checkoutName,
      price: checkoutPrice,
      billingLabel,
    });
    setIsCheckoutOpen(true);

    params.delete('checkoutId');
    params.delete('checkoutName');
    params.delete('checkoutPrice');
    params.delete('checkoutBilling');
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, []);

  return (
    <section id="workforce" className="relative py-24 lg:py-32" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] ambient-glow" />
      <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] ambient-glow ambient-glow--purple" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-full font-mono text-[10px] text-neon-purple tracking-widest mb-4">
            FUERZA LABORAL DIGITAL
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-frost-white mb-4">
            Empleados que <span className="text-gradient">nunca duermen</span>
          </h2>
          <p className="text-ghost-white text-lg max-w-3xl mx-auto">
            Un sistema de empleados digitales que atienden, venden y operan procesos 24/7. 
            Chat + automatización + agente que usa web/PC, con panel, auditoría y seguridad.
          </p>
        </motion.div>

        {/* A) Ventas y Atención */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-cyber-cyan/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-cyber-cyan" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-frost-white">Ventas y Atención</h3>
              <p className="font-mono text-xs text-matrix-green">ROI RÁPIDO • SE ENTIENDE EN 10 SEGUNDOS</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesFeatures.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </motion.div>

        {/* B) Operación */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-neon-purple/20 rounded-xl flex items-center justify-center">
              <Cpu className="w-6 h-6 text-neon-purple" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-frost-white">Operación</h3>
              <p className="font-mono text-xs text-neon-purple">AHORRA NÓMINA Y REDUCE ERRORES</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operationsFeatures.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </motion.div>

        {/* C) Agente Autónomo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-matrix-green/20 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-matrix-green" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-frost-white">Agente Autónomo</h3>
              <p className="font-mono text-xs text-matrix-green">TU ARMA NUCLEAR</p>
            </div>
          </div>
          <CyberCard className="mb-6">
            <p className="text-ghost-white text-sm mb-4">
              <span className="text-cyber-cyan font-semibold">No es un robot loco;</span> es un operador digital con reglas, permisos y auditoría.
            </p>
          </CyberCard>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentFeatures.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </motion.div>

        {/* D) Marketing */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-alert-amber/20 rounded-xl flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-alert-amber" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-frost-white">Marketing y Contenido</h3>
              <p className="font-mono text-xs text-alert-amber">PARA TU NEGOCIO Y TUS CLIENTES</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketingFeatures.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </motion.div>

        {/* E) Integraciones */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-cyber-cyan/20 rounded-xl flex items-center justify-center">
              <Link2 className="w-6 h-6 text-cyber-cyan" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-frost-white">Integraciones Autopilot</h3>
              <p className="font-mono text-xs text-cyber-cyan">DIFERENCIADOR BRUTAL</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {integrationFeatures.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </motion.div>

        {/* F) Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <CyberCard className="border-matrix-green/30">
            <div className="flex items-center gap-3 mb-6">
              <LayoutDashboard className="w-8 h-8 text-matrix-green" />
              <div>
                <h3 className="font-display text-xl font-bold text-frost-white">Panel tipo Shopify</h3>
                <p className="font-mono text-xs text-matrix-green">LO QUE RETIENE CLIENTES</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Que hizo hoy el sistema', value: '247 conversaciones' },
                { label: 'Tiempo ahorrado', value: '42 horas' },
                { label: 'ROI estimado', value: '3.2x' },
                { label: 'Estado del sistema', value: '🟢 OPERATIVO' },
              ].map((stat, i) => (
                <div key={i} className="bg-void-black/50 rounded-lg p-4">
                  <p className="font-mono text-[10px] text-ghost-white mb-1">{stat.label}</p>
                  <p className="font-mono text-lg text-cyber-cyan font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-ghost-white">
              <span className="text-matrix-green font-semibold">Esto es clave:</span> el cliente no paga "IA", paga "ver el trabajo".
            </p>
          </CyberCard>
        </motion.div>

        {/* Products */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <h3 className="font-display text-3xl font-bold text-frost-white text-center mb-8">
            Elige tu <span className="text-gradient">sistema operativo</span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8 + index * 0.1 }}
                className={`relative ${product.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
              >
                {product.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyber-cyan text-void-black font-mono text-[10px] font-bold tracking-wider rounded-full">
                    MÁS POPULAR
                  </div>
                )}
                <div className={`h-full p-6 rounded-xl border ${product.popular ? 'bg-steel-gray/50 border-cyber-cyan shadow-cyber-glow' : 'bg-steel-gray/30 border-terminal-gray/50'}`}>
                  <h4 className="font-display text-xl font-bold text-frost-white mb-1">{product.name}</h4>
                  <p className="font-mono text-xs text-cyber-cyan mb-2">{product.subtitle}</p>
                  <p className="text-sm text-ghost-white mb-4">{product.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ghost-white">
                        <CheckCircle2 className="w-4 h-4 text-matrix-green flex-shrink-0 mt-0.5" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <div className="mb-6">
                    <p className="font-mono text-[10px] text-ghost-white mb-1">PRECIO FIJO</p>
                    <p className="font-mono text-2xl text-cyber-cyan font-bold">{product.monthly}<span className="text-sm text-ghost-white font-normal">/mes</span></p>
                  </div>

                  <CyberButton
                    variant={product.popular ? 'primary' : 'secondary'}
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => openCheckout(product)}
                  >
                    CONTRATAR
                  </CyberButton>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Closing statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <CyberCard className="inline-block max-w-2xl">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-cyber-cyan" />
              <span className="font-mono text-xs text-cyber-cyan tracking-widest">DEMO QUE ROMPE CABEZAS</span>
            </div>
            <p className="text-ghost-white text-lg mb-4">
              Cliente escribe por WhatsApp → Bot califica y agenda → Se crea lead en CRM → 
              Se genera reporte/tarea → En panel se ve <span className="text-matrix-green font-bold">"Hecho ✅"</span>
            </p>
            <p className="text-frost-white font-semibold">
              Eso cierra.
            </p>
          </CyberCard>
        </motion.div>
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
          billingLabel={selectedPlan.billingLabel}
        />
      )}
    </section>
  );
}
