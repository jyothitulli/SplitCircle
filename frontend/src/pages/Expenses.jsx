import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { circlesAPI, expensesAPI } from '../services/api';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/forms/FormField';

function ExpenseItem({ expense }) {
  const date = new Date(expense.date || expense.createdAt).toLocaleDateString();
  return (
    <div className="flex items-center justify-between p-4 glass-light rounded-xl hover:bg-slate-700/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">💳</div>
        <div>
          <p className="font-medium text-slate-200">{expense.title || expense.description}</p>
          <p className="text-xs text-slate-500">{date} • Paid by {expense.paidBy?.name || 'Unknown'}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-slate-100">₹{Number(expense.amount).toFixed(2)}</p>
        <Badge variant="primary" size="sm">{expense.splitType || 'EQUAL'}</Badge>
      </div>
    </div>
  );
}

export function ExpensesPage() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const preCircle = params.get('circle');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(preCircle || '');

  const { data: circlesData, isLoading: circlesLoading } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];

  const circleId = selectedCircle || circles[0]?.id;

  const { data: expensesData, isLoading: expLoading } = useQuery({
    queryKey: ['expenses', circleId],
    queryFn: () => expensesAPI.list(circleId),
    enabled: !!circleId,
  });
  const expenses = expensesData?.data?.data?.expenses || [];

  const { data: membersData } = useQuery({
    queryKey: ['members', circleId],
    queryFn: () => circlesAPI.listMembers(circleId),
    enabled: !!circleId,
  });
  const members = membersData?.data?.data?.members || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: (data) => expensesAPI.create(circleId, data),
    onSuccess: () => {
      qc.invalidateQueries(['expenses', circleId]);
      toast.success('Expense added!');
      setShowCreate(false);
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create expense'),
  });

  if (circlesLoading) return <Loader text="Loading..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Expenses</h2>
          <p className="text-slate-400 text-sm">{expenses.length} expenses</p>
        </div>
        <div className="flex gap-3">
          <select className="input w-auto" value={selectedCircle} onChange={(e) => setSelectedCircle(e.target.value)}>
            <option value="">All circles</option>
            {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {circleId && <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add</button>}
        </div>
      </div>

      {!circleId ? (
        <EmptyState icon="💳" title="Select a circle" description="Choose a circle to view and manage expenses" />
      ) : expLoading ? <Loader /> : expenses.length === 0 ? (
        <EmptyState icon="💳" title="No expenses yet" description="Add your first expense to start tracking"
          action={<button className="btn-primary" onClick={() => setShowCreate(true)}>Add Expense</button>} />
      ) : (
        <div className="space-y-3">
          {expenses.map((e) => <ExpenseItem key={e.id} expense={e} />)}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Expense">
        <form
          onSubmit={handleSubmit((d) => {
            // Map this form's fields onto POST /api/circles/:circleId/expenses'
            // expected shape: { description, amount, splitMethod, paidById,
            // participants: [{ userId }], expenseDate }. Only EQUAL split is
            // offered above, since PERCENTAGE/CUSTOM need per-member share
            // inputs that this form doesn't collect.
            const participants = members.map((m) => ({ userId: m.user?.id || m.id }));

            createMutation.mutate({
              description: d.title,
              amount: Number(d.amount),
              splitMethod: 'EQUAL',
              paidById: d.paidById || undefined,
              expenseDate: d.date || undefined,
              participants,
            });
          })}
          className="space-y-4"
        >
          <Input label="Title" placeholder="Dinner at Barbeque Nation"
            error={errors.title?.message} {...register('title', { required: 'Title required' })} />
          <Input label="Amount (₹)" type="number" step="0.01" placeholder="1200"
            error={errors.amount?.message} {...register('amount', { required: 'Amount required', min: 0.01 })} />
          <Input label="Date" type="date" defaultValue={new Date().toISOString().split('T')[0]}
            {...register('date')} />
          <Select label="Split Type"
            options={[{ value: 'EQUAL', label: 'Equal Split' }]}
            {...register('splitType')} />
          {/* Note: PERCENTAGE and CUSTOM splits need a per-member share
              input UI that doesn't exist here yet — only Equal Split is
              wired up to avoid silently sending invalid requests. */}
          {members.length > 0 && (
            <div>
              <label className="label">Paid By</label>
              <select className="input" {...register('paidById')}>
                {members.map((m) => <option key={m.user?.id || m.id} value={m.user?.id || m.id}>{m.user?.name || m.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
