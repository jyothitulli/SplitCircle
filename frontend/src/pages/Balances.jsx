import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { circlesAPI, balancesAPI } from '../services/api';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';

function BalanceItem({ balance }) {
  const isPositive = balance.netBalance > 0;
  return (
    <div className="flex items-center justify-between p-4 glass-light rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {balance.user?.name?.[0] || '?'}
        </div>
        <div>
          <p className="font-medium text-slate-200">{balance.user?.name}</p>
          <p className="text-xs text-slate-500">{balance.user?.email}</p>
        </div>
      </div>
      <p className={`font-bold text-lg ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}₹{Math.abs(Number(balance.netBalance)).toFixed(2)}
      </p>
    </div>
  );
}

export function BalancesPage() {
  const [selectedCircle, setSelectedCircle] = useState('');
  const { data: circlesData } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];
  const circleId = selectedCircle || circles[0]?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['balances', circleId],
    queryFn: () => balancesAPI.getBalances(circleId),
    enabled: !!circleId,
  });
  const balances = data?.data?.data?.balances || [];

  const totalOwed = balances.filter(b => b.netBalance < 0).reduce((s, b) => s + Math.abs(Number(b.netBalance)), 0);
  const totalOwing = balances.filter(b => b.netBalance > 0).reduce((s, b) => s + Number(b.netBalance), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-100">Balances</h2>
        <select className="input w-auto" value={selectedCircle} onChange={(e) => setSelectedCircle(e.target.value)}>
          <option value="">Select circle</option>
          {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {circleId && (
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">Total Owed To You</p>
            <p className="text-2xl font-bold text-green-400">₹{totalOwing.toFixed(2)}</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 mb-1">You Owe</p>
            <p className="text-2xl font-bold text-red-400">₹{totalOwed.toFixed(2)}</p>
          </div>
        </div>
      )}

      {!circleId ? (
        <EmptyState icon="⚖️" title="Select a circle" description="Choose a circle to view balances" />
      ) : isLoading ? <Loader /> : balances.length === 0 ? (
        <EmptyState icon="⚖️" title="No balances" description="All settled up in this circle!" />
      ) : (
        <div className="space-y-3">
          {balances.map((b, i) => <BalanceItem key={i} balance={b} />)}
        </div>
      )}
    </div>
  );
}
