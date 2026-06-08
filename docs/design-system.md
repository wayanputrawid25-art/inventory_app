# Design System

This document outlines the design system for the Inventory App, establishing consistent visual and interaction patterns across the application.

## Typography

### Font Family
- **Primary Font**: Inter (for UI and body text)
- **Fallback Stack**: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

### Type Scale

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| **H1** | 32px | 700 | 1.2 | Page titles, main headings |
| **H2** | 28px | 600 | 1.25 | Section headings |
| **H3** | 24px | 600 | 1.3 | Subsection headings |
| **H4** | 20px | 600 | 1.35 | Card titles, form labels |
| **Body Large** | 16px | 400 | 1.5 | Standard body text, descriptions |
| **Body Regular** | 14px | 400 | 1.5 | Default text, table content |
| **Body Small** | 12px | 400 | 1.4 | Helper text, metadata, captions |
| **Caption** | 11px | 500 | 1.4 | Timestamps, hints, UI labels |

### Font Weights
- **Regular (400)**: Body text, regular content
- **Medium (500)**: Labels, captions, emphasis
- **Semibold (600)**: Subheadings, strong emphasis
- **Bold (700)**: Main headings, critical information

### Text Colors
- **Primary Text**: #1A202C (near-black for dark backgrounds)
- **Secondary Text**: #4A5568 (medium gray for descriptions)
- **Tertiary Text**: #718096 (light gray for helper text)
- **Disabled Text**: #CBD5E0 (disabled state)
- **Error Text**: #E53E3E (errors and warnings)
- **Success Text**: #22543D (success messages)

---

## Spacing

### Spacing Scale
Consistent spacing maintains visual hierarchy and improves usability.

| Token | Size | Usage |
|-------|------|-------|
| **xs** | 4px | Minimal gaps, icon spacing |
| **sm** | 8px | Small padding, tight layouts |
| **md** | 12px | Compact components |
| **lg** | 16px | Standard padding, medium gaps |
| **xl** | 24px | Large sections, section padding |
| **2xl** | 32px | Page margins, major sections |
| **3xl** | 48px | Page top margins, hero sections |
| **4xl** | 64px | Full section spacing |

### Padding Standards
- **Button Padding**: `lg` horizontal (16px) × `md` vertical (12px)
- **Card Padding**: `xl` (24px) all sides
- **Input Padding**: `md` horizontal (12px) × `md` vertical (12px)
- **Page Padding**: `3xl` (48px) top/bottom, `2xl` (32px) left/right

### Margin Standards
- **Section Margin**: `3xl` (48px) bottom between major sections
- **Component Margin**: `lg` (16px) bottom between components
- **Element Margin**: `md` (12px) bottom between elements

---

## Card System

### Card Structure
Cards are the primary container for content, providing visual separation and organization.

```
┌─────────────────────────────────────┐
│  Card Header (Optional)             │
├─────────────────────────────────────┤
│                                     │
│  Card Content                       │
│                                     │
├─────────────────────────────────────┤
│  Card Footer (Optional)             │
└─────────────────────────────────────┘
```

### Card Variants

#### Default Card
- **Background**: #FFFFFF
- **Border**: 1px solid #E2E8F0
- **Border Radius**: 8px
- **Box Shadow**: 0px 1px 3px rgba(0, 0, 0, 0.1)
- **Padding**: 24px (lg)

#### Elevated Card
- **Background**: #FFFFFF
- **Border**: None
- **Border Radius**: 8px
- **Box Shadow**: 0px 4px 6px rgba(0, 0, 0, 0.07), 0px 10px 20px rgba(0, 0, 0, 0.05)
- **Padding**: 24px (lg)

#### Ghost Card
- **Background**: #F7FAFC
- **Border**: 1px solid #E2E8F0
- **Border Radius**: 8px
- **Box Shadow**: None
- **Padding**: 24px (lg)

#### Interactive Card
- **Background**: #FFFFFF
- **Border**: 1px solid #E2E8F0
- **Border Radius**: 8px
- **Hover State**: Border changes to #CBD5E0, shadow increases
- **Cursor**: pointer

### Card Components
- **Header**: H4 typography, `lg` bottom padding
- **Title**: H4 weight and size
- **Subtitle**: Body small, secondary text color
- **Content**: Body regular or small text
- **Footer**: Body small, typically right-aligned

---

## Color System

### Brand Colors

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| **Primary Blue** | #2563EB | 37, 99, 235 | Primary actions, links, highlights |
| **Primary Dark** | #1E40AF | 30, 64, 175 | Hover state, darker contexts |
| **Primary Light** | #DBEAFE | 219, 238, 254 | Backgrounds, disabled states |

### Semantic Colors

| Semantic | Hex Code | RGB | Usage |
|----------|----------|-----|-------|
| **Success** | #10B981 | 16, 185, 129 | Success states, confirmations |
| **Warning** | #F59E0B | 245, 158, 11 | Warnings, cautions |
| **Error** | #EF4444 | 239, 68, 68 | Errors, critical alerts |
| **Info** | #3B82F6 | 59, 130, 246 | Information, neutral states |

### Neutral Colors

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| **White** | #FFFFFF | 255, 255, 255 | Backgrounds, text on dark |
| **Gray 50** | #F9FAFB | 249, 250, 251 | Light backgrounds |
| **Gray 100** | #F3F4F6 | 243, 244, 246 | Subtle backgrounds |
| **Gray 200** | #E5E7EB | 229, 231, 235 | Borders, dividers |
| **Gray 300** | #D1D5DB | 209, 213, 219 | Secondary borders |
| **Gray 400** | #9CA3AF | 156, 163, 175 | Disabled elements |
| **Gray 500** | #6B7280 | 107, 114, 128 | Secondary text |
| **Gray 600** | #4B5563 | 75, 85, 99 | Primary text |
| **Gray 700** | #374151 | 55, 65, 81 | Strong text |
| **Gray 800** | #1F2937 | 31, 41, 55 | Dark text |
| **Gray 900** | #111827 | 17, 24, 39 | Darkest text |

### Color Applications

#### Backgrounds
- **Primary Background**: #FFFFFF (white)
- **Secondary Background**: #F9FAFB (gray 50)
- **Tertiary Background**: #F3F4F6 (gray 100)

#### Borders
- **Primary Border**: #E5E7EB (gray 200)
- **Secondary Border**: #D1D5DB (gray 300)
- **Disabled Border**: #E5E7EB (gray 200)

#### Text
- **Primary Text**: #1F2937 (gray 800)
- **Secondary Text**: #4B5563 (gray 600)
- **Tertiary Text**: #9CA3AF (gray 400)

---

## Button System

### Button Variants

#### Primary Button
- **Background**: #2563EB (primary blue)
- **Text Color**: #FFFFFF (white)
- **Border**: None
- **Padding**: 12px (md) vertical × 16px (lg) horizontal
- **Border Radius**: 6px
- **Font Weight**: 600 (semibold)
- **Font Size**: 14px (body regular)
- **Hover**: Background #1E40AF (primary dark)
- **Active**: Background #1E3A8A (darker)
- **Disabled**: Background #CBD5E0 (gray 200), cursor not-allowed
- **Box Shadow**: None

#### Secondary Button
- **Background**: #F3F4F6 (gray 100)
- **Text Color**: #1F2937 (gray 800)
- **Border**: 1px solid #E5E7EB (gray 200)
- **Padding**: 12px (md) vertical × 16px (lg) horizontal
- **Border Radius**: 6px
- **Font Weight**: 600 (semibold)
- **Font Size**: 14px (body regular)
- **Hover**: Background #E5E7EB (gray 200)
- **Active**: Background #D1D5DB (gray 300)
- **Disabled**: Background #F9FAFB (gray 50), text #CBD5E0 (gray 200)

#### Ghost Button
- **Background**: transparent
- **Text Color**: #2563EB (primary blue)
- **Border**: 1px solid #2563EB (primary blue)
- **Padding**: 12px (md) vertical × 16px (lg) horizontal
- **Border Radius**: 6px
- **Font Weight**: 600 (semibold)
- **Font Size**: 14px (body regular)
- **Hover**: Background #DBEAFE (primary light)
- **Active**: Background #BFDBFE (lighter primary)
- **Disabled**: Text #CBD5E0 (gray 200), border #CBD5E0 (gray 200)

#### Danger Button
- **Background**: #EF4444 (error red)
- **Text Color**: #FFFFFF (white)
- **Border**: None
- **Padding**: 12px (md) vertical × 16px (lg) horizontal
- **Border Radius**: 6px
- **Font Weight**: 600 (semibold)
- **Font Size**: 14px (body regular)
- **Hover**: Background #DC2626 (darker red)
- **Active**: Background #B91C1C (darkest red)
- **Disabled**: Background #CBD5E0 (gray 200)

#### Success Button
- **Background**: #10B981 (success green)
- **Text Color**: #FFFFFF (white)
- **Border**: None
- **Padding**: 12px (md) vertical × 16px (lg) horizontal
- **Border Radius**: 6px
- **Font Weight**: 600 (semibold)
- **Font Size**: 14px (body regular)
- **Hover**: Background #059669 (darker green)
- **Active**: Background #047857 (darkest green)
- **Disabled**: Background #CBD5E0 (gray 200)

### Button Sizes

| Size | Padding | Font Size | Usage |
|------|---------|-----------|-------|
| **Small** | 8px (sm) × 12px (md) | 12px (small) | Compact actions, table rows |
| **Medium** | 12px (md) × 16px (lg) | 14px (regular) | Standard actions, forms |
| **Large** | 16px (lg) × 24px (xl) | 16px (large) | Primary actions, hero sections |

### Button States

#### Default
- Standard styling as per variant

#### Hover
- Slight background color shift
- Cursor changes to pointer
- Optional: subtle shadow increase

#### Active/Pressed
- Darker background color
- Possibly slight inset shadow

#### Disabled
- Background becomes #CBD5E0 (gray 200)
- Text becomes #A0AEC0 (gray 300)
- Cursor becomes not-allowed
- No hover effects

#### Focus (Accessibility)
- 2px solid outline in primary blue (#2563EB)
- 2px offset from button edge
- Applies to all button variants

### Button States with Icons
- **Icon Position**: Left of text (default) or right of text
- **Icon Spacing**: 8px (sm) between icon and text
- **Icon Size**: 16px × 16px (standard)
- **Icon Alignment**: Vertically centered with text

### Button Groups
- **Spacing**: 8px (sm) between buttons
- **Layout**: Horizontal (default) or vertical (mobile/compact)
- **Alignment**: Left, center, or right (context-dependent)

---

## Implementation Guidelines

### Usage Recommendations

1. **Always use semantic colors** for states (error, success, warning)
2. **Maintain consistent spacing** using the spacing scale
3. **Apply typography scale** for hierarchy and clarity
4. **Use cards** to organize related content
5. **Follow button hierarchy**: Primary for main actions, secondary for alternatives
6. **Test contrast ratios** to ensure WCAG AA compliance (minimum 4.5:1)

### Responsive Adjustments

- **Mobile**: Reduce padding and margins by 1 level (e.g., xl → lg)
- **Tablet**: Standard scale applies
- **Desktop**: Standard scale with optional increases for spacious layouts

### Accessibility

- All text must meet WCAG AA contrast requirements (4.5:1 for normal text)
- Color should not be the only indicator of state
- Disabled states must be visually distinct
- Focus states must be clearly visible
- All interactive elements must be keyboard accessible

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-08 | Initial design system documentation |

