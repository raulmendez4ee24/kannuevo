import { useEffect } from 'react';

export default function CatalogRedirect() {
  useEffect(() => {
    window.location.replace('/catalogo.html');
  }, []);

  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center">
      <p className="font-mono text-sm text-cyber-cyan">Abriendo catalogo...</p>
    </div>
  );
}
