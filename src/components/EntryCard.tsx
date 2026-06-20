import { Car, Zap, Leaf, Trash2, Droplets, Heart, Edit3 } from 'lucide-react';
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

interface EntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

export default function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const cat = CATEGORIES.find((c) => c.value === entry.category);
  const Icon = ICONS[entry.category];
  const moodInfo = entry.mood ? MOODS.find((m) => m.value === entry.mood) : null;
  const date = new Date(entry.created_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="group bg-[#FDF6E3]/85 backdrop-blur-sm rounded-2xl border border-parchment-300/40 shadow-sm hover:shadow-md transition-all duration-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${CATEGORY_STYLES[entry.category]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif font-semibold text-[#3D2518] truncate">{entry.title}</h3>
            <p className="text-xs font-serif text-[#7A6248] mt-0.5">{dateStr} at {timeStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onEdit(entry); }} aria-label={`Edit "${entry.title}"`} className="p-1.5 rounded-lg hover:bg-parchment-200 transition text-[#7A6248] hover:text-sage-700">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }} aria-label={`Delete "${entry.title}"`} className="p-1.5 rounded-lg hover:bg-red-50 transition text-[#7A6248] hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {entry.content && (
        <p className="mt-3 text-sm font-serif text-[#5C3D2E] leading-relaxed line-clamp-3">{entry.content}</p>
      )}

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-serif font-medium ${CATEGORY_STYLES[entry.category]}`}>
          {cat?.label ?? entry.category}
        </span>
        {entry.carbon_value > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-serif font-medium bg-sage-100/60 text-sage-800">
            {entry.carbon_value} kg CO2
          </span>
        )}
        {moodInfo && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-serif font-medium bg-amber-50/60 text-amber-800">
            {moodInfo.emoji} {moodInfo.label}
          </span>
        )}
      </div>
    </div>
  );
}
