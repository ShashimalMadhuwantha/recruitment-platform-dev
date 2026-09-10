---
name: recruitment-platform-frontend-design
description: Use this skill whenever designing, styling, or building any UI page or component for the Recruitment & ATS Platform frontend (React + TypeScript + Vite + Tailwind CSS). Defines the concrete design system — color theme, typography, spacing, component patterns for forms/tables/kanban boards/score visualizations, role-specific layouts (Super Admin, Recruiter, Applicant), responsive rules, and accessibility requirements. Always consult this skill before creating a new page, a new component, or applying any color/spacing/typography choice on this project, so the visual design stays consistent across all three roles. Trigger for ANY frontend styling, layout, component, or "make this look better" request on this project, even without the word "design" — e.g. "build the applicant dashboard", "style the job posting form", "show the ATS score breakdown", "make the kanban board".
---

# Recruitment & ATS Platform — Frontend Design Skill

This skill defines the concrete visual design system for the platform. It is deliberately specific — not generic SaaS-template defaults — so the product feels considered rather than templated. It covers theme, layout, and components; for folder structure and how components connect to data, see the companion skill `recruitment-platform-dev`.

## Design principles for this product

- **Trust and clarity over decoration.** This is a tool people use to make hiring decisions and career decisions — both high-stakes. Favor calm, legible layouts over flashy visuals. No gradients, no marketing-site flourishes, no decorative motion.
- **The ATS score is the product's signature element.** It appears everywhere (applicant dashboards, recruiter pipelines, comparison views) and must be instantly readable at a glance, consistently styled every time it appears.
- **Three roles, one visual language, different emphasis.** Don't reskin the whole app per role — reuse the same components and theme, but let each role's primary view emphasize what that role needs (Applicant → progress and clarity; Recruiter → density and comparison; Admin → oversight and control).
- **Avoid the generic AI-generated SaaS look**: no near-black-with-one-neon-accent, no identical rounded cards with the same soft shadow on everything, no tracked-out ALL-CAPS eyebrow labels, no arrow (→) tacked onto every button label. Every color and spacing choice below exists for a specific reason in this product — deviating should also be deliberate, not a slide back into defaults.

## 1. Color theme

**Base palette** — defined as Tailwind CSS custom colors (add to `tailwind.config.js` under `theme.extend.colors`):

| Token | Hex | Usage |
|---|---|---|
| `brand-900` | `#1B2A4A` | Primary text on light surfaces, headers, nav background |
| `brand-600` | `#2F4B8C` | Primary buttons, links, active states, focus rings |
| `brand-100` | `#E4E9F5` | Selected-row backgrounds, subtle highlights |
| `surface` | `#FFFFFF` | Card/page backgrounds |
| `surface-muted` | `#F6F7FA` | App background behind cards |
| `border-default` | `#DFE3EA` | All hairline borders/dividers |
| `text-primary` | `#1B2330` | Body text |
| `text-secondary` | `#5B6472` | Secondary/meta text, labels |
| `text-muted` | `#8B93A1` | Placeholder text, disabled states |

**ATS score color bands** — this is the product's most important semantic color use. Applied consistently everywhere a match score appears (badges, progress rings, table cells):

| Score range | Token | Hex | Meaning |
|---|---|---|---|
| 80–100% | `score-high` | `#1E7A4C` (text) / `#E3F5EA` (bg) | Strong match |
| 50–79% | `score-mid` | `#A5690B` (text) / `#FBF0DD` (bg) | Partial match |
| 0–49% | `score-low` | `#B3423A` (text) / `#FBE9E7` (bg) | Weak match |

Always pair the score number with its color band **and** a text label ("Strong match" / "Partial match" / "Weak match") — never rely on color alone (accessibility, and colorblind recruiters/applicants).

**Role accent (subtle, used only for a small nav/header indicator, not full re-theming):**

| Role | Accent | Hex |
|---|---|---|
| Applicant | Blue-leaning brand | `brand-600` (`#2F4B8C`) |
| Recruiter | Teal | `#0F766E` |
| Super Admin | Slate | `#3F4A5C` |

**Semantic states** (used across all roles, not role-specific):

| State | Hex |
|---|---|
| Success | `#1E7A4C` |
| Warning | `#A5690B` |
| Danger/error | `#B3423A` |
| Info | `#2F4B8C` (same as brand-600) |

Never introduce a new color outside this table without updating this file — the palette is intentionally small (9 tokens + 3 score bands) so the product doesn't drift into a rainbow of ad hoc hex values.

## 2. Typography

- **Font family:** `Inter` for all UI text (body, labels, buttons) — clean, highly legible at small sizes, standard for data-dense SaaS. Load via `fonts.googleapis.com` (allowed CDN) or self-host.
- **Type scale** (Tailwind text-size tokens, use consistently — don't invent one-off sizes):

| Use | Tailwind class | Size / weight |
|---|---|---|
| Page title | `text-2xl font-semibold` | 24px / 600 |
| Section heading | `text-lg font-semibold` | 18px / 600 |
| Card title | `text-base font-medium` | 16px / 500 |
| Body text | `text-sm` | 14px / 400 |
| Meta/secondary text | `text-xs text-secondary` | 12px / 400 |
| Score number (large display) | `text-3xl font-bold` | 30px / 700 — the one place a heavier weight is used, because the score is the single most important number on the page |

- Sentence case everywhere — never Title Case, never ALL CAPS (including labels, buttons, and nav items).
- Line length for any paragraph/description text: keep under ~75 characters by constraining container width (`max-w-prose` or explicit `max-w-[560px]`).

## 3. Spacing & layout grid

- Base spacing unit: **4px**, using Tailwind's default scale (`p-1` = 4px, `p-2` = 8px, etc.) — don't use arbitrary pixel values.
- Card padding: `p-6` (24px) standard, `p-4` (16px) for dense table-like cards (e.g. kanban cards).
- Page layout: fixed left sidebar nav (240px, collapsible to 64px icon-only on tablet) + main content area with `max-w-[1280px]` and `px-8` outer padding — applies to Recruiter and Admin. Applicant-facing pages (job search, profile) can go full-width up to `max-w-[1440px]` since they're more content-browsing oriented.
- Grid gaps: `gap-4` (16px) for card grids, `gap-2` (8px) for tightly related items (e.g. filter chips).
- Border radius: `rounded-lg` (8px) for cards and inputs, `rounded-full` for badges/pills and avatars. Never mix — pick 8px as the one non-pill radius across the whole product.
- Shadows: use sparingly — `shadow-sm` only on floating elements (dropdowns, modals, toasts). Cards on the page surface use a `border border-border-default` instead of a shadow — flat design, not the generic "soft shadow on every card" SaaS look.

## 4. Core components

Build these once in `frontend/src/components/ui/` and reuse everywhere — don't restyle per page.

- **Button** — variants: `primary` (brand-600 fill), `secondary` (outline, brand-600 border/text), `ghost` (no border, text only), `danger` (for destructive actions like reject/delete). One consistent height (`h-10`) and padding (`px-4`) across all variants.
- **ScoreBadge** — the component used everywhere an ATS score appears. Props: `score: number`, `size: 'sm' | 'md' | 'lg'`. Renders the number, color band background/text from §1, and label. `lg` size (used on the applicant's own score-breakdown page and the recruiter's candidate detail view) includes a horizontal progress bar beneath it.
- **ScoreBreakdown** — expandable panel showing the five sub-scores (skills/experience/education/semantic/certifications) as horizontal bars with their weight and matched/missing detail — built once, used identically on both the applicant-facing and recruiter-facing score views (same data, same component, just gated by role for which actions show, per SRS §4.4).
- **DataTable** — for applicant lists, candidate lists, admin user lists. Supports sortable columns, row selection (for bulk actions), and a built-in empty state.
- **KanbanBoard / KanbanCard** — the recruiter pipeline view (Applied → Screening → Shortlisted → Interview → Offer → Hired → Rejected). Each `KanbanCard` shows candidate name, `ScoreBadge` (`sm`), and a compact avatar — kept intentionally minimal since recruiters scan many cards at once.
- **StatusPill** — small rounded-full label for application status (Applied, Under Review, Shortlisted, etc.) and job status (Draft, Published, Closed) — uses the semantic-state colors from §1, never the score-band colors (status and match score are different concepts and must never share a color language).
- **FormField** — label + input/select/textarea + inline validation error (13px, `text-danger`, appears directly below the field, never a toast for field-level validation).
- **EmptyState** — icon + one-line message + one primary action. Used for "no applications yet", "no candidates match your filters", etc. — always actionable, never just "Nothing here."
- **Toast/notification** — top-right, auto-dismiss after 4s for success, persistent until dismissed for errors.

## 5. Role-specific layout patterns

- **Applicant** — dashboard-first: profile completeness front and center, application-status list below, "jobs matching your profile" as a secondary panel. Job search is a separate full-width page (filters left rail, results grid). CV builder is a focused single-column editor, no sidebar distraction.
- **Recruiter** — pipeline-first: the Kanban board (§4) is the default landing view for a job. Candidate list view (DataTable) is the alternate/filterable view for the same data. Job creation is a multi-step form (basics → requirements/skills → ATS weights → screening questions → review) rather than one long form — each step gets its own progress indicator, no numbered "01/02/03" badges (that's a sequence marker, and this genuinely is a sequence, so a simple progress bar of dots is fine, not decorative numbering).
- **Super Admin** — table-and-panel oriented: left nav lists admin sections (Companies, Users, Moderation, Config, Analytics, Billing), each opening a DataTable with a detail drawer (slide-over panel from the right) rather than full page navigation for record detail — keeps the admin fast for high-volume moderation/support tasks.

## 6. Responsive breakpoints

Use Tailwind defaults, applied consistently:

| Breakpoint | Width | Behavior |
|---|---|---|
| Base (mobile) | <640px | Single column everywhere; sidebar nav becomes a bottom tab bar (Applicant) or a hamburger drawer (Recruiter/Admin, since those roles are desktop-primary but must still function on mobile) |
| `sm` | ≥640px | Two-column forms where it makes sense (e.g. profile fields) |
| `md` | ≥768px | Sidebar nav appears as icon-only rail |
| `lg` | ≥1024px | Full sidebar with labels; Kanban board shows all pipeline stages side-by-side (scroll below this) |
| `xl` | ≥1280px | Max content width reached, extra space stays as margin, not stretched content |

Recruiter and Admin experiences are desktop-primary (per SRS NFR-13, responsive is required, but design for desktop first and verify down to tablet/mobile). Applicant experience must feel equally good on mobile, since job seekers frequently browse and apply from a phone — design applicant flows mobile-first.

## 7. States every screen needs

Every data-driven view (list, dashboard, detail page) must explicitly design for:
- **Loading** — skeleton placeholders matching the final layout's shape, not a generic spinner, for any view that takes more than ~300ms (list views, score computation).
- **Empty** — use the `EmptyState` component (§4), written in the product's voice: plain, direct, action-oriented ("No applications yet — browse open roles to get started," not "No data found").
- **Error** — inline, specific, and actionable where possible ("Couldn't load candidates — retry" with a retry button), never a raw error code shown to the user.

## 8. Accessibility (non-negotiable, per SRS NFR-12)

- Every interactive element has a visible focus ring (`focus-visible:ring-2 ring-brand-600`) — never remove outline without replacing it.
- Color is never the only signal — score bands and status pills always pair color with a text label (§1).
- All form fields have associated `<label>` elements, not placeholder-only labeling.
- Modals and slide-over panels trap focus and are closable via `Escape`.
- Minimum contrast ratio 4.5:1 for body text against its background — check any new color pairing against this before shipping (the palette in §1 is pre-checked; only flag if introducing something new).
