import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { SelectField } from '../components/ui/SelectField';
import { circlesAPI, ocrAPI } from '../services/api';
import { IconCheck, IconImage, IconScan, IconUpload } from '../components/icons';

const splitTabs = [
  { value: 'EQUAL', label: 'Equal' },
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'CUSTOM', label: 'Custom' },
];

const emptyForm = {
  circleId: '',
  description: '',
  amount: '',
  expenseDate: new Date().toISOString().split('T')[0],
  paidById: '',
  splitMethod: 'EQUAL',
  participants: [],
  category: 'General',
  receiptUrl: '',
  merchant: '',
};

function DropZone({ onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <button
      type="button"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`w-full rounded-xl3 border-2 border-dashed p-10 text-center transition-all duration-200 ${
        dragging ? 'border-primary-500 bg-primary-500/5' : 'border-border-strong bg-surface-2 hover:border-primary-500/50 hover:bg-surface-hover'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*" capture="environment"
        className="hidden"
        onChange={(event) => event.target.files?.[0] && onFile(event.target.files[0])}
      />
      <motion.span
        animate={dragging ? { scale: 1.08 } : { scale: 1 }}
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600"
      >
        <IconUpload size={22} />
      </motion.span>
      <p className="font-medium text-ink">Drop a receipt image here</p>
      <p className="mt-1 text-sm text-muted">or click to browse JPEG, PNG, WEBP, or GIF files.</p>
    </button>
  );
}

function DraftResult({ draft }) {
  const currency = draft.currency || 'INR';
  const symbol = currency === 'INR' ? 'Rs' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
  const money = (value) => (value || value === 0 ? `${symbol} ${Number(value).toFixed(2)}` : 'Not detected');

  const fields = [
    { label: 'Merchant', value: draft.merchant || 'Not detected' },
    { label: 'Total amount', value: money(draft.amount ?? draft.totalAmount) },
    { label: 'Subtotal', value: money(draft.subtotal) },
    { label: 'Tax / GST', value: money(draft.tax) },
    { label: 'Date', value: draft.date || 'Not detected' },
    { label: 'Confidence', value: `${Math.round((draft.confidence || 0) * 100)}%` },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <Card className="overflow-hidden p-0">
        {draft.imageUrl && <img src={draft.imageUrl} alt="Receipt" className="h-56 w-full object-contain bg-surface-2" />}
        <div className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink">
            <IconCheck size={16} className="text-success-600" /> Extracted draft
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label} className="rounded-2xl border border-border bg-surface-2 p-3">
                <p className="text-xs text-faint">{field.label}</p>
                <p className="mt-1 font-numeric font-semibold text-ink">{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {draft.items?.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <p className="mb-3 text-sm font-medium text-ink">Detected items ({draft.items.length})</p>
          <ul className="space-y-1.5 text-sm text-muted">
            {draft.items.map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-3">
                <span className="truncate">{item.name}{item.quantity ? ` × ${item.quantity}` : ''}</span>
                <span className="font-numeric text-ink">{symbol} {Number(item.total).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {draft.warnings?.length > 0 && (
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
          <p className="font-medium">We noticed a few OCR issues.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {draft.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {draft.rawText && (
        <details className="rounded-2xl border border-border bg-surface-2">
          <summary className="cursor-pointer p-4 text-sm text-ink">View raw OCR text</summary>
          <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap p-4 pt-0 text-xs text-muted">{draft.rawText}</pre>
        </details>
      )}
    </motion.section>
  );
}

function ReviewModal({ draft, form, setForm, members, circles, onSubmit, onCancel, isPending }) {
  const toggleParticipant = (userId) => {
    setForm((current) => ({
      ...current,
      participants: current.participants.includes(userId)
        ? current.participants.filter((id) => id !== userId)
        : [...current.participants, userId],
    }));
  };

  return (
    <Modal isOpen={Boolean(draft)} onClose={onCancel} title="Review OCR draft" subtitle="Confirm the details and turn it into an expense." size="xl">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Description</label>
                <input className="input" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Groceries, dinner, rent" required />
              </div>
              <div>
                <label className="label">Category</label>
                <input className="input" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Food, transport, utilities" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Amount</label>
                <input className="input font-numeric" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} required />
              </div>
              <div>
                <label className="label">Date</label>
                <input className="input" type="date" value={form.expenseDate} onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Circle</label>
                <SelectField value={form.circleId} onChange={(event) => setForm((current) => ({ ...current, circleId: event.target.value, participants: [] }))}>
                  <option value="">Select a circle</option>
                  {circles.map((circle) => (
                    <option key={circle.id} value={circle.id}>{circle.name}</option>
                  ))}
                </SelectField>
              </div>
              <div>
                <label className="label">Paid by</label>
                <SelectField value={form.paidById} onChange={(event) => setForm((current) => ({ ...current, paidById: event.target.value }))}>
                  <option value="">Select payer</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </SelectField>
              </div>
            </div>
            <div>
              <label className="label">Split method</label>
              <div className="grid grid-cols-3 gap-2">
                {splitTabs.map((tab) => (
                  <button key={tab.value} type="button" onClick={() => setForm((current) => ({ ...current, splitMethod: tab.value }))} className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${form.splitMethod === tab.value ? 'border-primary-500/40 bg-primary-500/10 text-primary-600' : 'border-border bg-surface-2 text-muted hover:bg-surface-hover'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {draft?.imageUrl && (
              <div className="overflow-hidden rounded-2xl border border-border bg-surface-2">
                <img src={draft.imageUrl} alt="Receipt preview" className="h-56 w-full object-contain bg-surface-2" />
              </div>
            )}
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <p className="text-sm font-semibold text-ink">Receipt details</p>
              <div className="mt-3 space-y-2 text-sm text-muted">
                <div className="flex items-center justify-between gap-3">
                  <span>Merchant</span>
                  <span className="font-medium text-ink">{draft?.merchant || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Confidence</span>
                  <span className="font-medium text-ink">{Math.round((draft?.confidence || 0) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Warnings</span>
                  <span className="font-medium text-ink">{draft?.warnings?.length || 0}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-4">
              <p className="mb-3 text-sm font-semibold text-ink">Participants</p>
              <div className="space-y-2">
                {members.map((member) => (
                  <label key={member.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
                    <span>{member.name}</span>
                    <input type="checkbox" checked={form.participants.includes(member.id)} onChange={() => toggleParticipant(member.id)} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={isPending} disabled={!form.circleId || !form.paidById || form.participants.length === 0}>Create expense</Button>
        </div>
      </form>
    </Modal>
  );
}

export function OCRUploadPage() {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: circlesData } = useQuery({ queryKey: ['circles'], queryFn: circlesAPI.list });
  const circles = circlesData?.data?.data?.circles || [];

  const { data: membersData } = useQuery({
    queryKey: ['members', form.circleId],
    queryFn: () => circlesAPI.listMembers(form.circleId),
    enabled: Boolean(form.circleId),
  });
  const members = useMemo(() => membersData?.data?.data?.members || [], [membersData]);

  useEffect(() => {
    if (circles.length && !form.circleId) {
      setForm((current) => ({ ...current, circleId: circles[0].id }));
    }
  }, [circles, form.circleId]);

  useEffect(() => {
    if (!form.circleId || members.length === 0) return;
    const hasSelected = form.participants.some((memberId) => members.some((member) => member.id === memberId));
    if (!hasSelected && form.participants.length === 0) {
      setForm((current) => ({ ...current, participants: members.map((member) => member.id) }));
    }
  }, [members, form.circleId, form.participants]);

  const handleFile = (selectedFile) => {
    setFile(selectedFile);
    setDraft(null);
    setIsReviewOpen(false);
    const reader = new FileReader();
    reader.onload = (event) => setPreview(event.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const { mutate: scanReceipt, isPending: isScanning } = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('receipt', file);
      return ocrAPI.scanReceipt(formData);
    },
    onSuccess: ({ data }) => {
      const nextDraft = {
        ...data.data.draft,
        rawText: data.data.rawText,
        warnings: data.data.warnings || [],
      };
      setDraft(nextDraft);
      setIsReviewOpen(true);
      setForm((current) => ({
        ...current,
        description: nextDraft.description || nextDraft.merchant || current.description || 'Receipt expense',
        amount: nextDraft.amount || nextDraft.totalAmount || current.amount || '',
        expenseDate: nextDraft.expenseDate || nextDraft.date || current.expenseDate,
        category: nextDraft.category || current.category || 'General',
        receiptUrl: nextDraft.imageUrl || nextDraft.receiptUrl || current.receiptUrl,
        merchant: nextDraft.merchant || current.merchant || '',
        circleId: current.circleId || circles[0]?.id || '',
        paidById: current.paidById || members[0]?.id || '',
      }));
      toast.success('Receipt scanned. Review and create the expense.');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Scan failed'),
  });

  const { mutate: createExpense, isPending: isCreating } = useMutation({
    mutationFn: () => {
      const selectedMembers = form.participants.filter((memberId) => members.some((member) => member.id === memberId));
      const participants = selectedMembers.map((memberId) => {
        if (form.splitMethod === 'PERCENTAGE') return { userId: memberId, sharePercentage: 100 / selectedMembers.length };
        if (form.splitMethod === 'CUSTOM') return { userId: memberId, shareAmount: Number(form.amount) / selectedMembers.length };
        return { userId: memberId };
      });

      return ocrAPI.createExpense({
        circleId: form.circleId,
        description: form.description,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        paidById: form.paidById || undefined,
        splitMethod: form.splitMethod,
        participants,
        receiptUrl: form.receiptUrl,
        merchant: form.merchant,
        category: form.category,
        draft: {
          ...draft,
          merchant: form.merchant || draft?.merchant,
          amount: Number(form.amount),
          description: form.description,
          expenseDate: form.expenseDate,
          category: form.category,
          receiptUrl: form.receiptUrl,
          imageUrl: form.receiptUrl,
          warnings: draft?.warnings || [],
          rawText: draft?.rawText,
          confidence: draft?.confidence,
          publicId: draft?.publicId,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', form.circleId] });
      queryClient.invalidateQueries({ queryKey: ['circles'] });
      queryClient.invalidateQueries({ queryKey: ['balances', form.circleId] });
      toast.success('Expense saved and balances updated');
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not create expense'),
  });

  const reset = () => {
    setFile(null);
    setPreview(null);
    setDraft(null);
    setForm(emptyForm);
    setIsReviewOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    createExpense();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="section-title">Capture a receipt</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">OCR receipt upload</h2>
        <p className="section-subtitle">Upload a receipt, review the extracted draft, and save it as a full expense in one flow.</p>
      </div>

      {!file ? (
        <DropZone onFile={handleFile} />
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden p-0">
            <img src={preview} alt="Preview" className="h-64 w-full object-contain bg-surface-2" />
            <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-muted">
                  <IconImage size={16} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{file.name}</p>
                  <p className="text-xs text-faint">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={reset}>Change</Button>
                <Button onClick={() => scanReceipt()} loading={isScanning}>
                  <IconScan size={16} /> {isScanning ? 'Scanning…' : 'Scan receipt'}
                </Button>
              </div>
            </div>
          </Card>

          {draft && <DraftResult draft={draft} />}
        </div>
      )}

      <AnimatePresence>{draft && isReviewOpen && <ReviewModal draft={draft} form={form} setForm={setForm} members={members} circles={circles} onSubmit={handleSubmit} onCancel={() => setIsReviewOpen(false)} isPending={isCreating} />}</AnimatePresence>

      <p className="rounded-2xl border border-border bg-surface-2 p-4 text-center text-xs text-muted">
        OCR reduces the effort and pre-fills the form. You only need to confirm the circle, payer, and split type before saving.
      </p>
    </div>
  );
}
