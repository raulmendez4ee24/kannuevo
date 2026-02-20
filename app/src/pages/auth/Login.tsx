import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(returnUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-6 rounded-xl border border-terminal-gray/50 bg-steel-gray/30 space-y-4">
        <h1 className="font-display text-2xl text-frost-white">Iniciar sesión</h1>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full px-4 py-3 bg-void-black/50 border border-terminal-gray/50 rounded-lg text-frost-white"
        />
        {error ? <p className="text-error-crimson text-sm">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-cyber-cyan/10 border border-cyber-cyan text-cyber-cyan rounded-lg hover:bg-cyber-cyan/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-sm text-ghost-white">
          ¿No tienes cuenta? <Link to="/register" className="text-cyber-cyan hover:underline">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}
