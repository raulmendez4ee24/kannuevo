import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Cpu, Shield, Zap, AlertCircle, ShieldCheck } from 'lucide-react';

type Step = 'credentials' | '2fa';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void;
        signIn: () => Promise<{ authorization?: { id_token?: string } }>;
      };
    };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve();
      else {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export default function Login() {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { requestLoginOTP, loginWithOTP, loginWithSocial } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (step !== 'credentials' || !googleClientId || !googleButtonRef.current) return;

    let cancelled = false;
    void (async () => {
      try {
        await loadScript('https://accounts.google.com/gsi/client');
        if (cancelled || !window.google || !googleButtonRef.current) return;

        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (!response.credential) return;
            setError('');
            setIsLoading(true);
            try {
              await loginWithSocial('google', response.credential);
              navigate(returnUrl);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'No se pudo iniciar con Google');
            } finally {
              setIsLoading(false);
            }
          },
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 320,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar Google');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [googleClientId, loginWithSocial, navigate, returnUrl, step]);

  // Step 1: verify password via API (without setting user in context), then send OTP
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const code = data?.error ?? '';
        throw new Error(
          code === 'INVALID_CREDENTIALS' ? 'Credenciales inválidas' :
          code === 'TOO_MANY_REQUESTS' ? 'Demasiados intentos. Espera unos minutos.' :
          'Error de servidor'
        );
      }
      // Password OK → send OTP (2FA code to email)
      await requestLoginOTP(email);
      setStep('2fa');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: verify OTP → set user in context → navigate
  const handleTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await loginWithOTP(email, otp);
      navigate(returnUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-void-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-30" aria-hidden="true" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] ambient-glow opacity-30" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] ambient-glow ambient-glow--purple opacity-30" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="relative bg-steel-gray/30 backdrop-blur-xl border border-terminal-gray/50 rounded-2xl overflow-hidden">
          {/* Border gradient */}
          <div className="absolute inset-0 rounded-2xl p-[1px]">
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, transparent 50%, rgba(184, 41, 247, 0.3) 100%)',
              }}
            />
          </div>

          <div className="relative p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-xl mb-4">
                <Cpu className="w-8 h-8 text-cyber-cyan" />
              </div>
              <h1 className="font-display text-2xl font-bold text-frost-white mb-1">
                KAN LOGIC
              </h1>
              <p className="font-mono text-xs text-ghost-white tracking-widest">
                ARQUITECTURA IA
              </p>
            </div>

            {/* 2FA step indicator */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-void-black/50 rounded-lg border border-terminal-gray/30">
              {/* Step 1 */}
              <div className={`flex items-center gap-1.5 ${step === 'credentials' ? 'text-cyber-cyan' : 'text-matrix-green'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'credentials' ? 'bg-cyber-cyan/20 border border-cyber-cyan' : 'bg-matrix-green/20 border border-matrix-green'}`}>
                  {step === '2fa' ? '✓' : '1'}
                </div>
                <span className="font-mono text-[10px] tracking-wider">ACCESO</span>
              </div>

              <div className="flex-1 h-[1px] bg-terminal-gray/50" />

              {/* Step 2 */}
              <div className={`flex items-center gap-1.5 ${step === '2fa' ? 'text-cyber-cyan' : 'text-terminal-gray'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === '2fa' ? 'bg-cyber-cyan/20 border border-cyber-cyan' : 'bg-void-black border border-terminal-gray/50'}`}>
                  2
                </div>
                <span className="font-mono text-[10px] tracking-wider">VERIFICACIÓN</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-error-crimson/10 border border-error-crimson/30 rounded-lg mb-4"
              >
                <AlertCircle className="w-4 h-4 text-error-crimson flex-shrink-0" />
                <span className="text-sm text-error-crimson">{error}</span>
              </motion.div>
            )}

            {/* ── STEP 1: Credentials ── */}
            {step === 'credentials' && (
              <motion.form
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleCredentials}
                className="space-y-4"
              >
                {googleClientId && (
                  <div className="space-y-3">
                    <div className="grid gap-3">
                      {googleClientId && (
                        <div className="rounded-lg border border-terminal-gray/50 bg-void-black/40 p-2">
                          <div ref={googleButtonRef} className="flex justify-center" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-terminal-gray/40" />
                      <span className="font-mono text-[10px] text-terminal-gray tracking-widest">O ENTRA CON CORREO</span>
                      <div className="flex-1 h-px bg-terminal-gray/40" />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="login-email" className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                    CORREO ELECTRÓNICO
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-gray" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@empresa.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                    CONTRASEÑA
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-gray" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-gray hover:text-frost-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full relative overflow-hidden group"
                >
                  <div className={`
                    px-6 py-4 border rounded-lg font-mono text-sm tracking-widest uppercase transition-all
                    ${isLoading
                      ? 'bg-steel-gray/30 border-terminal-gray text-ghost-white/50 cursor-not-allowed'
                      : 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/20 hover:shadow-cyber-glow'}
                  `}>
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        VERIFICANDO...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4" />
                        CONTINUAR
                      </span>
                    )}
                  </div>
                </motion.button>
              </motion.form>
            )}

            {/* ── STEP 2: 2FA OTP ── */}
            {step === '2fa' && (
              <motion.form
                key="2fa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleTwoFactor}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <ShieldCheck className="w-10 h-10 text-cyber-cyan mx-auto mb-2" />
                  <p className="text-sm text-ghost-white">
                    Enviamos un código de 6 dígitos a
                  </p>
                  <p className="font-mono text-sm text-cyber-cyan font-bold">{email}</p>
                </div>

                <div>
                  <label htmlFor="login-otp" className="block font-mono text-[10px] text-ghost-white tracking-wider mb-2">
                    CÓDIGO DE VERIFICACIÓN
                  </label>
                  <input
                    id="login-otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full px-4 py-4 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white placeholder-ghost-white/30 focus:border-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan/50 transition-all font-mono text-2xl tracking-[0.6em] text-center"
                  />
                  <p className="font-mono text-[9px] text-terminal-gray text-center mt-2 tracking-wider">
                    El código expira en 10 minutos
                  </p>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  whileHover={{ scale: otp.length === 6 && !isLoading ? 1.02 : 1 }}
                  whileTap={{ scale: otp.length === 6 && !isLoading ? 0.98 : 1 }}
                  className="w-full relative overflow-hidden group"
                >
                  <div className={`
                    px-6 py-4 border rounded-lg font-mono text-sm tracking-widest uppercase transition-all
                    ${isLoading || otp.length < 6
                      ? 'bg-steel-gray/30 border-terminal-gray text-ghost-white/50 cursor-not-allowed'
                      : 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/20 hover:shadow-cyber-glow'}
                  `}>
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        VERIFICANDO...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        VERIFICAR E INGRESAR
                      </span>
                    )}
                  </div>
                </motion.button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setStep('credentials'); setOtp(''); setError(''); }}
                    className="text-xs text-ghost-white hover:text-frost-white transition-colors font-mono tracking-wider"
                  >
                    ← Volver
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={async () => {
                      setError('');
                      try {
                        await requestLoginOTP(email);
                      } catch {
                        setError('Error al reenviar código');
                      }
                    }}
                    className="text-xs text-ghost-white hover:text-cyber-cyan transition-colors font-mono tracking-wider"
                  >
                    Reenviar Código
                  </button>
                </div>
              </motion.form>
            )}

            {/* Links */}
            {step === 'credentials' && (
              <div className="mt-6 flex items-center justify-between text-sm">
                <Link to="/forgot-password" className="text-ghost-white hover:text-cyber-cyan transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
                <Link to="/register" className="text-cyber-cyan hover:underline">
                  Crear cuenta
                </Link>
              </div>
            )}

            {step === 'credentials' && googleClientId && (
              <div className="mt-4 p-3 rounded-lg bg-cyber-cyan/5 border border-cyber-cyan/20">
                <p className="text-[11px] text-ghost-white leading-relaxed">
                  Google crea o vincula tu cuenta de forma segura con el correo verificado.
                </p>
              </div>
            )}

            {/* Security badges */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-terminal-gray">
                <Shield className="w-3 h-3" />
                <span className="text-[8px] font-mono">SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-1 text-terminal-gray">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[8px] font-mono">2FA Activo</span>
              </div>
              <div className="flex items-center gap-1 text-terminal-gray">
                <Cpu className="w-3 h-3" />
                <span className="text-[8px] font-mono">AI Protection</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
