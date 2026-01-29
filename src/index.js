// The Void - Cloudflare Worker with Durable Objects

export class VoidRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.clientIdCounter = 0;

    // Initialize objects from storage or defaults
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get('objects');
      this.objects = stored || [
        { id: 'obj1', type: 'orb', x: 0.2, y: 0.3 },
        { id: 'obj2', type: 'triangle', x: 0.5, y: 0.2 },
        { id: 'obj3', type: 'diamond', x: 0.8, y: 0.4 },
        { id: 'obj4', type: 'glyph-circle', x: 0.3, y: 0.7 },
        { id: 'obj5', type: 'glyph-triangle', x: 0.6, y: 0.6 },
        { id: 'obj6', type: 'glyph-diamond', x: 0.7, y: 0.8 },
        { id: 'obj7', type: 'orb', x: 0.15, y: 0.5 },
        { id: 'obj8', type: 'triangle', x: 0.85, y: 0.15 },
      ];
    });
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  async handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const clientId = ++this.clientIdCounter;

    server.accept();

    this.sessions.set(clientId, server);

    // Send initial state
    server.send(JSON.stringify({
      type: 'init',
      clientId,
      objects: this.objects,
      presenceCount: this.sessions.size
    }));

    // Broadcast new presence count
    this.broadcast({
      type: 'presence',
      count: this.sessions.size
    });

    server.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data);
        await this.handleMessage(clientId, data);
      } catch (e) {
        console.error('Error handling message:', e);
      }
    });

    server.addEventListener('close', () => {
      this.sessions.delete(clientId);
      this.broadcast({
        type: 'presence',
        count: this.sessions.size
      });
      this.broadcast({
        type: 'cursor-leave',
        clientId
      }, clientId);
    });

    server.addEventListener('error', () => {
      this.sessions.delete(clientId);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async handleMessage(clientId, message) {
    switch (message.type) {
      case 'cursor':
        this.broadcast({
          type: 'cursor',
          clientId,
          x: message.x,
          y: message.y
        }, clientId);
        break;

      case 'click':
        this.broadcast({
          type: 'click',
          clientId,
          x: message.x,
          y: message.y
        });
        break;

      case 'trail':
        this.broadcast({
          type: 'trail',
          clientId,
          x: message.x,
          y: message.y
        }, clientId);
        break;

      case 'drag':
        const obj = this.objects.find(o => o.id === message.objectId);
        if (obj) {
          obj.x = message.x;
          obj.y = message.y;
          // Persist to storage
          await this.state.storage.put('objects', this.objects);
        }
        this.broadcast({
          type: 'drag',
          clientId,
          objectId: message.objectId,
          x: message.x,
          y: message.y
        }, clientId);
        break;
    }
  }

  broadcast(data, excludeClientId = null) {
    const message = JSON.stringify(data);
    this.sessions.forEach((ws, id) => {
      if (id !== excludeClientId) {
        try {
          ws.send(message);
        } catch (e) {
          // Session might be closed
          this.sessions.delete(id);
        }
      }
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // WebSocket connections go to the Durable Object
    if (url.pathname === '/ws') {
      const id = env.VOID_ROOM.idFromName('main-room');
      const room = env.VOID_ROOM.get(id);
      return room.fetch(request);
    }

    // Let assets handle static files (configured in wrangler.toml)
    return env.ASSETS.fetch(request);
  }
};
