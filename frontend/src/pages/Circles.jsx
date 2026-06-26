import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { circlesAPI } from '../services/api';
import { Loader } from '../components/ui/Loader';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/forms/FormField';

function CircleCard({ circle, onAddMember }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass rounded-2xl p-5 border border-transparent hover:border-indigo-500/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
          {circle.name?.[0]?.toUpperCase()}
        </div>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
          {circle.memberCount || 0} members
        </span>
      </div>
      <h3 className="font-semibold text-slate-100 mb-1">{circle.name}</h3>
      {circle.description && <p className="text-sm text-slate-400 mb-3">{circle.description}</p>}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700/50">
        <span>{circle.expenseCount || 0} expenses</span>
        <button onClick={() => onAddMember(circle)} className="text-indigo-400 hover:text-indigo-300">+ Member</button>
      </div>
    </motion.div>
  );
}

export function CirclesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [addMemberCircle, setAddMemberCircle] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = data?.data?.data?.circles || [];

  const createForm = useForm();
  const memberForm = useForm();

  const createMutation = useMutation({
    mutationFn: circlesAPI.create,
    onSuccess: () => { qc.invalidateQueries(['circles']); toast.success('Circle created!'); setShowCreate(false); createForm.reset(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create circle'),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ id, data }) => circlesAPI.addMember(id, data),
    onSuccess: () => { qc.invalidateQueries(['circles']); toast.success('Member added!'); setAddMemberCircle(null); memberForm.reset(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add member'),
  });

  if (isLoading) return <Loader text="Loading circles..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Your Circles</h2>
          <p className="text-slate-400 text-sm">{circles.length} circles</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Circle</button>
      </div>

      {circles.length === 0 ? (
        <EmptyState icon="◎" title="No circles yet" description="Create a circle to start splitting expenses with friends"
          action={<button className="btn-primary" onClick={() => setShowCreate(true)}>Create Circle</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {circles.map((c) => <CircleCard key={c.id} circle={c} onAddMember={setAddMemberCircle} />)}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Circle">
        <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <Input label="Circle Name" placeholder="Apartment 4B" {...createForm.register('name', { required: true })} />
          <Input label="Description (optional)" placeholder="Monthly shared expenses" {...createForm.register('description')} />
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={!!addMemberCircle} onClose={() => setAddMemberCircle(null)} title={`Add Member to ${addMemberCircle?.name}`}>
        <form onSubmit={memberForm.handleSubmit((d) => addMemberMutation.mutate({ id: addMemberCircle.id, data: d }))} className="space-y-4">
          <Input label="User Email" type="email" placeholder="friend@example.com" {...memberForm.register('email', { required: true })} />
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={() => setAddMemberCircle(null)}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={addMemberMutation.isPending}>
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
