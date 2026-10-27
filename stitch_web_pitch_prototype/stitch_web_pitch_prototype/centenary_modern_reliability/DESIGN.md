---
name: Centenary Modern Reliability
colors:
  surface: '#f9f9fe'
  surface-dim: '#dad9de'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f8'
  surface-container: '#eeedf2'
  surface-container-high: '#e8e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#43474f'
  inverse-surface: '#2f3034'
  inverse-on-surface: '#f1f0f5'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#006d40'
  on-secondary: '#ffffff'
  secondary-container: '#8af5b4'
  on-secondary-container: '#007243'
  tertiary: '#2c1b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#472f00'
  on-tertiary-container: '#cf9000'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#8df8b7'
  secondary-fixed-dim: '#70db9d'
  on-secondary-fixed: '#002110'
  on-secondary-fixed-variant: '#00522f'
  tertiary-fixed: '#ffdead'
  tertiary-fixed-dim: '#ffba3b'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#604100'
  background: '#f9f9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e7'
  status-success: '#008751'
  status-warning: '#F2A900'
  status-error: '#D32F2F'
  status-info: '#0288D1'
  surface-admin: '#F8FAFC'
  surface-field: '#FFFFFF'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter-sm: 16px
  gutter-lg: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width-admin: 1440px
---

## Brand & Style

The design system is built on the intersection of **heritage banking reliability** and **agile fintech innovation**. It serves two distinct environments: a high-density administrative cockpit for back-office operations and a rugged, high-utility field application for rural loan officers.

### Design Style: Corporate Modern / Fintech
We employ a **Corporate Modern** aesthetic infused with "Fintech" clarity. This means:
- **Administrative Precision:** A layout optimized for information density without sacrificing legibility, utilizing a structured grid and subtle tonal layering.
- **Field Resilience:** For the mobile experience, the "human touch" is achieved through larger tap targets, high-contrast status indicators (Red/Amber/Green), and a clear sense of hierarchy that guides the user through complex KYC processes.
- **Atmosphere:** Professional, secure, and technologically advanced. The UI should feel like a high-performance tool—utilitarian but refined.

## Colors

The palette is anchored by **Centenary Blue** (`#003366`), evoking deep-seated institutional trust, and **Growth Green** (`#008751`), representing the bank's mission of financial inclusion and agricultural roots in Malawi.

- **Primary (Centenary Blue):** Used for headers, primary actions, and brand-identifying elements.
- **Secondary (Growth Green):** Used for "Success" states, loan approvals, and secondary navigational accents.
- **Tertiary (Warm Gold):** Reserved for "Pending" or "Amber" states in the scoring engine and highlighting premium features.
- **Neutral (Slate Grays):** A sophisticated range of grays from `#1E293B` (text) to `#F8FAFC` (backgrounds) ensures a clean, modern interface that reduces eye strain during long admin sessions.

**Accessibility Note:** All color pairings for text must maintain a minimum 4.5:1 contrast ratio. Status colors (RAG tiering) must always be accompanied by icons or text labels to support color-blind accessibility.

## Typography

This design system uses a tri-font strategy to balance authority, readability, and technical precision.

1.  **IBM Plex Sans (Headlines):** Chosen for its "industrial-humanist" balance. It reflects the bank’s corporate strength while remaining approachable.
2.  **Inter (Body & UI):** The gold standard for modern SaaS and mobile interfaces. Its high x-height ensures maximum legibility for field officers under direct sunlight or low-light conditions.
3.  **JetBrains Mono (Technical Data):** Used specifically for account numbers, transaction hashes, JEXL scoring formulas, and audit logs. The monospaced nature prevents "character jumping" in high-density data tables.

## Layout & Spacing

The design system utilizes a **base 4px grid** to ensure mathematical harmony across all components.

### Administrative Dashboard (Fixed-Fluid Mix)
- **Grid:** 12-column system.
- **Sidebar:** Fixed at 280px to accommodate deep navigation trees (Loan Products > Sub-products).
- **Content:** Fluid width with a maximum of 1440px to prevent excessive line lengths on ultra-wide monitors.
- **Density:** "Compact" spacing for data tables and "Comfortable" for configuration wizards.

### Field App (Mobile Web)
- **Grid:** Single column for forms; 2-column for dashboard stat cards.
- **Margins:** 16px safe-area margins.
- **Touch Targets:** Minimum 48x48px for all interactive elements to account for "in-the-field" usage conditions.

## Elevation & Depth

We use **Tonal Layers** as the primary driver of depth, supplemented by soft, functional shadows.

1.  **Surface 0 (Background):** `#F8FAFC`. Used for the main canvas.
2.  **Surface 1 (Cards/Containers):** White (`#FFFFFF`) with a 1px subtle border (`#E2E8F0`).
3.  **Surface 2 (Popovers/Modals):** White with an **Ambient Shadow** (8px blur, 10% opacity Centenary Blue tint) to indicate high-level interaction.
4.  **Field App Exception:** Avoid complex shadows to maintain performance on lower-end mobile devices. Use high-contrast borders (1.5px) to define input areas and card boundaries.

## Shapes

The design system adopts a **Soft (0.25rem / 4px)** roundedness. 

- **Rationale:** Sharp corners feel overly aggressive/dated, while "Pill" shapes feel too casual for a commercial bank. The 4px radius provides a modern, professional look that fits the "structured" nature of banking forms and data tables.
- **Buttons:** Use 4px radius for standard actions.
- **Status Badges:** Use 12px (rounded-full) for "Red/Amber/Green" tiering indicators to make them feel like distinct status lights.

## Components

### Buttons
- **Primary:** Centenary Blue background, White text. High-contrast for "Submit Application" or "Approve."
- **Secondary:** Growth Green outline with Green text. Used for "Add Attachment" or "Save Draft."
- **Tertiary/Ghost:** No background, Blue text. Used for "Cancel" or "Go Back."

### Form Fields (The Core Field App Component)
- **States:** Active, Error (Status-Red border), and Offline-Cached (indicated by a small "sync" icon within the field).
- **Labels:** Always visible above the input (never use floating labels that disappear).
- **Input Types:** Specialized renderers for GPS (including a map preview snippet) and Signature (a large, dedicated canvas area).

### Status Cards (Scoring Engine)
- Use the **RAG (Red-Amber-Green)** system.
- **Decision Cards:** Feature a large numeric score (0-1000) using JetBrains Mono, paired with a clear textual decision (e.g., "STP APPROVE") in all-caps bold.

### Sync Indicators (Field App)
- A persistent "Connectivity Bar" at the top of the mobile app.
- **Sync States:** 
  - *Cloud Icon (Green):* All data synced.
  - *Arrow Icon (Blue):* Sync in progress.
  - *Offline Icon (Amber):* Operating in offline mode; X items pending.

### Data Tables (Admin)
- High-density rows (32px height).
- Alternate row striping for legibility.
- Sticky headers for long audit trail logs.