/**
 * A small, purpose-built icon set for SplitCircle.
 * Hand-drawn rather than pulled from a generic library so the line
 * weight and corner radius matches the rest of the product (rounded
 * caps, 1.75 stroke) instead of looking like a stock icon pack.
 */
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Svg({ children, size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base}>
      {children}
    </svg>
  );
}

export function IconDashboard(props) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="2" />
      <rect x="13" y="10" width="7.5" height="10.5" rx="2" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="2" />
    </Svg>
  );
}

export function IconCircles(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="9" r="5.5" />
      <circle cx="15" cy="15" r="5.5" />
    </Svg>
  );
}

export function IconExpense(props) {
  return (
    <Svg {...props}>
      <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4" />
    </Svg>
  );
}

export function IconScale(props) {
  return (
    <Svg {...props}>
      <path d="M12 3v18M7 21h10" />
      <path d="M4 7h6M14 7h6" />
      <path d="M4 7 1.5 12.5a3 3 0 0 0 5 0L4 7ZM20 7l-2.5 5.5a3 3 0 0 0 5 0L20 7Z" />
    </Svg>
  );
}

export function IconSettle(props) {
  return (
    <Svg {...props}>
      <path d="M4 8h11M11 4l4 4-4 4" />
      <path d="M20 16H9M13 12l-4 4 4 4" />
    </Svg>
  );
}

export function IconChore(props) {
  return (
    <Svg {...props}>
      <path d="m5 16 6.5-6.5a2 2 0 1 1 3 3L8 19l-4 1 1-4Z" />
      <path d="M14 5l1.5-1.5a1.6 1.6 0 0 1 2.3 0l2.7 2.7a1.6 1.6 0 0 1 0 2.3L19 10" />
    </Svg>
  );
}

export function IconFairness(props) {
  return (
    <Svg {...props}>
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      <circle cx="12" cy="12" r="4" />
    </Svg>
  );
}

export function IconScan(props) {
  return (
    <Svg {...props}>
      <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <path d="M4 12h16" />
    </Svg>
  );
}

export function IconMic(props) {
  return (
    <Svg {...props}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </Svg>
  );
}

export function IconSparkle(props) {
  return (
    <Svg {...props}>
      <path d="M12 3 13.8 9 20 10.8 13.8 12.6 12 18.8 10.2 12.6 4 10.8 10.2 9 12 3Z" />
    </Svg>
  );
}

export function IconLogout(props) {
  return (
    <Svg {...props}>
      <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Svg>
  );
}

export function IconChevronLeft(props) {
  return (
    <Svg {...props}>
      <path d="M14.5 5 8 12l6.5 7" />
    </Svg>
  );
}

export function IconSun(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
    </Svg>
  );
}

export function IconMoon(props) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </Svg>
  );
}

export function IconPlus(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconClose(props) {
  return (
    <Svg {...props}>
      <path d="M6 18 18 6M6 6l12 12" />
    </Svg>
  );
}

export function IconEdit(props) {
  return (
    <Svg {...props}>
      <path d="M4 17.25V20h2.75L19.6 7.15a1.5 1.5 0 0 0 0-2.12l-1.13-1.13a1.5 1.5 0 0 0-2.12 0L4 17.25Z" />
      <path d="M13.5 5.5l3 3" />
    </Svg>
  );
}

export function IconTrash(props) {
  return (
    <Svg {...props}>
      <path d="M5 7h14M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M7 7l1 13.5h8L17 7" />
    </Svg>
  );
}

export function IconArrowUp(props) {
  return (
    <Svg {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Svg>
  );
}

export function IconArrowDown(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Svg>
  );
}

export function IconArrowRight(props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function IconUpload(props) {
  return (
    <Svg {...props}>
      <path d="M12 16V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M5 16v2.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V16" />
    </Svg>
  );
}

export function IconImage(props) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="m4.5 17 4.5-4.5a1.8 1.8 0 0 1 2.5 0l1.3 1.3 3.2-3.2a1.8 1.8 0 0 1 2.5 0l1.5 1.5" />
    </Svg>
  );
}

export function IconCheck(props) {
  return (
    <Svg {...props}>
      <path d="M5 12.5 9.5 17 19 7" />
    </Svg>
  );
}

export function IconClock(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function IconAlert(props) {
  return (
    <Svg {...props}>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </Svg>
  );
}

export function IconBolt(props) {
  return (
    <Svg {...props}>
      <path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" />
    </Svg>
  );
}

export function IconUsers(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="8.5" r="2.3" />
      <path d="M15.5 19c.3-2.2 1.7-3.8 3.8-4.4" />
    </Svg>
  );
}

export function IconWallet(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
      <path d="M3 10.5h18" />
      <circle cx="16.5" cy="14.5" r="1.4" />
    </Svg>
  );
}

export function IconTrend(props) {
  return (
    <Svg {...props}>
      <path d="M4 16 9.5 10.5l3.5 3.5L20 7" />
      <path d="M14.5 7H20v5.5" />
    </Svg>
  );
}

export function IconReceipt(props) {
  return (
    <Svg {...props}>
      <path d="M6 3h12v17.5l-2.5-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 20.5Z" />
      <path d="M9 8h6M9 11.5h6M9 15h4" />
    </Svg>
  );
}

export function IconMenu(props) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function IconMail(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m4 7 7 5.5L19 7" />
    </Svg>
  );
}

export function IconLock(props) {
  return (
    <Svg {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </Svg>
  );
}

export function IconChevronDown(props) {
  return (
    <Svg {...props}>
      <path d="M5 8.5 12 16l7-7.5" />
    </Svg>
  );
}

export function IconUser(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </Svg>
  );
}

export function IconShield(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 5 6v5.2c0 4.4 3 7.9 7 9.3 4-1.4 7-4.9 7-9.3V6l-7-2.5Z" />
      <path d="m9 12 2 2 4-4.5" />
    </Svg>
  );
}

export function IconGauge(props) {
  return (
    <Svg {...props}>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15 15.2 9.8" />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconFlow(props) {
  return (
    <Svg {...props}>
      <circle cx="5.5" cy="6" r="2.3" />
      <circle cx="18.5" cy="6" r="2.3" />
      <circle cx="12" cy="18" r="2.3" />
      <path d="M7.4 7.2 10.4 15.8" />
      <path d="M16.6 7.2 13.6 15.8" />
      <path d="M7.8 6h8.4" strokeDasharray="1.5 2.6" />
    </Svg>
  );
}

export function IconActivity(props) {
  return (
    <Svg {...props}>
      <path d="M3 12h4l2.2-7 4 14 2.2-7H21" />
    </Svg>
  );
}

export function IconTarget(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconZap(props) {
  return (
    <Svg {...props}>
      <path d="M12.5 3 5 13.5h5.5L11 21l7.5-10.5H13l-.5-7.5Z" />
    </Svg>
  );
}

export function IconGrid(props) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="4.5" height="4.5" rx="1.2" />
      <rect x="10" y="3.5" width="4.5" height="4.5" rx="1.2" />
      <rect x="16.5" y="3.5" width="4.5" height="4.5" rx="1.2" />
      <rect x="3.5" y="10" width="4.5" height="4.5" rx="1.2" />
      <rect x="10" y="10" width="4.5" height="4.5" rx="1.2" />
      <rect x="16.5" y="10" width="4.5" height="4.5" rx="1.2" />
      <rect x="3.5" y="16.5" width="4.5" height="4.5" rx="1.2" />
      <rect x="10" y="16.5" width="4.5" height="4.5" rx="1.2" />
      <rect x="16.5" y="16.5" width="4.5" height="4.5" rx="1.2" />
    </Svg>
  );
}

export function IconCompass(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15 9-4.2 2.8L9 15l4.2-2.8L15 9Z" />
    </Svg>
  );
}
