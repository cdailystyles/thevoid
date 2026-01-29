// The Void - Client
(function() {
  'use strict';

  // Elements
  const voidEl = document.getElementById('void');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const objectsContainer = document.getElementById('objects');
  const cursorsContainer = document.getElementById('cursors');
  const whispersContainer = document.getElementById('whispers');
  const presenceCount = document.getElementById('presence-count');
  const presencePlural = document.getElementById('presence-plural');

  // State
  let ws = null;
  let clientId = null;
  let remoteCursors = new Map();
  let objects = new Map();
  let draggingObject = null;
  let lastTrailTime = 0;
  let lastCursorTime = 0;

  // Whispered words
  const whisperWords = ['here', 'now', 'drift', 'echo', 'void', 'presence', 'silence', 'between', 'within', 'beyond'];

  // Resize canvas
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // WebSocket connection
  function connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log('Connected to The Void');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    ws.onclose = () => {
      console.log('Disconnected from The Void');
      // Reconnect after delay
      setTimeout(connect, 2000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  function handleMessage(data) {
    switch (data.type) {
      case 'init':
        clientId = data.clientId;
        updatePresence(data.presenceCount);
        initObjects(data.objects);
        break;

      case 'presence':
        updatePresence(data.count);
        break;

      case 'cursor':
        updateRemoteCursor(data.clientId, data.x, data.y);
        break;

      case 'cursor-leave':
        removeRemoteCursor(data.clientId);
        break;

      case 'click':
        createRipple(data.x * window.innerWidth, data.y * window.innerHeight, data.clientId !== clientId);
        break;

      case 'trail':
        createTrailPoint(data.x * window.innerWidth, data.y * window.innerHeight, true);
        break;

      case 'drag':
        updateObjectPosition(data.objectId, data.x, data.y);
        break;
    }
  }

  function updatePresence(count) {
    presenceCount.textContent = count;
    presencePlural.textContent = count === 1 ? '' : 's';
  }

  // Remote cursors
  function updateRemoteCursor(id, x, y) {
    let cursor = remoteCursors.get(id);
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.className = 'remote-cursor';
      cursorsContainer.appendChild(cursor);
      remoteCursors.set(id, cursor);
    }
    cursor.style.left = (x * window.innerWidth) + 'px';
    cursor.style.top = (y * window.innerHeight) + 'px';
  }

  function removeRemoteCursor(id) {
    const cursor = remoteCursors.get(id);
    if (cursor) {
      cursor.remove();
      remoteCursors.delete(id);
    }
  }

  // Objects
  function initObjects(objectsData) {
    objectsContainer.innerHTML = '';
    objects.clear();

    objectsData.forEach(obj => {
      createObject(obj);
    });
  }

  function createObject(obj) {
    const el = document.createElement('div');
    el.className = `void-object ${obj.type}`;
    el.dataset.id = obj.id;

    // Set glyph content for glyph types
    if (obj.type === 'glyph-circle') {
      el.textContent = '◯';
      el.classList.remove('glyph-circle');
    } else if (obj.type === 'glyph-triangle') {
      el.textContent = '△';
      el.classList.remove('glyph-triangle');
    } else if (obj.type === 'glyph-diamond') {
      el.textContent = '◇';
      el.classList.remove('glyph-diamond');
    }

    el.style.left = (obj.x * window.innerWidth) + 'px';
    el.style.top = (obj.y * window.innerHeight) + 'px';

    // Drag handling
    el.addEventListener('mousedown', startDrag);
    el.addEventListener('touchstart', startDrag, { passive: false });

    objectsContainer.appendChild(el);
    objects.set(obj.id, { el, x: obj.x, y: obj.y });
  }

  function updateObjectPosition(id, x, y) {
    const obj = objects.get(id);
    if (obj) {
      obj.x = x;
      obj.y = y;
      obj.el.style.left = (x * window.innerWidth) + 'px';
      obj.el.style.top = (y * window.innerHeight) + 'px';
    }
  }

  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();

    const el = e.currentTarget;
    el.classList.add('dragging');
    draggingObject = el.dataset.id;

    const moveHandler = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const x = clientX / window.innerWidth;
      const y = clientY / window.innerHeight;

      updateObjectPosition(draggingObject, x, y);

      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'drag',
          objectId: draggingObject,
          x,
          y
        }));
      }
    };

    const endHandler = () => {
      el.classList.remove('dragging');
      draggingObject = null;
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);
  }

  // Ripples and particles
  function createRipple(x, y, isRemote = false) {
    // Create multiple expanding ripples
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.marginLeft = '-100px';
        ripple.style.marginTop = '-100px';
        if (isRemote) {
          ripple.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }
        voidEl.appendChild(ripple);
        setTimeout(() => ripple.remove(), 2000);
      }, i * 150);
    }

    // Create particles
    createParticleBurst(x, y, isRemote);
  }

  function createParticleBurst(x, y, isRemote = false) {
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      if (isRemote) {
        particle.style.background = 'rgba(255, 255, 255, 0.25)';
      }

      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const velocity = 50 + Math.random() * 100;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      voidEl.appendChild(particle);
      animateParticle(particle, x, y, vx, vy);
    }
  }

  function animateParticle(particle, startX, startY, vx, vy) {
    let x = startX;
    let y = startY;
    let opacity = 0.5;
    const friction = 0.98;

    function update() {
      vx *= friction;
      vy *= friction;
      x += vx * 0.016;
      y += vy * 0.016;
      opacity -= 0.01;

      if (opacity <= 0) {
        particle.remove();
        return;
      }

      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.opacity = opacity;

      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  // Trail
  function createTrailPoint(x, y, isRemote = false) {
    const trail = document.createElement('div');
    trail.className = 'trail-point';
    trail.style.left = x + 'px';
    trail.style.top = y + 'px';
    if (isRemote) {
      trail.style.background = 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)';
    }
    voidEl.appendChild(trail);
    setTimeout(() => trail.remove(), 1000);
  }

  // Whispers
  function spawnWhisper() {
    const word = whisperWords[Math.floor(Math.random() * whisperWords.length)];
    const whisper = document.createElement('div');
    whisper.className = 'whisper';
    whisper.textContent = word;
    whisper.style.left = (Math.random() * 80 + 10) + '%';
    whisper.style.top = (Math.random() * 80 + 10) + '%';
    whispersContainer.appendChild(whisper);
    setTimeout(() => whisper.remove(), 8000);
  }

  // Start whisper interval
  setInterval(spawnWhisper, 5000 + Math.random() * 10000);
  setTimeout(spawnWhisper, 2000);

  // Event listeners
  voidEl.addEventListener('click', (e) => {
    if (draggingObject) return;

    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'click', x, y }));
    }
  });

  voidEl.addEventListener('touchend', (e) => {
    if (draggingObject || e.target.classList.contains('void-object')) return;

    const touch = e.changedTouches[0];
    const x = touch.clientX / window.innerWidth;
    const y = touch.clientY / window.innerHeight;

    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'click', x, y }));
    }
  });

  function handleMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX / window.innerWidth;
    const y = clientY / window.innerHeight;

    const now = Date.now();

    // Send cursor position (throttled)
    if (now - lastCursorTime > 50 && ws && ws.readyState === 1) {
      lastCursorTime = now;
      ws.send(JSON.stringify({ type: 'cursor', x, y }));
    }

    // Create trail (throttled)
    if (now - lastTrailTime > 30) {
      lastTrailTime = now;
      createTrailPoint(clientX, clientY, false);

      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'trail', x, y }));
      }
    }
  }

  voidEl.addEventListener('mousemove', handleMove);
  voidEl.addEventListener('touchmove', handleMove, { passive: true });

  // Handle window resize for object positions
  window.addEventListener('resize', () => {
    objects.forEach((obj, id) => {
      obj.el.style.left = (obj.x * window.innerWidth) + 'px';
      obj.el.style.top = (obj.y * window.innerHeight) + 'px';
    });
  });

  // Connect
  connect();

})();
