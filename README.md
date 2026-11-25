# XAUUSD Trading CMT

A Next.js-based gold (XAU/USD) trading application with technical analysis capabilities.

## Features

- ✅ Built with **Next.js 15** (App Router)
- ✅ **TypeScript** for type safety
- ✅ **Tailwind CSS v4** for styling
- ✅ **Vercel Speed Insights** enabled for performance monitoring
- ✅ ESLint configured for code quality

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Build for Production

```bash
npm run build
npm start
```

## Vercel Speed Insights

This project has Vercel Speed Insights pre-configured. The `<SpeedInsights />` component is integrated in the root layout (`src/app/layout.tsx`) and will automatically track:

- Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
- Real user performance metrics
- Page-level performance data

Speed Insights data will be visible in your Vercel dashboard after deploying to Vercel and receiving user traffic.

## Project Structure

```
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout with Speed Insights
│       ├── page.tsx        # Home page
│       └── globals.css     # Global styles
├── package.json
├── tsconfig.json
├── next.config.js
└── postcss.config.js
```

## Deploy on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new).

After deployment, Speed Insights will automatically start collecting performance data.

---

<div align="center">
  <p>Built with AI Studio</p>
  <p>The fastest path from prompt to production with Gemini.</p>
</div>
