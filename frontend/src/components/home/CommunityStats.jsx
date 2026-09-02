import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { publicAPI } from '../../services/api';
import { formatCompactINR } from '../../utils/formatCurrency';
import { IconUsers, IconCircles, IconWallet } from '../icons';

/**
 * "Join the growing SplitCircle community" strip shown on the landing
 * page. Pulls real aggregate counts from GET /api/public/stats.
 *
 * Renders nothing (not a skeleton, not an error banner) while loading
 * or if the request fails — the rest of the landing page is fully
 * functional either way, so this section simply doesn't appear rather
 * than showing a broken or fabricated number.
 */
export function CommunityStats() {
  const { data, isSuccess } = useQuery({
    queryKey: ['public-stats'],
    queryFn: publicAPI.getStats,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 min — this doesn't need to be second-fresh
  });

  const stats = data?.data?.data;

  if (!isSuccess || !stats) return null;

  const { userCount, circleCount, totalExpenseAmount } = stats;

  const items = [
    { icon: <IconUsers size={16} />, value: `${userCount}+`, label: 'users' },
    { icon: <IconCircles size={16} />, value: `${circleCount}+`, label: 'circles' },
    { icon: <IconWallet size={16} />, value: `${formatCompactINR(totalExpenseAmount)}+`, label: 'expenses tracked' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45 }}
      className="mt-10 flex flex-col items-center gap-3"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-faint">
        Join the growing SplitCircle community
      </p>
      <div className="glass flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border border-border/70 px-6 py-3 text-sm">
        {items.map((item, i) => (
          <span key={item.label} className="flex items-center gap-2">
            {i > 0 && <span className="hidden text-faint sm:inline">&middot;</span>}
            <span className="text-primary-500">{item.icon}</span>
            <span className="font-display font-semibold text-ink">{item.value}</span>
            <span className="text-muted">{item.label}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}
