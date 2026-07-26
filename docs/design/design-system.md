# SecureCare interface design system

The interface is designed for calm, high-attention childcare operations. It uses local
React components and CSS tokens so the application does not depend on a generic dashboard
framework.

## Foundations

- Canvas: `#f4f7f6`; surface: `#ffffff`; primary text: `#142d33`.
- Primary action: muted teal `#0d7069`; red is reserved for destructive or dangerous
  actions.
- Success, warning, danger and information each have distinct text and soft-background
  tokens. Status is always conveyed by text as well as colour.
- The spacing rhythm is based on 0.25rem increments, with operational surfaces generally
  using 1rem to 2.25rem.
- Radius tokens range from 0.5rem to 1.25rem. Shadows remain subtle so borders and spacing,
  rather than decoration, establish hierarchy.
- Headings use a compact responsive scale. Body text retains a readable line height and
  system fonts avoid a third-party font request.

## Components

- `PageHeader` establishes the eyebrow, page title, description and page-level actions.
- `StatusBadge` maps lifecycle values to semantic tones while retaining the status text.
- `AlertBanner` provides consistent success, warning, danger and information feedback.
- `EmptyState` gives an explicit explanation and an optional authorised next action.
- `Skeleton` indicates pending record content without presenting fabricated values.
- `ConfirmDialog` is the sensitive-action modal. It has an accessible name and description,
  handles Escape, moves initial focus to Cancel and restores the triggering focus.
- Existing primary, secondary and danger button classes share minimum sizes and focus
  treatment. Native workflow buttons inherit the same control baseline.

## Layout and responsive behaviour

The desktop shell uses a fixed 17rem sidebar, a compact sticky top bar and a bounded content
workspace. Below 56rem, the sidebar becomes an explicitly controlled modal navigation drawer.
Below 40rem, page actions, forms and attendance controls become full-width, while dense tables
remain inside labelled controlled-scroll containers. The application supports a minimum
320px viewport and avoids global horizontal overflow.

## Accessibility

All interactive elements receive a visible `:focus-visible` indicator and a minimum practical
touch target. Form errors use alert semantics, error summaries receive focus, and the shell
retains the skip link and semantic landmarks. Motion is disabled under
`prefers-reduced-motion: reduce`. Colour is not the sole status indicator.

## Security boundaries

Navigation is derived only from server-provided access data. Hidden links are a usability
control, never the authorisation boundary. The redesign does not place child, incident,
pickup, attendance, health or medication data in browser storage and does not alter CSRF,
route-guard, validation or API behaviour.
