import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/SectionHeader';
import { SelectField } from '../components/ui/SelectField';
import { SkeletonList } from '../components/ui/Skeleton';
import { Stagger, StaggerItem } from '../components/motion';
import { circlesAPI, expensesAPI } from '../services/api';
import { IconEdit, IconExpense, IconPlus, IconTrash } from '../components/icons';

const defaultForm = {
  description: '',
  amount: '',
  expenseDate: new Date().toISOString().split('T')[0],
  paidById: '',
  splitMethod: 'EQUAL',
  shares: {},
};

const splitTabs = [
  { value: 'EQUAL', label: 'Equal' },
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'CUSTOM', label: 'Custom' },
];

function ExpenseItem({ expense, onEdit, onDelete, isDeleting }) {
  const date = new Date(expense.expenseDate || expense.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600">
          <IconExpense size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{expense.description}</p>
          <p className="mt-0.5 truncate text-xs text-faint">
            {date} · Paid by {expense.paidBy?.name || 'Unknown'} · {expense.participants?.length || 0} participants
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:text-right">
        <div>
          <p className="font-numeric font-semibold text-ink">Rs {Number(expense.amount).toFixed(2)}</p>
          <Badge variant="primary" size="sm">
            {expense.splitMethod}
          </Badge>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:border-border-strong hover:text-ink"
          onClick={() => onEdit(expense)}
          aria-label="Edit expense"
        >
          <IconEdit size={15} />
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:border-danger-500/40 hover:text-danger-500"
          onClick={() => onDelete(expense)}
          disabled={isDeleting}
          aria-label="Delete expense"
        >
          <IconTrash size={15} />
        </button>
      </div>
    </Card>
  );
}

function ExpenseForm({ form, setForm, members, onSubmit, onCancel, isPending, submitLabel }) {
  const amount = Number(form.amount) || 0;
  const customTotal = members.reduce((sum, member) => sum + (Number(form.shares[member.id]) || 0), 0);
  const percentageTotal = members.reduce((sum, member) => sum + (Number(form.shares[member.id]) || 0), 0);

  const setShare = (userId, value) => {
    setForm((current) => ({ ...current, shares: { ...current.shares, [userId]: value } }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Description</label>
        <input
          className="input"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Dinner, groceries, rent"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Amount</label>
          <input
            className="input font-numeric"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            required
          />
        </div>
        <div>
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={form.expenseDate}
            onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className="label">Paid by</label>
        <SelectField value={form.paidById} onChange={(event) => setForm((current) => ({ ...current, paidById: event.target.value }))}>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </SelectField>
      </div>

      <div>
        <label className="label">Split method</label>
        <div className="grid grid-cols-3 gap-2">
          {splitTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setForm((current) => ({ ...current, splitMethod: tab.value, shares: {} }))}
              className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                form.splitMethod === tab.value
                  ? 'border-primary-500/40 bg-primary-500/10 text-primary-600'
                  : 'border-border bg-surface-2 text-muted hover:bg-surface-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {form.splitMethod !== 'EQUAL' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Participant shares</p>
                <p className="font-numeric text-xs text-faint">
                  {form.splitMethod === 'PERCENTAGE'
                    ? `${percentageTotal.toFixed(2)} / 100%`
                    : `Rs ${customTotal.toFixed(2)} / Rs ${amount.toFixed(2)}`}
                </p>
              </div>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="grid grid-cols-[1fr_120px] items-center gap-3">
                    <span className="truncate text-sm text-muted">{member.name}</span>
                    <input
                      className="input font-numeric"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.shares[member.id] || ''}
                      onChange={(event) => setShare(member.id, event.target.value)}
                      placeholder={form.splitMethod === 'PERCENTAGE' ? '%' : 'Rs'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" loading={isPending} disabled={members.length === 0}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [selectedCircle, setSelectedCircle] = useState(params.get('circle') || '');
  const [editingExpense, setEditingExpense] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const { data: circlesData, isLoading: circlesLoading } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];
  const circleId = selectedCircle || circles[0]?.id;

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', circleId],
    queryFn: () => expensesAPI.list(circleId),
    enabled: Boolean(circleId),
  });
  const expenses = expensesData?.data?.data?.expenses || [];

  const { data: membersData } = useQuery({
    queryKey: ['members', circleId],
    queryFn: () => circlesAPI.listMembers(circleId),
    enabled: Boolean(circleId),
  });
  const members = useMemo(() => membersData?.data?.data?.members || [], [membersData]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingExpense ? expensesAPI.update(circleId, editingExpense.id, payload) : expensesAPI.create(circleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', circleId] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      toast.success(editingExpense ? 'Expense updated' : 'Expense added');
      setShowModal(false);
      setEditingExpense(null);
      setForm(defaultForm);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to save expense'),
  });

  const deleteMutation = useMutation({
    mutationFn: (expense) => expensesAPI.remove(circleId, expense.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', circleId] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      toast.success('Expense deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete expense'),
  });

  const openCreate = () => {
    setEditingExpense(null);
    setForm({ ...defaultForm, paidById: members[0]?.id || '' });
    setShowModal(true);
  };

  const openEdit = (expense) => {
    const shares = {};
    for (const participant of expense.participants || []) {
      shares[participant.userId] =
        expense.splitMethod === 'PERCENTAGE' ? participant.sharePercentage || '' : participant.shareAmount || '';
    }
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      expenseDate: new Date(expense.expenseDate || expense.createdAt).toISOString().split('T')[0],
      paidById: expense.paidBy?.id || members[0]?.id || '',
      splitMethod: expense.splitMethod,
      shares,
    });
    setShowModal(true);
  };

  const buildPayload = () => {
    const participants = members.map((member) => {
      if (form.splitMethod === 'PERCENTAGE') return { userId: member.id, sharePercentage: Number(form.shares[member.id]) };
      if (form.splitMethod === 'CUSTOM') return { userId: member.id, shareAmount: Number(form.shares[member.id]) };
      return { userId: member.id };
    });

    return {
      description: form.description,
      amount: Number(form.amount),
      splitMethod: form.splitMethod,
      paidById: form.paidById || undefined,
      expenseDate: form.expenseDate,
      participants,
    };
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveMutation.mutate(buildPayload());
  };

  if (circlesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 skeleton" />
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Create, edit, delete, and split expenses across circle members."
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
              <Button onClick={openCreate}>
                <IconPlus size={16} /> Add expense
              </Button>
            )}
          </div>
        }
      />

      {!circleId ? (
        <EmptyState icon={<IconExpense size={20} />} title="Select a circle" description="Choose a circle before adding expenses." />
      ) : expensesLoading ? (
        <SkeletonList count={4} />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<IconExpense size={20} />}
          title="No expenses yet"
          description="Add the first expense to start calculating balances."
          action={
            <Button onClick={openCreate}>
              <IconPlus size={16} /> Add expense
            </Button>
          }
        />
      ) : (
        <Stagger className="space-y-3">
          {expenses.map((expense) => (
            <StaggerItem key={expense.id}>
              <ExpenseItem expense={expense} onEdit={openEdit} onDelete={deleteMutation.mutate} isDeleting={deleteMutation.isPending} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingExpense ? 'Edit expense' : 'Add expense'}
        subtitle="Split it equally, by percentage, or with custom amounts."
        size="lg"
      >
        <ExpenseForm
          form={form}
          setForm={setForm}
          members={members}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          isPending={saveMutation.isPending}
          submitLabel={editingExpense ? 'Update expense' : 'Add expense'}
        />
      </Modal>
    </div>
  );
}
