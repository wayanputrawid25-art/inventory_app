# Responsive Strategy

This document defines the responsive strategy for the Inventory App and provides guidelines for Desktop, Tablet, and Mobile breakpoints, layout behavior, and component adjustments to ensure consistent and accessible experiences across devices.

## Breakpoints
- **Desktop**: 1024px and up
- **Tablet**: 600px — 1023px
- **Mobile**: up to 599px

Breakpoints are recommendations; prefer content-driven breakpoints where a component should adapt earlier or later based on real UI needs.

---

## Desktop (>= 1024px)

Layout
- Use a 12-column grid with 24px gutters for complex data layouts and dashboards.
- Page width: center content with a max-width of 1200px–1400px to maintain readability on very large screens.
- Use multi-column layouts for dashboards, lists, and side-by-side panels.

Navigation
- Primary navigation visible in the header or left sidebar (persistent).
- Secondary navigation as top tabs or contextual sidebars.

Typography & Spacing
- Use standard type scale (H1...Body) from the design system.
- Increase heading sizes subtly for improved hierarchy on large screens (e.g., H1 + 2px).
- Use full spacing scale; allow larger margins for breathing room.

Components
- Data tables show full columns; use inline actions and row hover states.
- Cards show additional metadata and actions; tooltips available for dense information.
- Modal dialogs center on screen with larger max-width (up to 800–900px).

Interactions
- Hover states available for affordance (tooltips, hover highlights).
- Keyboard and mouse-first interactions prioritized but preserve accessibility for touch devices.

Performance
- Load high-resolution assets lazily when they enter the viewport.
- Use virtualization for very long lists or large tables.

---

## Tablet (600px–1023px)

Layout
- Use a 8-column grid or a constrained 12-column grid with reduced gutters (16px).
- Page width: fluid layout with comfortable margins; max-width around 900–1024px.
- Prefer single-column stacking for content lists, but allow two-column layouts for dashboards where space permits.

Navigation
- Consider a collapsible left navigation or persistent top navigation.
- Use collapsible side panels for filters and contextual controls.

Typography & Spacing
- Use the standard type scale but reduce excessive large headings by 1 step for balance.
- Reduce spacing scale by one token in dense contexts to fit content.

Components
- Tables may hide less-critical columns or use stacked rows/cards for readability.
- Cards should maintain sufficient padding (16–20px) and support touch-friendly targets.
- Modals should be narrower and have full-screen option on smaller tablets in portrait.

Interactions
- Touch targets must be at least 44px × 44px.
- Replace hover-only affordances with persistent controls or tap-to-reveal alternatives.

Performance
- Serve medium-resolution images; defer heavy assets.

---

## Mobile (<= 599px)

Layout
- Use a single-column fluid layout with 16px page padding (or as defined by the spacing scale: md/lg).
- Avoid multi-column content except for small inline elements.

Navigation
- Use a top header with a hamburger menu or bottom navigation for key destinations.
- Contextual actions should be accessible through floating action buttons (FAB) or bottom sheets when appropriate.

Typography & Spacing
- Use smaller scale options (reduce headings by 1–2 steps where needed).
- Keep line lengths short for readability; stack content vertically.

Components
- Convert tables into responsive stacks, toggles to view detail rows, or horizontal scroll where appropriate.
- Cards should be full-width with touch-friendly padding (12–16px inside), and clear separation between items.
- Use full-screen modals or bottom sheets for complex flows.

Interactions
- All interactive elements must be large enough for touch (>=44px) and have clear visual feedback on touch.
- Minimize hover reliance; provide explicit reveal patterns for tooltips/help.

Performance & Network
- Prioritize critical UI and defer non-essential scripts.
- Use responsive images (srcset, sizes) and optimized formats (AVIF/WebP where supported).
- Implement optimistic UI for actions where possible to improve perceived performance.

Accessibility
- Ensure adequate contrast and readable sizes; implement skip links for keyboard users.
- Provide accessible labels and focus management for dialogs and navigation.

---

## General Guidelines
- Prefer content-driven breakpoints: adapt components when their layout breaks, not strictly at only the listed breakpoints.
- Maintain consistent spacing and typography from the design system; scale down/up thoughtfully rather than arbitrarily changing sizes.
- Test across real devices and simulators (different OS, screen sizes, and pixel densities).
- Ensure touch targets, keyboard navigation, and screen reader accessibility are validated for each breakpoint.
- Use analytics to identify common device sizes and optimize breakpoints for your user base.

## Version History
| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-06-08 | Initial responsive strategy document |
