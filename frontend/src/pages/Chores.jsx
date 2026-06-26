import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { circlesAPI, choresAPI } from '../services/api';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/forms/FormField';
import { Badge } from '../components/ui/Badge';

export function ChoresPage() {
  const qc = useQueryClient();
  const [selectedCircle, setSelectedCircle] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data: circlesData } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];
  const circleId = selectedCircle || circles[0]?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['chores', circleId],
    queryFn: () => choresAPI.list(circleId),
    enabled: !!circleId,
  });
  const chores = data?.data?.data?.chores || [];

  const { data: assignmentsData } = useQuery({
    queryKey: ['chore-assignments', circleId],
    queryFn: () => choresAPI.listAssignments(circleId),
    enabled: !!circleId,
  });
  const assignments = assignmentsData?.data?.data?.assignments || [];

  const { register, handleSubmit, reset } = useForm();

  const createMutation = useMutation({
    mutationFn: (data) => choresAPI.create(circleId, data),
    onSuccess: () => { qc.invalidateQueries(['chores', circleId]); toast.success('Chore created!'); setShowCreate(false); reset(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const completeMutation = useMutation({
    mutationFn: choresAPI.complete,
    onSuccess: () => { qc.invalidateQueries(['chore-assignments', circleId]); toast.success('Chore completed! 🎉'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-100">Chores</h2>
        <div className="flex gap-3">
          <select className="input w-auto" value={selectedCircle} onChange={(e) => setSelectedCircle(e.target.value)}>
            <option value="">Select circle</option>
            {circles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {circleId && <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Chore</button>}
        </div>
      </div>

      {!circleId ? <EmptyState icon="🧹" title="Select a circle" /> : isLoading ? <Loader /> : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">CHORES ({chores.length})</h3>
            <div className="space-y-3">
              {chores.length === 0 ? <EmptyState icon="🧹" title="No chores" description="Create chores for your circle" action={<button className="btn-primary text-sm" onClick={() => setShowCreate(true)}>Add Chore</button>} /> :
                chores.map((c) => (
                  <div key={c.id} className="glass-light rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-200">{c.title}</p>
                        {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
                      </div>
                      <Badge variant="purple">{c.recurrenceInterval || (c.isRecurring ? 'RECURRING' : 'ONE_TIME')}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">ASSIGNMENTS ({assignments.length})</h3>
            <div className="space-y-3">
              {assignments.length === 0 ? <EmptyState icon="📋" title="No assignments" /> :
                assignments.map((a) => (
                  <div key={a.id} className="glass-light rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">{a.chore?.title}</p>
                      <p className="text-xs text-slate-500">Assigned to {a.user?.name}</p>
                      {a.dueDate && <p className="text-xs text-amber-400">Due {new Date(a.dueDate).toLocaleDateString()}</p>}
                    </div>
                    {a.status !== 'COMPLETED' && (
                      <button onClick={() => completeMutation.mutate(a.id)} className="btn-primary text-xs py-1.5 px-3">
                        ✓ Done
                      </button>
                    )}
                    {a.status === 'COMPLETED' && <Badge variant="success">Done</Badge>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Chore">
        <form
          onSubmit={handleSubmit((d) => {
            // Map this form's fields onto the shape the backend validator
            // expects (POST /api/circles/:circleId/chores): isRecurring is a
            // boolean, and recurrenceInterval is only sent when recurring.
            const isRecurring = d.recurrence !== 'ONE_TIME';
            createMutation.mutate({
              title: d.title,
              description: d.description,
              isRecurring,
              ...(isRecurring ? { recurrenceInterval: d.recurrence } : {}),
            });
          })}
          className="space-y-4"
        >
          <Input label="Title" placeholder="Clean bathroom" {...register('title', { required: true })} />
          <Input label="Description" placeholder="Optional description" {...register('description')} />
          <Select label="Recurrence"
            options={[{ value: 'ONE_TIME', label: 'One Time' }, { value: 'DAILY', label: 'Daily' }, { value: 'WEEKLY', label: 'Weekly' }, { value: 'MONTHLY', label: 'Monthly' }]}
            {...register('recurrence')} />
          <Input label="Points" type="number" defaultValue={1} {...register('points', { valueAsNumber: true })} />
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
