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
├── services/         # API clients (factor, workspace, entity records, …)
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
# Must match dff-service ADMIN_API_KEY to use form layout builder
NEXT_PUBLIC_ADMIN_API_KEY=dev-admin-key-change-me
```

Validated in `src/config/env.ts` with Zod.

## API layer

Import from `src/services/*.service.ts` (see `services/dff-service/docs/API.md` for the full active list).

| Module | Used by |
|--------|---------|
| `factor.service` | Registry list, create, edit, view, danger zone |
| `factor-set.service` | Factor sets list, edit, membership |
| `entity-record.service` | Categories, drugs (EAV records) |
| `category.service` | Category danger zone, linked drugs |
| `workspace.service` | Form workspaces + metadata builder |
| `lookup-collection.service` | Lookup fields, `/lookups` admin page (UUID + by-code) |

### Factor sets (P4.7+)

| Route | Purpose |
|-------|---------|
| `/factor-sets` | List factor sets (search, status filter, pagination) |
| `/factor-sets/new` | Create — **P4.8** |
| `/factor-sets/[id]/edit` | Edit + members — **P4.8–P4.9** |

| Service | Used by |
|---------|---------|
| `factor-set.service` | Factor set list and detail APIs |

See `services/dff-service/docs/FACTOR_SETS.md`.

| Route | Purpose |
|-------|---------|
| `/categories` | Category list (static columns); **Customize form** when admin key set |
| `/categories/new` | Create category; **Edit layout** toggle (admin) |
| `/categories/[id]/edit` | Edit / archive; layout builder toggle |
| `/categories/form` | Layout-only editor (admin; publishes schema sync) |
| `/drugs` | Drug list with category filter |
| `/drugs/new` | Create drug (`CategoryRecordSelect` in view mode) |
| `/drugs/[id]/edit` | Edit / archive |
| `/drugs/form` | Drug form layout editor (admin) |

Uses `EntityRecordForm` + `entity-record.service` (not generic `/entities/[typeSlug]` routes).

**Builder flow:** Toggle **Edit layout** (or open `/categories/form` / `/drugs/form`) → change sections/fields → **Publish** in the builder chrome. That calls `POST /api/v1/admin/workspaces/:id/publish`, which syncs validation schema on the API (Phase C1). Protected fields (`name`, `statusCode`, `categoryId` on drugs) cannot be removed.

**Orphan field policy:** Removing a custom field and publishing drops it from validation/UI but keeps existing stored values on the server. See `services/dff-service/docs/PLATFORM_SCHEMA.md`.

| Service | Used by |
|---------|---------|
| `entity-record.service` | Category & drug CRUD |
| `workspace.service` | Renderer definitions + admin publish / builder |
