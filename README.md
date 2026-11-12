This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Environment variables

Create a `.env.local` file in the project root:

```bash
# Required for the scanner's "Item check" mode to identify items with Gemini.
# Get a key at https://aistudio.google.com/apikey
GEMINI_API_KEY=your-key-here

# Optional. Defaults to gemini-3.1-flash-lite.
# GEMINI_MODEL=gemini-3.1-flash-lite
```

Without `GEMINI_API_KEY` the scanner still runs: `/api/scan/identify` falls back to
an offline estimate and the verdict card says so, so the app stays demoable with no
key configured.

### How the scanner works

- **Item check** photographs the item, posts a downscaled JPEG to
  `app/api/scan/identify/route.ts`, and Gemini returns a structured verdict matching
  the `ScanItem` shape in `lib/scan-data.ts`.
- **Reward points are never set by the model.** The route derives them from the
  `awardPoints()` table in `lib/scan-data.ts`, keyed on bin and verdict, so the same
  item always scores the same.
- **Bin QR** decodes locally with `jsQR` — no network call, no model.

### How the points system works

`lib/points-store.ts` owns the balance, level progress, carry list, and issued
vouchers. It's an external store read via `useSyncExternalStore` and mirrored to
`localStorage`, so the balance survives both navigation between routes and a reload.
It seeds from `levelSummary` in `lib/home-data.ts` on first run.

The earn-and-spend loop:

1. **Identify an item** → it goes onto the carry list (`carryItem`). No points yet.
2. **The list persists** until you check in at a bin — including across navigation.
3. **Scan a bin QR** → `disposeAtBin(binId)` drops off every carried item belonging
   to *that* bin, credits their points plus a **25 pt clean sorting bonus**, and
   leaves items for other bins on the list. Items go to both `balance` and
   `lifetimePoints`, so the level bar on home advances.
4. **Redeem a reward** → `redeemReward()` deducts from `balance` only, and issues a
   voucher. `lifetimePoints` never decreases, so the level can't regress.

Every figure on the balance card is live: the balance, the active voucher count,
the "Redeemed in 2026" counter, and the expiring-points pill. `expiringPoints` is
the slice of the balance that lapses at year end — redeeming draws it down first
(oldest points go first) and floors at zero, while newly earned points don't add to
it, since those lapse in a later cycle. Only `expiryLabel` is still a static string;
nothing recalculates the date.

Two details worth knowing:

- The bonus is a **prototype shortcut**. A real deployment would confirm a complete
  drop-off against the bin's own sensor; here any drop-off containing a recyclable
  earns it. It is awarded once per check-in, not per item, and general waste alone
  does not earn it.
- `resetPoints()` restores the seeded state, which is handy mid-demo.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
