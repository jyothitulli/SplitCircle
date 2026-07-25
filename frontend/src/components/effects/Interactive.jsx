import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';

/**
 * TiltCard — wraps any glass panel with a subtle, physically-plausible
 * 3D tilt that tracks the cursor, plus a soft glare that slides across
 * the surface. This is the single biggest contributor to the "premium
 * fintech dashboard" feel: cards should feel like panes of glass with
 * real depth, not flat divs.
 *
 * Kept subtle on purpose (max ~6deg) so it reads as polish, not gimmick.
 */
export function TiltCard({ children, className = '', glare = true, max = 6, ...props }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { stiffness: 220, damping: 22, mass: 0.6 };
  const rotateX = useSpring(useMotionValue(0), springConfig);
  const rotateY = useSpring(useMotionValue(0), springConfig);
  const glareX = useSpring(x, springConfig);
  const glareY = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set(px);
    y.set(py);
    rotateY.set((px - 0.5) * max * 2);
    rotateX.set((0.5 - py) * max * 2);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      className={`relative will-change-transform ${className}`}
      {...props}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`radial-gradient(320px circle at ${glareX}px ${glareY}px, rgb(255 255 255 / 0.14), transparent 65%)`,
          }}
        />
      )}
    </motion.div>
  );
}

/**
 * Magnetic — wraps interactive elements (mainly buttons) so they
 * gently pull toward the cursor within a small radius, then spring
 * back. A hallmark Linear / Arc-style micro-interaction.
 */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const x = useSpring(useMotionValue(0), { stiffness: 300, damping: 20, mass: 0.5 });
  const y = useSpring(useMotionValue(0), { stiffness: 300, damping: 20, mass: 0.5 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={{ x, y }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * useMouseGlow — returns an onMouseMove handler that writes the
 * pointer position straight into CSS custom properties (--mx, --my)
 * on the event's own currentTarget. No React state, no re-render —
 * pair it with the `.spotlight` utility class (see index.css) on the
 * same element to get an interior glow that tracks the cursor.
 */
export function useMouseGlow() {
  return (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--mx', `${mx}%`);
    e.currentTarget.style.setProperty('--my', `${my}%`);
  };
}
