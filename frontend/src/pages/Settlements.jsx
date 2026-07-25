import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/SectionHeader';
import { SelectField } from '../components/ui/SelectField';
import { SkeletonList } from '../components/ui/Skeleton';
import { Stagger, StaggerItem } from '../components/motion';
import { balancesAPI, circlesAPI } from '../services/api';
import { IconArrowRight, IconCheck, IconSettle } from '../components/icons';

function SettlementItem({ settlement, onPay, isPaying }) {
  return (
    <Card className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-danger-500">{settlement.fromUser?.name || 'Member'}</span>
        <IconArrowRight size={14} className="text-faint" />
        <span className="font-semibold text-success-600">{settlement.toUser?.name || 'Member'}</span>
      </div>
      <div className="flex items-center gap-3">
        <p className="font-numeric text-lg font-bold text-ink">Rs {Number(settlement.amount).toFixed(2)}</p>
        {settlement.status === 'COMPLETED' ? (
          <Badge variant="success" icon={<IconCheck size={11} />}>
            Paid
          </Badge>
        ) : (
          settlement.id && (
            <Button size="sm" onClick={() => onPay(settlement.id)} loading={isPaying}>
              Mark paid
            </Button>
          )
        )}
      </div>
    </Card>
  );
}

export function SettlementsPage() {
  const queryClient = useQueryClient();
  const [selectedCircle, setSelectedCircle] = useState('');
  const { data: circlesData } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];
  const circleId = selectedCircle || circles[0]?.id;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['settlements', circleId],
    queryFn: () => balancesAPI.optimize(circleId),
    enabled: Boolean(circleId),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  const settlements = data?.data?.data?.settlements || [];

  const recalculateMutation = useMutation({
    mutationFn: () => balancesAPI.optimize(circleId),
    onSuccess: (response) => {
      queryClient.setQueryData(['settlements', circleId], response);
      toast.success('Settlements recalculated');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to recalculate settlements'),
  });

  const payMutation = useMutation({
    mutationFn: balancesAPI.pay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', circleId] });
      toast.success('Payment recorded');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to record payment'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settlements"
        description="Optimize who pays whom and record completed payments."
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
              <Button variant="secondary" onClick={() => recalculateMutation.mutate()} loading={recalculateMutation.isPending || isFetching}>
                Recalculate
              </Button>
            )}
          </div>
        }
      />

      {!circleId ? (
        <EmptyState icon={<IconSettle size={20} />} title="Select a circle" description="Choose a circle to calculate optimized settlements." />
      ) : isLoading ? (
        <SkeletonList count={3} />
      ) : settlements.length === 0 ? (
        <EmptyState icon={<IconCheck size={20} />} title="All settled up" description="No pending settlements in this circle." />
      ) : (
        <Stagger className="space-y-3">
          {settlements.map((settlement, index) => (
            <StaggerItem key={settlement.id || index}>
              <SettlementItem settlement={settlement} onPay={payMutation.mutate} isPaying={payMutation.isPending} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
