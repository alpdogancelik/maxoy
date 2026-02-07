# Project Structure (Clean)

This repo contains **one active Next.js app** (Pages Router) and archived legacy/unused parts.

## Active App Root
`C:\Users\alpdo\Downloads\Maxoy\Maxoy`

### Active Folders
- `pages/` - Pages Router pages (Maxoy site)
- `components/` - UI components
- `constants/` - Text/config data
- `context/` - React context providers
- `data/` - Local JSON
- `lib/` - Utilities, services
- `public/` - Public assets
- `styles/` - SCSS styles
- `prisma/` - DB schema (if you keep Prisma for admin)
- `scripts/` - CLI scripts

### Root Files
- `package.json`, `next.config.js`, `tsconfig.json`
- `middleware.js/ts`

## Archived (Safe to Ignore)
All archived items are moved to:

`Maxoy\_archive\`

- `app_disabled/` - App Router version (not used now)
- `src_disabled/` - Sanity Studio app
- `pages_legacy/` - Old pages backup
- `sanity/`, `sanity.config.ts`, `sanity.cli.ts` - Sanity studio files

## Notes
- Current active site runs from **pages/**
- Sanity is removed from runtime, but archived for backup
- If you want, archived folders can be deleted later

