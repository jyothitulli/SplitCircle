import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { circlesAPI, choresAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/forms/FormField';
import { Badge } from '../components/ui/Badge';
import { PageHeader, SectionHeader } from '../components/ui/SectionHeader';
import { SelectField } from '../components/ui/SelectField';
import { SkeletonList } from '../components/ui/Skeleton';
import { Stagger, StaggerItem } from '../components/motion';
import { IconCheck, IconChore, IconClock, IconPlus } from '../components/icons';

export function ChoresPage() {
  const qc = useQueryClient();
  const [selectedCircle, setSelectedCircle] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data: circlesData, isLoading: circlesLoading } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chores', circleId] });
      toast.success('Chore created');
      setShowCreate(false);
      reset();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create chore'),
  });

  const completeMutation = useMutation({
    mutationFn: choresAPI.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chore-assignments', circleId] });
      toast.success('Chore completed 🎉');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to complete chore'),
  });

  if (circlesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 skeleton" />
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chores"
        description="Assign shared tasks and keep track of who is on point."
        action={
          <div className="flex gap-3">
            <SelectField value={selectedCircle} onChange={(e) => setSelectedCircle(e.target.value)} className="w-44">
              <option value="">Select circle</option>
              {circles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
            {circleId && (
              <Button onClick={() => setShowCreate(true)}>
                <IconPlus size={16} /> Chore
              </Button>
            )}
          </div>
        }
      />

      {!circleId ? (
        <EmptyState icon={<IconChore size={20} />} title="Select a circle" description="Choose a circle to view its chores." />
      ) : isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <SectionHeader title={`Chores (${chores.length})`} />
            {chores.length === 0 ? (
              <EmptyState
                icon={<IconChore size={20} />}
                title="No chores"
                description="Create chores for your circle"
                action={
                  <Button size="sm" onClick={() => setShowCreate(true)}>
                    Add chore
                  </Button>
                }
              />
            ) : (
              <Stagger className="space-y-3">
                {chores.map((c) => (
                  <StaggerItem key={c.id}>
                    <Card className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{c.title}</p>
                          {c.description && <p className="truncate text-xs text-faint">{c.description}</p>}
                        </div>
                        <Badge variant="copper">{c.recurrenceInterval || (c.isRecurring ? 'RECURRING' : 'ONE_TIME')}</Badge>
                      </div>
                    </Card>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </div>

          <div>
            <SectionHeader title={`Assignments (${assignments.length})`} />
            {assignments.length === 0 ? (
              <EmptyState icon={<IconClock size={20} />} title="No assignments" description="Assignments will show up here." />
            ) : (
              <Stagger className="space-y-3">
                {assignments.map((a) => (
                  <StaggerItem key={a.id}>
                    <Card className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{a.chore?.title}</p>
                        <p className="truncate text-xs text-faint">Assigned to {a.user?.name}</p>
                        {a.dueDate && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-warning-500">
                            <IconClock size={12} /> Due {new Date(a.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {a.status !== 'COMPLETED' ? (
                        <Button size="sm" onClick={() => completeMutation.mutate(a.id)} loading={completeMutation.isPending}>
                          <IconCheck size={14} /> Done
                        </Button>
                      ) : (
                        <Badge variant="success" icon={<IconCheck size={11} />}>
                          Done
                        </Badge>
                      )}
                    </Card>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create chore" subtitle="Add a task members can be assigned.">
        <form
          onSubmit={handleSubmit((d) => {
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
          <Select
            label="Recurrence"
            options={[
              { value: 'ONE_TIME', label: 'One time' },
              { value: 'DAILY', label: 'Daily' },
              { value: 'WEEKLY', label: 'Weekly' },
              { value: 'MONTHLY', label: 'Monthly' },
            ]}
            {...register('recurrence')}
          />
          <Input label="Points" type="number" defaultValue={1} {...register('points', { valueAsNumber: true })} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
