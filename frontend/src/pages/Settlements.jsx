import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { circlesAPI, balancesAPI } from '../services/api';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

function SettlementItem({ s, onPay }) {
  return (
    <div className="flex items-center justify-between p-4 glass-light rounded-xl">
      <div className="flex items-center gap-3">
        <div className="text-2xl">💸</div>
        <div>
          <p className="text-slate-200">
            <span className="font-medium text-red-400">{s.fromUser?.name}</span>
            {' → '}
            <span className="font-medium text-green-400">{s.toUser?.name}</span>
          </p>
          <p className="text-xs text-slate-500">Settlement</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-bold text-slate-100">₹{Number(s.amount).toFixed(2)}</p>
        {s.id && s.status !== 'COMPLETED' && (
          <button onClick={() => onPay(s.id)} className="btn-primary text-xs py-1.5 px-3">Mark Paid</button>
        )}
        {s.status === 'COMPLETED' && <Badge variant="success">Paid</Badge>}
      </div>
    </div>
  );
}

export function SettlementsPage() {
  const qc = useQueryClient();
  const [selectedCircle, setSelectedCircle] = useState('');
  const { data: circlesData } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];
  const circleId = selectedCircle || circles[0]?.id;

  // NOTE: GET /api/circles/:circleId/settlements/optimize is not a pure read —
  // the backend deletes existing PENDING settlements and recreates them on
  // every call. Running it automatically as a query (e.g. on every mount or
  // background refetch) would silently invalidate settlement IDs the user is
  // currently looking at. Instead we only call it once on circle selection
  // and explicitly via a "Recalculate" button, never as a background refetch.
  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['settlements', circleId],
    queryFn: () => balancesAPI.optimize(circleId),
    enabled: !!circleId,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const settlements = data?.data?.data?.settlements || [];

  const recalculateMutation = useMutation({
    mutationFn: () => balancesAPI.optimize(circleId),
    onSuccess: (res) => {
      qc.setQueryData(['settlements', circleId], res);
      toast.success('Settlements recalculated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to recalculate settlements'),
  });

  const payMutation = useMutation({
    mutationFn: balancesAPI.pay,
    onSuccess: () => { qc.invalidateQueries(['settlements', circleId]); toast.success('Payment recorded!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to record payment'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-100">Settlements</h2>
        <div className="flex gap-3">
          <select className="input w-auto" value={selectedCircle} onChange={(e) => setSelectedCircle(e.target.value)}>
            <option value="">Select circle</option>
            {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {circleId && (
            <button
              className="btn-secondary text-sm"
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending || isFetching}
            >
              {recalculateMutation.isPending ? 'Recalculating...' : '↻ Recalculate'}
            </button>
          )}
        </div>
      </div>

      {!circleId ? (
        <EmptyState icon="✅" title="Select a circle" />
      ) : isLoading ? <Loader /> : settlements.length === 0 ? (
        <EmptyState icon="🎉" title="All settled up!" description="No pending settlements in this circle" />
      ) : (
        <div className="space-y-3">
          {settlements.map((s, i) => <SettlementItem key={i} s={s} onPay={payMutation.mutate} />)}
        </div>
      )}
    </div>
  );
}
