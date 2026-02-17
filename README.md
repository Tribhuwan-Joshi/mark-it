# Mark-It

A simple, real-time bookmark manager built with Next.js 16 (App Router).

## Tech Stack

- Next.js 16
- Supabase (Auth, Database, Realtime)
- Tailwind CSS
- TypeScript

## Features

- Google OAuth Login (persists across sessions)
- Create and remove bookmarks instantly
- Real-time updates across multiple tabs

## Challenges & Solutions

### Real-time Updates failing

Initially, adding a bookmark in one tab didn't show up in others. The database wasn't broadcasting changes. I fixed this by enabling replication on the `bookmarks` table (`alter publication supabase_realtime add table bookmarks;`).

### Hydration Errors

Browser extensions were injecting attributes into the HTML tag, causing mismatch errors. I solved this by adding `suppressHydrationWarning` to the root layout. Although It depends on broswer, you may not have the extensions to interfere like I do.
