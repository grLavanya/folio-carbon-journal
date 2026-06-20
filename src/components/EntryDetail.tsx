import { X, Car, Zap, Leaf, Trash2, Droplets, Heart } from 'lucide-react';
import type { Category, JournalEntry } from '../lib/types';
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
  transport: 'bg-sky-100/70 text-sky-800',
  energy: 'bg-amber-100/70 text-amber-800',
  food: 'bg-emerald-100/70 text-emerald-800',
  waste: 'bg-orange-100/70 text-orange-800',
  water: 'bg-cyan-100/70 text-cyan-800',
  lifestyle: 'bg-rose-100/70 text-rose-800',
};

interface EntryDetailProps {
  entry: JournalEntry;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

export default function EntryDetail({ entry, onClose, onEdit, onDelete }: EntryDetailProps) {
  const cat = CATEGORIES.find((c) => c.value === entry.category);
  const Icon = ICONS[entry.category];
  const moodInfo = entry.mood ? MOODS.find((m) => m.value === entry.mood) : null;
  const date = new Date(entry.created_at);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[#FDF6E3]/97 backdrop-blur-md rounded-2xl shadow-[0_8px_40px_rgba(60,45,20,0.22)] border border-parchment-300/60 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#FDF6E3]/97 backdrop-blur-md rounded-t-2xl border-b border-parchment-300/40 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${CATEGORY_STYLES[entry.category]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-[#3D2518]">{entry.title}</h2>
              <p className="text-xs font-serif text-[#7A6248]">{dateStr} at {timeStr}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close details" className="p-1.5 rounded-lg hover:bg-parchment-200 transition text-[#7A6248]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {entry.content && (
            <p className="font-serif text-[#5C3D2E] leading-relaxed whitespace-pre-wrap">{entry.content}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-serif font-medium ${CATEGORY_STYLES[entry.category]}`}>
              {cat?.label ?? entry.category}
            </span>
            {entry.carbon_value > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-serif font-medium bg-sage-100/60 text-sage-800">
                {entry.carbon_value} kg CO2
              </span>
            )}
            {moodInfo && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-serif font-medium bg-amber-50/60 text-amber-800">
                {moodInfo.emoji} {moodInfo.label}
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onEdit(entry)}
              className="flex-1 py-2 rounded-lg bg-sage-50 hover:bg-sage-100 text-sage-800 font-serif font-medium text-sm transition"
            >
              Edit Entry
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="flex-1 py-2 rounded-lg bg-red-50/80 hover:bg-red-100 text-red-700 font-serif font-medium text-sm transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
