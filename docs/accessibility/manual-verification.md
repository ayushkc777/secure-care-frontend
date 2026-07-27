# Manual accessibility verification

Target: WCAG 2.2 AA where practical. Automated JSX rules, Testing Library assertions and
axe checks are gates, but they do not replace this pass.

- Complete every public authentication and protected workflow with keyboard only. Confirm
  the skip link, menus, forms, dialogs and tables have a visible focus indicator and logical
  order.
- At 320 CSS pixels and at 200% zoom, confirm there is no two-dimensional page scrolling;
  wide tables may scroll inside their labelled keyboard-focusable regions.
- Trigger empty, loading, validation, API failure and conflict states. Confirm errors are
  announced, focus moves to the summary, and entered non-secret values are not unexpectedly
  lost.
- Open confirmation dialogs, check initial focus, Tab/Shift+Tab containment, Escape, button
  names and focus restoration.
- With VoiceOver or NVDA, inspect landmarks, heading order, form labels, status/alert
  announcements, table captions/headers and chart text alternatives.
- Check text, controls and status colours with a contrast analyser. The jsdom axe run disables
  colour-contrast because it cannot compute rendered colours; this item remains manual.
- Enable reduced motion and confirm transitions do not depend on animation.

Record browser, assistive technology, viewport, date, failures and screenshots. Current
limitation: no formal audit by disabled users or assistive-technology specialists has been
performed.
