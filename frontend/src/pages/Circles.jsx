import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Input, Textarea } from '../components/forms/FormField';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/SectionHeader';
import { SkeletonStatGrid } from '../components/ui/Skeleton';
import { Stagger, StaggerItem } from '../components/motion';
import { circlesAPI } from '../services/api';
import { IconCircles, IconPlus, IconUsers } from '../components/icons';

function CircleCard({ circle, onAddMember }) {
  return (
    <Card hover className="flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-lg font-bold text-white shadow-[0_14px_30px_-14px_rgb(var(--primary-500)/0.6)]">
          {circle.name?.[0]?.toUpperCase()}
        </div>
        <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
          {circle.myRole}
        </span>
      </div>
      <h3 className="font-semibold text-ink">{circle.name}</h3>
      <p className="mt-1 min-h-10 text-sm leading-6 text-muted">{circle.description || 'Shared expenses and balances.'}</p>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-muted">
        <span>
          {circle.memberCount || 0} members · {circle.expenseCount || 0} expenses
        </span>
        <button type="button" onClick={() => onAddMember(circle)} className="font-medium text-primary-600 hover:text-primary-700">
          Add member
        </button>
      </div>
    </Card>
  );
}

export function CirclesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [addMemberCircle, setAddMemberCircle] = useState(null);
  const { data, isLoading } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = data?.data?.data?.circles || [];
  const createForm = useForm();
  const memberForm = useForm();

  const createMutation = useMutation({
    mutationFn: circlesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      toast.success('Circle created');
      setShowCreate(false);
      createForm.reset();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create circle'),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ id, payload }) => circlesAPI.addMember(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      toast.success('Member added');
      setAddMemberCircle(null);
      memberForm.reset();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to add member'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 skeleton" />
        <SkeletonStatGrid count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Circles"
        description="Create groups, invite members, and scope every shared expense."
        action={
          <Button onClick={() => setShowCreate(true)}>
            <IconPlus size={16} /> New circle
          </Button>
        }
      />

      {circles.length === 0 ? (
        <EmptyState
          icon={<IconCircles size={20} />}
          title="No circles yet"
          description="Create your first circle to invite members and start splitting expenses."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <IconPlus size={16} /> Create circle
            </Button>
          }
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {circles.map((circle) => (
            <StaggerItem key={circle.id}>
              <CircleCard circle={circle} onAddMember={setAddMemberCircle} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create circle" subtitle="Set up a new shared space.">
        <form onSubmit={createForm.handleSubmit((payload) => createMutation.mutate(payload))} className="space-y-4">
          <Input label="Circle name" placeholder="Apartment 4B" {...createForm.register('name', { required: true })} />
          <Textarea label="Description" placeholder="Monthly shared expenses" {...createForm.register('description')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(addMemberCircle)}
        onClose={() => setAddMemberCircle(null)}
        title="Add member"
        subtitle={addMemberCircle ? `Invite someone to ${addMemberCircle.name}` : undefined}
      >
        <form
          onSubmit={memberForm.handleSubmit((payload) => addMemberMutation.mutate({ id: addMemberCircle.id, payload }))}
          className="space-y-4"
        >
          <Input
            label="User email"
            type="email"
            icon={<IconUsers size={17} />}
            placeholder="friend@example.com"
            {...memberForm.register('email', { required: true })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setAddMemberCircle(null)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={addMemberMutation.isPending}>
              {addMemberMutation.isPending ? 'Adding…' : 'Add member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
