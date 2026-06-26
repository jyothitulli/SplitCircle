import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { circlesAPI, fairnessAPI } from '../services/api';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';

export function FairnessPage() {
  const [selectedCircle, setSelectedCircle] = useState('');
  const { data: circlesData } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];
  const circleId = selectedCircle || circles[0]?.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['fairness', circleId],
    queryFn: () => fairnessAPI.leaderboard(circleId),
    enabled: !!circleId,
  });
  const leaderboard = data?.data?.data?.leaderboard || [];

  const calcMutation = useMutation({
    mutationFn: () => fairnessAPI.calculate(circleId),
    onSuccess: () => { refetch(); toast.success('Fairness calculated!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const chartData = leaderboard.map((l) => ({
    name: l.user?.name?.split(' ')[0] || 'User',
    score: Number(l.overallScore || 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-100">Fairness Score</h2>
        <div className="flex gap-3">
          <select className="input w-auto" value={selectedCircle} onChange={(e) => setSelectedCircle(e.target.value)}>
            <option value="">Select circle</option>
            {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {circleId && (
            <button className="btn-primary" onClick={() => calcMutation.mutate()} disabled={calcMutation.isPending}>
              {calcMutation.isPending ? 'Calculating...' : '⟳ Recalculate'}
            </button>
          )}
        </div>
      </div>

      {!circleId ? <EmptyState icon="🏆" title="Select a circle" /> : isLoading ? <Loader /> : leaderboard.length === 0 ? (
        <EmptyState icon="🏆" title="No scores yet" description="Calculate fairness to see who's pulling their weight"
          action={<button className="btn-primary" onClick={() => calcMutation.mutate()}>Calculate Now</button>} />
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-4">LEADERBOARD</h3>
            <div className="space-y-3">
              {leaderboard.map((l, i) => (
                <div key={l.userId} className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-500/20 text-slate-400' : 'bg-orange-900/20 text-orange-700'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{l.user?.name}</p>
                    <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(Number(l.overallScore), 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-300">{Number(l.overallScore || 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {chartData.length >= 3 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-4">RADAR CHART</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
