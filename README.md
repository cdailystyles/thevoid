# The Void

An abstract, anonymous, endless shared interactive experience. No game mechanics, no goals - just presence and interaction with strangers.

## Features

- **Shared Ripples**: Click anywhere to create expanding ripple circles and particle bursts that everyone sees
- **Draggable Objects**: Orbs, geometric shapes, and mysterious glyphs (◯ △ ◇) that anyone can drag
- **Visible Cursors**: See other users as faint glowing dots
- **Fading Trails**: Mouse/touch movements leave trails visible to all
- **Whispered Words**: Occasional words fade in and out ("here", "now", "drift", "echo")
- **Presence Counter**: See how many others are in The Void

## Deploy to Cloudflare

### One-time setup

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

### Deploy

```bash
npm install
npm run deploy
```

That's it! Your site will be live at `https://thevoid.<your-subdomain>.workers.dev`

### Custom Domain

To use a custom domain, add it in the Cloudflare dashboard under Workers & Pages > your worker > Settings > Domains & Routes.

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:8787`

## Tech Stack

- Cloudflare Workers (edge compute)
- Durable Objects (WebSocket state management)
- Vanilla JavaScript frontend
- No build step required
