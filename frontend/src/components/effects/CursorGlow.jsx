import { useEffect, useRef } from 'react';

/**
 * CursorGlow — a soft radial light that follows the cursor across
 * the whole app, mounted once in the root layout. Position is pushed
 * straight to a ref's CSS custom properties on every mousemove rather
 * than through React state, so it never triggers a re-render or fights
 * with the animation frame budget — this is what keeps it feeling like
 * "premium fluid interface" instead of a laggy demo effect.
 *
 * Automatically disables itself on touch-only devices and honors
 * prefers-reduced-motion.
 */
export function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    if (reduceMotion || isCoarsePointer) return undefined;

    let raf = null;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let visible = false;

    const apply = () => {
      node.style.setProperty('--cursor-x', `${targetX}px`);
      node.style.setProperty('--cursor-y', `${targetY}px`);
      node.style.opacity = visible ? '1' : '0';
      raf = null;
    };

    const onMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      visible = true;
      if (raf === null) raf = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      visible = false;
      if (raf === null) raf = requestAnimationFrame(apply);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[60] hidden opacity-0 transition-opacity duration-500 md:block"
      style={{
        background:
          'radial-gradient(600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgb(var(--primary-500) / 0.10), rgb(var(--secondary-500) / 0.05) 35%, transparent 60%)',
      }}
      aria-hidden="true"
    />
  );
}
