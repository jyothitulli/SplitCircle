import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { circlesAPI, balancesAPI } from '../services/api';
import { Card, StatCard } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/SectionHeader';
import { SelectField } from '../components/ui/SelectField';
import { SkeletonList, SkeletonStatGrid } from '../components/ui/Skeleton';
import { Stagger, StaggerItem } from '../components/motion';
import { IconArrowDown, IconArrowUp, IconScale } from '../components/icons';

function BalanceItem({ balance }) {
  const isPositive = balance.netBalance > 0;
  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-bold ${
            isPositive ? 'bg-success-500/10 text-success-600' : 'bg-danger-500/10 text-danger-500'
          }`}
        >
          {balance.user?.name?.[0] || '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{balance.user?.name}</p>
          <p className="truncate text-xs text-faint">{balance.user?.email}</p>
        </div>
      </div>
      <p className={`flex shrink-0 items-center gap-1 font-numeric text-lg font-bold ${isPositive ? 'text-success-600' : 'text-danger-500'}`}>
        {isPositive ? <IconArrowUp size={15} /> : <IconArrowDown size={15} />}
        ₹{Math.abs(Number(balance.netBalance)).toFixed(2)}
      </p>
    </Card>
  );
}

export function BalancesPage() {
  const [selectedCircle, setSelectedCircle] = useState('');
  const { data: circlesData, isLoading: circlesLoading } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];
  const circleId = selectedCircle || circles[0]?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['balances', circleId],
    queryFn: () => balancesAPI.getBalances(circleId),
    enabled: !!circleId,
  });
  const balances = data?.data?.data?.balances || [];

  const totalOwed = balances.filter((b) => b.netBalance < 0).reduce((s, b) => s + Math.abs(Number(b.netBalance)), 0);
  const totalOwing = balances.filter((b) => b.netBalance > 0).reduce((s, b) => s + Number(b.netBalance), 0);

  if (circlesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 skeleton" />
        <SkeletonStatGrid count={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Balances"
        description="Review who owes what in your selected circle."
        action={
          <SelectField value={selectedCircle} onChange={(e) => setSelectedCircle(e.target.value)} className="w-full max-w-xs">
            <option value="">Select circle</option>
            {circles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        }
      />

      {circleId && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard label="Total owed to you" value={`₹${totalOwing.toFixed(2)}`} icon={<IconArrowUp size={20} />} color="green" />
          <StatCard label="You owe" value={`₹${totalOwed.toFixed(2)}`} icon={<IconArrowDown size={20} />} color="red" />
        </div>
      )}

      {!circleId ? (
        <EmptyState icon={<IconScale size={20} />} title="Select a circle" description="Choose a circle to view balances." />
      ) : isLoading ? (
        <SkeletonList count={4} />
      ) : balances.length === 0 ? (
        <EmptyState icon={<IconScale size={20} />} title="No balances" description="All settled up in this circle!" />
      ) : (
        <Stagger className="space-y-3">
          {balances.map((b, i) => (
            <StaggerItem key={i}>
              <BalanceItem balance={b} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
