# The Void

An abstract, anonymous, endless shared interactive experience. No game mechanics, no goals - just presence and interaction with strangers.

## Features

- **Shared Ripples**: Click anywhere to create expanding ripple circles and particle bursts that everyone sees
- **Draggable Objects**: Orbs, geometric shapes, and mysterious glyphs (◯ △ ◇) that anyone can drag
- **Visible Cursors**: See other users as faint glowing dots
- **Fading Trails**: Mouse/touch movements leave trails visible to all
- **Whispered Words**: Occasional words fade in and out ("here", "now", "drift", "echo")
- **Presence Counter**: See how many others are in The Void

## Running Locally

```bash
npm install
npm start
```

Visit `http://localhost:3000`

## Deployment

### Railway / Render / Fly.io

1. Connect your GitHub repository
2. Set the start command to `npm start`
3. Deploy

### Environment Variables

- `PORT` - Server port (default: 3000)

## Tech Stack

- Node.js + Express
- WebSocket (ws library)
- Vanilla JavaScript frontend
- No build step required
