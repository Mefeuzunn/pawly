/* ==========================================================================
   Pawly / Widgetable Mood Candy Jar 2D Physics Engine
   Canvas-based Gravity • Circle Collision • Natural Stacking & Jiggle
   ========================================================================== */

export class CandyJarPhysics {
  constructor(canvasOrSelector, options = {}) {
    this.canvas = typeof canvasOrSelector === 'string' ? document.querySelector(canvasOrSelector) : canvasOrSelector;
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width = this.canvas.clientWidth || 170;
    this.height = this.canvas.height = this.canvas.clientHeight || 180;

    this.options = Object.assign({
      gravity: 0.52,
      restitution: 0.42,
      friction: 0.88,
      candyRadius: 15
    }, options);

    this.candies = [];
    this.rafId = null;
    this.isActive = true;

    this.bindEvents();
    this.startLoop();
  }

  loadCandies(list = []) {
    this.candies = [];
    const count = Math.min(list.length, 35);
    list.slice(-count).forEach((c, idx) => {
      const radius = this.options.candyRadius;
      const x = (this.width / 2) + (Math.random() - 0.5) * (this.width * 0.45);
      const y = this.height - radius - 10 - (idx * 6);
      this.candies.push({
        id: c.id || `c_${idx}`,
        x: Math.max(radius + 8, Math.min(this.width - radius - 8, x)),
        y: Math.max(radius, y),
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2,
        radius,
        color: c.color || '#FFCAD4',
        emoji: c.emoji || '🍬',
        angle: (Math.random() - 0.5) * 0.5,
        vangle: 0
      });
    });
  }

  dropCandy(candy) {
    const radius = this.options.candyRadius;
    const newCandy = {
      id: candy.id || `drop_${Date.now()}`,
      x: (this.width / 2) + (Math.random() - 0.5) * 20,
      y: 12,
      vx: (Math.random() - 0.5) * 3.5,
      vy: 2.5 + Math.random() * 2,
      radius,
      color: candy.color || '#FFCAD4',
      emoji: candy.emoji || '✨',
      angle: (Math.random() - 0.5) * 0.4,
      vangle: (Math.random() - 0.5) * 0.1
    };
    this.candies.push(newCandy);
    if (this.candies.length > 40) {
      this.candies.shift();
    }
  }

  jiggleJar() {
    this.candies.forEach(c => {
      c.vy -= 4.5 + Math.random() * 3.5;
      c.vx += (Math.random() - 0.5) * 5;
      c.vangle += (Math.random() - 0.5) * 0.2;
    });
  }

  bindEvents() {
    this.canvas.addEventListener('click', () => {
      this.jiggleJar();
      if (window.PawlyAudio) window.PawlyAudio.soundBubble();
    });

    window.addEventListener('resize', () => {
      if (!this.canvas) return;
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      if (w > 0 && h > 0) {
        this.width = this.canvas.width = w;
        this.height = this.canvas.height = h;
      }
    });
  }

  startLoop() {
    const update = () => {
      if (!this.isActive) return;
      this.step();
      this.render();
      this.rafId = requestAnimationFrame(update);
    };
    this.rafId = requestAnimationFrame(update);
  }

  step() {
    const { gravity, restitution, friction } = this.options;
    const w = this.width;
    const h = this.height;

    // 1. Entegre Hız ve Pozisyon
    for (let i = 0; i < this.candies.length; i++) {
      const c = this.candies[i];
      c.vy += gravity;
      c.vx *= 0.99;
      c.x += c.vx;
      c.y += c.vy;
      c.angle += c.vangle;
      c.vangle *= 0.95;

      // Zemin ve Duvar Çarpışmaları (Kavanoz Kıvrımları)
      const leftWall = 14;
      const rightWall = w - 14;
      const bottomFloor = h - 16;

      if (c.x - c.radius < leftWall) {
        c.x = leftWall + c.radius;
        c.vx = -c.vx * restitution;
      }
      if (c.x + c.radius > rightWall) {
        c.x = rightWall - c.radius;
        c.vx = -c.vx * restitution;
      }
      if (c.y + c.radius > bottomFloor) {
        c.y = bottomFloor - c.radius;
        c.vy = -c.vy * restitution;
        c.vx *= friction;
        if (Math.abs(c.vy) < 0.2) c.vy = 0;
      }
    }

    // 2. Çember-Çember Çarpışma Çözümü (Candy to Candy Collision)
    const len = this.candies.length;
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const c1 = this.candies[i];
          const c2 = this.candies[j];

          const dx = c2.x - c1.x;
          const dy = c2.y - c1.y;
          const distSq = dx * dx + dy * dy;
          const minDist = c1.radius + c2.radius;

          if (distSq < minDist * minDist && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            // Ayrışma itişi
            c1.x -= nx * overlap * 0.5;
            c1.y -= ny * overlap * 0.5;
            c2.x += nx * overlap * 0.5;
            c2.y += ny * overlap * 0.5;

            // İmpuls aktarımı
            const kx = c1.vx - c2.vx;
            const ky = c1.vy - c2.vy;
            const p = (kx * nx + ky * ny) * (1 + restitution);

            c1.vx -= p * nx * 0.5;
            c1.vy -= p * ny * 0.5;
            c2.vx += p * nx * 0.5;
            c2.vy += p * ny * 0.5;
          }
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Cam Kavanoz Gövdesi Çizimi (Sleek Glass Rim)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 202, 212, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, 10);
    ctx.lineTo(14, h - 28);
    ctx.quadraticCurveTo(14, h - 12, 28, h - 12);
    ctx.lineTo(w - 28, h - 12);
    ctx.quadraticCurveTo(w - 14, h - 12, w - 14, h - 28);
    ctx.lineTo(w - 14, 10);
    ctx.stroke();

    // Cam Yansıma Parlaması
    const grad = ctx.createLinearGradient(16, 16, 40, h - 20);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(32, h / 2, 8, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Şekerleri Çiz
    this.candies.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);

      // Şeker gölgesi
      ctx.shadowColor = 'rgba(160, 115, 80, 0.22)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;

      // Yuvarlak Pastel Şeker Gövdesi
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();

      // İnce kenar çizgisi
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();

      // Şeker parlaması
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.arc(-c.radius * 0.3, -c.radius * 0.3, c.radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fill();

      // Emoji Yüz
      ctx.font = `${Math.round(c.radius * 1.15)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.emoji, 0, 1);

      ctx.restore();
    });
  }

  destroy() {
    this.isActive = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}

window.CandyJarPhysics = CandyJarPhysics;
