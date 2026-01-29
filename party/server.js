// The Void - PartyKit Server

// Initial objects
const defaultObjects = [
  { id: 'obj1', type: 'orb', x: 0.2, y: 0.3 },
  { id: 'obj2', type: 'triangle', x: 0.5, y: 0.2 },
  { id: 'obj3', type: 'diamond', x: 0.8, y: 0.4 },
  { id: 'obj4', type: 'glyph-circle', x: 0.3, y: 0.7 },
  { id: 'obj5', type: 'glyph-triangle', x: 0.6, y: 0.6 },
  { id: 'obj6', type: 'glyph-diamond', x: 0.7, y: 0.8 },
  { id: 'obj7', type: 'orb', x: 0.15, y: 0.5 },
  { id: 'obj8', type: 'triangle', x: 0.85, y: 0.15 },
];

export default class VoidServer {
  constructor(room) {
    this.room = room;
    this.objects = [...defaultObjects];
    this.clientIdCounter = 0;
    this.clientIds = new Map();
  }

  async onStart() {
    // Load persisted objects
    const stored = await this.room.storage.get('objects');
    if (stored) {
      this.objects = stored;
    }
  }

  onConnect(conn, ctx) {
    const clientId = ++this.clientIdCounter;
    this.clientIds.set(conn.id, clientId);

    // Send init to new client
    conn.send(JSON.stringify({
      type: 'init',
      clientId,
      objects: this.objects,
      presenceCount: this.room.getConnections().length
    }));

    // Broadcast presence update
    this.broadcast({
      type: 'presence',
      count: this.room.getConnections().length
    });
  }

  onClose(conn) {
    const clientId = this.clientIds.get(conn.id);
    this.clientIds.delete(conn.id);

    // Broadcast presence update
    this.broadcast({
      type: 'presence',
      count: this.room.getConnections().length
    });

    // Remove cursor
    this.broadcast({
      type: 'cursor-leave',
      clientId
    }, conn.id);
  }

  async onMessage(message, sender) {
    const clientId = this.clientIds.get(sender.id);
    let data;

    try {
      data = JSON.parse(message);
    } catch (e) {
      return;
    }

    switch (data.type) {
      case 'cursor':
        this.broadcast({
          type: 'cursor',
          clientId,
          x: data.x,
          y: data.y
        }, sender.id);
        break;

      case 'click':
        this.broadcast({
          type: 'click',
          clientId,
          x: data.x,
          y: data.y
        });
        break;

      case 'trail':
        this.broadcast({
          type: 'trail',
          clientId,
          x: data.x,
          y: data.y
        }, sender.id);
        break;

      case 'drag':
        const obj = this.objects.find(o => o.id === data.objectId);
        if (obj) {
          obj.x = data.x;
          obj.y = data.y;
          await this.room.storage.put('objects', this.objects);
        }
        this.broadcast({
          type: 'drag',
          clientId,
          objectId: data.objectId,
          x: data.x,
          y: data.y
        }, sender.id);
        break;
    }
  }

  broadcast(data, excludeConnId = null) {
    const message = JSON.stringify(data);
    for (const conn of this.room.getConnections()) {
      if (conn.id !== excludeConnId) {
        conn.send(message);
      }
    }
  }
}
