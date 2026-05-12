# DESIGN.md — 心御AI小说辅助器

## Color Strategy: Restrained + Committed hybrid

### Dark theme OKLCH tokens
- **Ink** `oklch(95% 0.005 260)` — body text, tinted slightly cool
- **Charcoal** `oklch(78% 0.01 260)` — headings, emphasis
- **Ash** `oklch(58% 0.008 260)` — secondary labels
- **Mist** `oklch(28% 0.01 260)` — surfaces (cards, panels)
- **Void** `oklch(12% 0.015 260)` — deep background, the canvas
- **Abyss** `oklch(7% 0.02 260)` — deepest surfaces
- **Accent** `oklch(65% 0.18 280)` — primary interaction (cool violet, not purple)
- **Accent-warm** `oklch(60% 0.15 15)` — warnings, warm emphasis (subdued amber)
- **Accent-cool** `oklch(72% 0.12 200)` — secondary, links, calm

### Token reference (Tailwind mapping)
```
--color-ink:       oklch(95% 0.005 260)   → text-white/95
--color-charcoal:  oklch(78% 0.01 260)    → text-white/78
--color-ash:       oklch(58% 0.008 260)   → text-white/58
--color-mist:      oklch(28% 0.01 260)    → surface-lighter
--color-void:      oklch(12% 0.015 260)   → surface
--color-abyss:     oklch(7% 0.02 260)     → surface-light
--color-accent:    oklch(65% 0.18 280)    → accent-primary
--color-accent-warm: oklch(60% 0.15 15)   → accent-warm
--color-accent-cool: oklch(72% 0.12 200)  → accent-secondary
```

## Typography
- System font stack with serif body option
- Body: 14px/1.7, headings: weight 500-600
- Line length capped at 70ch for editor

## Motion
- ease-out-quint for UI transitions (200-300ms)
- No bounce, no elastic
- Reduced motion: disable all transitions

## Elevation
- 0: Abyss (deepest)
- 1: Void (default bg)
- 2: Mist (cards, panels)
- 3: 1px border + subtle shadow (modals)

## Absolute bans
- No gradient text
- No side-stripe borders > 1px
- No glassmorphism as default
- No identical card grids
- No purple-to-blue gradients
- Use OKLCH tinted neutrals, never pure black/white
