/**
 * Lightweight CSS-only sphere visualization replacing the heavy Three.js Canvas.
 * Uses CSS 3D transforms and gradients — zero WebGL overhead.
 */
export default function InteractiveSphere() {
  return (
    <div className="w-full h-full min-h-[360px] lg:min-h-[500px] flex items-center justify-center relative">
      {/* Outer glow */}
      <div className="absolute w-64 h-64 lg:w-80 lg:h-80 rounded-full bg-radial-cyan opacity-20 animate-pulse-slow" />

      {/* Main sphere */}
      <div className="relative w-48 h-48 lg:w-64 lg:h-64 animate-spin-slow">
        {/* Wireframe ring 1 */}
        <div className="absolute inset-0 rounded-full border-2 border-cyber-cyan/40 animate-spin-reverse" />

        {/* Wireframe ring 2 */}
        <div className="absolute inset-2 rounded-full border border-neon-purple/30 rotate-45 animate-spin-slow" />

        {/* Wireframe ring 3 */}
        <div className="absolute inset-4 rounded-full border border-cyber-cyan/20 -rotate-12" />

        {/* Core glow */}
        <div className="absolute inset-8 lg:inset-12 rounded-full bg-gradient-to-br from-cyber-cyan/30 to-neon-purple/20 animate-pulse-slow" />

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-cyber-cyan shadow-[0_0_20px_rgba(0,240,255,0.8)]" />
        </div>

        {/* Orbiting dots */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute inset-0 animate-spin-slow"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyber-cyan/70" />
          </div>
        ))}
      </div>

      {/* Label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs tracking-widest text-ghost-white/50">
        [ NUCLEO KAN LOGIC ]
      </div>
    </div>
  );
}
