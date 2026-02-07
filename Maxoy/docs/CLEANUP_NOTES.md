# Cleanup Notes

## What was archived
- `app_disabled/` - App Router implementation (inactive)
- `src_disabled/` - Sanity Studio (inactive)
- `pages_legacy/` - Old page backups
- `sanity/` + `sanity.*` - Sanity config

## Why
- The repo had **two different apps** (App Router + Pages Router) + **Sanity studio**
- These conflict and make it hard to understand
- Current active version uses **Pages Router** for Maxoy

## Safe removals (optional)
If you are 100% sure you don't need them:
- `Maxoy\_archive\`

## Active run command
```
cd C:\Users\alpdo\Downloads\Maxoy\Maxoy
npm run dev
```

