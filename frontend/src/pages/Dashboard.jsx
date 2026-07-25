import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Card, StatCard } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard, SkeletonRow } from '../components/ui/Skeleton';
import { SelectField } from '../components/ui/SelectField';
import { Badge } from '../components/ui/Badge';
import { Stagger, StaggerItem, ScrollReveal } from '../components/motion';
import { TiltCard } from '../components/effects/Interactive';
import { Gauge } from '../components/viz/Gauge';
import { ContributionHeatmap, buildHeatmapWeeks } from '../components/viz/Heatmap';
import { SettlementFlow } from '../components/viz/FlowViz';
import { ActivityTimeline } from '../components/viz/ActivityTimeline';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  circlesAPI, expensesAPI, balancesAPI, fairnessAPI, insightsAPI,
} from '../services/api';
import {
  IconArrowRight, IconCircles, IconExpense, IconMic,
  IconScan, IconSparkle, IconUsers, IconShield,
  IconWallet, IconTrend, IconScale, IconGauge, IconAlert, IconFlow, IconActivity,
} from '../components/icons';

const RISK_VALUE = { LOW: 18, MEDIUM: 55, HIGH: 86 };
const RISK_LABEL = { LOW: 'Low risk', MEDIUM: 'Medium risk', HIGH: 'High risk' };

function QuickAction({ to, label, description, icon, badge }) {
  return (
    <Link to={to} className="group">
      <Card hover className="flex h-full items-start gap-4 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink">{label}</p>
            {badge && <Badge variant="warning" size="sm">{badge}</Badge>}
          </div>
          <p className="mt-0.5 text-sm leading-5 text-muted">{description}</p>
        </div>
        <IconArrowRight size={16} className="mt-2 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}

/** Spending timeline — daily totals over the last two active weeks, aurora-gradient fill. */
function SpendingTimeline({ expenses, isDark }) {
  const data = useMemo(() => {
    const byDay = new Map();
    for (const expense of expenses) {
      const d = new Date(expense.expenseDate || expense.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDay.set(key, (byDay.get(key) || 0) + Number(expense.amount || 0));
    }
    return Array.from(byDay.entries()).map(([day, total]) => ({ day, total })).slice(-14);
  }, [expenses]);

  if (data.length === 0) return <EmptyState title="No spending yet" description="Add expenses to see your timeline." />;

  const stroke = isDark ? 'rgb(138 111 255)' : 'rgb(108 66 255)';
  const stroke2 = isDark ? 'rgb(34 211 238)' : 'rgb(8 145 178)';
  const grid = isDark ? 'rgb(34 36 52)' : 'rgb(227 227 240)';
  const tick = isDark ? 'rgb(108 110 133)' : 'rgb(140 141 163)';

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="auroraFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.38} />
            <stop offset="100%" stopColor={stroke2} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="auroraStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={stroke} />
            <stop offset="100%" stopColor={stroke2} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="day" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{
            background: isDark ? 'rgb(14 15 23)' : 'rgb(255 255 255)',
            border: `1px solid ${grid}`,
            borderRadius: 14,
            color: isDark ? 'rgb(244 244 250)' : 'rgb(18 18 28)',
            fontSize: 12,
          }}
          formatter={(v) => [`₹${Number(v).toFixed(2)}`, 'Spent']}
        />
        <Area type="monotone" dataKey="total" stroke="url(#auroraStroke)" strokeWidth={2.5} fill="url(#auroraFill)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RecentExpenseRow({ expense }) {
  const date = new Date(expense.expenseDate || expense.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface-2/60 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
          <IconExpense size={15} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{expense.description}</p>
          <p className="text-xs text-faint">{date} · {expense.paidBy?.name || 'Unknown'}</p>
        </div>
      </div>
      <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">₹{Number(expense.amount).toFixed(2)}</p>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [chartCircle, setChartCircle] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = data?.data?.data?.circles || [];
  const activeCircleId = chartCircle || circles[0]?.id;

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', activeCircleId],
    queryFn: () => expensesAPI.list(activeCircleId),
    enabled: Boolean(activeCircleId),
  });
  const expenses = useMemo(() => expensesData?.data?.data?.expenses || [], [expensesData]);

  const { data: balancesData } = useQuery({
    queryKey: ['balances', activeCircleId],
    queryFn: () => balancesAPI.getBalances(activeCircleId),
    enabled: Boolean(activeCircleId),
  });
  const balances = balancesData?.data?.data?.balances || [];

  const { data: settlementsData } = useQuery({
    queryKey: ['settlements', activeCircleId],
    queryFn: () => balancesAPI.optimize(activeCircleId),
    enabled: Boolean(activeCircleId),
    retry: false,
  });
  const settlements = useMemo(() => settlementsData?.data?.data?.settlements || [], [settlementsData]);

  const { data: fairnessData } = useQuery({
    queryKey: ['fairness', activeCircleId],
    queryFn: () => fairnessAPI.leaderboard(activeCircleId),
    enabled: Boolean(activeCircleId),
    retry: false,
  });
  const leaderboard = fairnessData?.data?.data?.leaderboard || [];
  const fairnessScore = leaderboard.length
    ? leaderboard.reduce((s, r) => s + Number(r.overallScore || 0), 0) / leaderboard.length
    : null;

  const { data: conflictData } = useQuery({
    queryKey: ['conflicts', activeCircleId],
    queryFn: () => insightsAPI.getConflicts(activeCircleId),
    enabled: Boolean(activeCircleId),
    retry: false,
  });
  const conflict = conflictData?.data?.data;
  const riskLevel = conflict?.riskLevel || null;
  const riskScore = riskLevel ? RISK_VALUE[riskLevel] : null;

  const { data: insightsData, isFetching: insightsLoading } = useQuery({
    queryKey: ['insights', activeCircleId],
    queryFn: () => insightsAPI.get(activeCircleId),
    enabled: Boolean(activeCircleId),
    retry: false,
  });
  const insights = insightsData?.data?.data?.insights || [];

  // Circle Health Score — a composite read of fairness, conflict risk,
  // and recent activity. Every input is real data; nothing here is invented.
  const healthScore = useMemo(() => {
    const parts = [];
    if (fairnessScore !== null) parts.push(fairnessScore);
    if (riskScore !== null) parts.push(100 - riskScore);
    if (expenses.length > 0) parts.push(Math.min(100, 60 + expenses.length * 2));
    if (parts.length === 0) return null;
    return parts.reduce((s, v) => s + v, 0) / parts.length;
  }, [fairnessScore, riskScore, expenses.length]);

  const heatmapWeeks = useMemo(
    () => buildHeatmapWeeks(expenses.map((e) => e.expenseDate || e.createdAt), 14),
    [expenses]
  );

  const activityItems = useMemo(() => {
    const fromExpenses = expenses.slice(0, 6).map((e) => ({
      id: `exp-${e.id}`,
      title: `${e.paidBy?.name || 'Someone'} added "${e.description}"`,
      subtitle: `₹${Number(e.amount).toFixed(2)} · ${e.splitMethod?.toLowerCase() || 'equal'} split`,
      time: new Date(e.expenseDate || e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tone: 'primary',
      sortKey: new Date(e.expenseDate || e.createdAt).getTime(),
    }));
    const fromSettlements = settlements.slice(0, 4).map((s, i) => ({
      id: `settle-${s.id || i}`,
      title: `${s.fromUser?.name || 'Member'} owes ${s.toUser?.name || 'Member'}`,
      subtitle: `₹${Number(s.amount).toFixed(2)} pending settlement`,
      time: 'Pending',
      tone: 'cyan',
      sortKey: Date.now() - i,
    }));
    return [...fromExpenses, ...fromSettlements].sort((a, b) => b.sortKey - a.sortKey).slice(0, 8);
  }, [expenses, settlements]);

  const settlementFlows = useMemo(
    () => settlements.slice(0, 5).map((s) => ({
      from: s.fromUser?.name || 'Member',
      to: s.toUser?.name || 'Member',
      amount: s.amount,
    })),
    [settlements]
  );

  const totalMembers = circles.reduce((s, c) => s + (c.memberCount || 0), 0);
  const totalExpenses = circles.reduce((s, c) => s + (c.expenseCount || 0), 0);
  const totalSpend = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const thisMonthSpend = expenses
    .filter((e) => {
      const d = new Date(e.expenseDate || e.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalOwed = balances.filter((b) => b.netBalance > 0).reduce((s, b) => s + Number(b.netBalance), 0);
  const totalDue = balances.filter((b) => b.netBalance < 0).reduce((s, b) => s + Math.abs(Number(b.netBalance)), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero welcome */}
      <TiltCard max={2.5}>
        <Card glow={false} className="overflow-hidden p-6 md:p-8">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-60 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgb(var(--primary-500) / 0.22), transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgb(var(--secondary-500) / 0.2), transparent 70%)' }}
          />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="section-title">Intelligence dashboard</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                {greeting}, <span className="text-aurora">{user?.name?.split(' ')[0] || 'there'}</span>
              </h2>
              <p className="section-subtitle">
                A live read on fairness, risk, and momentum across every circle you&rsquo;re in.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-border/70 bg-surface-2/70 px-4 py-3 text-sm shadow-sm backdrop-blur-xl">
                <p className="text-xs text-faint">Active circles</p>
                <p className="mt-0.5 font-bold text-ink">{circles.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-surface-2/70 px-4 py-3 text-sm shadow-sm backdrop-blur-xl">
                <p className="text-xs text-faint">Total expenses</p>
                <p className="mt-0.5 font-mono font-bold tabular-nums text-ink">{totalExpenses}</p>
              </div>
            </div>
          </div>
        </Card>
      </TiltCard>

      {/* KPI strip */}
      <Stagger className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StaggerItem>
          <StatCard label="Circles" value={circles.length} icon={<IconCircles size={20} />} color="primary" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Members" value={totalMembers} icon={<IconUsers size={20} />} color="copper" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="This month" value={`₹${thisMonthSpend.toFixed(0)}`} icon={<IconTrend size={20} />} color="green" />
        </StaggerItem>
        <StaggerItem>
          <StatCard label="Total tracked" value={`₹${totalSpend.toFixed(0)}`} icon={<IconWallet size={20} />} color="amber" />
        </StaggerItem>
      </Stagger>

      {/* Circle selector */}
      {circles.length > 1 && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted">Viewing:</p>
          <SelectField value={chartCircle} onChange={(e) => setChartCircle(e.target.value)} className="w-52">
            {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        </div>
      )}

      {!activeCircleId ? (
        <EmptyState
          icon={<IconCircles size={20} />}
          title="No circle yet"
          description="Create or join a circle to unlock the intelligence dashboard."
          action={<Link to="/circles"><button className="btn-primary text-sm">Create a circle</button></Link>}
        />
      ) : (
        <>
          {/* Score row — Circle Health, Fairness, Conflict Risk */}
          <div className="grid gap-5 md:grid-cols-3">
            <ScrollReveal>
              <TiltCard>
                <Card className="flex flex-col items-center p-6 text-center">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-faint">
                    <IconShield size={14} /> Circle health
                  </div>
                  {healthScore === null ? (
                    <div className="flex h-[132px] items-center justify-center text-sm text-muted">Not enough data yet</div>
                  ) : (
                    <Gauge value={healthScore} tone="primary" sublabel="/ 100" label="Composite of fairness, risk & activity" />
                  )}
                </Card>
              </TiltCard>
            </ScrollReveal>

            <ScrollReveal delay={0.05}>
              <TiltCard>
                <Card className="flex flex-col items-center p-6 text-center">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-faint">
                    <IconGauge size={14} /> Fairness score
                  </div>
                  {fairnessScore === null ? (
                    <div className="flex h-[132px] flex-col items-center justify-center gap-2 text-sm text-muted">
                      <span>Not calculated yet</span>
                      <Link to="/fairness" className="text-xs font-medium text-primary-500 hover:text-primary-600">Calculate now →</Link>
                    </div>
                  ) : (
                    <Gauge value={fairnessScore} tone="success" sublabel="/ 100" label="Average across all members" />
                  )}
                </Card>
              </TiltCard>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <TiltCard>
                <Card className="flex flex-col items-center p-6 text-center">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-faint">
                    <IconAlert size={14} /> Conflict risk
                  </div>
                  {riskScore === null ? (
                    <div className="flex h-[132px] items-center justify-center text-sm text-muted">No signal yet</div>
                  ) : (
                    <Gauge value={riskScore} tone={riskLevel === 'HIGH' ? 'danger' : riskLevel === 'MEDIUM' ? 'warning' : 'success'} sublabel={RISK_LABEL[riskLevel]} label={conflict?.reasons?.[0] || 'No active risk factors detected'} />
                  )}
                </Card>
              </TiltCard>
            </ScrollReveal>
          </div>

          {/* Spending timeline + Contribution heatmap */}
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <ScrollReveal>
              <Card className="p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-semibold text-ink">Spending timeline</h3>
                    <p className="text-xs text-muted">Daily totals — last 14 active days</p>
                  </div>
                  <Badge variant="primary" size="sm">{expenses.length} expenses</Badge>
                </div>
                {expensesLoading ? (
                  <div className="flex h-[220px] items-center justify-center text-sm text-muted">Loading…</div>
                ) : (
                  <SpendingTimeline expenses={expenses} isDark={isDark} />
                )}
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={0.05}>
              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <IconActivity size={16} className="text-primary-500" />
                  <div>
                    <h3 className="font-display font-semibold text-ink">Contribution heatmap</h3>
                    <p className="text-xs text-muted">14-week activity intensity</p>
                  </div>
                </div>
                <ContributionHeatmap weeks={heatmapWeeks} className="mt-6" />
                <div className="mt-5 flex items-center justify-end gap-1.5 text-2xs text-faint">
                  Less
                  {['bg-surface-hover', 'bg-primary-500/25', 'bg-primary-500/50', 'bg-primary-500/75', 'bg-gradient-to-br from-primary-500 to-secondary-500'].map((c, i) => (
                    <span key={i} className={`h-2.5 w-2.5 rounded-[3px] ${c}`} />
                  ))}
                  More
                </div>
              </Card>
            </ScrollReveal>
          </div>

          {/* AI Insights + Activity timeline */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ScrollReveal>
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconSparkle size={16} className="text-secondary-500" />
                    <div>
                      <h3 className="font-display font-semibold text-ink">AI insights</h3>
                      <p className="text-xs text-muted">Gemini-powered read on this circle</p>
                    </div>
                  </div>
                  <Link to="/insights" className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600">
                    Full report <IconArrowRight size={12} />
                  </Link>
                </div>
                {insightsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
                  </div>
                ) : insights.length === 0 ? (
                  <EmptyState icon={<IconSparkle size={18} />} title="No insights yet" description="Add a few expenses and check back." />
                ) : (
                  <ul className="space-y-3">
                    {insights.slice(0, 4).map((text, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-surface-2/60 p-3.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-[10px] font-bold text-white shadow-glow">
                          {i + 1}
                        </span>
                        <p className="text-sm leading-6 text-ink">{text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={0.05}>
              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <IconFlow size={16} className="text-primary-500" />
                  <div>
                    <h3 className="font-display font-semibold text-ink">Activity timeline</h3>
                    <p className="text-xs text-muted">Recent expenses & settlements</p>
                  </div>
                </div>
                {activityItems.length === 0 ? (
                  <EmptyState icon={<IconExpense size={18} />} title="No activity yet" description="Everything you log will appear here." />
                ) : (
                  <ActivityTimeline items={activityItems} />
                )}
              </Card>
            </ScrollReveal>
          </div>

          {/* Settlement flow visualization */}
          <ScrollReveal>
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconScale size={16} className="text-secondary-500" />
                  <div>
                    <h3 className="font-display font-semibold text-ink">Settlement flow</h3>
                    <p className="text-xs text-muted">Optimized payments to close the loop — {totalOwed > 0 ? `₹${totalOwed.toFixed(2)} owed to circle members` : 'everyone is settled'}</p>
                  </div>
                </div>
                <Link to="/settlements" className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600">
                  All settlements <IconArrowRight size={12} />
                </Link>
              </div>
              {settlementFlows.length === 0 ? (
                <EmptyState icon={<IconScale size={18} />} title="All settled up" description="No pending payments in this circle right now." />
              ) : (
                <SettlementFlow flows={settlementFlows} />
              )}
              {(totalOwed > 0 || totalDue > 0) && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/70 bg-success-500/5 p-4">
                    <p className="text-xs font-medium text-muted">You are owed</p>
                    <p className="mt-1 font-mono text-xl font-bold tabular-nums text-success-600">₹{totalOwed.toFixed(2)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-danger-500/5 p-4">
                    <p className="text-xs font-medium text-muted">You owe</p>
                    <p className="mt-1 font-mono text-xl font-bold tabular-nums text-danger-500">₹{totalDue.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </Card>
          </ScrollReveal>

          {/* Recent expenses */}
          <ScrollReveal>
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display font-semibold text-ink">Recent expenses</h3>
                <Link to="/expenses" className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600">
                  View all <IconArrowRight size={12} />
                </Link>
              </div>
              {expensesLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
              ) : expenses.length === 0 ? (
                <EmptyState title="No expenses" description="Add your first expense." icon={<IconExpense size={18} />} />
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 5).map((e) => <RecentExpenseRow key={e.id} expense={e} />)}
                </div>
              )}
            </Card>
          </ScrollReveal>
        </>
      )}

      {/* Quick actions */}
      <ScrollReveal>
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-ink">Quick actions</h3>
            <p className="text-xs text-muted">Jump to the most useful tools</p>
          </div>
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem>
              <QuickAction to="/expenses" label="Add expense" description="Log any split, method, or amount." icon={<IconExpense size={20} />} />
            </StaggerItem>
            <StaggerItem>
              <QuickAction to="/ocr" label="Scan receipt" description="Upload a bill and extract a draft." icon={<IconScan size={20} />} />
            </StaggerItem>
            <StaggerItem>
              <QuickAction to="/voice" label="Voice entry" description="Hands-free logging — AI assistant." icon={<IconMic size={20} />} badge="Soon" />
            </StaggerItem>
            <StaggerItem>
              <QuickAction to="/insights" label="AI insights" description="Gemini-powered spending analysis." icon={<IconSparkle size={20} />} />
            </StaggerItem>
          </Stagger>
        </Card>
      </ScrollReveal>
    </div>
  );
}
