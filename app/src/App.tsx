import { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';

// Landing Page Components (eagerly loaded - entry point)
import HUD from './components/ui/HUD';
import HeroSection from './sections/HeroSection';
import DigitalWorkforceSection from './sections/DigitalWorkforceSection';
import ServicesSection from './sections/ServicesSection';
import ProcessSection from './sections/ProcessSection';
import AuditSection from './sections/AuditSection';
import FAQSection from './sections/FAQSection';
import ContactSection from './sections/ContactSection';
import Footer from './sections/Footer';

// Lazy-loaded: Heavy 3D component
const NeuralNetworkBackground = lazy(() => import('./components/three/NeuralNetworkBackground'));

// Lazy-loaded: Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const CatalogRedirect = lazy(() => import('./pages/CatalogRedirect'));

// Lazy-loaded: Dashboard
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const Automations = lazy(() => import('./pages/dashboard/Automations'));
const Tasks = lazy(() => import('./pages/dashboard/Tasks'));
const Integrations = lazy(() => import('./pages/dashboard/Integrations'));
const Security = lazy(() => import('./pages/dashboard/Security'));
const AdminClients = lazy(() => import('./pages/dashboard/admin/Clients'));
const AdminMetrics = lazy(() => import('./pages/dashboard/admin/Metrics'));
const AdminLogs = lazy(() => import('./pages/dashboard/admin/Logs'));

const DEFAULT_META_DESCRIPTION =
  'Sistemas con IA que captan, responden y venden por ti. Diseñamos chatbots, agentes de voz, automatizaciones y paginas web enfocadas en generar leads y ventas reales.';

const ROUTE_META: Record<string, { title: string; description: string; canonical: string }> = {
  '/': {
    title: 'KAN LOGIC | Arquitectura IA para Negocio Real',
    description: DEFAULT_META_DESCRIPTION,
    canonical: 'https://www.kanlogicsistem.com/',
  },
  '/hero': {
    title: 'KAN LOGIC | Arquitectura IA para Negocio Real',
    description: DEFAULT_META_DESCRIPTION,
    canonical: 'https://www.kanlogicsistem.com/',
  },
  '/services': {
    title: 'KAN LOGIC | Soluciones de IA para Ventas y Operacion',
    description:
      'Chatbots, agentes de voz, agentes autonomos y paginas web personalizadas para captar leads, atender clientes y operar procesos con menos friccion.',
    canonical: 'https://www.kanlogicsistem.com/#/services',
  },
  '/workforce': {
    title: 'KAN LOGIC | Planes de Automatizacion',
    description:
      'Planes Starter, Growth, Commerce y Enterprise con precio fijo para WhatsApp, seguimiento, ventas y automatizacion operativa.',
    canonical: 'https://www.kanlogicsistem.com/#/workforce',
  },
  '/process': {
    title: 'KAN LOGIC | Proceso de Implementacion',
    description:
      'Diagnostico, diseno, implementacion y optimizacion de sistemas con IA para ventas, seguimiento y operacion.',
    canonical: 'https://www.kanlogicsistem.com/#/process',
  },
  '/audit': {
    title: 'KAN LOGIC | Diagnostico de Automatizacion',
    description:
      'Solicita un diagnostico para identificar el primer proceso que conviene automatizar en tu negocio.',
    canonical: 'https://www.kanlogicsistem.com/#/audit',
  },
  '/faq': {
    title: 'KAN LOGIC | Preguntas Frecuentes',
    description:
      'Resuelve dudas sobre precios, implementacion, soporte, integraciones y alcance de los sistemas con IA de KAN Logic.',
    canonical: 'https://www.kanlogicsistem.com/#/faq',
  },
  '/contact': {
    title: 'KAN LOGIC | Contacto',
    description:
      'Habla con KAN Logic para automatizar ventas, atencion y operacion con chatbots, voz, agentes autonomos y paginas web.',
    canonical: 'https://www.kanlogicsistem.com/#/contact',
  },
  '/login': {
    title: 'KAN LOGIC | Iniciar Sesion',
    description: 'Accede al panel de KAN Logic para operar automatizaciones, tareas, integraciones y seguridad.',
    canonical: 'https://www.kanlogicsistem.com/#/login',
  },
  '/register': {
    title: 'KAN LOGIC | Crear Cuenta',
    description: 'Crea una cuenta en KAN Logic para administrar automatizaciones y operacion con IA.',
    canonical: 'https://www.kanlogicsistem.com/#/register',
  },
  '/forgot-password': {
    title: 'KAN LOGIC | Recuperar Contrasena',
    description: 'Solicita instrucciones para recuperar el acceso a tu cuenta de KAN Logic.',
    canonical: 'https://www.kanlogicsistem.com/#/forgot-password',
  },
  '/reset-password': {
    title: 'KAN LOGIC | Restablecer Contrasena',
    description: 'Restablece tu contrasena de acceso a la plataforma de KAN Logic.',
    canonical: 'https://www.kanlogicsistem.com/#/reset-password',
  },
  '/dashboard': {
    title: 'KAN LOGIC | Dashboard',
    description: 'Panel operativo de KAN Logic con overview, tareas, workflows, integraciones y seguridad.',
    canonical: 'https://www.kanlogicsistem.com/#/dashboard',
  },
};

function CheckoutStatusBanner() {
  const location = useLocation();
  const [message, setMessage] = useState<{
    tone: 'success' | 'warning';
    title: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('checkout');
    if (!status) return;

    const paymentId = params.get('payment_id');
    if (status === 'success') {
      setMessage({
        tone: 'success',
        title: 'Pago confirmado',
        body: paymentId
          ? `Stripe confirmo tu checkout. Referencia: ${paymentId}.`
          : 'Stripe confirmo tu checkout y el webhook ya puede procesarlo.',
      });
    } else if (status === 'canceled') {
      setMessage({
        tone: 'warning',
        title: 'Checkout cancelado',
        body: 'No se cargo ningun pago. Puedes intentarlo de nuevo cuando quieras.',
      });
    }

    params.delete('checkout');
    params.delete('payment_id');
    params.delete('session_id');
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, [location.pathname]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 7000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className={`pointer-events-auto max-w-xl rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
          message.tone === 'success'
            ? 'border-matrix-green/40 bg-matrix-green/12 text-frost-white'
            : 'border-yellow-500/40 bg-yellow-500/12 text-frost-white'
        }`}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyber-cyan">
          Estado de Checkout
        </p>
        <p className="mt-1 font-display text-lg font-bold">{message.title}</p>
        <p className="mt-1 text-sm text-ghost-white/80">{message.body}</p>
      </motion.div>
    </div>
  );
}

function RouteMeta() {
  const location = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[location.pathname] ?? {
      title: 'KAN LOGIC | Arquitectura IA para Negocio Real',
      description: DEFAULT_META_DESCRIPTION,
      canonical: `https://www.kanlogicsistem.com/#${location.pathname}`,
    };

    document.title = meta.title;

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', meta.description);

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', meta.canonical);
  }, [location.pathname]);

  return null;
}

// Landing Page Component
function LandingPage() {
  const [currentSection, setCurrentSection] = useState('INICIO');

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const sections = ['hero', 'services', 'workforce', 'process', 'audit', 'faq', 'contact'];
        const sectionNames = ['INICIO', 'SOLUCIONES', 'FUERZA LABORAL', 'PROCESO', 'AUDITORIA', 'FAQ', 'CONTACTO'];

        for (let i = sections.length - 1; i >= 0; i--) {
          const element = document.getElementById(sections[i]);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2) {
              setCurrentSection(sectionNames[i]);
              break;
            }
          }
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-void-black text-frost-white scrollbar-cyber">
      <Suspense fallback={null}>
        <NeuralNetworkBackground />
      </Suspense>
      <HUD currentSection={currentSection} />
      <main className="relative z-10">
        <HeroSection />
        <ServicesSection />
        <DigitalWorkforceSection />
        <ProcessSection />
        <AuditSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, permission }: { children: React.ReactNode; permission?: string }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="font-mono text-sm text-ghost-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-error-crimson mb-2">⛔ ACCESO DENEGADO</p>
          <p className="font-mono text-xs text-ghost-white">No tienes permiso para acceder a esta sección</p>
          <Link to="/dashboard" className="text-cyber-cyan hover:underline text-sm mt-4 inline-block">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Public Route (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="font-mono text-sm text-ghost-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// App Routes
function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/hero" element={<LandingPage />} />
        <Route path="/workforce" element={<LandingPage />} />
        <Route path="/services" element={<LandingPage />} />
        <Route path="/process" element={<LandingPage />} />
        <Route path="/audit" element={<LandingPage />} />
        <Route path="/faq" element={<LandingPage />} />
        <Route path="/contact" element={<LandingPage />} />
        <Route path="/express" element={<LandingPage />} />
        <Route path="/catalogo" element={<CatalogRedirect />} />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Overview />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/automations"
          element={
            <ProtectedRoute permission="automation:view">
              <DashboardLayout>
                <Automations />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/tasks"
          element={
            <ProtectedRoute permission="tasks:view">
              <DashboardLayout>
                <Tasks />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/integrations"
          element={
            <ProtectedRoute permission="integrations:view">
              <DashboardLayout>
                <Integrations />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/security"
          element={
            <ProtectedRoute permission="security:view">
              <DashboardLayout>
                <Security />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/dashboard/admin/clients"
          element={
            <ProtectedRoute permission="admin:clients">
              <DashboardLayout>
                <AdminClients />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/metrics"
          element={
            <ProtectedRoute permission="admin:metrics">
              <DashboardLayout>
                <AdminMetrics />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/logs"
          element={
            <ProtectedRoute permission="admin:logs">
              <DashboardLayout>
                <AdminLogs />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-void-black flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-cyber-cyan font-display mb-4">404</h1>
                <p className="text-ghost-white mb-6">Página no encontrada</p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors"
                >
                  Volver al Inicio
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="font-mono text-sm text-ghost-white">Cargando...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ErrorBoundary>
          <CheckoutStatusBanner />
          <RouteMeta />
          <Suspense fallback={<LoadingSpinner />}>
            <AppRoutes />
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
