# The Void

An abstract, anonymous, endless shared interactive experience. No game mechanics, no goals - just presence and interaction with strangers.

## Features

- **Shared Ripples**: Click anywhere to create expanding ripple circles and particle bursts that everyone sees
- **Draggable Objects**: Orbs, geometric shapes, and mysterious glyphs (◯ △ ◇) that anyone can drag
- **Visible Cursors**: See other users as faint glowing dots
- **Fading Trails**: Mouse/touch movements leave trails visible to all
- **Whispered Words**: Occasional words fade in and out ("here", "now", "drift", "echo")
- **Presence Counter**: See how many others are in The Void

## Deploy (Free)

```bash
npm install
npx partykit login
npm run deploy
```

Your site will be live at `https://thevoid.<your-username>.partykit.dev`

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:1999`

## Tech Stack

- [PartyKit](https://partykit.io) - Real-time multiplayer infrastructure (free tier)
- Vanilla JavaScript frontend
- No build step required
