# نظام الفواتير (Normar Dental Lab Invoice System)

Arabic RTL invoice + dental work tracker for Normar Digital Dental Industry Lab. Single-page React + Vite app.

## Run & Operate

- `pnpm dev` — run the dev server (port 5000)
- `pnpm build` — production build (outputs to `dist/public`)
- `pnpm typecheck` — type check the project
- `pnpm serve` — preview the production build
- Firebase config is hardcoded (public web keys) in `src/lib/firebase.ts`

## Stack

- pnpm, Node.js 24, TypeScript ~5.9
- React 18 + Vite 7 + Tailwind v4 + shadcn/ui + wouter
- Firebase Firestore (collections: `invoices`, `dentalWorks`, `settings/materialsBudget`)
- PDF: jspdf + html2canvas
- Font: Almarai (Google Fonts) for Arabic text

## Where things live

- `src/App.tsx` — root, header nav, wouter routes
- `src/pages/invoices.tsx` — invoice tabs (form / preview / list) + Firestore save / PDF / print
- `src/pages/dental-work.tsx` — dental work tracker page (budget + entries)
- `src/components/invoice-form.tsx|invoice-preview.tsx|invoice-list.tsx` — invoice components
- `src/lib/firebase.ts` — Firebase init
- `public/normar.png` — lab logo
- `src/index.css` — theme tokens (HSL), Almarai font import

## Architecture decisions

- Migrated from Next.js App Router to Vite + wouter — no SSR needed, single-user dental lab tool
- Originally bootstrapped inside a pnpm-workspace monorepo with multiple artifacts; flattened to a single root app
- Firestore directly from the client (public anon access pattern from original v0 app); no backend persistence layer
- All UI is RTL with `dir="rtl"` and Arabic copy; Almarai font loaded both via CSS `@import` and `<link>` for reliability
- Dental work budget stored as singleton doc at `settings/materialsBudget`; remaining = budget − sum(entries.materialCost)

## Product

- **Invoices page**: build, preview, save to Firestore, print, and download invoices as PDF; list and reload past invoices
- **Dental work page**: set a global materials budget, log per-entry dental work (doctor, patient, work type, teeth count, color, material cost), see remaining budget after auto-deducting all entries

## User preferences

- Arabic UI (RTL), preserve original v0 layout and Normar branding

## Gotchas

- Firestore writes block on network; alerts surface success/error
- `index.css` HSL vars must remain in `H S% L%` format (no `hsl(...)` wrapper) since `@theme inline` wraps them
- When adding pages, remember to add a nav link in `src/App.tsx`'s `Header`
- Vite dev server reads `PORT` (defaults to 5000) and `BASE_PATH` (defaults to `/`) env vars

## Pointers

- `.local/skills/react-vite` for Vite/React conventions
- `.local/skills/workflows` for workflow management
