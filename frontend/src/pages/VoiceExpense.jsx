import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { voiceAPI } from '../services/api';

// The Web Speech API is only available in some browsers (Chrome/Edge use the
// vendor-prefixed constructor; Firefox/Safari currently don't support it at
// all). We feature-detect rather than assume — when unsupported, the page
// still works fully via the manual transcript textarea below.
const SpeechRecognitionImpl =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

function DraftResult({ draft }) {
  const fields = [
    { label: 'Amount', value: draft.amount ? `${draft.currency || 'INR'} ${Number(draft.amount).toFixed(2)}` : '—', icon: '💰' },
    { label: 'Category', value: draft.category || '—', icon: '🏷️' },
    { label: 'Date', value: draft.date || 'Today', icon: '📅' },
    { label: 'Confidence', value: draft.confidence != null ? `${Math.round(draft.confidence * 100)}%` : '—', icon: '🎯' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-slate-200 mb-1">📄 Extracted Draft</h3>
        <p className="text-sm text-slate-400 mb-4">{draft.description}</p>
        <div className="grid grid-cols-2 gap-4">
          {fields.map(({ label, value, icon }) => (
            <div key={label} className="glass-light rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">{icon} {label}</p>
              <p className="font-semibold text-slate-200">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function VoiceExpensePage() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [draft, setDraft] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const recognitionRef = useRef(null);

  const { mutate, isPending } = useMutation({
    mutationFn: (text) => voiceAPI.logExpense(text),
    onSuccess: ({ data }) => {
      // POST /api/voice/expense -> { data: { draft: {...}, warnings: [...] } }
      setDraft(data.data.draft);
      setWarnings(data.data.warnings || []);
      toast.success('Transcript processed!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not process transcript'),
  });

  const startListening = useCallback(() => {
    if (!SpeechRecognitionImpl) {
      toast.error('Voice capture is not supported in this browser. Type your expense below instead.');
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || '';
      setTranscript((prev) => (prev ? `${prev} ${text}` : text));
    };
    recognition.onerror = () => {
      toast.error('Could not capture audio. Please try again or type it manually.');
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleSubmit = () => {
    const trimmed = transcript.trim();
    if (!trimmed) {
      toast.error('Say or type an expense first, e.g. "I paid 420 rupees for groceries yesterday"');
      return;
    }
    setDraft(null);
    mutate(trimmed);
  };

  const reset = () => { setTranscript(''); setDraft(null); setWarnings([]); };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Voice Expense Entry</h2>
        <p className="text-slate-400 text-sm">Speak or type an expense and let AI extract the details</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-center">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all ${
              isListening
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 animate-pulse'
                : 'bg-indigo-500/20 text-indigo-400 border-2 border-indigo-500/30 hover:border-indigo-500/60'
            }`}
            type="button"
          >
            {isListening ? '⏹️' : '🎤'}
          </button>
        </div>
        <p className="text-center text-sm text-slate-500">
          {isListening ? 'Listening... tap to stop' : 'Tap to speak, or type below'}
        </p>
        {!SpeechRecognitionImpl && (
          <p className="text-center text-xs text-amber-400">
            Voice capture isn&apos;t supported in this browser — type your expense instead.
          </p>
        )}

        <textarea
          className="input resize-none"
          rows={3}
          placeholder='e.g. "I paid 420 rupees for groceries yesterday"'
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />

        <div className="flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={reset}>Clear</button>
          <button type="button" className="btn-primary flex-1" onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : '✨ Extract Expense'}
          </button>
        </div>
      </div>

      {draft && <DraftResult draft={draft} />}

      {warnings.length > 0 && (
        <div className="glass rounded-xl p-4 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-400">⚠️ {w}</p>
          ))}
        </div>
      )}

      <div className="glass rounded-xl p-4">
        <p className="text-xs text-slate-500 text-center">
          💡 This returns a draft only — no expense is created automatically. Review the extracted data and add it manually on the Expenses page.
        </p>
      </div>
    </div>
  );
}
