# Semen

Semen is a Next.js business dashboard for monitoring sales performance, branch distribution, stock availability, and salesman rankings in a cement distribution network.

## Overview

This project presents a sales executive dashboard with:

- monthly revenue and performance KPIs
- branch-level revenue comparisons
- category composition visualizations
- active store and inventory summaries
- top salesman ranking based on sales value

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts
- Drizzle ORM
- PostgreSQL
- Leaflet for map views
- Xlsx for spreadsheet import workflows

## Features

- Executive summary page with KPI cards and charts
- Sales analytics and branch performance monitoring
- Stock matrix and warehouse visibility
- Map-based store visualization
- Import workflow for spreadsheet-based data processing

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a local PostgreSQL database and set the `DATABASE_URL` environment variable.

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open http://localhost:3000 in your browser.

## Available Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Environment Variables

Set the following variables in your local environment:

```bash
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
```

## Notes

This repository is intended for internal dashboard use and can be extended with more analytics, authentication, or deployment configuration as needed.
