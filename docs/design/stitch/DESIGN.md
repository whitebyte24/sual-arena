---
name: Serene Illumination
colors:
  surface: '#03132b'
  surface-dim: '#03132b'
  surface-bright: '#2b3953'
  surface-container-lowest: '#000e25'
  surface-container-low: '#0c1c34'
  surface-container: '#102038'
  surface-container-high: '#1b2a43'
  surface-container-highest: '#26354e'
  on-surface: '#d6e3ff'
  on-surface-variant: '#bccac0'
  inverse-surface: '#d6e3ff'
  inverse-on-surface: '#22314a'
  outline: '#87948b'
  outline-variant: '#3d4a42'
  surface-tint: '#63dca6'
  primary: '#63dca6'
  on-primary: '#003824'
  primary-container: '#1ba473'
  on-primary-container: '#00311f'
  inverse-primary: '#006c49'
  secondary: '#f1bf58'
  on-secondary: '#402d00'
  secondary-container: '#936b00'
  on-secondary-container: '#fff7ef'
  tertiary: '#aec7f7'
  on-tertiary: '#153057'
  tertiary-container: '#7991be'
  on-tertiary-container: '#0c2950'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#81f9c1'
  primary-fixed-dim: '#63dca6'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffdea3'
  secondary-fixed-dim: '#f1bf58'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5c4200'
  tertiary-fixed: '#d6e3ff'
  tertiary-fixed-dim: '#aec7f7'
  on-tertiary-fixed: '#001b3d'
  on-tertiary-fixed-variant: '#2e476f'
  background: '#03132b'
  on-background: '#d6e3ff'
  surface-variant: '#26354e'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a dignified, warm, and intellectually respectful atmosphere for a family-centered Islamic knowledge application. The aesthetic merges the disciplined clarity of modern editorial mobile design with the timeless reverence of sacred art. It steers strictly clear of garish trivia gamification, flashing casino-like mechanics, and sensory overload. Instead, it cultivates quiet focus, celebration of learning, and communal reflection.

### Emotional Posture & Principles
- **Dignified Elevation:** Visual feedback conveys honor and accomplishment through steady radiance and warm metallic lusters rather than frenetic bouncing or arcade tropes.
- **Geometric Harmony:** Visual rhythm is anchored by octagonal symmetries, subtle interlocking tessellations (*khatim*), and precise proportioning.
- **Reverent Warmth:** Deep night tones evoke peaceful contemplation (*Tahajjud* and desert skies), balanced by lanterns (*fener*) of soft, directional amber light.
- **Strict Visual Restraint:** Strictly avoid any representations of sentient beings (human faces, eyes, figures, prophets, companions, or animals). Identity, categories, and avatars rely solely on calligraphic motifs, geometric crests, and layered letterforms.

## Colors

The palette balances profound depth with radiant sacred accents. Dark mode serves as the primary canvas, providing optimal visual calm for long reading and evening study sessions, while the light companion mirrors illuminated manuscripts on vellum.

### Dark Mode (Default)
- **Canvas Base (`#0B1B33`):** Deepest night navy, serving as the foundational floor for the entire viewport.
- **Surface Raised (`#12294A`):** Modal sheets, navigation backdrops, and secondary section groupings.
- **Surface Container / Cards (`#18335A`):** Question cards, answer option tiles, and elevated interactive panels.
- **Hairline Strokes:** Primary subtle borders use `#1E3A63`; premium emphasis and active states use `rgba(224, 176, 74, 0.25)`.
- **Primary Emerald (`#0E9F6E`):** Represents truth, correct selections, validation, and active progression milestones.
- **Antique Gold Accent (`#E0B04A`):** Reserved for star ratings, streak milestones, wisdom seals, and elevated status glyphs.
- **Text Primary (`#F4F1E8`):** Unbleached warm cream; avoids clinical white to preserve eye comfort.
- **Text Secondary (`#9DB0C9`):** Slate-tinted blue for meta-annotations, category subtext, and timer counters.
- **Critical Error (`#D64545`):** Reserved for incorrect answers, timeout warnings, and destructive actions.

### Light Mode Companion
- **Canvas Base:** `#F7F4EC` (Warm raw parchment).
- **Surface Elevated:** `#FFFFFF` (Crisp ivory container).
- **Text Primary:** `#0B1B33` (Deep blue-black).
- **Primary Emerald:** `#0A7A54` (Deep forest emerald for calibrated 4.5:1+ contrast on cream).
- **Antique Gold Accent:** `#B88A1F` (Burnished ochre gold).

## Typography

Typography prioritizes pristine legibility for complex questions, theological phrasing, and multilingual contexts. Complete native support for Turkish extended diacritics (`ğ`, `ş`, `ı`, `İ`, `ö`, `ü`, `ç`) is mandatory across all weights.

### Typographic System
- **Latin & Turkish Script:** Plus Jakarta Sans delivers contemporary warmth with geometric discipline, maintaining high legibility even during timed assessments.
- **Arabic Inscriptions & References:** Pair with *Noto Naskh Arabic* or *IBM Plex Sans Arabic* for Quranic verses, Hadith excerpts, and terminology. Set Arabic body text at least 2pt larger than adjacent Latin type to balance x-height and diacritical marks (*tashkeel*).
- **Proportional Numbers:** All countdown timers, score counters, and live arena leaderboards must utilize tabular lining numbers (`font-variant-numeric: tabular-nums`) to prevent layout shifts.

## Layout & Spacing

Designed primarily for mobile screen dimensions (390×844pt and variable viewports), the layout structure enforces clean hierarchy and thumb-reach zones.

### Spatial Grid & Rules
- **Base Grid:** 4pt base grid with an 8pt architectural rhythm. Component gaps adhere strictly to `space-xs` (4px), `space-sm` (8px), `space-md` (16px), `space-lg` (24px), and `space-xl` (32px).
- **Screen Margins:** Horizontal canvas margins are locked at `1.25rem` (20px) on compact mobile screens, expanding to `1.5rem` (24px) on large screens and foldables.
- **Accessibility Safeguard:** Interactive elements maintain a hard minimum touch target of 48×48dp, even when visual icon footprints are smaller.
- **Ergonomic Thumb Zone:** Primary actionable triggers (answer options, confirmation buttons) are pinned to the bottom 60% of the viewport, while timers, category labels, and streak counters occupy the upper 40%.

## Elevation & Depth

Depth is established through rich tonal stratification and subtle luminous glows rather than dark cast shadows.

### Surface Hierarchy
1. **Level 0 (Canvas):** `#0B1B33` — The grounding foundation.
2. **Level 1 (Panels & Navigators):** `#12294A` with a 1px top border of `#1E3A63`.
3. **Level 2 (Cards & Answer Tiles):** `#18335A` enclosed with a subtle outline (`#1E3A63`).
4. **Level 3 (Focused & Correct States):** Emerald or Gold wash backed by a directional inner ambient glow.

### The "Fener" (Lantern) Glow
In lieu of standard drop shadows, high-priority cards and milestone achievements emit a soft ambient radial bloom:
- **Gold Lantern Bloom:** `0px 8px 32px rgba(224, 176, 74, 0.15)`
- **Emerald Truth Glow:** `0px 8px 28px rgba(14, 159, 110, 0.20)`
- **Structural Outlines:** All elevated components must incorporate a 1px border. Avoid heavy, unfeathered black shadows.

## Shapes

The design language balances friendly, contemporary curvature with the dignified structure of sacred architecture.

### Corner Curvature Logic
- **Cards & Question Surfaces:** Standardized at `20px` to `24px` radius (`rounded-xl`), creating comfortable, inviting frames.
- **Buttons & Interactive Action Blocks:** `16px` radius (`rounded-lg`) to preserve clarity as distinct clickable elements.
- **Badges, Streak Trackers & Filter Chips:** Fully rounded pills (`9999px`) to distinguish categorical metadata from primary cards.
- **Ornamental Visual Motifs:** Integrate the 8-pointed star (*Khatim-al-Sulayman*) as background watermark textures at 3% to 6% opacity, as score divider nodes, and as frames for numeric chapter badges. Cut corner variations (chamfered edges) are permitted for gold badges.

## Components

### Buttons
- **Primary Action (Emerald):** Background `#0E9F6E`, text `#F4F1E8`, border-radius 16px. Height 54px. Pressed state darkens to `#0A7A54` with a 0.98 scale compression.
- **Secondary Action (Subtle Navy):** Background `#18335A`, 1px border `#1E3A63`, text `#F4F1E8`.
- **Celebratory / Milestone (Gold):** Background `#E0B04A`, text `#0B1B33` (bold), subtle lantern glow `0px 4px 16px rgba(224, 176, 74, 0.3)`.

### Answer Option Tiles
- Default state: Surface `#18335A`, border 1.5px `#1E3A63`, padding `16px 20px`, border-radius 20px. Left-aligned label accompanied by an indexed Latin/Arabic key badge (`A`, `B`, `C`, `D`).
- Selected state: Surface `#12294A`, border 1.5px `#E0B04A`.
- Correct state: Surface `#0A7A54` tinted at 30% fill, border 2px `#0E9F6E`, accompanied by a smooth emerald glow.
- Incorrect state: Surface `#D64545` tinted at 20% fill, border 1.5px `#D64545`.

### Chips & Badges
- Continuous streak chips feature Antique Gold glyphs (`#E0B04A`) on an `#12294A` pill with a `rgba(224, 176, 74, 0.25)` outline.
- Category indicators utilize concise 11px uppercase labels with +0.04em tracking.

### Avatar System (Aniconic Rule)
- Human and animal depictions are strictly prohibited.
- User and opponent profiles feature geometric avatars: an interlocking octagram, stylized arabesque spirals, or typographic monogram seals set inside an ornamental gold border.

### Divider & Ornamentation
- Horizontal section dividers utilize a 1px gradient line (`transparent` -> `rgba(224, 176, 74, 0.4)` -> `transparent`) centered with an 8-pointed miniature star glyph.