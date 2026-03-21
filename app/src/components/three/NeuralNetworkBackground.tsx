/**
 * Lightweight CSS-only animated background replacing the heavy Three.js version.
 * Uses CSS animations for particles and gradient overlays — zero WebGL overhead.
 */
export default function NeuralNetworkBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-void-black via-[#050510] to-void-black" />

      {/* Animated grid */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Floating particles via CSS */}
      <div className="neural-particles" />

      {/* Radial glow spots (no blur filter — pure gradients) */}
      <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full bg-radial-cyan opacity-20 animate-drift" />
      <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-radial-purple opacity-15 animate-drift-reverse" />

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-void-black/50 via-transparent to-void-black/80 pointer-events-none" />
    </div>
  );
}
