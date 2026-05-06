# نظام الفواتير (Normar Dental Lab Invoice System)

Arabic RTL invoice + dental work tracker for Normar Digital Dental Industry Lab. Migrated from a Vercel/v0 Next.js project to a Replit Vite + React app.

## Run & Operate

- `pnpm --filter @workspace/invoice-app run dev` — run the invoice web app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Firebase config is hardcoded (public web keys) in `artifacts/invoice-app/src/lib/firebase.ts`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React 18 + Vite 7 + Tailwind v4 + shadcn/ui + wouter
- API: Express 5
- Data: Firebase Firestore (collections: `invoices`, `dentalWorks`, `settings/materialsBudget`)
- PDF: jspdf + html2canvas
- Font: Almarai (Google Fonts) for Arabic text

## Where things live

- `artifacts/invoice-app/src/App.tsx` — root, header nav, wouter routes
- `artifacts/invoice-app/src/pages/invoices.tsx` — invoice tabs (form / preview / list) + Firestore save / PDF / print
- `artifacts/invoice-app/src/pages/dental-work.tsx` — dental work tracker page (budget + entries)
- `artifacts/invoice-app/src/components/invoice-form.tsx|invoice-preview.tsx|invoice-list.tsx` — invoice components
- `artifacts/invoice-app/src/lib/firebase.ts` — Firebase init
- `artifacts/invoice-app/public/normar.png` — lab logo
- `artifacts/invoice-app/src/index.css` — theme tokens (HSL), Almarai font import

## Architecture decisions

- Migrated from Next.js App Router to Vite + wouter — no SSR needed, single-user dental lab tool
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
- When adding pages, remember to add a nav link in `App.tsx`'s `Header`

## Pointers

- See `.local/skills/pnpm-workspace`, `.local/skills/react-vite`, `.local/skills/artifacts` for workspace and artifact conventions
- Original Next.js source preserved at `.migration-backup/` for reference
