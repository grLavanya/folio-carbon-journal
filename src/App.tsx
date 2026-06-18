import { useState, useEffect, useCallback, useRef } from 'react';
import { Leaf, Plus, LogOut, BookOpen, X } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/auth';
import { fetchEntries, createEntry, updateEntry, deleteEntry } from './lib/entries';
import type { JournalEntry, JournalEntryInsert } from './lib/types';
import { analyzeEntry } from './lib/gemini';
import { initWorldHealth, applyImpact, saveWorldHealth, recalculateFromEntries } from './lib/worldHealth';
import type { WorldState } from './lib/worldHealth';
import AuthScreen from './components/AuthScreen';
import EntryForm from './components/EntryForm';
import EntryCard from './components/EntryCard';
import EntryDetail from './components/EntryDetail';

interface FlowerState {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

interface ImpactToast {
  id: number;
  message: string;
  type: 'positive' | 'negative' | 'neutral';
  scoreDelta: number;
  exiting: boolean;
}

function Cloud({ className }: { className: string }) {
  return (
    <g className={className}>
      <ellipse cx="0" cy="0" rx="60" ry="24" fill="white" />
      <ellipse cx="-30" cy="8" rx="40" ry="18" fill="white" />
      <ellipse cx="30" cy="8" rx="45" ry="20" fill="white" />
      <ellipse cx="0" cy="14" rx="50" ry="16" fill="white" />
      <ellipse cx="-15" cy="-10" rx="30" ry="16" fill="white" />
      <ellipse cx="20" cy="-8" rx="35" ry="18" fill="white" />
    </g>
  );
}

function Tree({ x, y, scale = 1, variant = 'round', swayDur, swayDelay, healthScale = 1 }: {
  x: number; y: number; scale?: number; variant?: 'round' | 'pine' | 'wide'; swayDur: string; swayDelay: string; healthScale?: number;
}) {
  const trunkColor = '#8B6F47';
  const leafColors = {
    round: { main: '#5B8C3E', light: '#7AB356', dark: '#3D6B2E' },
    pine: { main: '#4A7A35', light: '#6A9E4F', dark: '#2E5A22' },
    wide: { main: '#6A9E4F', light: '#8CC06A', dark: '#4A7A35' },
  };
  const colors = leafColors[variant];
  const hs = healthScale;

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-1.5 0 40; 1.5 0 40; -1.5 0 40"
          dur={swayDur}
          begin={swayDelay}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
        />
        <rect x="-6" y="-10" width="12" height="50" rx="3" fill={trunkColor} />
        <rect x="-4" y="-10" width="4" height="50" rx="2" fill="#9E8060" opacity="0.5" />

        {variant === 'round' && (
          <>
            <ellipse cx="0" cy="-40" rx={38 * hs} ry={35 * hs} fill={colors.dark} />
            <ellipse cx="-12" cy="-48" rx={28 * hs} ry={26 * hs} fill={colors.main} />
            <ellipse cx="14" cy="-44" rx={26 * hs} ry={24 * hs} fill={colors.main} />
            <ellipse cx="0" cy="-52" rx={22 * hs} ry={20 * hs} fill={colors.light} />
            <ellipse cx="-20" cy="-32" rx={18 * hs} ry={16 * hs} fill={colors.main} />
            <ellipse cx="22" cy="-30" rx={16 * hs} ry={14 * hs} fill={colors.dark} />
          </>
        )}

        {variant === 'pine' && (
          <>
            <polygon points={`0,${-75 * hs} ${-30 * hs},-10 ${30 * hs},-10`} fill={colors.dark} />
            <polygon points={`0,${-65 * hs} ${-25 * hs},-15 ${25 * hs},-15`} fill={colors.main} />
            <polygon points={`0,${-55 * hs} ${-20 * hs},-5 ${20 * hs},-5`} fill={colors.dark} />
            <polygon points={`0,${-45 * hs} ${-28 * hs},0 ${28 * hs},0`} fill={colors.main} />
            <polygon points={`0,${-50 * hs} ${-18 * hs},-20 ${18 * hs},-20`} fill={colors.light} opacity="0.6" />
          </>
        )}

        {variant === 'wide' && (
          <>
            <ellipse cx="0" cy="-30" rx={50 * hs} ry={28 * hs} fill={colors.dark} />
            <ellipse cx="-15" cy="-38" rx={35 * hs} ry={22 * hs} fill={colors.main} />
            <ellipse cx="18" cy="-34" rx={32 * hs} ry={20 * hs} fill={colors.main} />
            <ellipse cx="0" cy="-42" rx={28 * hs} ry={18 * hs} fill={colors.light} />
            <ellipse cx="-28" cy="-22" rx={22 * hs} ry={14 * hs} fill={colors.dark} />
            <ellipse cx="30" cy="-20" rx={20 * hs} ry={12 * hs} fill={colors.dark} />
          </>
        )}
      </g>
    </g>
  );
}

function SmallPlant({ x, y, swayDur, swayDelay }: { x: number; y: number; swayDur: string; swayDelay: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-2 0 0; 2 0 0; -2 0 0"
          dur={swayDur}
          begin={swayDelay}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
        />
        <line x1="0" y1="0" x2="-3" y2="-14" stroke="#5B8C3E" strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1="0" x2="4" y2="-12" stroke="#5B8C3E" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="-5" cy="-16" rx="5" ry="4" fill="#7AB356" />
        <ellipse cx="6" cy="-14" rx="5" ry="3.5" fill="#6A9E4F" />
      </g>
    </g>
  );
}

function BirdGroup() {
  return (
    <g>
      <g className="bird-1">
        <path d="M-8,0 Q-4,-6 0,-2 Q4,-6 8,0" fill="none" stroke="#5A7A6A" strokeWidth="1.5" strokeLinecap="round" transform="translate(0, 180) scale(1.2)" />
      </g>
      <g className="bird-2">
        <path d="M-8,0 Q-4,-6 0,-2 Q4,-6 8,0" fill="none" stroke="#5A7A6A" strokeWidth="1.5" strokeLinecap="round" transform="translate(0, 220) scale(0.9)" />
      </g>
      <g className="bird-3">
        <path d="M-8,0 Q-4,-6 0,-2 Q4,-6 8,0" fill="none" stroke="#6A8A7A" strokeWidth="1.5" strokeLinecap="round" transform="translate(0, 160) scale(1.0)" />
      </g>
    </g>
  );
}

function Flower({ x, y, timestamp }: { x: number; y: number; timestamp: number }) {
  const petalColors = ['#FFB7C5', '#FF9EB5', '#FFC0CB', '#FFA0B4', '#FFD1DC'];
  const centerColor = '#FFE066';
  const delay = `${-((Date.now() - timestamp) / 1000)}s`;

  return (
    <g transform={`translate(${x}, ${y})`} className="flower-bloom">
      <g>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="0;1.05;1"
          dur="1.2s"
          begin={delay}
          fill="freeze"
          calcMode="spline"
          keySplines="0.25 0.1 0.25 1; 0.25 0.1 0.25 1"
        />
        {/* Petals */}
        {petalColors.map((color, i) => {
          const angle = (i * 72) * Math.PI / 180;
          const px = Math.cos(angle) * 5;
          const py = Math.sin(angle) * 5 - 8;
          return <ellipse key={i} cx={px} cy={py} rx="4.5" ry="3" fill={color} transform={`rotate(${i * 72}, 0, -8)`} />;
        })}
        <circle cx="0" cy="-8" r="3" fill={centerColor} />
        <line x1="0" y1="0" x2="0" y2="-5" stroke="#5B8C3E" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Landscape({ healthScore, worldEffect, effectType, flowers }: {
  healthScore: number;
  worldEffect: WorldState['effect'];
  effectType: WorldState['effectType'];
  flowers: FlowerState[];
}) {
  const treeData: { x: number; y: number; scale: number; variant: 'round' | 'pine' | 'wide'; swayDur: string; swayDelay: string }[] = [
    { x: 120, y: 520, scale: 1.1, variant: 'round', swayDur: '6s', swayDelay: '0s' },
    { x: 280, y: 510, scale: 0.8, variant: 'pine', swayDur: '5s', swayDelay: '-1s' },
    { x: 420, y: 500, scale: 1.2, variant: 'wide', swayDur: '7s', swayDelay: '-2.5s' },
    { x: 600, y: 505, scale: 0.9, variant: 'round', swayDur: '5.5s', swayDelay: '-0.5s' },
    { x: 780, y: 495, scale: 1.0, variant: 'pine', swayDur: '6.5s', swayDelay: '-3s' },
    { x: 950, y: 505, scale: 1.1, variant: 'round', swayDur: '5s', swayDelay: '-4s' },
    { x: 1100, y: 510, scale: 0.85, variant: 'wide', swayDur: '7s', swayDelay: '-1.5s' },
    { x: 50, y: 560, scale: 0.6, variant: 'round', swayDur: '6s', swayDelay: '-2s' },
    { x: 1150, y: 555, scale: 0.65, variant: 'pine', swayDur: '5.5s', swayDelay: '-3.5s' },
  ];

  const grassPositions = [
    { x: 50, y: 592, swayDur: '3s', swayDelay: '0s' },
    { x: 55, y: 591, swayDur: '3.5s', swayDelay: '-0.5s' },
    { x: 180, y: 589, swayDur: '2.8s', swayDelay: '-1s' },
    { x: 350, y: 587, swayDur: '3.2s', swayDelay: '-1.5s' },
    { x: 500, y: 585, swayDur: '3s', swayDelay: '-2s' },
    { x: 700, y: 586, swayDur: '2.9s', swayDelay: '-0.3s' },
    { x: 900, y: 587, swayDur: '3.3s', swayDelay: '-1.8s' },
    { x: 1050, y: 588, swayDur: '3.1s', swayDelay: '-0.8s' },
  ];

  const plantData = [
    { x: 200, y: 540, swayDur: '2.8s', swayDelay: '-1s' },
    { x: 350, y: 530, swayDur: '3s', swayDelay: '-2s' },
    { x: 500, y: 535, swayDur: '3s', swayDelay: '0s' },
    { x: 650, y: 525, swayDur: '3.2s', swayDelay: '-1.5s' },
    { x: 850, y: 530, swayDur: '3.3s', swayDelay: '-1.8s' },
    { x: 1050, y: 535, swayDur: '3.5s', swayDelay: '-0.5s' },
  ];

  // Health-driven color calculations: score 0-100, default 50
  // Map to 0-1 with dramatic visual differences at each tier
  const t = healthScore / 100;

  // Sky: grey-brown at low, pleasant blue at mid, vivid bright blue at high
  const skyTop = lerpColor('#6B6B78', '#87CEEB', t);
  const skyMid = lerpColor('#808088', '#B0E0F0', t);
  const skyLow = lerpColor('#959598', '#D0ECF5', t);
  const skyBot = lerpColor('#A8A8A0', '#E8F8F0', t);

  // Tree fullness: sparse at low (0.55), normal at mid (0.85), lush at high (1.2)
  const treeHealthScale = 0.55 + t * 0.65;

  // Water: murky brown-green at low, moderate teal at mid, crystal blue at high
  const waterTop = lerpColor('#6A7A60', '#90D0C8', t);
  const waterMid = lerpColor('#5A6A50', '#70B8AE', t);
  const waterBot = lerpColor('#4A5840', '#50988A', t);

  // Ground: dry yellow-brown at low, natural green at mid, rich vibrant green at high
  const groundTop = lerpColor('#B8A848', '#90CC60', t);
  const groundMid = lerpColor('#A09838', '#78B850', t);
  const groundBot = lerpColor('#888830', '#60A840', t);

  // Determine which elements get a glow effect
  const skyGlow = worldEffect === 'sky';
  const treesGlow = worldEffect === 'trees';
  const waterGlow = worldEffect === 'water';
  const glowClass = effectType === 'positive' ? 'world-glow-positive' : effectType === 'negative' ? 'world-glow-negative' : '';

  return (
    <div className="fixed inset-0 overflow-hidden">
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="40%" stopColor={skyMid} />
            <stop offset="70%" stopColor={skyLow} />
            <stop offset="100%" stopColor={skyBot} />
          </linearGradient>

          <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={waterTop} />
            <stop offset="30%" stopColor={waterMid} />
            <stop offset="100%" stopColor={waterBot} />
          </linearGradient>

          <linearGradient id="waterReflection" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="groundGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={groundTop} />
            <stop offset="40%" stopColor={groundMid} />
            <stop offset="100%" stopColor={groundBot} />
          </linearGradient>

          <linearGradient id="hillGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lerpColor('#8A9058', '#A0D878', t)} />
            <stop offset="100%" stopColor={lerpColor('#7A8048', '#88C060', t)} />
          </linearGradient>

          <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFF5D6" stopOpacity={0.2 + t * 0.6} />
            <stop offset="50%" stopColor="#FFF5D6" stopOpacity={0.05 + t * 0.2} />
            <stop offset="100%" stopColor="#FFF5D6" stopOpacity="0" />
          </radialGradient>

          <filter id="waterShimmerFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.003" numOctaves="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <filter id="softBlur">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Sky */}
        <rect width="1200" height="800" fill="url(#skyGradient)" className={skyGlow ? glowClass : ''} />

        {/* Sun */}
        <circle cx="920" cy="120" r={100 + t * 40} fill="url(#sunGlow)" className={skyGlow ? glowClass : ''} />
        <circle cx="920" cy="120" r={30 + t * 8} fill="#FFF8E1" />
        <circle cx="920" cy="120" r={24 + t * 8} fill="#FFFDF5" />

        {/* Clouds */}
        <g transform="translate(0, 80)"><Cloud className="cloud-1" /></g>
        <g transform="translate(0, 120)"><Cloud className="cloud-2" /></g>
        <g transform="translate(0, 60)"><Cloud className="cloud-3" /></g>
        <g transform="translate(0, 140)"><Cloud className="cloud-4" /></g>
        <g transform="translate(0, 150)"><Cloud className="cloud-5" /></g>
        <g transform="translate(0, 100)"><Cloud className="cloud-6" /></g>

        {/* Birds */}
        <BirdGroup />

        {/* Distant hills */}
        <path
          d="M0,480 Q150,380 300,430 Q500,350 650,400 Q800,370 950,420 Q1100,380 1200,440 L1200,560 L0,560 Z"
          fill="url(#hillGradient)"
          filter="url(#softBlur)"
          opacity="0.6"
        />

        {/* Main meadow */}
        <path
          d="M0,520 Q100,490 250,510 Q400,485 550,505 Q700,480 850,500 Q1000,490 1100,505 Q1150,510 1200,515 L1200,600 L0,600 Z"
          fill="url(#groundGradient)"
        />

        <path
          d="M0,535 Q150,525 300,530 Q500,520 650,528 Q850,522 1000,530 Q1100,525 1200,532 L1200,600 L0,600 Z"
          fill={lerpColor('#908830', '#78B850', t)}
          opacity="0.6"
        />

        {/* Trees */}
        <g className={treesGlow ? glowClass : ''}>
          {treeData.map((tr, i) => (
            <Tree key={i} x={tr.x} y={tr.y} scale={tr.scale} variant={tr.variant} swayDur={tr.swayDur} swayDelay={tr.swayDelay} healthScale={treeHealthScale} />
          ))}
        </g>

        {/* Small plants */}
        {plantData.map((p, i) => (
          <SmallPlant key={i} x={p.x} y={p.y} swayDur={p.swayDur} swayDelay={p.swayDelay} />
        ))}

        {/* Flowers */}
        {flowers.map((f) => (
          <Flower key={f.id} x={f.x} y={f.y} timestamp={f.timestamp} />
        ))}

        {/* Water */}
        <path
          d="M0,590 Q100,585 200,588 Q400,582 600,586 Q800,583 1000,587 Q1100,585 1200,588 L1200,800 L0,800 Z"
          fill="url(#waterGradient)"
          className={waterGlow ? glowClass : ''}
        />

        {/* Water reflection shimmer */}
        <path
          d="M0,590 Q100,585 200,588 Q400,582 600,586 Q800,583 1000,587 Q1100,585 1200,588 L1200,650 L0,650 Z"
          fill="url(#waterReflection)"
          filter="url(#waterShimmerFilter)"
          className="water-shimmer"
        />

        {/* Water ripples */}
        <g>
          <ellipse cx={200} cy={650} rx={80} ry={2} fill="white" className="water-ripple" />
          <ellipse cx={500} cy={670} rx={100} ry={2.5} fill="white" className="water-ripple" />
          <ellipse cx={800} cy={640} rx={70} ry={1.5} fill="white" className="water-ripple" />
          <ellipse cx={1000} cy={690} rx={90} ry={2} fill="white" className="water-ripple" />
          <ellipse cx={350} cy={710} rx={60} ry={1.5} fill="white" className="water-ripple" />
          <ellipse cx={650} cy={730} rx={85} ry={2} fill="white" className="water-ripple" />
          <ellipse cx={150} cy={740} rx={55} ry={1.5} fill="white" className="water-ripple" />
          <ellipse cx={900} cy={750} rx={70} ry={1.8} fill="white" className="water-ripple" />
        </g>

        {/* Grass at water edge */}
        {grassPositions.map((g, i) => {
          const d = i % 2 === 0
            ? `M${g.x},${g.y} Q${g.x + 2},${g.y - 12} ${g.x + 4},${g.y}`
            : `M${g.x},${g.y} Q${g.x + 3},${g.y - 13} ${g.x + 6},${g.y}`;
          const color = i % 2 === 0 ? '#5B8C3E' : '#7AB356';
          return (
            <path key={i} d={d} fill="none" stroke={color} strokeWidth="1.5">
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={`-2 ${g.x} ${g.y}; 2 ${g.x} ${g.y}; -2 ${g.x} ${g.y}`}
                dur={g.swayDur}
                begin={g.swayDelay}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
              />
            </path>
          );
        })}
      </svg>
    </div>
  );
}

// Color interpolation helper
function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

function Navbar({
  onSignOut,
  onTogglePanel,
  showPanel,
  entriesCount,
}: {
  onSignOut: () => void;
  onTogglePanel: () => void;
  showPanel: boolean;
  entriesCount: number;
}) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#FDF6E3]/80 via-[#FDF6E3]/50 to-transparent backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <Leaf className="w-6 h-6 text-sage-600" strokeWidth={2.2} />
        <span className="text-xl font-serif font-semibold tracking-tight text-[#3D2518]">Folio</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-serif font-medium border transition ${showPanel
              ? 'bg-sage-600 border-sage-600 text-parchment-50 hover:bg-sage-700'
              : 'bg-[#FDF6E3]/80 border-parchment-300/60 text-[#5C3D2E] hover:bg-[#FDF6E3]/95 shadow-sm'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          My Entries ({entriesCount})
        </button>
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-serif font-medium text-[#5C3D2E] hover:bg-[#FDF6E3]/60 transition"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}

function JournalApp() {
  const { user, loading, signOut } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const [healthScore, setHealthScore] = useState(50);
  const [worldEffect, setWorldEffect] = useState<WorldState['effect']>(null);
  const [effectType, setEffectType] = useState<WorldState['effectType']>(null);
  const [flowers, setFlowers] = useState<FlowerState[]>([]);
  const flowerIdRef = useRef(0);
  const effectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [toasts, setToasts] = useState<ImpactToast[]>([]);
  const toastIdRef = useRef(0);

  const loadEntries = useCallback(async () => {
    try {
      setFetching(true);
      setError(null);
      const data = await fetchEntries();
      setEntries(data);
    } catch {
      setError('Failed to load entries');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadEntries();
      initWorldHealth().then(setHealthScore);
    }
  }, [user, loadEntries]);

  const triggerWorldReaction = useCallback((impact: WorldState) => {
    setHealthScore(impact.score);
    setWorldEffect(impact.effect);
    setEffectType(impact.effectType);
    saveWorldHealth(impact.score);

    // Add flower for exceptional positive actions
    if (impact.effect === 'flowers' || (impact.effectType === 'positive' && impact.score > 65)) {
      const newFlower: FlowerState = {
        id: flowerIdRef.current++,
        x: 100 + Math.random() * 1000,
        y: 480 + Math.random() * 100,
        timestamp: Date.now(),
      };
      setFlowers((prev) => [...prev.slice(-12), newFlower]);
    }

    // Clear effect highlight after a few seconds
    if (effectTimeoutRef.current) clearTimeout(effectTimeoutRef.current);
    effectTimeoutRef.current = setTimeout(() => {
      setWorldEffect(null);
      setEffectType(null);
    }, 4000);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDF6E3]/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[#5C3D2E]">
          <Leaf className="w-6 h-6 animate-pulse text-sage-500" />
          <span className="font-serif font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const totalCarbon = entries.reduce((sum, e) => sum + e.carbon_value, 0);

  const handleCreate = async (data: JournalEntryInsert) => {
    await createEntry(data);

    // Rule-based impact analysis
    const impact = analyzeEntry(data.category, data.mood ?? null);
    const worldState = applyImpact(impact, healthScore);
    triggerWorldReaction(worldState);

    // Show toast notification
    const scoreDelta = worldState.score - healthScore;
    if (impact.impact_type !== 'neutral' || scoreDelta !== 0) {
      const sign = scoreDelta >= 0 ? '+' : '';
      const icon = impact.impact_type === 'positive' ? '\u{1F33F}' : impact.impact_type === 'negative' ? '\u{1F32A}' : '\u{26A1}';
      const exceptionalNote = impact.is_exceptional ? ' Exceptional!' : '';
      const toast: ImpactToast = {
        id: toastIdRef.current++,
        message: `${icon} ${impact.impact_type.charAt(0).toUpperCase() + impact.impact_type.slice(1)} impact detected${exceptionalNote} \u2014 ${sign}${scoreDelta} world health`,
        type: impact.impact_type,
        scoreDelta,
        exiting: false,
      };
      setToasts((prev) => [...prev.slice(-2), toast]);

      setTimeout(() => {
        setToasts((prev) => prev.map((t) => t.id === toast.id ? { ...t, exiting: true } : t));
      }, 3000);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    }

    await loadEntries();
  };

  const handleUpdate = async (data: JournalEntryInsert) => {
    if (!editingEntry) return;
    await updateEntry(editingEntry.id, data);
    setEditingEntry(null);
    await loadEntries();
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    setViewingEntry(null);
    const updatedEntries = await fetchEntries();
    setEntries(updatedEntries);
    const newScore = recalculateFromEntries(updatedEntries);
    setHealthScore(newScore);
    await saveWorldHealth(newScore);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#A8D8EA]">
      <Landscape healthScore={healthScore} worldEffect={worldEffect} effectType={effectType} flowers={flowers} />
      <Navbar
        onSignOut={signOut}
        onTogglePanel={() => setShowPanel(!showPanel)}
        showPanel={showPanel}
        entriesCount={entries.length}
      />

      {/* Impact toasts */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-5 py-3 rounded-xl font-serif text-sm shadow-lg backdrop-blur-sm border ${toast.exiting ? 'impact-toast-exit' : 'impact-toast-enter'
              } ${toast.type === 'positive'
                ? 'bg-sage-100/90 border-sage-300 text-sage-900'
                : toast.type === 'negative'
                  ? 'bg-red-50/90 border-red-200 text-red-900'
                  : 'bg-parchment-100/90 border-parchment-300 text-parchment-900'
              }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Backdrop overlay for closing the collapsible panel when clicking outside */}
      {showPanel && (
        <div
          className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[1px] md:bg-transparent transition-opacity cursor-pointer"
          onClick={() => setShowPanel(false)}
        />
      )}

      {/* Collapsible Journal entries side panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-40 w-full sm:w-[450px] bg-[#FDF6E3]/95 backdrop-blur-md border-l border-parchment-300/60 shadow-[0_0_30px_rgba(60,45,20,0.15)] flex flex-col transition-transform duration-300 ease-in-out ${showPanel ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Panel Header */}
        <div className="pt-6 pb-4 px-6 border-b border-parchment-300/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sage-600" />
            <h2 className="text-xl font-serif font-semibold text-[#3D2518]">My Journal</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditingEntry(null); setShowForm(true); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sage-500 hover:bg-sage-600 active:bg-sage-700 text-parchment-50 font-serif font-medium text-xs shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New Entry
            </button>
            <button
              onClick={() => setShowPanel(false)}
              className="p-1.5 rounded-lg hover:bg-parchment-200 text-[#7A6248] transition"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Panel Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-parchment-50/70 rounded-xl px-3 py-2 border border-parchment-300/40 shadow-sm text-center">
              <div className="text-[10px] uppercase tracking-wider font-serif text-[#7A6248] font-medium">Entries</div>
              <div className="text-base font-serif font-bold text-[#3D2518]">{entries.length}</div>
            </div>
            <div className="bg-parchment-50/70 rounded-xl px-3 py-2 border border-parchment-300/40 shadow-sm text-center">
              <div className="text-[10px] uppercase tracking-wider font-serif text-[#7A6248] font-medium">Carbon</div>
              <div className="text-base font-serif font-bold text-[#3D5A30]">{totalCarbon.toFixed(1)} kg</div>
            </div>
            <div className="bg-parchment-50/70 rounded-xl px-3 py-2 border border-parchment-300/40 shadow-sm text-center">
              <div className="text-[10px] uppercase tracking-wider font-serif text-[#7A6248] font-medium">Health</div>
              <div className="text-base font-serif font-bold text-[#3D2518]">{healthScore}</div>
            </div>
          </div>

          {/* Entries list */}
          <div className="space-y-3">
            {error && (
              <div className="p-4 rounded-xl bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-800 text-sm font-serif text-center">
                {error}
              </div>
            )}

            {fetching && entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-[#5C3D2E]">
                <Leaf className="w-10 h-10 animate-pulse text-sage-400 mb-3" />
                <p className="font-serif font-medium">Loading your journal...</p>
              </div>
            )}

            {!fetching && entries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-[#5C3D2E]">
                <BookOpen className="w-12 h-12 text-sage-400/60 mb-4" />
                <h3 className="text-lg font-serif font-semibold text-[#3D2518] mb-1">Your world is waiting...</h3>
                <p className="text-sm font-serif text-[#7A6248] max-w-xs text-center italic">
                  Write your first green moment and begin your journey toward mindful living.
                </p>
                <button
                  onClick={() => { setEditingEntry(null); setShowForm(true); }}
                  className="mt-5 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sage-500 hover:bg-sage-600 text-parchment-50 font-serif font-medium text-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  Add First Entry
                </button>
              </div>
            )}

            {entries.map((entry) => (
              <div key={entry.id} onClick={() => setViewingEntry(entry)} className="cursor-pointer">
                <EntryCard
                  entry={entry}
                  onEdit={(e) => { if (e) { setEditingEntry(e); setShowForm(true); } }}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) for quick entry creation */}
      {!showPanel && (
        <button
          onClick={() => { setEditingEntry(null); setShowForm(true); }}
          className="fixed bottom-6 right-6 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-sage-500 hover:bg-sage-600 active:bg-sage-700 text-parchment-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
          title="New Entry"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Modals */}
      {showForm && (
        <EntryForm
          onSubmit={editingEntry ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditingEntry(null); }}
          initial={editingEntry ? {
            title: editingEntry.title,
            content: editingEntry.content,
            category: editingEntry.category,
            carbon_value: editingEntry.carbon_value,
            mood: editingEntry.mood,
          } : undefined}
        />
      )}

      {viewingEntry && (
        <EntryDetail
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onEdit={(e) => { setViewingEntry(null); setEditingEntry(e); setShowForm(true); }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <JournalApp />
    </AuthProvider>
  );
}
