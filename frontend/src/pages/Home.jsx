import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { AuroraBackground } from '../components/effects/AuroraBackground';
import { CursorGlow } from '../components/effects/CursorGlow';
import { TiltCard, Magnetic } from '../components/effects/Interactive';
import { InstallAppButton } from '../components/ui/InstallAppButton';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import {
  IconArrowRight, IconCircles, IconScan,
  IconFairness, IconScale, IconSparkle, IconAlert,
} from '../components/icons';

const FEATURES = [
  { icon: <IconCircles size={20} />, title: 'Circles for every group', text: 'Roommates, trips, teams \u2014 spin up a circle in seconds and invite everyone.' },
  { icon: <IconScan size={20} />, title: 'Receipt OCR', text: 'Photograph a bill and let AI draft the expense, amount, and split for you.' },
  { icon: <IconFairness size={20} />, title: 'Fairness scoring', text: 'A live score tracks who\u2019s carrying the load, before it becomes a conversation.' },
  { icon: <IconAlert size={20} />, title: 'Conflict prediction', text: 'Pattern-based risk signals surface tension early, not after it boils over.' },
  { icon: <IconScale size={20} />, title: 'Optimized settlements', text: 'The fewest possible transfers to bring every balance back to zero.' },
  { icon: <IconSparkle size={20} />, title: 'AI insights', text: 'Gemini-powered summaries of spending patterns, written in plain language.' },
];

const STEPS = [
  { n: '01', title: 'Create a circle', text: 'Name it, invite your people, done in under a minute.' },
  { n: '02', title: 'Log expenses your way', text: 'Type it, scan a receipt, or speak it \u2014 split however feels fair.' },
  { n: '03', title: 'Settle with confidence', text: 'One optimized payment plan, backed by a fairness score you can trust.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-ink">
      <AuroraBackground variant="hero" />
      <CursorGlow />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-[0_18px_40px_-18px_rgb(var(--primary-500)/0.75)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="9" r="6.2" stroke="white" strokeWidth="1.8" />
              <circle cx="15" cy="15" r="6.2" stroke="rgb(var(--secondary-500))" strokeWidth="1.8" />
            </svg>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary-600">SplitCircle</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <InstallAppButton />
          <ThemeToggle />
          <Link
            to="/login"
            className="hidden rounded-xl border border-border/70 bg-surface-2/70 px-4 py-2 text-sm font-medium text-ink shadow-sm backdrop-blur-xl transition hover:border-primary-500/40 hover:text-primary-500 sm:inline-flex"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-10 text-center md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="section-title">Intelligence for shared living</span>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink md:text-6xl">
            Shared spending that feels <span className="text-aurora-animate">premium</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted">
            Fairness scoring, conflict prediction, receipt OCR, and AI insights &mdash;
            everything a circle needs to split costs without the awkward conversations.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Magnetic strength={0.25}>
            <Link
              to="/register"
              className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-base"
            >
              Get started <IconArrowRight size={16} />
            </Link>
          </Magnetic>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface-2/70 px-7 py-3.5 text-base font-medium text-ink shadow-sm backdrop-blur-xl transition hover:border-primary-500/40 hover:text-primary-500 sm:hidden"
          >
            Sign in
          </Link>
          <p className="text-sm text-faint sm:ml-2">Free to use &mdash; no credit card.</p>
        </motion.div>
      </section>

      {/* Feature grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.4 }}
            >
              <TiltCard max={5}>
                <div className="glass gradient-ring h-full rounded-2xl p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
                    {f.icon}
                  </div>
                  <p className="mt-4 font-display font-semibold text-ink">{f.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{f.text}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">How it works</h2>
          <p className="mt-2 text-muted">Three steps from signup to settled up.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative rounded-2xl border border-border/70 bg-surface-2/60 p-6 backdrop-blur-xl"
            >
              <span className="font-display text-4xl font-bold text-primary-500/25">{s.n}</span>
              <p className="mt-3 font-display font-semibold text-ink">{s.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
        <TiltCard max={3}>
          <div className="glass gradient-ring rounded-xl3 p-10 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Ready for calmer shared finances?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted">
              Create your first circle in under a minute &mdash; no credit card, no setup fees.
            </p>
            <Magnetic strength={0.25} className="mt-7 inline-block">
              <Link to="/register" className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-base">
                Create your circle <IconArrowRight size={16} />
              </Link>
            </Magnetic>
          </div>
        </TiltCard>
      </section>

      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-10 text-center text-xs text-faint">
        SplitCircle &mdash; Intelligence for shared living.
      </footer>
    </div>
  );
}
