import { EmptyBoxIcon } from './icons'
import './ObjectPortrait.css'

// Temporary, high-quality placeholder photography for the eight items
// the Landing Page hero and Lens Match examples reference. A real
// sourced photo set didn't clear the bar for "consistent, clean,
// well-lit" (verified against Wikimedia Commons directly — its search
// and category results for these exact objects are a stylistically
// chaotic mix of vintage/unrelated photos, not usable as a set) — so
// this renders a dimensional, studio-lit illustration instead, sharing
// one backdrop/shadow treatment across all eight for consistency.
//
// Swapping in real photography later requires zero layout change:
// pass `src`, and the real image renders in the exact same frame.

export type ObjectKey =
  | 'water-bottle'
  | 'backpack'
  | 'wallet'
  | 'keys'
  | 'student-id'
  | 'laptop-charger'
  | 'headphones'
  | 'umbrella'

interface ObjectPortraitProps {
  /** One of the eight curated illustrations. Omit for real report data
   *  with no known photo — renders a generic neutral placeholder instead. */
  item?: ObjectKey
  /** A real photo URL. When provided, replaces the illustration with zero layout change. */
  src?: string
  alt?: string
  className?: string
}

const LABELS: Record<ObjectKey, string> = {
  'water-bottle': 'Water bottle',
  backpack: 'Backpack',
  wallet: 'Wallet',
  keys: 'Keys',
  'student-id': 'Student ID card',
  'laptop-charger': 'Laptop charger',
  headphones: 'Headphones',
  umbrella: 'Umbrella',
}

function WaterBottle() {
  return (
    <>
      <ellipse className="op-shadow" cx="100" cy="168" rx="38" ry="8" />
      <rect x="86" y="34" width="28" height="14" rx="4" fill="url(#op-metal)" />
      <rect x="90" y="26" width="20" height="12" rx="3" fill="url(#op-metal)" />
      <rect x="66" y="46" width="68" height="118" rx="20" fill="url(#op-bottle)" />
      <rect x="76" y="58" width="10" height="92" rx="5" fill="#ffffff" opacity="0.35" />
    </>
  )
}

function Backpack() {
  return (
    <>
      <ellipse className="op-shadow" cx="100" cy="172" rx="46" ry="8" />
      <path d="M72 62 Q72 40 100 40 Q128 40 128 62" fill="none" stroke="url(#op-strap)" strokeWidth="7" strokeLinecap="round" />
      <rect x="52" y="58" width="96" height="112" rx="24" fill="url(#op-canvas)" />
      <rect x="68" y="96" width="64" height="56" rx="14" fill="#00000012" />
      <line x1="100" y1="96" x2="100" y2="152" stroke="#00000022" strokeWidth="2" />
    </>
  )
}

function Wallet() {
  return (
    <>
      <ellipse className="op-shadow" cx="100" cy="150" rx="48" ry="8" />
      <rect x="70" y="78" width="10" height="46" rx="2" fill="url(#op-card)" transform="rotate(-8 75 100)" />
      <rect x="82" y="72" width="10" height="46" rx="2" fill="url(#op-card2)" transform="rotate(-3 87 94)" />
      <rect x="54" y="92" width="92" height="66" rx="12" fill="url(#op-leather)" />
      <line x1="54" y1="125" x2="146" y2="125" stroke="#00000018" strokeWidth="2" />
    </>
  )
}

function Keys() {
  return (
    <>
      <ellipse className="op-shadow" cx="100" cy="156" rx="34" ry="7" />
      <circle cx="78" cy="60" r="16" fill="none" stroke="url(#op-metal)" strokeWidth="5" />
      <g transform="rotate(18 100 100)">
        <circle cx="86" cy="96" r="12" fill="none" stroke="url(#op-metal)" strokeWidth="5" />
        <rect x="96" y="91" width="46" height="10" rx="3" fill="url(#op-metal)" />
        <rect x="128" y="101" width="8" height="10" fill="url(#op-metal)" />
        <rect x="116" y="101" width="6" height="8" fill="url(#op-metal)" />
      </g>
      <g transform="rotate(-6 100 100)">
        <circle cx="84" cy="128" r="10" fill="none" stroke="url(#op-metal2)" strokeWidth="4" />
        <rect x="93" y="124" width="34" height="8" rx="2.5" fill="url(#op-metal2)" />
      </g>
    </>
  )
}

function StudentId() {
  return (
    <>
      <ellipse className="op-shadow" cx="100" cy="172" rx="42" ry="8" />
      <circle cx="100" cy="36" r="5" fill="none" stroke="#00000030" strokeWidth="3" />
      <rect x="60" y="42" width="80" height="116" rx="12" fill="url(#op-card3)" />
      <rect x="76" y="58" width="30" height="34" rx="6" fill="url(#op-metal2)" opacity="0.5" />
      <rect x="76" y="102" width="48" height="6" rx="3" fill="#ffffff" opacity="0.55" />
      <rect x="76" y="116" width="34" height="6" rx="3" fill="#ffffff" opacity="0.4" />
    </>
  )
}

function LaptopCharger() {
  return (
    <>
      <ellipse className="op-shadow" cx="104" cy="172" rx="46" ry="8" />
      <path
        d="M70 92 C40 100 40 130 66 132 C48 140 52 162 78 156"
        fill="none"
        stroke="url(#op-cable)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="80" cy="156" r="5" fill="url(#op-metal)" />
      <rect x="86" y="70" width="62" height="72" rx="16" fill="url(#op-brick)" />
      <circle cx="117" cy="106" r="7" fill="#ffffff" opacity="0.5" />
    </>
  )
}

function Headphones() {
  return (
    <>
      <ellipse className="op-shadow" cx="100" cy="168" rx="42" ry="8" />
      <path d="M62 108 Q62 50 100 50 Q138 50 138 108" fill="none" stroke="url(#op-metal)" strokeWidth="7" strokeLinecap="round" />
      <rect x="48" y="98" width="26" height="46" rx="13" fill="url(#op-earcup)" />
      <rect x="126" y="98" width="26" height="46" rx="13" fill="url(#op-earcup)" />
      <rect x="54" y="106" width="9" height="30" rx="4.5" fill="#ffffff" opacity="0.3" />
      <rect x="132" y="106" width="9" height="30" rx="4.5" fill="#ffffff" opacity="0.3" />
    </>
  )
}

function Umbrella() {
  return (
    <>
      <ellipse className="op-shadow" cx="100" cy="176" rx="30" ry="7" />
      <path d="M100 60 L100 158" stroke="url(#op-metal2)" strokeWidth="4" />
      <path d="M100 150 Q112 158 108 168" fill="none" stroke="url(#op-metal2)" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M46 66 Q100 30 154 66 L146 78 Q100 52 54 78 Z"
        fill="url(#op-canopy1)"
      />
      <path d="M46 66 Q100 30 154 66" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M73 71 L73 61 M100 66 L100 55 M127 71 L127 61" stroke="#00000018" strokeWidth="2" />
    </>
  )
}

const ILLUSTRATIONS: Record<ObjectKey, () => React.JSX.Element> = {
  'water-bottle': WaterBottle,
  backpack: Backpack,
  wallet: Wallet,
  keys: Keys,
  'student-id': StudentId,
  'laptop-charger': LaptopCharger,
  headphones: Headphones,
  umbrella: Umbrella,
}

/**
 * A consistently-framed object portrait: a real photo when `src` is
 * given, otherwise a dimensional placeholder illustration. Every item
 * shares the same studio backdrop, shadow, and lighting convention
 * (defined once here) so the set reads as one consistent style rather
 * than eight unrelated graphics.
 */
function ObjectPortrait({ item, src, alt, className = '' }: ObjectPortraitProps) {
  if (src) {
    return (
      <div className={`op-frame ${className}`}>
        <img src={src} alt={alt ?? (item ? LABELS[item] : '')} className="img-fade-in" />
      </div>
    )
  }

  if (!item) {
    // Real report data with no photo of its own — a generic neutral
    // placeholder, distinct from the eight curated marketing
    // illustrations (which assume a specific, known object).
    return (
      <div className={`op-frame op-frame-empty ${className}`} role="img" aria-label={alt ?? 'No photo available'}>
        <EmptyBoxIcon />
        <span>No photo</span>
      </div>
    )
  }

  const Illustration = ILLUSTRATIONS[item]

  return (
    <div className={`op-frame op-frame-placeholder ${className}`} role="img" aria-label={alt ?? LABELS[item]}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="op-bottle" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8fb2cf" />
            <stop offset="1" stopColor="#3f6486" />
          </linearGradient>
          <linearGradient id="op-canvas" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c48a5c" />
            <stop offset="1" stopColor="#8a5a34" />
          </linearGradient>
          <linearGradient id="op-strap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a06d43" />
            <stop offset="1" stopColor="#6e4726" />
          </linearGradient>
          <linearGradient id="op-leather" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7a4a2e" />
            <stop offset="1" stopColor="#4a2c1a" />
          </linearGradient>
          <linearGradient id="op-card" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d9c08a" />
            <stop offset="1" stopColor="#b89a5f" />
          </linearGradient>
          <linearGradient id="op-card2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#c9d6d2" />
            <stop offset="1" stopColor="#94a8a2" />
          </linearGradient>
          <linearGradient id="op-card3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7f9fc4" />
            <stop offset="1" stopColor="#455f82" />
          </linearGradient>
          <linearGradient id="op-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e4e6e8" />
            <stop offset="1" stopColor="#9aa0a6" />
          </linearGradient>
          <linearGradient id="op-metal2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#cfd3d6" />
            <stop offset="1" stopColor="#7d8489" />
          </linearGradient>
          <linearGradient id="op-brick" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbfbfa" />
            <stop offset="1" stopColor="#d6d5d0" />
          </linearGradient>
          <linearGradient id="op-cable" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4a4643" />
            <stop offset="1" stopColor="#242220" />
          </linearGradient>
          <linearGradient id="op-earcup" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4a4643" />
            <stop offset="1" stopColor="#1c1a18" />
          </linearGradient>
          <linearGradient id="op-canopy1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c2603a" />
            <stop offset="1" stopColor="#8f3a20" />
          </linearGradient>
        </defs>
        <Illustration />
      </svg>
    </div>
  )
}

export default ObjectPortrait
