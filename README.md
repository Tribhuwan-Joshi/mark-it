# Mark-It
[Live](https://mark-it-gray.vercel.app/)
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

### Real-time deletes not reflecting

Adding bookmarks updated other tabs fine but deleting one did not show up until refresh. Supabase ignores filters on DELETE events so my separate DELETE listener was not working properly. I switched to one listener using event * with the user_id filter and handled INSERT UPDATE and DELETE inside the same callback using payload.eventType. Now deletes show up instantly in all tabs without refresh.

### Hydration Errors

Browser extensions were injecting attributes into the HTML tag, causing mismatch errors. I solved this by adding `suppressHydrationWarning` to the root layout. Although It depends on broswer, you may not have the extensions to interfere like I do.
