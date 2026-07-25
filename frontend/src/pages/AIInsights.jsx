import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader, SectionHeader } from '../components/ui/SectionHeader';
import { SelectField } from '../components/ui/SelectField';
import { SkeletonList } from '../components/ui/Skeleton';
import { Stagger, StaggerItem } from '../components/motion';
import { circlesAPI, insightsAPI } from '../services/api';
import { IconAlert, IconSparkle } from '../components/icons';

function InsightCard({ insight }) {
  const message = typeof insight === 'string' ? insight : insight.message || insight.content || JSON.stringify(insight);
  const title = typeof insight === 'string' ? 'Recommendation' : insight.title || 'Recommendation';
  const severity = typeof insight === 'object' ? insight.severity : null;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600">
            <IconSparkle size={14} />
          </span>
          <div>
            <p className="font-semibold text-ink">{title}</p>
            <p className="mt-1.5 text-sm leading-6 text-muted">{message}</p>
          </div>
        </div>
        {severity && <Badge variant={severity === 'HIGH' ? 'danger' : severity === 'MEDIUM' ? 'warning' : 'primary'}>{severity}</Badge>}
      </div>
    </Card>
  );
}

function ConflictRiskCard({ riskLevel = 'LOW', reasons = [], memberCount }) {
  const variant = riskLevel === 'HIGH' ? 'danger' : riskLevel === 'MEDIUM' ? 'warning' : 'success';

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-ink">Circle risk level</p>
        <Badge variant={variant}>{riskLevel}</Badge>
      </div>
      {memberCount != null && <p className="mb-3 text-xs text-faint">Based on {memberCount} members</p>}
      {reasons.length === 0 ? (
        <p className="text-sm text-muted">No specific risk factors detected.</p>
      ) : (
        <ul className="space-y-2">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-sm text-muted">
              <IconAlert size={13} className="mt-0.5 shrink-0 text-warning-500" />
              {reason}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function AIInsightsPage() {
  const queryClient = useQueryClient();
  const [selectedCircle, setSelectedCircle] = useState('');
  const [showConflicts, setShowConflicts] = useState(false);
  const { data: circlesData } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];
  const circleId = selectedCircle || circles[0]?.id;

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', circleId],
    queryFn: () => insightsAPI.get(circleId),
    enabled: Boolean(circleId),
  });

  const refreshMutation = useMutation({
    mutationFn: () => insightsAPI.get(circleId, true),
    onSuccess: (response) => {
      queryClient.setQueryData(['insights', circleId], response);
      toast.success('Insights refreshed');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to refresh insights'),
  });

  const { data: conflictsData, isLoading: conflictsLoading } = useQuery({
    queryKey: ['conflicts', circleId],
    queryFn: () => insightsAPI.getConflicts(circleId),
    enabled: Boolean(circleId) && showConflicts,
  });

  const insights = insightsData?.data?.data?.insights || [];
  const conflictPrediction = conflictsData?.data?.data || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI insights"
        description="Gemini-powered spending analysis, recommendations, and conflict signals."
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
              <Button onClick={() => refreshMutation.mutate()} loading={refreshMutation.isPending}>
                Refresh
              </Button>
            )}
          </div>
        }
      />

      {!circleId ? (
        <EmptyState icon={<IconSparkle size={20} />} title="Select a circle" description="Choose a circle to generate AI insights." />
      ) : (
        <div className="space-y-6">
          <section>
            <SectionHeader title="Insights" />
            {insightsLoading ? (
              <SkeletonList count={3} />
            ) : insights.length === 0 ? (
              <EmptyState title="No insights yet" description="Add expenses and refresh insights to generate recommendations." />
            ) : (
              <Stagger className="space-y-3">
                {insights.map((insight, index) => (
                  <StaggerItem key={`${index}-${JSON.stringify(insight).slice(0, 24)}`}>
                    <InsightCard insight={insight} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="section-title">Conflict prediction</p>
              {!showConflicts && (
                <button className="text-sm font-medium text-primary-600 hover:text-primary-700" onClick={() => setShowConflicts(true)}>
                  Load prediction
                </button>
              )}
            </div>
            {showConflicts &&
              (conflictsLoading ? (
                <SkeletonList count={1} />
              ) : !conflictPrediction ? (
                <EmptyState title="No conflicts predicted" description="Your circle currently looks healthy." />
              ) : (
                <ConflictRiskCard
                  riskLevel={conflictPrediction.riskLevel}
                  reasons={conflictPrediction.reasons || []}
                  memberCount={conflictPrediction.memberCount}
                />
              ))}
          </section>
        </div>
      )}
    </div>
  );
}
