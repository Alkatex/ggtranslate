import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { tokens } from '../styles/tokens'

// ─── Hook prefers-reduced-motion ─────────────────────────────────────────────
export function useMotion() {
  const reduced = useReducedMotion()
  return { reduced }
}

// ─── FadeIn ──────────────────────────────────────────────────────────────────
// Usage: <FadeIn>contenu</FadeIn>
export function FadeIn({ children, delay = 0, duration = 0.2, style }: {
  children: React.ReactNode
  delay?: number
  duration?: number
  style?: React.CSSProperties
}) {
  const { reduced } = useMotion()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : duration, delay: reduced ? 0 : delay }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// ─── SlideUp ─────────────────────────────────────────────────────────────────
// Usage: <SlideUp>contenu</SlideUp>
export function SlideUp({ children, delay = 0, style }: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}) {
  const { reduced } = useMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : 8 }}
      transition={{
        duration: reduced ? 0 : 0.2,
        delay: reduced ? 0 : delay,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// ─── SlideDown ───────────────────────────────────────────────────────────────
// Usage: <SlideDown>contenu</SlideDown>
export function SlideDown({ children, delay = 0, style }: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}) {
  const { reduced } = useMotion()
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -8 }}
      transition={{
        duration: reduced ? 0 : 0.2,
        delay: reduced ? 0 : delay,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// ─── ScalePop ────────────────────────────────────────────────────────────────
// Usage: <ScalePop>badge ou notification</ScalePop>
export function ScalePop({ children, delay = 0, style }: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}) {
  const { reduced } = useMotion()
  return (
    <motion.div
      initial={{ opacity: 0, scale: reduced ? 1 : 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: reduced ? 1 : 0.9 }}
      transition={{
        duration: reduced ? 0 : 0.3,
        delay: reduced ? 0 : delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// ─── FeedItem ────────────────────────────────────────────────────────────────
// Usage: <FeedItem>ligne de traduction</FeedItem>
export function FeedItem({ children, style }: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const { reduced } = useMotion()
  return (
    <motion.div
      initial={{ opacity: 0, x: reduced ? 0 : -10, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration: reduced ? 0 : 0.2,
        ease: [0.0, 0.0, 0.2, 1],
      }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// ─── OverlayBackdrop ─────────────────────────────────────────────────────────
// Usage: wrap autour d'une modale/popup
export function OverlayBackdrop({ children, onClose }: {
  children: React.ReactNode
  onClose?: () => void
}) {
  const { reduced } = useMotion()
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.15 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 400,
          background: tokens.alpha.overlay,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: reduced ? 1 : 0.92, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: reduced ? 1 : 0.95, y: reduced ? 0 : 8 }}
          transition={{ duration: reduced ? 0 : 0.2, ease: [0.0, 0.0, 0.2, 1] }}
          onClick={e => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── MotionButton ────────────────────────────────────────────────────────────
// Bouton avec hover + tap animé
export function MotionButton({
  children, onClick, disabled, style, className,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}) {
  const { reduced } = useMotion()
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={className}
      whileHover={reduced || disabled ? {} : { scale: 1.02 }}
      whileTap={reduced || disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        background: 'transparent',
        ...style,
      }}
    >
      {children}
    </motion.button>
  )
}

// ─── LivePulse ───────────────────────────────────────────────────────────────
// Animation pulse pour le bouton LIVE actif
export function LivePulse({ active, color = tokens.colors.cyan }: {
  active: boolean
  color?: string
}) {
  const { reduced } = useMotion()
  if (!active || reduced) return null
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: -4,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        pointerEvents: 'none',
      }}
      animate={{
        opacity: [0.6, 0],
        scale: [1, 1.4],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  )
}

// ─── Stagger container ───────────────────────────────────────────────────────
// Usage: <StaggerList items={[...]} renderItem={item => <div>{item}</div>} />
export function StaggerList<T>({ items, renderItem, gap = 8 }: {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  gap?: number
}) {
  const { reduced } = useMotion()
  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', gap }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduced ? 0 : 0.06 } },
      }}
    >
      {items.map((item, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: reduced ? 0 : 10 },
            visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.2 } },
          }}
        >
          {renderItem(item, i)}
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── AnimatePresence re-export ────────────────────────────────────────────────
export { AnimatePresence }