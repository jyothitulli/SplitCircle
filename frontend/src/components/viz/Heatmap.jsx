import { motion } from 'framer-motion';

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

/**
 * ContributionHeatmap — GitHub-style intensity grid showing how
 * consistently each member has been logging expenses / chores.
 * `data` is an array of { date, value } — value 0-4 intensity buckets.
 * Purely presentational & lightweight; no chart library needed.
 */
export function ContributionHeatmap({ weeks = [], className = '' }) {
  const intensityClass = (level) => {
    switch (level) {
      case 0:
        return 'bg-surface-hover';
      case 1:
        return 'bg-primary-500/25';
      case 2:
        return 'bg-primary-500/50';
      case 3:
        return 'bg-primary-500/75';
      default:
        return 'bg-gradient-to-br from-primary-500 to-secondary-500';
    }
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      <div className="flex flex-col justify-between py-1 text-2xs text-faint">
        {DAY_LABELS.map((d, i) => (
          <span key={i} className="h-3 leading-3">{d}</span>
        ))}
      </div>
      <div className="flex flex-1 gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <motion.div
                key={di}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: (wi * 7 + di) * 0.004 }}
                whileHover={{ scale: 1.35 }}
                title={`${day.date}: ${day.value} activit${day.value === 1 ? 'y' : 'ies'}`}
                className={`h-3 w-3 rounded-[3px] ${intensityClass(day.level)} transition-colors`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Builds a deterministic pseudo-heatmap grid from raw expense dates. */
export function buildHeatmapWeeks(dates = [], weeksCount = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const counts = new Map();
  dates.forEach((d) => {
    const key = new Date(d).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const totalDays = weeksCount * 7;
  const start = new Date(today);
  start.setDate(start.getDate() - totalDays + 1);
  // align to Monday
  const dow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dow);

  const weeks = [];
  const cursor = new Date(start);
  for (let w = 0; w < weeksCount; w += 1) {
    const week = [];
    for (let d = 0; d < 7; d += 1) {
      const key = cursor.toISOString().slice(0, 10);
      const value = counts.get(key) || 0;
      const level = value === 0 ? 0 : value === 1 ? 1 : value === 2 ? 2 : value <= 4 ? 3 : 4;
      week.push({ date: key, value, level });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
