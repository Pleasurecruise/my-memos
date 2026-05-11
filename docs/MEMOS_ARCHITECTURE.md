# Memos Architecture

## Runtime

- Single SvelteKit app deployed as one Cloudflare Worker
- UI routes, server load functions, and write APIs live in `apps/memos`
- No separate `apps/api` in the first phase

## Storage

- `R2` stores raw memo markdown objects at `memos/YYYY/MM/{id}.md`
- `D1` stores memo metadata and query fields
- `KV` stores only safe read caches:
  - unfiltered memo list
  - tag counts

## Data model

Table: `memos`

- `id`
- `r2_key`
- `tags_json`
- `search_text`
- `created_at`
- `updated_at`
- `visibility`
- `pinned`
- `archived`

No link graph, backlink table, or note-style relationship model.

## Request flow

Read:

- `+page.server.ts` reads memos from `D1`
- memo content is hydrated from `R2`
- tag stats come from `D1`

Write:

- `POST /api/memos`
- write markdown to `R2`
- insert metadata into `D1`
- clear related `KV` caches

## Current scope

Implemented:

- server-side homepage load
- create memo API
- date, tag, and text filtering
- Cloudflare platform typing
- D1 schema bootstrap on request

Not implemented yet:

- update memo
- pin/archive/delete actions
- pagination
- attachments
- auth
