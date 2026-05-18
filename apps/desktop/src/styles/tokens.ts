// ─── GGTranslate Design Tokens ───────────────────────────────────────────────
// Source unique de vérité pour toutes les valeurs de design.
// Changer une valeur ici la propage dans toute l'app.

export const tokens = {

    // ─── COULEURS ──────────────────────────────────────────────────────────────
    colors: {
      // Marque
      cyan:   '#06b6d4',
      blue:   '#3b82f6',
      purple: '#a855f7',
      green:  '#22c55e',
      orange: '#f97316',
      red:    '#ef4444',
      yellow: '#f59e0b',
  
      // Backgrounds
      bg:      '#060b14',    // fond app principal
      bgSide:  '#080d18',    // sidebar + panneau droit
      bgChat:  '#0a0f1a',    // fond chat groupe
      bg2:     '#0d1424',    // cards, panels
      bg3:     '#111827',    // inputs, feed items, inner cards
  
      // Borders
      borderDark:  '#0f1a2e', // bordure sidebar (très sombre)
      border:      '#1e2d45', // bordure standard
      borderMuted: '#334155', // bordure très atténuée
  
      // Texte
      text:     '#f1f5f9',  // texte primaire
      white:    '#ffffff',
      muted:    '#94a3b8',  // texte secondaire
      dim:      '#475569',  // texte atténué
      veryDim:  '#334155',  // texte très atténué
  
      // Plans
      planFree:    '#64748b',
      planTrial:   '#06b6d4',
      planStarter: '#3b82f6',
      planPro:     '#a855f7',
  
      // États pipeline
      stateInactive:    '#475569',
      stateListening:   '#06b6d4',
      stateProcessing:  '#3b82f6',
      stateTranslated:  '#22c55e',
      stateError:       '#ef4444',
      stateOther:       '#a855f7',
    },
  
    // ─── OPACITÉS / ALPHAS ────────────────────────────────────────────────────
    alpha: {
      cyanDim:    'rgba(6,182,212,0.05)',
      cyanLight:  'rgba(6,182,212,0.10)',
      cyanMid:    'rgba(6,182,212,0.15)',
      cyanBorder: 'rgba(6,182,212,0.22)',
  
      blueDim:    'rgba(59,130,246,0.10)',
      purpleDim:  'rgba(168,85,247,0.10)',
      purpleMid:  'rgba(168,85,247,0.15)',
      greenDim:   'rgba(34,197,94,0.08)',
      greenMid:   'rgba(34,197,94,0.15)',
      redDim:     'rgba(239,68,68,0.10)',
      redMid:     'rgba(239,68,68,0.15)',
      orangeDim:  'rgba(249,115,22,0.09)',
  
      overlay:    'rgba(0,0,0,0.85)',
      glass:      'rgba(0,0,0,0.35)',
    },
  
    // ─── GRADIENTS ────────────────────────────────────────────────────────────
    gradients: {
      primary:  'linear-gradient(135deg, #3b82f6, #06b6d4)',
      primaryR: 'linear-gradient(to right, #3b82f6, #06b6d4)',
      pro:      'linear-gradient(to right, #7c3aed, #a855f7)',
      danger:   'linear-gradient(to right, #f97316, #ef4444)',
      logo:     'linear-gradient(135deg, #3b82f6, #06b6d4)',
    },
  
    // ─── TYPOGRAPHIE ──────────────────────────────────────────────────────────
    fonts: {
      display: "'Orbitron', sans-serif",  // titres, labels, badges
      body:    "'DM Sans', sans-serif",   // texte courant
      mono:    "monospace",               // codes groupe, timestamps
    },
  
    fontSizes: {
      xs:   '9px',
      sm:   '10px',
      base: '11px',
      md:   '12px',
      lg:   '13px',
      xl:   '14px',
      '2xl': '16px',
      '3xl': '18px',
      '4xl': '20px',
      '5xl': '24px',
      '6xl': '32px',
    },
  
    fontWeights: {
      normal:  400,
      medium:  500,
      semibold: 600,
      bold:    700,
      black:   900,
    },
  
    letterSpacing: {
      tight:  '0.06em',
      normal: '0.08em',
      wide:   '0.1em',
      wider:  '0.12em',
      widest: '0.15em',
    },
  
    // ─── ESPACEMENTS ──────────────────────────────────────────────────────────
    spacing: {
      '1':  '4px',
      '2':  '8px',
      '3':  '10px',
      '4':  '12px',
      '5':  '14px',
      '6':  '16px',
      '7':  '20px',
      '8':  '24px',
      '9':  '28px',
      '10': '32px',
      '12': '40px',
      '14': '48px',
    },
  
    // ─── BORDER RADIUS ────────────────────────────────────────────────────────
    radius: {
      xs:   '4px',
      sm:   '6px',
      md:   '8px',
      lg:   '10px',
      xl:   '12px',
      '2xl': '14px',
      '3xl': '16px',
      '4xl': '20px',
      full: '99px',
      circle: '50%',
    },
  
    // ─── TRANSITIONS ──────────────────────────────────────────────────────────
    transitions: {
      fast:    'all 0.15s ease',
      normal:  'all 0.2s ease',
      medium:  'all 0.28s ease',
      slow:    'all 0.38s ease',
      panel:   'width 0.28s ease',
      overlay: 'all 0.2s ease-out',
    },
  
    // ─── OMBRES / GLOWS ───────────────────────────────────────────────────────
    shadows: {
      cyanSm:  '0 0 18px rgba(6,182,212,0.14)',
      cyanMd:  '0 0 28px rgba(6,182,212,0.22)',
      cyanLg:  '0 4px 22px rgba(6,182,212,0.28)',
      livePulse: '0 0 32px rgba(6,182,212,0.5)',
    },
  
    // ─── GLASSMORPHISM OVERLAY ────────────────────────────────────────────────
    glass: {
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderCyan: '1px solid rgba(6,182,212,0.2)',
    },
  
    // ─── DIMENSIONS APP ───────────────────────────────────────────────────────
    layout: {
      sidebarWidth:     '68px',
      rightPanelWidth:  '280px',
      navHeight:        '64px',
      maxContentWidth:  '800px',
    },
  
    // ─── ANIMATIONS ───────────────────────────────────────────────────────────
    animations: {
      // Durées (ms) — respecter prefers-reduced-motion
      durationFast:   150,
      durationNormal: 200,
      durationMedium: 300,
      durationSlow:   600,
  
      // Easing
      easeOut:  'cubic-bezier(0.0, 0.0, 0.2, 1)',
      easeIn:   'cubic-bezier(0.4, 0.0, 1, 1)',
      easeInOut:'cubic-bezier(0.4, 0.0, 0.2, 1)',
      spring:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  } as const
  
  // ─── HELPERS ─────────────────────────────────────────────────────────────────
  
  // Couleur d'un plan
  export function getPlanColor(plan: string): string {
    switch (plan) {
      case 'pro':     return tokens.colors.planPro
      case 'starter': return tokens.colors.planStarter
      case 'trial':   return tokens.colors.planTrial
      default:        return tokens.colors.planFree
    }
  }
  
  // Couleur d'un état pipeline
  export function getStateColor(state: string): string {
    switch (state) {
      case 'listening':   return tokens.colors.stateListening
      case 'processing':  return tokens.colors.stateProcessing
      case 'translated':  return tokens.colors.stateTranslated
      case 'error':       return tokens.colors.stateError
      default:            return tokens.colors.stateInactive
    }
  }
  
  // Card style standard
  export const cardStyle = {
    background: tokens.colors.bg2,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing['7'],
  } as const
  
  // Card style avec accent cyan
  export const cardStyleCyan = {
    background: tokens.alpha.cyanDim,
    border: `1px solid ${tokens.colors.cyan}`,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing['7'],
  } as const
  
  // Input style standard
  export const inputStyle = {
    background: tokens.colors.bg3,
    border: `1px solid ${tokens.colors.border}`,
    color: tokens.colors.text,
    borderRadius: tokens.radius.md,
    padding: `${tokens.spacing['3']} ${tokens.spacing['5']}`,
    fontSize: tokens.fontSizes.lg,
    outline: 'none',
    width: '100%',
  } as const
  
  // Badge style
  export function badgeStyle(color: string) {
    return {
      background: `${color}22`,
      border: `1px solid ${color}44`,
      color,
      padding: '3px 10px',
      borderRadius: tokens.radius.full,
      fontSize: tokens.fontSizes.sm,
      fontFamily: tokens.fonts.display,
      letterSpacing: tokens.letterSpacing.wide,
    } as const
  }
  
  // Bouton primaire
  export const btnPrimary = {
    background: tokens.gradients.primaryR,
    border: 'none',
    color: tokens.colors.white,
    borderRadius: tokens.radius.md,
    cursor: 'pointer',
    fontFamily: tokens.fonts.display,
    fontWeight: tokens.fontWeights.bold,
    fontSize: tokens.fontSizes.lg,
    transition: tokens.transitions.normal,
  } as const
  
  // Bouton ghost
  export const btnGhost = {
    background: 'transparent',
    border: `1px solid ${tokens.colors.border}`,
    color: tokens.colors.muted,
    borderRadius: tokens.radius.md,
    cursor: 'pointer',
    fontSize: tokens.fontSizes.lg,
    transition: tokens.transitions.normal,
  } as const
  
  export default tokens