import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { circlesAPI, insightsAPI } from '../services/api';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

function InsightCard({ insight, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass-light rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{insight.icon || '💡'}</div>
        <div>
          {insight.title && <p className="font-semibold text-slate-200 mb-1">{insight.title}</p>}
          <p className="text-sm text-slate-300 leading-relaxed">{insight.message || insight.content || String(insight)}</p>
          {insight.severity && (
            <div className="mt-2">
              <Badge variant={insight.severity === 'HIGH' ? 'danger' : insight.severity === 'MEDIUM' ? 'warning' : 'primary'}>
                {insight.severity}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ConflictRiskCard({ riskLevel, reasons, memberCount }) {
  const variant = riskLevel === 'HIGH' ? 'danger' : riskLevel === 'MEDIUM' ? 'warning' : 'success';
  return (
    <div className="glass-light rounded-xl p-5 border border-red-500/20">
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium text-slate-200">Circle Risk Level</p>
        <Badge variant={variant}>{riskLevel}</Badge>
      </div>
      {memberCount != null && (
        <p className="text-xs text-slate-500 mb-3">Based on {memberCount} member{memberCount === 1 ? '' : 's'}</p>
      )}
      {reasons.length === 0 ? (
        <p className="text-sm text-slate-400">No specific risk factors detected.</p>
      ) : (
        <ul className="space-y-2">
          {reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AIInsightsPage() {
  const qc = useQueryClient();
  const [selectedCircle, setSelectedCircle] = useState('');
  const [showConflicts, setShowConflicts] = useState(false);
  const { data: circlesData } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];
  const circleId = selectedCircle || circles[0]?.id;

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', circleId],
    queryFn: () => insightsAPI.get(circleId),
    enabled: !!circleId,
  });

  const refreshMutation = useMutation({
    mutationFn: () => insightsAPI.get(circleId, true),
    onSuccess: (res) => { qc.setQueryData(['insights', circleId], res); toast.success('Insights refreshed'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to refresh insights'),
  });

  const { data: conflictsData, isLoading: conflictsLoading } = useQuery({
    queryKey: ['conflicts', circleId],
    queryFn: () => insightsAPI.getConflicts(circleId),
    enabled: !!circleId && showConflicts,
  });

  // GET /api/circles/:id/insights -> { data: { insights: string[], ... } }
  const insightsArr = insightsData?.data?.data?.insights || [];

  // GET /api/circles/:id/conflicts -> { data: { riskLevel, reasons: string[], memberCount, ... } }
  const conflictPrediction = conflictsData?.data?.data || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">AI Insights</h2>
          <p className="text-slate-400 text-sm">Gemini-powered analysis of your circle</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-auto" value={selectedCircle} onChange={(e) => setSelectedCircle(e.target.value)}>
            <option value="">Select circle</option>
            {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {circleId && (
            <button className="btn-primary" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
              {refreshMutation.isPending ? 'Refreshing...' : '⟳ Refresh'}
            </button>
          )}
        </div>
      </div>

      {!circleId ? (
        <EmptyState icon="🤖" title="Select a circle" description="Choose a circle to get AI-powered insights" />
      ) : (
        <div className="space-y-6">
          {/* Insights */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">💡 INSIGHTS</h3>
            {insightsLoading ? <Loader /> : insightsArr.length === 0 ? (
              <EmptyState icon="💡" title="No insights yet" description="Add more expenses to get AI insights" />
            ) : (
              <div className="space-y-3">
                {insightsArr.map((ins, i) => <InsightCard key={i} insight={ins} delay={i * 0.05} />)}
              </div>
            )}
          </div>

          {/* Conflicts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-400">⚠️ CONFLICT PREDICTIONS</h3>
              {!showConflicts && (
                <button className="text-sm text-indigo-400 hover:text-indigo-300" onClick={() => setShowConflicts(true)}>
                  Load conflicts →
                </button>
              )}
            </div>
            {showConflicts && (
              conflictsLoading ? <Loader /> : !conflictPrediction ? (
                <EmptyState icon="✅" title="No conflicts predicted" description="Your circle looks harmonious!" />
              ) : (
                <ConflictRiskCard
                  riskLevel={conflictPrediction.riskLevel}
                  reasons={conflictPrediction.reasons || []}
                  memberCount={conflictPrediction.memberCount}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
