const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected clients
const clients = new Map();
let clientIdCounter = 0;

// Store draggable objects (persisted in memory)
const objects = [
  { id: 'obj1', type: 'orb', x: 0.2, y: 0.3 },
  { id: 'obj2', type: 'triangle', x: 0.5, y: 0.2 },
  { id: 'obj3', type: 'diamond', x: 0.8, y: 0.4 },
  { id: 'obj4', type: 'glyph-circle', x: 0.3, y: 0.7 },
  { id: 'obj5', type: 'glyph-triangle', x: 0.6, y: 0.6 },
  { id: 'obj6', type: 'glyph-diamond', x: 0.7, y: 0.8 },
  { id: 'obj7', type: 'orb', x: 0.15, y: 0.5 },
  { id: 'obj8', type: 'triangle', x: 0.85, y: 0.15 },
];

// Broadcast to all clients except sender
function broadcast(data, excludeId = null) {
  const message = JSON.stringify(data);
  clients.forEach((client, id) => {
    if (id !== excludeId && client.readyState === 1) {
      client.send(message);
    }
  });
}

// Broadcast to all clients
function broadcastAll(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  const clientId = ++clientIdCounter;
  clients.set(clientId, ws);

  console.log(`Client ${clientId} connected. Total: ${clients.size}`);

  // Send initial state to new client
  ws.send(JSON.stringify({
    type: 'init',
    clientId,
    objects,
    presenceCount: clients.size
  }));

  // Notify all clients of new presence count
  broadcastAll({
    type: 'presence',
    count: clients.size
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'cursor':
          // Broadcast cursor position to others
          broadcast({
            type: 'cursor',
            clientId,
            x: message.x,
            y: message.y
          }, clientId);
          break;

        case 'click':
          // Broadcast click/ripple to all including sender for consistency
          broadcastAll({
            type: 'click',
            clientId,
            x: message.x,
            y: message.y
          });
          break;

        case 'trail':
          // Broadcast trail point to others
          broadcast({
            type: 'trail',
            clientId,
            x: message.x,
            y: message.y
          }, clientId);
          break;

        case 'drag':
          // Update object position and broadcast
          const obj = objects.find(o => o.id === message.objectId);
          if (obj) {
            obj.x = message.x;
            obj.y = message.y;
          }
          broadcast({
            type: 'drag',
            clientId,
            objectId: message.objectId,
            x: message.x,
            y: message.y
          }, clientId);
          break;
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected. Total: ${clients.size}`);

    // Notify remaining clients
    broadcastAll({
      type: 'presence',
      count: clients.size
    });

    // Remove cursor
    broadcast({
      type: 'cursor-leave',
      clientId
    });
  });
});

server.listen(PORT, () => {
  console.log(`The Void is listening on port ${PORT}`);
});
