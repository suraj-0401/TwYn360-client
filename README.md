# DFF Client (Next.js)

Metadata-driven scientific workflow UI for the DFF platform.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- React Query, Zustand, Axios
- React Hook Form + Zod
- shadcn/ui (`src/components/ui`)

## Scripts

```bash
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

## Source layout

```
src/
├── app/              # Next.js routes & root layout
├── modules/          # Domain features (categories, drugs, models, …)
├── renderer/         # Metadata-driven form/workflow engine
├── shared/           # App-specific shared UI & utilities
├── providers/        # React Query + Theme providers
├── services/         # API services (health, system, …)
├── store/            # Zustand stores
├── lib/              # axios client + shadcn utils
├── config/           # Zod env validation
├── styles/           # Additional global/module styles
└── types/            # Shared TypeScript types (API contracts)
```

### Modules

`categories`, `drugs`, `models`, `templates`, `factors`, `factor-sets`, `formulas`, `outputs`, `workflows`, `governance`

### Renderer

`fields`, `sections`, `layouts`, `formulas`, `outputs`, `workflow`

## Environment

Copy `.env.example` to `.env.local` (or use `.env`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Validated in `src/config/env.ts` with Zod.

## API layer

Import from `src/services/*.service.ts` (see `dff-service/docs/API.md` for the full active list).

| Module | Used by |
|--------|---------|
| `factor.service` | Registry list, create, edit, view, danger zone |
| `workspace.service` | Factor form workspace + metadata builder |
| `lookup-collection.service` | Lookup fields, `/lookups` admin page |
| `lookup.service` | Legacy type-code lookups only |
| `health.service` | Optional diagnostics |
