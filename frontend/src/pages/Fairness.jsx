import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader, SectionHeader } from '../components/ui/SectionHeader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SelectField } from '../components/ui/SelectField';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useTheme } from '../context/ThemeContext';
import { circlesAPI, fairnessAPI } from '../services/api';
import { IconFairness } from '../components/icons';

export function FairnessPage() {
  const [selectedCircle, setSelectedCircle] = useState('');
  const { isDark } = useTheme();
  const { data: circlesData } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];
  const circleId = selectedCircle || circles[0]?.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['fairness', circleId],
    queryFn: () => fairnessAPI.leaderboard(circleId),
    enabled: Boolean(circleId),
  });
  const leaderboard = data?.data?.data?.leaderboard || [];

  const calculateMutation = useMutation({
    mutationFn: () => fairnessAPI.calculate(circleId),
    onSuccess: () => {
      refetch();
      toast.success('Fairness calculated');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to calculate fairness'),
  });

  const chartData = leaderboard.map((row) => ({
    name: row.user?.name?.split(' ')[0] || 'Member',
    score: Number(row.overallScore || 0),
  }));

  // Recharts needs literal color strings (it renders raw SVG attrs),
  // so theme-derive a small palette rather than using Tailwind classes.
  const chartColors = isDark
    ? { grid: '#222434', tick: '#6c6e85', stroke: '#8a6fff', fill: '#8a6fff', tooltipBg: '#0e0f17', tooltipBorder: '#222434', tooltipText: '#f4f4fa' }
    : { grid: '#e3e3f0', tick: '#8c8da3', stroke: '#6c42ff', fill: '#6c42ff', tooltipBg: '#ffffff', tooltipBorder: '#e3e3f0', tooltipText: '#12121c' };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fairness score"
        description="Balance spending, chores, and participation across each circle."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <SelectField value={selectedCircle} onChange={(event) => setSelectedCircle(event.target.value)} className="sm:w-56">
              <option value="">Select circle</option>
              {circles.map((circle) => (
                <option key={circle.id} value={circle.id}>
                  {circle.name}
                </option>
              ))}
            </SelectField>
            {circleId && (
              <Button onClick={() => calculateMutation.mutate()} loading={calculateMutation.isPending}>
                Calculate
              </Button>
            )}
          </div>
        }
      />

      {!circleId ? (
        <EmptyState icon={<IconFairness size={20} />} title="Select a circle" description="Choose a circle to view fairness analytics." />
      ) : isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : leaderboard.length === 0 ? (
        <EmptyState
          icon={<IconFairness size={20} />}
          title="No scores yet"
          description="Calculate fairness after adding expenses and chores."
          action={
            <Button onClick={() => calculateMutation.mutate()} loading={calculateMutation.isPending}>
              Calculate now
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <SectionHeader title="Leaderboard" />
            <div className="space-y-5">
              {leaderboard.map((row, index) => {
                const score = Number(row.overallScore || 0);
                return (
                  <div key={row.userId} className="flex items-center gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-muted">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ink">{row.user?.name}</p>
                        <span className="font-numeric text-sm font-bold text-ink">{score.toFixed(1)}</span>
                      </div>
                      <ProgressBar value={Math.min(score, 100)} className="mt-2" color={index === 0 ? 'copper' : 'primary'} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Score shape" />
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={chartData}>
                <PolarGrid stroke={chartColors.grid} />
                <PolarAngleAxis dataKey="name" tick={{ fill: chartColors.tick, fontSize: 12 }} />
                <Radar name="Score" dataKey="score" stroke={chartColors.stroke} fill={chartColors.fill} fillOpacity={0.32} />
                <Tooltip
                  contentStyle={{
                    background: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: 12,
                    color: chartColors.tooltipText,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}
