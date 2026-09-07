/**
 * Apex Antiqua Particle & Visual Effects Engine
 * 60FPS Canvas system for exhaust smoke, drift skid marks, crash explosions, and colosseum embers.
 */

class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.skidMarks = [];
    this.ambientEmbers = [];
    this.torches = [];
    this.lastTime = performance.now();
    this.isActive = true;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  setTorches(torchPositions) {
    this.torches = torchPositions;
  }

  /**
   * Spawn exhaust smoke and tire drift particles behind a car
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} angle - Car travel direction in radians
   * @param {string} colorHex - Player team theme color
   * @param {boolean} isDrift - True if cornering / high speed
   */
  emitTireSmoke(x, y, angle, colorHex = '#ffffff', isDrift = false) {
    const count = isDrift ? 9 : 4;
    // Exhaust offset (behind the car)
    const backDist = 18;
    const exhaustX = x - Math.cos(angle) * backDist;
    const exhaustY = y - Math.sin(angle) * backDist;

    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * (isDrift ? 1.4 : 0.6);
      const speed = Math.random() * (isDrift ? 45 : 25) + 10;
      const partAngle = angle + Math.PI + spread;

      this.particles.push({
        type: 'smoke',
        x: exhaustX + (Math.random() - 0.5) * 8,
        y: exhaustY + (Math.random() - 0.5) * 8,
        vx: Math.cos(partAngle) * speed,
        vy: Math.sin(partAngle) * speed,
        radius: Math.random() * 5 + 4,
        maxRadius: Math.random() * (isDrift ? 24 : 16) + 12,
        life: 0,
        maxLife: Math.random() * 0.35 + 0.3,
        alpha: Math.random() * 0.55 + 0.4,
        color: colorHex,
        tint: isDrift ? 0.35 : 0.15
      });
    }

    if (isDrift) {
      // Record skid mark segment
      this.skidMarks.push({
        x1: x - Math.cos(angle) * 8 - Math.sin(angle) * 6,
        y1: y - Math.sin(angle) * 8 + Math.cos(angle) * 6,
        x2: x - Math.cos(angle) * 16 - Math.sin(angle) * 6,
        y2: y - Math.sin(angle) * 16 + Math.cos(angle) * 6,
        alpha: 0.7,
        width: 3.5
      });
      this.skidMarks.push({
        x1: x - Math.cos(angle) * 8 + Math.sin(angle) * 6,
        y1: y - Math.sin(angle) * 8 - Math.cos(angle) * 6,
        x2: x - Math.cos(angle) * 16 + Math.sin(angle) * 6,
        y2: y - Math.sin(angle) * 16 - Math.cos(angle) * 6,
        alpha: 0.7,
        width: 3.5
      });

      // Keep max 150 skid segments to avoid memory bloat
      if (this.skidMarks.length > 150) {
        this.skidMarks.splice(0, 20);
      }
    }
  }

  /**
   * Catastrophic Car Crash Explosion
   * Spawns fireballs, metallic sparks, flying tires, carbon debris, and shockwaves
   */
  emitCrashExplosion(x, y, color1 = '#ff3333', color2 = '#3388ff') {
    // 1. Shockwave rings
    this.particles.push({
      type: 'shockwave',
      x,
      y,
      radius: 5,
      maxRadius: 75,
      life: 0,
      maxLife: 0.45,
      color: '#ffddaa'
    });
    this.particles.push({
      type: 'shockwave',
      x,
      y,
      radius: 5,
      maxRadius: 95,
      life: 0.08,
      maxLife: 0.55,
      color: '#ff4400'
    });

    // 2. Fireballs & flash
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 120 + 30;
      this.particles.push({
        type: 'fireball',
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 8 + 6,
        maxRadius: Math.random() * 26 + 14,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.35,
        color: Math.random() > 0.4 ? '#ff5500' : (Math.random() > 0.5 ? '#ffcc00' : '#ffffff')
      });
    }

    // 3. Glowing high-velocity metal sparks
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 260 + 60;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 0.6 + 0.3,
        color: Math.random() > 0.5 ? '#ffff88' : '#ff8822',
        size: Math.random() * 3 + 1.5
      });
    }

    // 4. Flying debris: carbon fiber plates, shards, and spinning wheels
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 160 + 40;
      this.particles.push({
        type: 'debris',
        subType: i < 3 ? 'wheel' : (i % 2 === 0 ? 'plate1' : 'plate2'),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 18,
        size: i < 3 ? 9 : (Math.random() * 8 + 5),
        life: 0,
        maxLife: Math.random() * 0.7 + 0.5,
        color: i < 3 ? '#222222' : (i % 2 === 0 ? color1 : color2)
      });
    }

    // 5. Heavy dense smoke cloud on impact
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 40 + 10;
      this.particles.push({
        type: 'smoke',
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 8 + 8,
        maxRadius: Math.random() * 35 + 20,
        life: 0,
        maxLife: Math.random() * 0.7 + 0.6,
        alpha: 0.8,
        color: '#3a3a3a',
        tint: 0.1
      });
    }
  }

  /**
   * Spawn victory celebration confetti / nitro sparks
   */
  emitVictoryGlow(x, y, teamColor) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 150 + 50;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.8,
        color: Math.random() > 0.5 ? teamColor : '#ffd700',
        size: 3
      });
    }
  }

  update(dt) {
    // Ambient torch embers
    if (this.torches.length > 0 && Math.random() < 0.3) {
      const t = this.torches[Math.floor(Math.random() * this.torches.length)];
      if (t) {
        this.ambientEmbers.push({
          x: t.x + (Math.random() - 0.5) * 12,
          y: t.y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 15,
          vy: -(Math.random() * 35 + 20),
          size: Math.random() * 2.5 + 1,
          life: 0,
          maxLife: Math.random() * 0.8 + 0.6,
          color: Math.random() > 0.4 ? '#ffaa00' : '#ff4400'
        });
      }
    }

    // Update ambient embers
    for (let i = this.ambientEmbers.length - 1; i >= 0; i--) {
      const e = this.ambientEmbers[i];
      e.life += dt;
      if (e.life >= e.maxLife) {
        this.ambientEmbers.splice(i, 1);
        continue;
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vx += (Math.random() - 0.5) * 10 * dt;
    }

    // Gently fade skid marks over time
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const s = this.skidMarks[i];
      s.alpha -= 0.015 * dt;
      if (s.alpha <= 0) {
        this.skidMarks.splice(i, 1);
      }
    }

    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      const progress = p.life / p.maxLife;

      if (progress >= 1) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;

      if (p.type === 'smoke') {
        p.vx *= 0.95;
        p.vy *= 0.95;
      } else if (p.type === 'debris') {
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.rot += p.rotSpeed * dt;
      } else if (p.type === 'spark') {
        p.vx *= 0.94;
        p.vy = (p.vy + 90 * dt) * 0.94; // slight gravity
      } else if (p.type === 'fireball') {
        p.vx *= 0.93;
        p.vy *= 0.93;
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw persistent rubber skid marks
    if (this.skidMarks.length > 0) {
      this.ctx.save();
      this.ctx.lineCap = 'round';
      for (const s of this.skidMarks) {
        this.ctx.strokeStyle = `rgba(10, 10, 15, ${s.alpha * 0.65})`;
        this.ctx.lineWidth = s.width;
        this.ctx.beginPath();
        this.ctx.moveTo(s.x1, s.y1);
        this.ctx.lineTo(s.x2, s.y2);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // 2. Render ambient torch embers
    if (this.ambientEmbers.length > 0) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';
      for (const e of this.ambientEmbers) {
        const prog = e.life / e.maxLife;
        const a = (1 - prog) * 0.85;
        this.ctx.fillStyle = e.color;
        this.ctx.globalAlpha = a;
        this.ctx.beginPath();
        this.ctx.arc(e.x, e.y, e.size * (1 - prog * 0.4), 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // 3. Render dynamic particles
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      const fade = 1 - progress;

      if (p.type === 'smoke') {
        const currR = p.radius + (p.maxRadius - p.radius) * Math.sin(progress * Math.PI * 0.5);
        const alpha = p.alpha * fade;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, currR, 0, Math.PI * 2);

        // Soft radial gradient for fluffy volumetric smoke
        const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currR);
        grad.addColorStop(0, `rgba(220, 220, 230, ${alpha * 0.9})`);
        grad.addColorStop(0.6, `rgba(160, 160, 175, ${alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(100, 100, 115, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.fill();
        this.ctx.restore();
      }

      else if (p.type === 'shockwave') {
        const currR = p.radius + (p.maxRadius - p.radius) * progress;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, currR, 0, Math.PI * 2);
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = Math.max(1, (1 - progress) * 6);
        this.ctx.globalAlpha = (1 - progress) * 0.9;
        this.ctx.stroke();
        this.ctx.restore();
      }

      else if (p.type === 'fireball') {
        const currR = p.radius + (p.maxRadius - p.radius) * progress;
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, currR, 0, Math.PI * 2);
        const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currR);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, p.color);
        grad.addColorStop(1, 'rgba(255, 60, 0, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.globalAlpha = fade * 0.9;
        this.ctx.fill();
        this.ctx.restore();
      }

      else if (p.type === 'spark') {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = fade;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * fade, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      else if (p.type === 'debris') {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot);
        this.ctx.globalAlpha = Math.min(1, fade * 1.5);

        if (p.subType === 'wheel') {
          // 3D spinning tire
          this.ctx.fillStyle = '#1a1a1a';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#666666';
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();
          // Rim center
          this.ctx.fillStyle = '#ffd700';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          // Sharp carbon fiber plate fragment
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          this.ctx.moveTo(-p.size, -p.size * 0.5);
          this.ctx.lineTo(p.size * 1.2, -p.size * 0.3);
          this.ctx.lineTo(p.size * 0.6, p.size * 0.7);
          this.ctx.lineTo(-p.size * 0.8, p.size * 0.4);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.strokeStyle = '#000000';
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
        this.ctx.restore();
      }
    }
  }

  animate(time) {
    const dt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    if (this.isActive) {
      this.update(dt);
      this.render();
    }
    requestAnimationFrame(this.animate);
  }
}

window.ParticleEngine = ParticleEngine;
