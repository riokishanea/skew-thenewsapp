# Skew News

Skew is an AI-powered news analysis website designed to help readers understand news coverage, sentiment, and political framing.

## About

The project is built with Next.js, React, TypeScript, and Tailwind CSS. It currently includes a responsive news homepage prototype, reusable UI components, and a design system showcase.

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The design system is available at [http://localhost:3000/design-system](http://localhost:3000/design-system).

## Development database seed

After configuring the Supabase variables in `.env.local`, run [supabase/schema.sql](supabase/schema.sql) in Supabase Dashboard → SQL Editor, then run [supabase/seed.sql](supabase/seed.sql). The seed is safe to re-run and adds only the configured source homepages; it does not add articles, scrape sources, or create scheduler records.

## Available commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```
