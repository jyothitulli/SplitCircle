import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { IconExpense, IconFairness, IconScan, IconSparkle } from '../components/icons';

const upcoming = [
  { icon: IconSparkle, label: 'Natural language entry', description: 'Describe an expense in plain words and review a draft.' },
  { icon: IconFairness, label: 'Context-aware splits', description: 'Suggests a split method based on how your circle usually divides costs.' },
  { icon: IconScan, label: 'Works alongside OCR', description: 'Pairs with receipt scanning for a faster, reviewed-before-saved flow.' },
];

/**
 * AI Expense Assistant — Coming Soon.
 * Intentionally inert: no microphone access, no recording state, and
 * no network calls. This page exists purely to set expectations.
 */
export function VoiceExpensePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-surface-2 p-6 sm:p-8">
          <p className="section-title">Coming soon</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-ink">AI Expense Assistant — Coming Soon</h2>
          <p className="section-subtitle">
            We&rsquo;re preparing a more reliable way to log expenses with thoughtful drafting and intelligent follow-ups.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="panel-soft flex flex-col items-center p-8 text-center">
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative mb-5 flex h-16 w-16 items-center justify-center"
            >
              <span className="absolute inset-0 rounded-full border-2 border-dashed border-primary-500/25 animate-orbit" />
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600">
                <IconSparkle size={20} />
              </span>
            </motion.div>
            <h3 className="text-lg font-semibold text-ink">This feature isn&rsquo;t active yet</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted">
              This area is intentionally paused so the experience can launch as a polished, trusted feature rather than a
              half-finished prototype. No audio is captured and no requests are made from this page.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {upcoming.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
                className="rounded-2xl border border-border bg-surface-2 p-4"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-primary-600 shadow-sm">
                  <item.icon size={16} />
                </span>
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-2 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-sm font-semibold text-ink">Need to log an expense right now?</p>
              <p className="text-xs text-muted">Add it directly, or scan a receipt to draft one.</p>
            </div>
            <div className="flex gap-2">
              <Link to="/ocr" className="btn-secondary px-4 py-2 text-sm">
                Scan receipt
              </Link>
              <Link to="/expenses" className="btn-primary px-4 py-2 text-sm">
                <IconExpense size={15} /> Add expense
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
