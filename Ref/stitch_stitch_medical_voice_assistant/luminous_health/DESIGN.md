---
name: Luminous Health
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#414755'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#62fae3'
  on-secondary-container: '#007165'
  tertiary: '#9e3d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c64f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#62fae3'
  secondary-fixed-dim: '#3cddc7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  stack-gap: 16px
  touch-target-min: 48px
  card-padding: 24px
---

## Brand & Style

The design system is centered on a **Modern Minimalist** aesthetic tailored for the healthcare sector. It prioritizes clarity, accessibility, and a sense of calm. The target audience includes patients seeking a friction-less way to manage their health, requiring a UI that feels supportive rather than clinical. 

The emotional response is one of "Guided Ease"—using generous whitespace and a "soft-UI" approach to reduce medical anxiety. The visual language leans into high-quality typography and a spacious layout, ensuring that even complex health data feels approachable and easy to digest.

## Colors

The palette is built on a foundation of "Medical Purity." 

- **Primary (#007AFF):** A vibrant medical blue used for primary actions, critical navigation, and branding. It conveys trust and authority.
- **Secondary (#2DD4BF):** A soft teal used for "health-positive" indicators, such as completed tasks, wellness trends, and supportive UI accents.
- **Backgrounds:** A mix of pure White (#FFFFFF) and Slate-tinted Light Gray (#F8FAFC) to create subtle depth without the need for heavy borders.
- **Accents:** Use subtle gradients (Primary to Secondary) sparingly for high-visibility cards or voice-interaction states to signify energy and activity.

## Typography

This design system utilizes **Plus Jakarta Sans** for its friendly, rounded terminals and exceptional legibility. This choice balances the professional requirements of healthcare with a modern, approachable feel.

- **Scale:** High contrast between headlines and body text to facilitate quick scanning.
- **Weight:** Semi-bold and Bold weights are used for headlines to create a clear information hierarchy.
- **Accessibility:** All body text maintains a minimum size of 16px to accommodate users with varying visual needs. Line heights are kept generous to prevent text-heavy sections from feeling overwhelming.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model optimized for mobile-first interaction. 

- **The 8pt System:** All margins, paddings, and heights are multiples of 8px to ensure a consistent rhythmic flow.
- **Safe Zones:** Content is inset by 24px from the screen edges to provide a "breathing room" effect.
- **Touch Targets:** A strict minimum of 48x48px for all interactive elements, though 56px+ is preferred for primary actions to support ease of use for patients with limited dexterity.
- **Verticality:** Use vertical stacking with 16px or 24px gaps to differentiate content blocks, avoiding horizontal density.

## Elevation & Depth

This design system uses a **Tonal Layering** approach combined with **Ambient Shadows** to create a soft, physical feel.

- **Surfaces:** The base layer is #F8FAFC. Cards and primary containers sit on top in pure #FFFFFF.
- **Shadows:** Use a "soft-glow" shadow profile—low opacity (8-12%), large blur (24px-40px), and a slight Y-offset. Shadows should feel like a natural light source is directly above the device, casting a soft, non-threatening halo.
- **Z-Axis:** 
    - *Level 0 (Base):* Background colors.
    - *Level 1 (Cards):* Soft shadow, white background.
    - *Level 2 (Active/Voice):* Subtle teal-to-blue glow to indicate the system is listening or processing.

## Shapes

The shape language is extremely soft and organic, utilizing **Pill-shaped (3)** logic.

- **Primary Containers:** Use a 24px corner radius as the standard for cards and content sections.
- **Interactive Elements:** Buttons and input fields should utilize a fully rounded (pill) style to look inviting and "squishy."
- **Visual Metaphor:** Avoid sharp 90-degree angles entirely. Every corner should feel smoothed and polished to reinforce the "calm and safe" brand promise.

## Components

### Buttons
Primary buttons are pill-shaped, using the medical blue gradient or solid blue with white text. Height should be 56px to provide a generous touch target. Secondary buttons use a light teal tint with 10% opacity and teal text.

### Voice Interaction Hub
A dedicated floating action button (FAB) or bottom-docked bar that uses a subtle pulse animation and a teal-to-blue gradient. When active, it expands into a full-screen overlay with large-scale typography displaying transcribed text.

### Cards
Health data is housed in large cards (24px radius). Use icons with rounded background containers to categorize data (e.g., a heart icon in a soft red circle for vitals).

### Form Elements
Traditional "cluttered" forms are replaced by **Single-Question-Per-Screen** flows or voice prompts. Input fields are tall (60px), pill-shaped, and use light gray backgrounds instead of borders. Active states are indicated by a soft blue glow rather than a thick stroke.

### Chips
Used for quick-selection (e.g., symptoms or time slots). Chips use a 12px radius and switch from a light gray background to a solid blue background when selected.

### Progress Indicators
Thin, rounded bars using the teal secondary color to show health goals or appointment completion status.