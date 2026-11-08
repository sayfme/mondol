# Mondol Family

A family age and togetherness tracker built with Cloudflare Workers Static Assets, HTML, CSS, and vanilla JavaScript.

## Privacy architecture

Private dates for Sayf, Shanta and the wedding are **not stored in public files**. They are read only by the Worker from environment secrets. The browser receives calculated ages and elapsed-day counters, never the original dates.

All members' raw dates stay in secrets only. The site is a single cozy page with 3 sections: Family, Journey, Timeline.

## Requirements

- Node.js LTS and npm
- A Cloudflare account for production deployment
- Wrangler authentication (`npx wrangler login`)

## 1. Install dependencies

```bash
npm install
```

## 2. Configure local private dates

Create a local secrets file by copying the template. The real `.dev.vars` file is excluded by `.gitignore`; do not commit it or share it.

Values use `YYYY-MM-DD`:

```bash
cp .dev.vars.example .dev.vars
```

Then edit `.dev.vars` and replace each placeholder with its real date in `YYYY-MM-DD` format. Edit `.dev.vars` to update private dates. Keep the real values out of `public/`, Git commits, and screenshots.

## 3. Run locally

```bash
npm run dev
```

Open the local URL printed by Wrangler (usually `http://localhost:8787`).

## 4. Configure production Worker secrets

Authenticate first:

```bash
npx wrangler login
```

Set each private date as a Cloudflare Worker secret. Enter the value when Wrangler prompts:

```bash
npx wrangler secret put SENIOR_DOB
npx wrangler secret put MOTHER_DOB
npx wrangler secret put CHILD_DOB
npx wrangler secret put WEDDING_DATE
```

Use the same `YYYY-MM-DD` values as in local `.dev.vars`. Do not put real dates in `wrangler.jsonc` or regular public variables.

## 5. Deploy

```bash
npm run deploy
```

The Worker name is `mondol`.

## Project structure

```text
mondol-family/
├── public/
│   ├── index.html            # Single cozy page, 3 sections
│   ├── css/style.css
│   └── js/app.js
├── src/index.js
├── .dev.vars.example  # Safe template; copy to .dev.vars
├── .gitignore
├── package.json
├── wrangler.jsonc
└── README.md
```

## Notes

- No database, frontend framework, or paid API is required.
- The Worker calculates ages and anniversary counters server-side.
- The API response never includes original birth or wedding dates.
- Birthday countdowns are intentionally disabled to avoid leaking private birth dates.
- The theme preference is saved in the visitor's browser local storage.
- Family members: Sayf (senior), Shanta (mother), Nur (child) — display names only, defined in `src/index.js`.
- Google Fonts loads Noto Serif for headings and Noto Sans for body text and numbers; system fallbacks are included.
- Theme is misty rainy night: slate + misty grey with warm lamp accent, CSS rain and fog; light mode is soft misty morning. Preference saved in local storage.
- Icons are inline SVG (`public/index.html` sprite + `public/js/app.js`), not unicode glyphs.
- Anniversary card shows days until next anniversary and total years together as numbers only — never the raw wedding date.
