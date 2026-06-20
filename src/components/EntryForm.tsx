import { useState } from 'react';
import { X, Car, Zap, Leaf, Trash2, Droplets, Heart } from 'lucide-react';
import type { Category, Mood, JournalEntryInsert } from '../lib/types';
import { CATEGORIES, MOODS } from '../lib/types';

const ICONS: Record<Category, React.ElementType> = {
  transport: Car,
  energy: Zap,
  food: Leaf,
  waste: Trash2,
  water: Droplets,
  lifestyle: Heart,
};

const CATEGORY_STYLES: Record<Category, string> = {
  transport: 'bg-sky-100/80 text-sky-800 border-sky-200',
  energy: 'bg-amber-100/80 text-amber-800 border-amber-200',
  food: 'bg-emerald-100/80 text-emerald-800 border-emerald-200',
  waste: 'bg-orange-100/80 text-orange-800 border-orange-200',
  water: 'bg-cyan-100/80 text-cyan-800 border-cyan-200',
  lifestyle: 'bg-rose-100/80 text-rose-800 border-rose-200',
};

interface EntryFormProps {
  onSubmit: (entry: JournalEntryInsert) => Promise<void>;
  onClose: () => void;
  initial?: JournalEntryInsert;
}

export default function EntryForm({ onSubmit, onClose, initial }: EntryFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'transport');
  const [mood, setMood] = useState<Mood | null>(initial?.mood ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        content,
        category,
        carbon_value: initial?.carbon_value ?? 0,
        mood,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[#FDF6E3]/97 backdrop-blur-md rounded-2xl shadow-[0_8px_40px_rgba(60,45,20,0.22)] border border-parchment-300/60 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#FDF6E3]/97 backdrop-blur-md rounded-t-2xl border-b border-parchment-300/40 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-serif font-semibold text-[#3D2518]">
            {initial ? 'Edit Entry' : 'New Entry'}
          </h2>
          <button onClick={onClose} aria-label="Close form" className="p-1.5 rounded-lg hover:bg-parchment-200 transition text-[#7A6248]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50/80 border border-red-200 text-red-800 text-sm font-serif">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-serif font-medium text-[#5C3D2E] mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = ICONS[cat.value];
                const active = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-serif font-medium transition border ${active
                      ? `${CATEGORY_STYLES[cat.value]} ring-1 ring-sage-400/40 shadow-sm`
                      : 'border-parchment-300/60 bg-parchment-50 text-[#5C3D2E] hover:bg-parchment-200/60'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-serif font-medium text-[#5C3D2E] mb-1">Title</label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-parchment-300 bg-parchment-50 focus:outline-none focus:ring-2 focus:ring-sage-400/40 focus:border-sage-400 text-parchment-900 placeholder-[#A0856C] transition font-serif"
              placeholder="What did you do today?"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-serif font-medium text-[#5C3D2E] mb-1">Details</label>
            <textarea
              id="content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-parchment-300 bg-parchment-50 focus:outline-none focus:ring-2 focus:ring-sage-400/40 focus:border-sage-400 text-parchment-900 placeholder-[#A0856C] transition resize-none font-serif leading-relaxed"
              placeholder="Describe your activity and its impact..."
            />
          </div>

          <div>
            <label className="block text-sm font-serif font-medium text-[#5C3D2E] mb-2">How do you feel?</label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition border font-serif ${mood === m.value
                    ? 'border-sage-400 bg-sage-50 text-sage-800 ring-1 ring-sage-400/30'
                    : 'border-parchment-300/60 bg-parchment-50 text-[#5C3D2E] hover:bg-parchment-200/60'
                    }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-sage-500 hover:bg-sage-600 active:bg-sage-700 text-parchment-50 font-serif font-medium transition disabled:opacity-50"
          >
            {submitting ? 'Saving...' : initial ? 'Update Entry' : 'Create Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}
