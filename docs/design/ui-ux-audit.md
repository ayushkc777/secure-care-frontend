# SecureCare UI/UX audit

Audit date: 26 July 2026

## Scope

The existing React application, shared styles, route shell, authentication screens,
centre/child records, access management, pickup, incidents, safeguarding, attendance,
security records, and Phase 11 health and medication workflows were reviewed. Routes,
permissions, API contracts, CSRF handling and sensitive-data storage boundaries are not
being redesigned.

## Findings before redesign

- The single horizontal header does not scale to the number of role-aware workspaces and
  has no deliberate mobile navigation.
- Most pages use one large white card, so headings, summaries, forms, destructive actions
  and record lists compete at the same visual level.
- Typography is readable but the heading scale is oversized for operational screens and
  section spacing varies across long workflows.
- Native buttons outside `.primary-button`, `.secondary-button` and `.danger-button` are
  visually inconsistent. Form focus styling covers inputs but not every select or textarea.
- Loading is usually represented by changing a heading or by an empty screen. Empty states
  are generally plain paragraphs and success feedback lacks a consistent component.
- Record lists are responsive, but dense attendance, pickup, incident and health actions
  do not have a common action grouping or status treatment.
- Attendance shows raw child identifiers, flat status text and unqualified room counts;
  capacity, lateness and lifecycle state are not visually scannable.
- Several foundation routes remain placeholder-only and look unfinished.
- Security and access pages expose long identifiers without enough visual hierarchy or
  truncation support.
- Confirmation dialog focus enters the dialog, but Escape handling, focus restoration and
  a labelled modal surface are missing.
- Responsive behavior relies primarily on wrapping. There is no sidebar collapse,
  mobile-menu control, stable content header, or intentional narrow-screen form layout.
- The existing palette is appropriate, but semantic information, warning and danger tokens
  are repeated as literal colours rather than a documented design system.

## Redesign direction

Use a calm off-white canvas, white operational surfaces, deep navy text, restrained teal
actions and semantic green/amber/red/blue feedback. A responsive role-aware sidebar and
compact top bar provide consistent orientation. Shared page headers, badges, empty states,
skeletons, alerts and section surfaces create hierarchy without introducing a UI framework.

The redesign must retain server-authoritative permission decisions, route guards, strict
validation, CSRF behavior and the prohibition on sensitive browser storage.
