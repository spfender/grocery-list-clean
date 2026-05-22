# Grocery List

A shared realtime grocery list app built with Next.js, Tailwind CSS, Supabase, and Vercel.

## Features

* Shared realtime grocery syncing
* Mobile-friendly layout
* Auto-categorized grocery items
* Learned category memory
* Archive old grocery lists
* Print-friendly view
* Quick-add buttons
* Persistent cloud storage
* Custom app icon + installable home screen app

## Stack

* Next.js
* React
* Tailwind CSS
* Supabase
* Vercel

## Local Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Create:

```text
.env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

## Deployment

The app is deployed with Vercel and automatically redeploys on pushes to `main`.

## Design Direction

The UI is inspired by:

* Dieter Rams
* Calm, dense information surfaces

## Future Ideas

* Discord integration
* Store-route sorting
* Favorites / recurring items
* Shared user attribution
* Drag-and-drop category ordering
* Meal planning/recipe integration
