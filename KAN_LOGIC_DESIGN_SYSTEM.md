# KAN LOGIC - HYPER-TECH / NEO-CYBER DESIGN SYSTEM
## Nueva Era de Arquitectura IA

---

## 1. FILOSOFÍA DE DISEÑO

### Concepto Central
Kan Logic representa el **núcleo de la inteligencia artificial aplicada a negocios reales**. El diseño evoca la sensación de estar interactuando con un sistema de IA avanzado, donde cada elemento visual comunica precisión, velocidad y poder computacional.

### Metáfora Visual
> "El usuario no visita una web. Accede a una terminal de comando de IA."

---

## 2. PALETA DE COLORES EXACTA

### Colores Primarios
| Token | Valor | Uso |
|-------|-------|-----|
| `--void-black` | `#000000` | Fondos principales, espacio negativo |
| `--deep-void` | `#050508` | Fondos secundarios, cards |
| `--cyber-cyan` | `#00F0FF` | Acentos primarios, interacciones, glow |
| `--neon-purple` | `#B829F7` | Acentos secundarios, gradientes |
| `--electric-violet` | `#7C3AED` | Estados hover, profundidad |

### Colores de Soporte
| Token | Valor | Uso |
|-------|-------|-----|
| `--matrix-green` | `#00FF88` | Estados success, datos positivos |
| `--alert-amber` | `#FFB800` | Advertencias, atención |
| `--error-crimson` | `#FF3366` | Errores, estados críticos |
| `--steel-gray` | `#1A1A2E` | Superficies elevadas |
| `--frost-white` | `#E0E0E0` | Texto principal |
| `--ghost-white` | `#A0A0B0` | Texto secundario |
| `--terminal-gray` | `#4A4A5A` | Bordes sutiles, iconos |

### Gradientes Oficiales
```css
/* Gradient Principal - Cian a Púrpura */
--gradient-cyber: linear-gradient(135deg, #00F0FF 0%, #B829F7 100%);

/* Gradient de Fondo - Void a Deep Void */
--gradient-void: linear-gradient(180deg, #000000 0%, #050508 100%);

/* Gradient de Glow - Cian neón */
--glow-cyan: radial-gradient(circle, rgba(0,240,255,0.3) 0%, transparent 70%);

/* Gradient de Glow - Púrpura neón */
--glow-purple: radial-gradient(circle, rgba(184,41,247,0.3) 0%, transparent 70%);

/* Gradient de Texto - Cyber */
--text-gradient: linear-gradient(90deg, #00F0FF 0%, #B829F7 100%);
```

---

## 3. TIPOGRAFÍA

### Fuentes Principales
```css
/* Headers - Look futurista, geométrico */
--font-display: 'Space Grotesk', sans-serif;

/* Body - Legibilidad técnica */
--font-body: 'Space Grotesk', sans-serif;

/* Monospace - Código, datos, terminal */
--font-mono: 'JetBrains Mono', monospace;
```

### Escala Tipográfica
| Elemento | Tamaño | Peso | Line-height | Tracking |
|----------|--------|------|-------------|----------|
| H1 (Hero) | 72px / 4.5rem | 700 | 1.0 | -0.02em |
| H2 | 48px / 3rem | 600 | 1.1 | -0.01em |
| H3 | 32px / 2rem | 600 | 1.2 | 0 |
| H4 | 24px / 1.5rem | 500 | 1.3 | 0 |
| Body Large | 18px / 1.125rem | 400 | 1.6 | 0 |
| Body | 16px / 1rem | 400 | 1.6 | 0 |
| Caption | 14px / 0.875rem | 400 | 1.5 | 0.02em |
| Code/Data | 14px / 0.875rem | 500 | 1.4 | 0.05em |
| Micro | 12px / 0.75rem | 500 | 1.4 | 0.08em |

### Estilos Especiales
```css
/* Texto con gradiente */
.text-gradient {
  background: var(--text-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Texto de terminal */
.text-terminal {
  font-family: var(--font-mono);
  color: var(--cyber-cyan);
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

/* Texto glitch (para efectos especiales) */
.text-glitch {
  position: relative;
  animation: glitch 2s infinite;
}
```

---

## 4. SISTEMA DE ESPACIADO

### Grid Base
- **Base unit**: 4px
- **Grid**: 12 columnas
- **Gutter**: 24px
- **Max-width**: 1400px
- **Padding lateral**: 24px (móvil), 48px (tablet), 80px (desktop)

### Escalas de Espaciado
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;
--space-9: 96px;
--space-10: 128px;
```

---

## 5. COMPONENTES UI

### 5.1 Botones

#### Botón Primario (Efecto Láser)
```css
.btn-primary {
  position: relative;
  padding: 16px 32px;
  background: transparent;
  border: 1px solid var(--cyber-cyan);
  color: var(--cyber-cyan);
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Efecto de escaneo láser */
.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 240, 255, 0.4),
    transparent
  );
  transition: left 0.5s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  background: rgba(0, 240, 255, 0.1);
  box-shadow: 
    0 0 20px rgba(0, 240, 255, 0.5),
    0 0 40px rgba(0, 240, 255, 0.3),
    inset 0 0 20px rgba(0, 240, 255, 0.1);
}
```

#### Botón Secundario (Ghost)
```css
.btn-secondary {
  padding: 16px 32px;
  background: transparent;
  border: 1px solid var(--terminal-gray);
  color: var(--ghost-white);
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: var(--neon-purple);
  color: var(--neon-purple);
  box-shadow: 0 0 20px rgba(184, 41, 247, 0.3);
}
```

### 5.2 Cards (Efecto Descompresión)

```css
.card {
  position: relative;
  background: var(--deep-void);
  border: 1px solid var(--terminal-gray);
  border-radius: 8px;
  padding: 24px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Borde iluminado */
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  padding: 1px;
  background: var(--gradient-cyber);
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.4s ease;
}

/* Glow ambiental */
.card::after {
  content: '';
  position: absolute;
  inset: -1px;
  background: var(--glow-cyan);
  border-radius: 8px;
  opacity: 0;
  filter: blur(20px);
  z-index: -1;
  transition: opacity 0.4s ease;
}

.card:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: transparent;
}

.card:hover::before,
.card:hover::after {
  opacity: 1;
}

/* Efecto de descompresión - líneas de escaneo */
.card:hover .scan-lines {
  opacity: 1;
}

.scan-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 240, 255, 0.03) 2px,
    rgba(0, 240, 255, 0.03) 4px
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
```

### 5.3 Bento Grid

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 24px;
}

.bento-item {
  position: relative;
  background: var(--steel-gray);
  border: 1px solid rgba(74, 74, 90, 0.5);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Tamaños de items */
.bento-item--large { grid-column: span 2; grid-row: span 2; }
.bento-item--wide { grid-column: span 2; }
.bento-item--tall { grid-row: span 2; }

/* Efecto de brillo en esquinas */
.bento-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  padding: 1px;
  background: linear-gradient(
    135deg,
    rgba(0, 240, 255, 0.5) 0%,
    transparent 30%,
    transparent 70%,
    rgba(184, 41, 247, 0.5) 100%
  );
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.bento-item:hover {
  border-color: var(--cyber-cyan);
  box-shadow: 
    0 0 30px rgba(0, 240, 255, 0.2),
    inset 0 0 30px rgba(0, 240, 255, 0.05);
}
```

### 5.4 HUD (Heads-Up Display)

```css
.hud {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 240, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Esquinas decorativas del HUD */
.hud::before,
.hud::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--cyber-cyan);
}

.hud::before {
  bottom: -2px;
  left: -2px;
  border-top: none;
  border-right: none;
}

.hud::after {
  bottom: -2px;
  right: -2px;
  border-top: none;
  border-left: none;
}

/* Indicador de estado */
.hud-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--matrix-green);
}

.hud-status::before {
  content: '';
  width: 8px;
  height: 8px;
  background: var(--matrix-green);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
```

---

## 6. EFECTOS Y ANIMACIONES

### 6.1 Glow Ambiental
```css
.ambient-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  background: var(--glow-cyan);
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  animation: float 10s ease-in-out infinite;
}

.ambient-glow--purple {
  background: var(--glow-purple);
  animation-delay: -5s;
}
```

### 6.2 Animaciones Keyframes
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(50px, -50px); }
  50% { transform: translate(0, -100px); }
  75% { transform: translate(-50px, -50px); }
}

@keyframes scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

@keyframes glitch {
  0%, 90%, 100% { transform: translate(0); }
  92% { transform: translate(-2px, 2px); }
  94% { transform: translate(2px, -2px); }
  96% { transform: translate(-2px, -2px); }
  98% { transform: translate(2px, 2px); }
}

@keyframes data-flow {
  0% { background-position: 0% 0%; }
  100% { background-position: 0% 100%; }
}
```

### 6.3 Transiciones
```css
--transition-fast: 150ms ease;
--transition-base: 300ms ease;
--transition-slow: 500ms ease;
--transition-spring: 400ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-bounce: 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 7. EFECTOS ESPECIALES

### 7.1 Red Neuronal de Fondo (Three.js)
- Nodos conectados con líneas
- Color: `--cyber-cyan` con opacidad variable
- Movimiento: ondas suaves, respuesta al mouse
- Densidad: ~50 nodos en viewport
- Conexiones máximas: 3 por nodo

### 7.2 Esfera Lógica 3D (Hero)
- Geometría: Icosahedron con detalle alto
- Material: Wireframe + puntos brillantes
- Color base: `--cyber-cyan`
- Color secundario: `--neon-purple`
- Interacción: Rotación con mouse, pulsación al hover
- Efectos: Partículas emergiendo, glow dinámico

### 7.3 Paneles de Datos en Tiempo Real
- Tipografía: JetBrains Mono
- Colores: Verde para positivo, rojo para negativo
- Animación: Contadores animados, gráficos de líneas
- Efecto: "Máquina de escribir" para números

---

## 8. COPYWRITING - TONO DE VOZ

### Principios
1. **Autoridad Futurista**: Sonamos como la voz de una IA avanzada
2. **Eficiencia Algorítmica**: Menos palabras, más impacto
3. **Precisión Técnica**: Cada palabra cuenta

### Ejemplos de Copy

#### Hero
```
KAN LOGIC
Arquitectura IA para negocio real

[Subtítulo]
Tu WhatsApp responde en 72 horas.
Transformación completa en 14 días.

[CTA Primario] > INICIAR_SECUENCIA
[CTA Secundario] ver_arquitectura
```

#### Servicios
```
[EXPRESS]
Quiero algo funcionando ya
Precio fijo. 72h. Sin tecnicismos.

[ARQUITECTURA]
Quiero transformar mi operación
Auditoría con ROI. Roadmap por etapas.
```

#### Stats/Indicadores
```
ROI ESPERADO: 3x a 8x
TIEMPO DE DESPLIEGUE: 72h - 14 días
MODELO: Micro a Enterprise
CANALES: WhatsApp + Datos + CRM
```

---

## 9. RESPONSIVE BREAKPOINTS

| Breakpoint | Ancho | Ajustes |
|------------|-------|---------|
| Mobile | < 640px | Grid 1 columna, H1: 40px, HUD compacto |
| Tablet | 640px - 1024px | Grid 2 columnas, H1: 56px |
| Desktop | 1024px - 1400px | Grid 4 columnas, H1: 72px |
| Wide | > 1400px | Grid 4 columnas, max-width: 1400px |

---

## 10. ACCESIBILIDAD

- Contraste mínimo: 4.5:1 para texto
- Estados focus visibles con outline cian
- Animaciones respetan prefers-reduced-motion
- Navegación por teclado completa

---

## 11. IMPLEMENTACIÓN TECNOLÓGICA

### Stack
- **Framework**: React + Vite + TypeScript
- **Estilos**: Tailwind CSS
- **Animaciones**: Framer Motion + GSAP
- **3D**: Three.js + React Three Fiber
- **Iconos**: Lucide React

### Estructura de Componentes
```
src/
├── components/
│   ├── ui/              # Componentes base
│   ├── effects/         # Efectos visuales
│   ├── three/           # Componentes 3D
│   └── hud/             # Componentes del HUD
├── sections/            # Secciones de página
├── hooks/               # Custom hooks
├── lib/                 # Utilidades
└── styles/              # Estilos globales
```

---

*Documento de Diseño v1.0 - Kan Logic Hyper-Tech Experience*
