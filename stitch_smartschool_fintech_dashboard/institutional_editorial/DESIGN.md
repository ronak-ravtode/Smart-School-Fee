---
name: Institutional Editorial
colors:
  surface: '#faf9f8'
  surface-dim: '#dadad9'
  surface-bright: '#faf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f2'
  surface-container: '#eeeeed'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e1'
  on-surface: '#1a1c1c'
  on-surface-variant: '#464742'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f0f0'
  outline: '#767872'
  outline-variant: '#c7c7c0'
  surface-tint: '#5f5e5d'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1c1a'
  on-primary-container: '#858382'
  inverse-primary: '#c9c6c4'
  secondary: '#5f5e5d'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfdd'
  on-secondary-container: '#636261'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#380d00'
  on-tertiary-container: '#e45415'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e0'
  primary-fixed-dim: '#c9c6c4'
  on-primary-fixed: '#1c1c1a'
  on-primary-fixed-variant: '#474745'
  secondary-fixed: '#e5e2e0'
  secondary-fixed-dim: '#c8c6c4'
  on-secondary-fixed: '#1c1c1b'
  on-secondary-fixed-variant: '#474745'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#822800'
  background: '#faf9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e3e2e1'
  canvas-cream: '#F3F0EE'
  ink-black: '#141413'
  lifted-cream: '#FCFBFA'
  signal-orange: '#CF4500'
  light-signal-orange: '#F37338'
  clay-brown: '#9A3A0A'
  link-blue: '#3860BE'
  dust-taupe: '#D1CDC7'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 64px
    fontWeight: '500'
    lineHeight: 64px
    letterSpacing: -1.28px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.8px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.72px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 28.8px
    letterSpacing: -0.48px
  eyebrow:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.56px
  body:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '450'
    lineHeight: 22.4px
  nav-button:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.48px
  footer-link:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '450'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  section-lg: 128px
  section-md: 96px
  section-sm: 64px
  card-padding: 40px
  gutter: 48px
  margin-mobile: 24px
  max-width: 1280px
---

## Brand & Style

This design system embodies an **Institutional Editorial** aesthetic, merging the authority of a global financial institution with the warmth and sophisticated pacing of a high-end magazine. The personality is confident, warm, and premium, intentionally distancing itself from "cold" technology tropes through the use of organic palettes and generous whitespace.

The design narrative is centered around **Orbits and Constellations**—a visual metaphor for connectivity and motion. This is achieved through circular masking, satellite-style call-to-actions, and delicate orbital arcs that guide the eye across the canvas. The layout prioritizes a deliberate reading pace, using whitespace as a structural element rather than just a void.

The visual style is a blend of **Minimalism** and **Atmospheric Depth**, utilizing "soft-touch" surfaces and oversized border radii to create a tactile, approachable interface that remains fundamentally professional and trustworthy.

## Colors

The palette is anchored by **Canvas Cream**, which replaces standard white as the primary surface to provide a warmer, more sophisticated backdrop. **Ink Black** serves as the primary engine for typography and high-contrast UI elements.

**Signal Orange** is reserved for critical paths: compliance, legal requirements, and high-priority status indicators. It should be used sparingly to maintain its "signal" value. **Light Signal Orange** is utilized for decorative orbital elements and subtle UI state indicators.

**Lifted Cream** and **Soft Bone** are used to create "paper-on-paper" layering, providing subtle depth without relying on heavy shadows. The iconic brand colors (red/yellow) are strictly omitted from the UI components, reserved exclusively for the brand mark to maintain institutional dignity.

## Typography

This design system utilizes a geometric sans-serif (Hanken Grotesk) to achieve a precise, modern feel. The most distinctive feature is the **450 weight** used for body copy, providing a "half-step" weight that feels more substantial than a standard regular but lighter than a medium, enhancing readability on cream backgrounds.

Headlines are characterized by a tight **-2% tracking** and 500 weight, creating a compact, impactful display style. **Eyebrow text** should always be uppercase with an increased letter-spacing of +4% and often paired with a Signal Orange leading dot. For mobile displays, H1 elements must scale down to 40px to ensure accessibility and visual balance.

## Layout & Spacing

The layout follows a strict **8px rhythm** within a 12-column fluid grid. To maintain the editorial feel, whitespace is applied aggressively; section padding rarely drops below 96px on desktop. 

Content is centered within a maximum width of 1280px, with generous gutters to prevent "edge-to-edge" fatigue. On mobile devices, section padding scales down to 48px or 64px to maintain momentum, and horizontal margins are fixed at 24px. Use high-density internal padding (32px-40px) for cards to ensure they feel substantial and "lifted" from the Canvas Cream background.

## Elevation & Depth

Elevation is treated as **atmospheric cushioning** rather than a directional light source. The system avoids hard, dark shadows in favor of extra-diffused, low-opacity "halos" that create a sense of soft lift.

- **Subtle Lift:** Used for floating navigation pills. 24px spread with 4% opacity.
- **Hero/Card Lift:** Used for media frames and primary cards. 48px spread with 8% opacity.
- **Feature Depth:** Reserved for rare high-impact tiles. 110px spread with 25% opacity.

Depth is also communicated through **Visual Layering**: Large "watermark" typography in Watermark Cream (#E8E2DA) is placed behind foreground imagery, creating a pressed-paper effect that adds verticality without increasing visual noise.

## Shapes

The shape language is defined by **extreme, oversized radii** that reinforce the friendly yet institutional tone. The system avoids traditional 8px/12px corners entirely, opting for "editorial-scale" curves.

- **20px (Signature):** Used for all primary and secondary CTA buttons.
- **40px (Frame):** Used for hero media containers and large section backgrounds.
- **999px (Pill):** Standard for navigation bars, carousel indicators, and text inputs.
- **50% (Circular):** Strictly used for service portraits and "Satellite" icon buttons.

Circular masks are a core brand motif; square images should be aggressively cropped into perfect circles or stadium shapes.

## Components

### Buttons
Primary buttons use an Ink Black fill with Canvas Cream text, featuring a 20px radius. Secondary buttons are often outlined (1.5px) or appear as "Satellite CTAs"—50px white circles with an arrow icon, typically docked to the bottom-right of circular portraits.

### Input Fields
Inputs follow the 999px pill shape with a 1px border at 50% opacity. Labeling should be clear and utilize the "Nav/Button" typography spec for compactness.

### Cards
Cards use either a White or Lifted Cream background to distinguish them from the Canvas Cream page. They feature 32px-40px internal padding and Level 2 elevation. Corner radii for cards should match the 40px "Frame" scale.

### Satellite & Orbitals
Special decorative components include "Orbital Arcs"—thin 1.5px curved lines in Light Signal Orange that visually connect related cards or imagery, suggesting a constellation of services.

### List & Navigation
The navigation bar is a floating pill (999px) with a Level 1 shadow. List items should be generously spaced with 1px dividers in a low-contrast watermark color.