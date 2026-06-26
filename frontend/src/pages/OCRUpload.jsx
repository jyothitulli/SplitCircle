import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ocrAPI } from '../services/api';

function DropZone({ onFile }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
        dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
      }`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <div className="text-5xl mb-4">📷</div>
      <p className="text-slate-300 font-medium">Drop receipt image here</p>
      <p className="text-slate-500 text-sm mt-1">or click to browse • JPEG, PNG, WEBP, GIF • Max 5MB</p>
    </div>
  );
}

function DraftResult({ draft }) {
  const fields = [
    { label: 'Merchant', value: draft.merchant || '—', icon: '🏪' },
    { label: 'Total Amount', value: draft.totalAmount ? `₹${draft.totalAmount.toFixed(2)}` : '—', icon: '💰' },
    { label: 'Date', value: draft.date || '—', icon: '📅' },
    { label: 'Confidence', value: `${Math.round(draft.confidence * 100)}%`, icon: '🎯' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass rounded-2xl overflow-hidden">
        {draft.imageUrl && (
          <img src={draft.imageUrl} alt="Receipt" className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          <h3 className="font-semibold text-slate-200 mb-4">📄 Extracted Data</h3>
          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ label, value, icon }) => (
              <div key={label} className="glass-light rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{icon} {label}</p>
                <p className="font-semibold text-slate-200">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {draft.rawText && (
        <details className="glass rounded-xl">
          <summary className="p-4 cursor-pointer text-sm text-slate-400 hover:text-slate-200">View raw OCR text</summary>
          <pre className="p-4 pt-0 text-xs text-slate-400 whitespace-pre-wrap max-h-48 overflow-y-auto">{draft.rawText}</pre>
        </details>
      )}
    </motion.div>
  );
}

export function OCRUploadPage() {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [draft, setDraft] = useState(null);

  const handleFile = (f) => {
    setFile(f);
    setDraft(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('receipt', file);
      return ocrAPI.scanReceipt(fd);
    },
    onSuccess: ({ data }) => {
      // POST /api/ocr/receipt -> { data: { draft: {...}, rawText, warnings } }
      setDraft({ ...data.data.draft, rawText: data.data.rawText });
      toast.success('Receipt scanned!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Scan failed'),
  });

  const reset = () => { setFile(null); setPreview(null); setDraft(null); };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">OCR Receipt Upload</h2>
        <p className="text-slate-400 text-sm">Upload a receipt image to extract expense data automatically</p>
      </div>

      {!file ? (
        <DropZone onFile={handleFile} />
      ) : (
        <div className="space-y-4">
          <div className="glass rounded-2xl overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-56 object-contain bg-slate-900" />
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary text-sm" onClick={reset}>Change</button>
                <button className="btn-primary text-sm" onClick={() => mutate()} disabled={isPending}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Scanning...
                    </span>
                  ) : '🔍 Scan Receipt'}
                </button>
              </div>
            </div>
          </div>

          {draft && <DraftResult draft={draft} />}
        </div>
      )}

      <div className="glass rounded-xl p-4">
        <p className="text-xs text-slate-500 text-center">
          💡 This returns a draft only — no expense is created automatically. Review the extracted data and add manually.
        </p>
      </div>
    </div>
  );
}
