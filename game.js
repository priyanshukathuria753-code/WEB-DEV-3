/**
 * Apex Antiqua: Colosseum Gran Turismo
 * Main Game Controller & Supercar SVG Renderer
 */

class ApexGame {
  constructor() {
    this.boardEl = document.getElementById('ludo-board');
    this.boardSvg = document.getElementById('board-svg');
    this.carsContainer = document.getElementById('cars-container');
    this.canvasEl = document.getElementById('fx-canvas');

    // 1-Knob Gearbox UI elements (Acts as 1 Die)
    this.gearKnob = document.getElementById('gear-knob');
    this.gearReadout = document.getElementById('digital-gear');
    this.tachNeedle = document.getElementById('tach-needle');
    this.rpmReadout = document.getElementById('rpm-readout');
    this.shiftBtn = document.getElementById('shift-btn');
    this.turnBanner = document.getElementById('turn-banner');
    this.activePlayerName = document.getElementById('active-player-name');
    this.activeTeamBadge = document.getElementById('active-team-badge');

    // Modals & notifications
    this.crashBanner = document.getElementById('crash-banner');
    this.crashAttackerText = document.getElementById('crash-attacker');
    this.crashVictimText = document.getElementById('crash-victim');
    this.victoryModal = document.getElementById('victory-modal');
    this.winnerTitle = document.getElementById('winner-title');

    // 1-Die Game Settings & State
    this.gameSpeed = 1; // 1 = Normal, 2 = Nitro
    this.consecutiveSixes = 0;
    this.isRolling = false;
    this.isMoving = false;
    this.currentRoll = null;

    // Players setup
    this.playerOrder = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
    this.currentPlayerIdx = 0;
    this.players = [];

    // Initialize particle engine
    this.particleEngine = new ParticleEngine(this.canvasEl);

    // Bind event listeners
    this.bindEvents();

    // Start game
    this.initGame(['RED', 'GREEN', 'YELLOW', 'BLUE'], {
      RED: false,   // Human
      GREEN: true,  // Bot
      YELLOW: true, // Bot
      BLUE: true    // Bot
    });
  }

  initGame(activeTeams = ['RED', 'GREEN', 'YELLOW', 'BLUE'], botConfig = {}) {
    this.players = activeTeams.map(team => ({
      team,
      isBot: botConfig[team] ?? true,
      hasWon: false,
      pieces: [
        { id: 0, pos: -1, hasFinished: false },
        { id: 1, pos: -1, hasFinished: false },
        { id: 2, pos: -1, hasFinished: false },
        { id: 3, pos: -1, hasFinished: false }
      ]
    }));

    this.currentPlayerIdx = 0;
    this.consecutiveSixes = 0;
    this.isRolling = false;
    this.isMoving = false;
    this.currentRoll = null;

    this.renderBoardTrack();
    this.renderCarTokens();
    this.updateDashboard();
    this.setGearPosition(0); // Neutral

    // Register torch positions for ambient particle embers
    setTimeout(() => {
      this.updateTorchPositions();
    }, 200);

    // If initial player is bot, trigger AI turn
    this.checkTurnState();
  }

  bindEvents() {
    this.shiftBtn.addEventListener('click', () => this.handleRollClick());
    this.gearKnob.parentElement.addEventListener('click', () => this.handleRollClick());

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.isRolling && !this.isMoving && this.currentRoll === null) {
        e.preventDefault();
        this.handleRollClick();
      }
    });

    // Speed toggle
    const speedBtn = document.getElementById('speed-btn');
    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        this.gameSpeed = this.gameSpeed === 1 ? 2.2 : 1;
        speedBtn.textContent = this.gameSpeed > 1 ? '⚡ NITRO (2X)' : '🏎️ NORMAL';
        speedBtn.classList.toggle('nitro-active', this.gameSpeed > 1);
      });
    }

    // Audio toggle
    const audioBtn = document.getElementById('audio-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const muted = window.racingAudio.toggleMute();
        audioBtn.textContent = muted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
        audioBtn.classList.toggle('muted', muted);
      });
    }

    // Game Mode Modal
    const newGameBtn = document.getElementById('new-game-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const startCustomGameBtn = document.getElementById('start-custom-game');

    if (newGameBtn && settingsModal) {
      newGameBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    }
    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
    }
    if (startCustomGameBtn && settingsModal) {
      startCustomGameBtn.addEventListener('click', () => {
        const pCount = parseInt(document.querySelector('input[name="player-count"]:checked')?.value || '4');
        const botRed = !document.getElementById('check-red-human')?.checked;
        const botGreen = !document.getElementById('check-green-human')?.checked;
        const botYellow = !document.getElementById('check-yellow-human')?.checked;
        const botBlue = !document.getElementById('check-blue-human')?.checked;

        const activeTeams = pCount === 2 ? ['RED', 'YELLOW'] : (pCount === 3 ? ['RED', 'GREEN', 'YELLOW'] : ['RED', 'GREEN', 'YELLOW', 'BLUE']);
        settingsModal.classList.remove('active');
        this.initGame(activeTeams, {
          RED: botRed,
          GREEN: botGreen,
          YELLOW: botYellow,
          BLUE: botBlue
        });
      });
    }

    // Rules modal
    const rulesBtn = document.getElementById('rules-btn');
    const rulesModal = document.getElementById('rules-modal');
    const closeRulesBtn = document.getElementById('close-rules');
    if (rulesBtn && rulesModal) {
      rulesBtn.addEventListener('click', () => rulesModal.classList.add('active'));
    }
    if (closeRulesBtn && rulesModal) {
      closeRulesBtn.addEventListener('click', () => rulesModal.classList.remove('active'));
    }

    // Close victory
    const restartBtn = document.getElementById('restart-game-btn');
    if (restartBtn && this.victoryModal) {
      restartBtn.addEventListener('click', () => {
        this.victoryModal.classList.remove('active');
        this.initGame(['RED', 'GREEN', 'YELLOW', 'BLUE'], {
          RED: false,
          GREEN: true,
          YELLOW: true,
          BLUE: true
        });
      });
    }

    // Locate P1 Base & Cars button
    const locateBtn = document.getElementById('locate-p1-btn');
    if (locateBtn) {
      locateBtn.addEventListener('click', () => this.locatePlayerCars());
    }

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyL') {
        this.locatePlayerCars();
      }
    });

    window.addEventListener('resize', () => {
      this.updateTorchPositions();
      this.updateAllCarPositions();
    });
  }

  /**
   * Visually highlights Player 1's base (Bottom-Left) and all Red supercars with pulsing radar ping
   */
  locatePlayerCars() {
    if (window.racingAudio) {
      window.racingAudio.playShiftClunk();
    }

    const p1Garage = document.querySelector('.garage-RED');
    if (p1Garage) {
      p1Garage.classList.remove('garage-ping');
      void p1Garage.offsetWidth;
      p1Garage.classList.add('garage-ping');
      setTimeout(() => p1Garage.classList.remove('garage-ping'), 2500);
    }

    const p1StartTile = document.querySelector('.player-start-tile');
    if (p1StartTile) {
      p1StartTile.classList.remove('tile-ping');
      void p1StartTile.offsetWidth;
      p1StartTile.classList.add('tile-ping');
      setTimeout(() => p1StartTile.classList.remove('tile-ping'), 2500);
    }

    document.querySelectorAll('.car-RED').forEach(car => {
      car.classList.remove('car-locate-ping');
      void car.offsetWidth;
      car.classList.add('car-locate-ping');
      setTimeout(() => car.classList.remove('car-locate-ping'), 2500);
    });

    if (this.turnBanner) {
      const origText = this.turnBanner.textContent;
      this.turnBanner.textContent = '📍 YOUR BASE: BOTTOM-LEFT PIT (RED START LINE: TILE #40)';
      setTimeout(() => {
        if (this.turnBanner && this.turnBanner.textContent.startsWith('📍 YOUR BASE')) {
          this.updateDashboard();
        }
      }, 2600);
    }
  }

  updateTorchPositions() {
    const rect = this.boardEl.getBoundingClientRect();
    const cRect = this.canvasEl.getBoundingClientRect();
    const offsetX = rect.left - cRect.left;
    const offsetY = rect.top - cRect.top;
    const s = rect.width / 15;

    // 4 Corner Braziers
    this.particleEngine.setTorches([
      { x: offsetX + s * 0.7, y: offsetY + s * 0.7 },
      { x: offsetX + s * 14.3, y: offsetY + s * 0.7 },
      { x: offsetX + s * 14.3, y: offsetY + s * 14.3 },
      { x: offsetX + s * 0.7, y: offsetY + s * 14.3 }
    ]);
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIdx];
  }

  updateDashboard() {
    const player = this.getCurrentPlayer();
    const cfg = TEAM_CONFIG[player.team];

    this.activePlayerName.textContent = `${cfg.name} (${player.isBot ? 'AI Bot' : 'Player'})`;
    this.activePlayerName.style.color = cfg.colorHex;
    this.activeTeamBadge.style.backgroundColor = cfg.colorHex;
    this.activeTeamBadge.style.boxShadow = `0 0 15px ${cfg.glowColor}`;

    const isLocked = player.isBot || this.isRolling || this.isMoving || this.currentRoll !== null;
    this.shiftBtn.disabled = isLocked;
    this.shiftBtn.style.opacity = isLocked ? '0.6' : '1';

    if (player.isBot) {
      this.turnBanner.textContent = 'AI SHIFTING GEARBOX...';
    } else if (this.currentRoll !== null) {
      this.turnBanner.textContent = `GEAR ${this.currentRoll} ENGAGED: SELECT YOUR CAR`;
    } else {
      this.turnBanner.textContent = 'YOUR TURN: ENGAGE CLUTCH & SHIFT GEAR!';
    }
  }


  /**
   * Render the 15x15 Ancient Colosseum Race Track SVG with Ultra-Realistic Textures & Clear Player Orientation
   */
  renderBoardTrack() {
    const s = 100 / 15; // 6.666% per tile
    let svgHtml = '';

    // Defs for realistic tarmac textures, headlight cones, and lighting gradients
    svgHtml += `
      <defs>
        <!-- Real Asphalt Macadam Noise Pattern -->
        <radialGradient id="asphaltGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#19181f" />
          <stop offset="70%" stop-color="#111015" />
          <stop offset="100%" stop-color="#08080a" />
        </radialGradient>

        <linearGradient id="kerbRedWhite" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#dd1122" />
          <stop offset="49%" stop-color="#dd1122" />
          <stop offset="50%" stop-color="#f5f5f5" />
          <stop offset="100%" stop-color="#f5f5f5" />
        </linearGradient>

        <linearGradient id="goldLaurel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff4b8" />
          <stop offset="35%" stop-color="#ffd700" />
          <stop offset="70%" stop-color="#d4af37" />
          <stop offset="100%" stop-color="#997a15" />
        </linearGradient>

        <linearGradient id="marblePedestal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3d3744" />
          <stop offset="50%" stop-color="#211e28" />
          <stop offset="100%" stop-color="#121017" />
        </linearGradient>

        <!-- Headlight Projection Beam Gradient -->
        <linearGradient id="lightBeam" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55" />
          <stop offset="35%" stop-color="#fff8cc" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#ffd700" stop-opacity="0" />
        </linearGradient>

        <!-- High-Gloss Specular Highlight -->
        <linearGradient id="specularReflection" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
          <stop offset="30%" stop-color="#ffffff" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>

        <filter id="hyperGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="shieldShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.85" />
        </filter>

        <!-- Racing Checkered Pattern -->
        <pattern id="checkeredPattern" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="1.5" height="1.5" fill="#ffffff" />
          <rect x="1.5" width="1.5" height="1.5" fill="#111111" />
          <rect y="1.5" width="1.5" height="1.5" fill="#111111" />
          <rect x="1.5" y="1.5" width="1.5" height="1.5" fill="#ffffff" />
        </pattern>
      </defs>
    `;

    // 1. Colosseum Sandstone Outer Wall & Dark Volcanic Asphalt Floor
    svgHtml += `
      <!-- Base Asphalt Floor -->
      <rect x="0" y="0" width="100" height="100" fill="url(#asphaltGrad)" />
      <!-- Subtle Tire Skid Curves on Track Floor -->
      <path d="M 12,42 Q 25,25 42,12" fill="none" stroke="#09080c" stroke-width="2.5" opacity="0.6" />
      <path d="M 58,12 Q 75,25 88,42" fill="none" stroke="#09080c" stroke-width="2.5" opacity="0.6" />
      <path d="M 88,58 Q 75,75 58,88" fill="none" stroke="#09080c" stroke-width="2.5" opacity="0.6" />
      <path d="M 42,88 Q 25,75 12,58" fill="none" stroke="#09080c" stroke-width="2.5" opacity="0.6" />
    `;

    // 2. 4 Pit Garages (Bases) with Clear Orientation & Player Tags
    const garages = [
      {
        team: 'GREEN',
        x: 0,
        y: 0,
        title: 'VIPER RACING',
        subtitle: 'OPPONENT (BOT)',
        isPlayer: false,
        color: TEAM_CONFIG.GREEN.colorHex,
        arrowText: 'PIT EXIT ►',
        arrowX: 4.8 * s,
        arrowY: 5.6 * s
      },
      {
        team: 'YELLOW',
        x: 9 * s,
        y: 0,
        title: 'SOLARIS GOLD',
        subtitle: 'OPPONENT (BOT)',
        isPlayer: false,
        color: TEAM_CONFIG.YELLOW.colorHex,
        arrowText: '▼ PIT EXIT',
        arrowX: 9.6 * s,
        arrowY: 4.8 * s
      },
      {
        team: 'BLUE',
        x: 9 * s,
        y: 9 * s,
        title: 'TRITON APEX',
        subtitle: 'OPPONENT (BOT)',
        isPlayer: false,
        color: TEAM_CONFIG.BLUE.colorHex,
        arrowText: '◄ PIT EXIT',
        arrowX: 10.2 * s,
        arrowY: 9.6 * s
      },
      {
        team: 'RED',
        x: 0,
        y: 9 * s,
        title: 'CRIMSON GT (YOUR SIDE)',
        subtitle: '★ PLAYER 1 BASE ★',
        isPlayer: true,
        color: TEAM_CONFIG.RED.colorHex,
        arrowText: 'EXIT TO TILE #40 ►',
        arrowX: 4.5 * s,
        arrowY: 13.5 * s
      }
    ];

    garages.forEach(g => {
      const isYou = g.isPlayer;
      svgHtml += `
        <g class="garage-zone garage-${g.team} ${isYou ? 'your-main-side' : ''}">
          <!-- Heavy Granite Wall Frame -->
          <rect x="${g.x}" y="${g.y}" width="${6 * s}" height="${6 * s}"
            fill="${isYou ? '#1b1419' : '#141318'}"
            stroke="${isYou ? '#ff2a44' : '#453d30'}"
            stroke-width="${isYou ? '1.2' : '0.7'}" rx="1.5" />

          <!-- Neon Circuit Glow Border (Extra Radiant for Player's Side) -->
          <rect x="${g.x + 0.8}" y="${g.y + 0.8}" width="${6 * s - 1.6}" height="${6 * s - 1.6}"
            fill="#0b0a0f"
            stroke="${g.color}"
            stroke-width="${isYou ? '0.9' : '0.5'}"
            stroke-dasharray="${isYou ? 'none' : '3, 1.5'}"
            opacity="${isYou ? '1' : '0.8'}" />

          ${isYou ? `
            <!-- Pulsing "YOU ARE HERE" Beacon Badge for Player 1 -->
            <rect x="${g.x + 0.8 * s}" y="${g.y + 0.6 * s}" width="${4.4 * s}" height="${1.1 * s}" rx="0.5" fill="#ff2a44" opacity="0.25" />
            <rect x="${g.x + 0.8 * s}" y="${g.y + 0.6 * s}" width="${4.4 * s}" height="${1.1 * s}" rx="0.5" fill="none" stroke="#ff2a44" stroke-width="0.5" />
            <text x="${g.x + 3 * s}" y="${g.y + 1.4 * s}" font-family="'Orbitron', monospace" font-size="1.5" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">★ YOUR MAIN BASE (P1) ★</text>
          ` : `
            <!-- Opponent Garage Header Banner -->
            <rect x="${g.x + 1 * s}" y="${g.y + 0.6 * s}" width="${4 * s}" height="${0.9 * s}" rx="0.4" fill="#000" opacity="0.5" />
            <text x="${g.x + 3 * s}" y="${g.y + 1.3 * s}" font-family="'Orbitron', monospace" font-size="1.2" font-weight="bold" fill="${g.color}" text-anchor="middle" letter-spacing="0.5">${g.title}</text>
          `}

          <!-- Central Hydraulic Pit Hub -->
          <circle cx="${g.x + 3 * s}" cy="${g.y + 3.4 * s}" r="${2.1 * s}" fill="#08080b" stroke="${g.color}" stroke-width="0.5" opacity="0.9" />
          <circle cx="${g.x + 3 * s}" cy="${g.y + 3.4 * s}" r="${1.2 * s}" fill="#17151e" stroke="#3d3744" stroke-width="0.5" />

          <!-- Roman Team Crest / Monogram -->
          <text x="${g.x + 3 * s}" y="${g.y + 3.8 * s}" font-family="'Cinzel', serif" font-size="2.6" font-weight="bold" fill="${g.color}" text-anchor="middle">${g.team[0]}</text>

          <!-- 4 Car Launch Pads -->
          ${this.renderGarageBays(g.x, g.y + 0.4 * s, s, g.color, isYou)}

          <!-- Exit Direction Arrow pointing to Start Line -->
          <text x="${g.arrowX}" y="${g.arrowY}" font-family="'Orbitron', monospace" font-size="1.1" font-weight="bold" fill="${isYou ? '#ffeb3b' : g.color}" text-anchor="middle">${g.arrowText}</text>
        </g>
      `;
    });

    // 3. Central Colosseum Winner's Circle Podium (Cols 6-8, Rows 6-8)
    const cx = 6 * s;
    const cy = 6 * s;
    const cSize = 3 * s;
    svgHtml += `
      <g class="center-podium">
        <!-- Sunken Roman Rotunda Base -->
        <rect x="${cx}" y="${cy}" width="${cSize}" height="${cSize}" fill="url(#marblePedestal)" stroke="#d4af37" stroke-width="0.9" />

        <!-- 4 Colored Home Victory Triangles -->
        <!-- Green (Left) -->
        <polygon points="${cx},${cy} ${cx + cSize / 2},${cy + cSize / 2} ${cx},${cy + cSize}" fill="${TEAM_CONFIG.GREEN.colorHex}" opacity="0.35" />
        <!-- Yellow (Top) -->
        <polygon points="${cx},${cy} ${cx + cSize},${cy} ${cx + cSize / 2},${cy + cSize / 2}" fill="${TEAM_CONFIG.YELLOW.colorHex}" opacity="0.35" />
        <!-- Blue (Right) -->
        <polygon points="${cx + cSize},${cy} ${cx + cSize},${cy + cSize} ${cx + cSize / 2},${cy + cSize / 2}" fill="${TEAM_CONFIG.BLUE.colorHex}" opacity="0.35" />
        <!-- Red (Bottom) -->
        <polygon points="${cx},${cy + cSize} ${cx + cSize},${cy + cSize} ${cx + cSize / 2},${cy + cSize / 2}" fill="${TEAM_CONFIG.RED.colorHex}" opacity="0.35" />

        <!-- 3D Roman Golden Laurels & Grand Trophy -->
        <circle cx="${cx + cSize / 2}" cy="${cy + cSize / 2}" r="${cSize * 0.42}" fill="#0a0805" stroke="url(#goldLaurel)" stroke-width="1.2" filter="url(#hyperGlow)" />
        <circle cx="${cx + cSize / 2}" cy="${cy + cSize / 2}" r="${cSize * 0.28}" fill="#241d08" stroke="#d4af37" stroke-width="0.6" />

        <!-- Triumphant Gold Trophy Emblem -->
        <text x="${cx + cSize / 2}" y="${cy + cSize / 2 + 1.4}" font-size="3.6" text-anchor="middle" filter="drop-shadow(0 0 8px #ffd700)">🏆</text>
        <text x="${cx + cSize / 2}" y="${cy + cSize / 2 + 3.1}" font-family="'Cinzel', serif" font-weight="bold" font-size="1.0" fill="#ffd700" text-anchor="middle" letter-spacing="1">VICTORIA</text>
      </g>
    `;

    // 4. 52 Perimeter Common Track Tiles with Realistic Asphalts, Kerbs & Arrows
    TRACK_COORDINATES.forEach((coord, idx) => {
      const tileX = coord.x * s;
      const tileY = coord.y * s;
      const isSafe = SAFE_TRACK_INDICES.has(idx);

      // Check starting tiles
      let startColor = null;
      let startLabel = '';
      if (idx === 0) { startColor = TEAM_CONFIG.GREEN.colorHex; startLabel = 'GRN START'; }
      else if (idx === 13) { startColor = TEAM_CONFIG.YELLOW.colorHex; startLabel = 'YEL START'; }
      else if (idx === 26) { startColor = TEAM_CONFIG.BLUE.colorHex; startLabel = 'BLU START'; }
      else if (idx === 39) { startColor = TEAM_CONFIG.RED.colorHex; startLabel = '★ YOUR START'; } // Player 1 Start

      const isPlayerStart = (idx === 39);

      svgHtml += `
        <g class="track-tile tile-${idx} ${isSafe ? 'tile-safe' : ''} ${isPlayerStart ? 'player-start-tile' : ''}" data-index="${idx}">
          <!-- Stone Asphalt Base -->
          <rect x="${tileX + 0.2}" y="${tileY + 0.2}" width="${s - 0.4}" height="${s - 0.4}" rx="0.5"
            fill="${startColor ? (isPlayerStart ? '#2b1218' : '#181b18') : '#131317'}"
            stroke="${isPlayerStart ? '#ff2a44' : (startColor ? startColor : (isSafe ? '#d4af37' : '#2b2933'))}"
            stroke-width="${isPlayerStart ? '1.0' : (isSafe || startColor ? '0.7' : '0.4')}" />

          <!-- Realistic Red/White Racing Kerbs on Edges -->
          <rect x="${tileX + 0.4}" y="${tileY + 0.4}" width="${s - 0.8}" height="0.8" fill="url(#kerbRedWhite)" opacity="0.75" />

          <!-- Center Lane White Dividing Dash (Clockwise race flow) -->
          <line x1="${tileX + s/2}" y1="${tileY + s*0.25}" x2="${tileX + s/2}" y2="${tileY + s*0.75}" stroke="#ffffff" stroke-width="0.4" stroke-dasharray="1.2, 1.2" opacity="0.4" />

          ${isSafe && !startColor ? `
            <!-- 3D Carved Roman Golden Shield / Safe Star (Aquila) -->
            <polygon points="${tileX + s/2},${tileY + 1.2} ${tileX + s - 1.2},${tileY + s - 1.4} ${tileX + 1.2},${tileY + s - 1.4}"
              fill="url(#goldLaurel)" opacity="0.45" filter="url(#shieldShadow)" />
            <circle cx="${tileX + s/2}" cy="${tileY + s/2}" r="1.3" fill="#ffd700" filter="drop-shadow(0 0 4px #ffd700)" />
            <text x="${tileX + s/2}" y="${tileY + s/2 + 0.6}" font-size="1.6" text-anchor="middle" fill="#000" font-weight="bold">★</text>
          ` : ''}

          ${startColor ? `
            <!-- Real F1 Start Grid Brackets & High-Visibility Banner -->
            <rect x="${tileX + 0.8}" y="${tileY + 0.8}" width="${s - 1.6}" height="${s - 1.6}" fill="${startColor}" opacity="${isPlayerStart ? '0.5' : '0.25'}" rx="0.4" />
            ${isPlayerStart ? `
              <!-- Checkered Flag Texture for Player 1 Start Line -->
              <rect x="${tileX + 0.8}" y="${tileY + 0.8}" width="${s - 1.6}" height="${s - 1.6}" fill="url(#checkeredPattern)" opacity="0.28" rx="0.4" />
            ` : ''}
            <!-- White Starting Box Brackets -->
            <path d="M ${tileX + 1.2},${tileY + 2.2} L ${tileX + 1.2},${tileY + 1.2} L ${tileX + 2.2},${tileY + 1.2}" fill="none" stroke="#fff" stroke-width="0.6" />
            <path d="M ${tileX + s - 2.2},${tileY + 1.2} L ${tileX + s - 1.2},${tileY + 1.2} L ${tileX + s - 1.2},${tileY + 2.2}" fill="none" stroke="#fff" stroke-width="0.6" />
            <text x="${tileX + s/2}" y="${tileY + s/2 + 0.7}" font-family="'Orbitron', monospace" font-weight="900" font-size="${isPlayerStart ? '1.35' : '1.3'}" text-anchor="middle" fill="${isPlayerStart ? '#ffffff' : startColor}">${isPlayerStart ? '★ START #40' : startLabel}</text>
          ` : ''}

          <!-- Subtle Track Tile Index Number -->
          <text x="${tileX + 1.2}" y="${tileY + 2.1}" font-size="1.0" fill="#585566" font-family="'Orbitron', monospace">${idx + 1}</text>
        </g>
      `;
    });

    // 5. 4 Colored Home Straightaways (5 tiles each leading into the podium)
    const homeRuns = [
      { team: 'GREEN', path: TEAM_CONFIG.GREEN.homePath, color: TEAM_CONFIG.GREEN.colorHex, arrow: '►' },
      { team: 'YELLOW', path: TEAM_CONFIG.YELLOW.homePath, color: TEAM_CONFIG.YELLOW.colorHex, arrow: '▼' },
      { team: 'BLUE', path: TEAM_CONFIG.BLUE.homePath, color: TEAM_CONFIG.BLUE.colorHex, arrow: '◄' },
      { team: 'RED', path: TEAM_CONFIG.RED.homePath, color: TEAM_CONFIG.RED.colorHex, arrow: '▲' }
    ];

    homeRuns.forEach(hr => {
      hr.path.forEach((pt, hIdx) => {
        const tx = pt.x * s;
        const ty = pt.y * s;
        const isRedHome = (hr.team === 'RED');

        svgHtml += `
          <g class="home-tile home-${hr.team}-${hIdx}">
            <!-- Runway Tile -->
            <rect x="${tx + 0.2}" y="${ty + 0.2}" width="${s - 0.4}" height="${s - 0.4}" rx="0.5"
              fill="${hr.color}" opacity="${isRedHome ? '0.45' : '0.35'}"
              stroke="${hr.color}" stroke-width="${isRedHome ? '0.9' : '0.6'}" />

            <!-- Illuminated Chevron Arrow pointing inward -->
            <circle cx="${tx + s/2}" cy="${ty + s/2}" r="1.4" fill="${hr.color}" opacity="0.75" />
            <text x="${tx + s/2}" y="${ty + s/2 + 0.6}" font-size="1.5" fill="#ffffff" font-weight="bold" text-anchor="middle">${hr.arrow}</text>
            <text x="${tx + 1.4}" y="${ty + 2.0}" font-size="0.9" fill="#ffffff" font-family="'Orbitron', monospace">${hIdx + 1}</text>
          </g>
        `;
      });
    });

    this.boardSvg.innerHTML = svgHtml;
  }

  renderGarageBays(gx, gy, s, color, isPlayer = false) {
    const bays = [
      { x: gx + 1.8 * s, y: gy + 1.8 * s },
      { x: gx + 3.2 * s, y: gy + 1.8 * s },
      { x: gx + 1.8 * s, y: gy + 3.2 * s },
      { x: gx + 3.2 * s, y: gy + 3.2 * s }
    ];

    return bays.map((b, i) => `
      <g class="pit-bay">
        <!-- Hydraulic Launch Ring -->
        <circle cx="${b.x}" cy="${b.y}" r="${0.62 * s}" fill="#16151c" stroke="${color}" stroke-width="${isPlayer ? '0.7' : '0.4'}" stroke-dasharray="2, 1" />
        <circle cx="${b.x}" cy="${b.y}" r="${0.45 * s}" fill="#0b0b0f" />
        <text x="${b.x}" y="${b.y + 0.5}" font-size="1.4" fill="${isPlayer ? '#ffffff' : '#777'}" font-weight="bold" text-anchor="middle" font-family="'Orbitron', monospace">CAR ${i+1}</text>
      </g>
    `).join('');
  }

  /**
   * Generates a hyper-realistic, Le Mans aerodynamic supercar SVG with glowing headlight beams and metallic body gloss
   */
  generateSupercarSvg(teamId) {
    const cfg = TEAM_CONFIG[teamId];
    const primary = cfg.colorHex;
    const secondary = cfg.secondaryHex;

    return `
      <svg viewBox="0 0 70 120" class="supercar-svg" style="filter: drop-shadow(0 0 8px ${cfg.glowColor});">
        <defs>
          <linearGradient id="body-${teamId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${secondary}" />
            <stop offset="25%" stop-color="${primary}" />
            <stop offset="50%" stop-color="#ffffff" stop-opacity="0.3" />
            <stop offset="75%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>

          <linearGradient id="canopy-${teamId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#80ffff" stop-opacity="0.9" />
            <stop offset="45%" stop-color="#0a2533" stop-opacity="0.95" />
            <stop offset="100%" stop-color="#050508" stop-opacity="1" />
          </linearGradient>

          <linearGradient id="headlightBeam" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65" />
            <stop offset="40%" stop-color="#fff8cc" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#ffd700" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- 1. Headlight Light Projection Cones casting onto asphalt -->
        <polygon points="21,20 0,-15 32,-15" fill="url(#headlightBeam)" opacity="0.8" />
        <polygon points="49,20 38,-15 70,-15" fill="url(#headlightBeam)" opacity="0.8" />

        <!-- 2. Neon Ground Effect Underglow -->
        <ellipse cx="35" cy="62" rx="30" ry="46" fill="${primary}" opacity="0.45" filter="blur(4px)" />

        <!-- 3. Four Wide Racing Tires with Bronze BBS Alloy Rims & Red Calipers -->
        <!-- Front Left Tire -->
        <rect x="5" y="24" width="11" height="20" rx="3" fill="#151515" stroke="#333" stroke-width="0.8" />
        <circle cx="10.5" cy="34" r="4.5" fill="#1e1e1e" stroke="#cca010" stroke-width="1.2" />
        <rect x="9.5" y="27" width="2" height="4" fill="#ff2200" /> <!-- Brake Caliper -->

        <!-- Front Right Tire -->
        <rect x="54" y="24" width="11" height="20" rx="3" fill="#151515" stroke="#333" stroke-width="0.8" />
        <circle cx="59.5" cy="34" r="4.5" fill="#1e1e1e" stroke="#cca010" stroke-width="1.2" />
        <rect x="58.5" y="27" width="2" height="4" fill="#ff2200" />

        <!-- Rear Left Tire -->
        <rect x="3" y="76" width="13" height="24" rx="3" fill="#151515" stroke="#333" stroke-width="0.8" />
        <circle cx="9.5" cy="88" r="5" fill="#1e1e1e" stroke="#cca010" stroke-width="1.4" />
        <rect x="8.5" y="79" width="2" height="5" fill="#ff2200" />

        <!-- Rear Right Tire -->
        <rect x="54" y="76" width="13" height="24" rx="3" fill="#151515" stroke="#333" stroke-width="0.8" />
        <circle cx="60.5" cy="88" r="5" fill="#1e1e1e" stroke="#cca010" stroke-width="1.4" />
        <rect x="59.5" y="79" width="2" height="5" fill="#ff2200" />

        <!-- 4. Carbon Aerodynamic Front Splitter -->
        <path d="M16,22 L35,8 L54,22 L51,28 L19,28 Z" fill="#1a1a1a" stroke="#444" stroke-width="0.8" />

        <!-- 5. Sculpted Metallic Hypercar Body Shell -->
        <path d="M18,26 Q35,16 52,26 Q57,46 55,76 L55,98 L15,98 L15,76 Q13,46 18,26 Z"
              fill="url(#body-${teamId})" stroke="#0a0a0a" stroke-width="1" />

        <!-- Side Radiator Pods & Aerodynamic Canards -->
        <path d="M15,48 L22,52 L22,74 L15,78 Z" fill="#111" />
        <path d="M55,48 L48,52 L48,74 L55,78 Z" fill="#111" />

        <!-- 6. Jet Fighter Cockpit Canopy with Roll Cage -->
        <path d="M26,38 Q35,28 44,38 L42,68 Q35,72 28,68 Z"
              fill="url(#canopy-${teamId})" stroke="#222" stroke-width="0.8" />
        <line x1="30" y1="42" x2="40" y2="62" stroke="#444" stroke-width="0.8" opacity="0.6" />
        <line x1="40" y1="42" x2="30" y2="62" stroke="#444" stroke-width="0.8" opacity="0.6" />

        <!-- 7. High-Intensity LED Headlights -->
        <ellipse cx="23" cy="20" rx="3" ry="1.8" fill="#ffffff" />
        <ellipse cx="47" cy="20" rx="3" ry="1.8" fill="#ffffff" />
        <ellipse cx="23" cy="20" rx="1.5" ry="0.9" fill="#00ffff" />
        <ellipse cx="47" cy="20" rx="1.5" ry="0.9" fill="#00ffff" />

        <!-- 8. Carbon Roof Scoop & Shark Fin -->
        <rect x="33.5" y="48" width="3" height="30" rx="1.5" fill="#111" />
        <ellipse cx="35" cy="42" rx="4" ry="2.5" fill="#000" />

        <!-- 9. Aggressive Carbon Rear Wing with Team Endplates -->
        <rect x="8" y="96" width="54" height="7" rx="1.5" fill="#1a1a1a" stroke="${primary}" stroke-width="0.9" />
        <rect x="7" y="92" width="3" height="15" rx="1" fill="${primary}" />
        <rect x="60" y="92" width="3" height="15" rx="1" fill="${primary}" />

        <!-- 10. Rear Red LED Brake Light Strip & Dual Exhausts -->
        <line x1="20" y1="102" x2="50" y2="102" stroke="#ff1133" stroke-width="1.8" filter="drop-shadow(0 0 3px #ff1133)" />
        <circle cx="28" cy="104" r="2.5" fill="#222" stroke="#999" stroke-width="0.5" />
        <circle cx="42" cy="104" r="2.5" fill="#222" stroke="#999" stroke-width="0.5" />
        <circle cx="28" cy="104" r="1.4" fill="#00ffff" />
        <circle cx="42" cy="104" r="1.4" fill="#00ffff" />
      </svg>
    `;
  }

  /**
   * Render all supercar tokens with rich SVG details
   */
  renderCarTokens() {
    this.carsContainer.innerHTML = '';

    this.players.forEach(player => {
      player.pieces.forEach((piece, pieceIdx) => {
        const carEl = document.createElement('div');
        carEl.className = `car-token car-${player.team}`;
        carEl.id = `car-${player.team}-${pieceIdx}`;
        carEl.dataset.team = player.team;
        carEl.dataset.pieceIndex = pieceIdx;

        // Custom Supercar Top-Down SVG model
        carEl.innerHTML = this.generateSupercarSvg(player.team);

        carEl.addEventListener('click', () => {
          this.handleCarClick(player.team, pieceIdx);
        });

        this.carsContainer.appendChild(carEl);
      });
    });

    this.updateAllCarPositions();
  }

  /**
   * Set physical pixel position and rotation for a car element
   */
  updateCarPosition(teamId, pieceIdx) {
    const player = this.players.find(p => p.team === teamId);
    if (!player) return;
    const piece = player.pieces[pieceIdx];
    const carEl = document.getElementById(`car-${teamId}-${pieceIdx}`);
    if (!carEl) return;

    const coords = getPieceCoordinates(teamId, pieceIdx, piece.pos);
    const rect = this.boardEl.getBoundingClientRect();
    const tileSize = rect.width / 15;

    // Center of target grid tile
    const posX = (coords.x + 0.5) * tileSize;
    const posY = (coords.y + 0.5) * tileSize;

    // Convert radian angle to SVG degrees
    // (Our car SVG model faces UP = -90 deg from standard X-axis)
    const deg = (coords.angle * 180 / Math.PI) + 90;

    carEl.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%) rotate(${deg}deg)`;
    carEl.style.width = `${tileSize * 0.88}px`;
    carEl.style.height = `${tileSize * 0.88}px`;

    if (coords.isFinish) {
      carEl.classList.add('car-finished');
    } else {
      carEl.classList.remove('car-finished');
    }
  }

  updateAllCarPositions() {
    this.players.forEach(player => {
      player.pieces.forEach((_, idx) => {
        this.updateCarPosition(player.team, idx);
      });
    });
  }

  /**
   * Highlight movable cars for current player turn
   */
  highlightMovableCars() {
    document.querySelectorAll('.car-token').forEach(c => c.classList.remove('car-selectable'));

    const player = this.getCurrentPlayer();
    if (this.currentRoll === null || player.isBot) return;

    const movable = getMovablePieces(player, this.currentRoll);
    movable.forEach(pIdx => {
      const carEl = document.getElementById(`car-${player.team}-${pIdx}`);
      if (carEl) {
        carEl.classList.add('car-selectable');
      }
    });

    if (movable.length > 0) {
      this.turnBanner.textContent = `GEAR ${this.currentRoll} READY! CHOOSE YOUR CAR`;
    }
  }

  /**
   * Shifter Gate Positions for Single Knob: H-pattern gate slots
   */
  setGearPosition(gear) {
    const positions = {
      0: { x: 0, y: 0 },     // Neutral center
      1: { x: -35, y: -43 }, // Top-Left
      2: { x: -35, y: 43 },  // Bottom-Left
      3: { x: 0, y: -43 },   // Top-Middle
      4: { x: 0, y: 43 },    // Bottom-Middle
      5: { x: 35, y: -43 },  // Top-Right
      6: { x: 35, y: 43 }    // Bottom-Right
    };

    const target = positions[gear] || positions[0];
    if (this.gearKnob) {
      this.gearKnob.style.transform = `translate(${target.x}px, ${target.y}px)`;
    }

    if (gear === 0) {
      if (this.gearReadout) this.gearReadout.textContent = 'N';
      if (this.tachNeedle) this.tachNeedle.style.transform = 'rotate(-120deg)';
      if (this.rpmReadout) this.rpmReadout.textContent = '800';
    } else {
      if (this.gearReadout) this.gearReadout.textContent = `${gear}`;
      const rpmDeg = -120 + (gear / 6) * 240;
      if (this.tachNeedle) this.tachNeedle.style.transform = `rotate(${rpmDeg}deg)`;
      if (this.rpmReadout) this.rpmReadout.textContent = `${1200 + gear * 1100}`;
    }
  }

  /**
   * Handle Roll / Gear Shift Event
   */
  handleRollClick() {
    const player = this.getCurrentPlayer();
    if (player.isBot || this.isRolling || this.isMoving || this.currentRoll !== null) return;
    this.executeRoll();
  }

  /**
   * Roll execution with mechanical gear shift (Acts as 1 Die)
   */
  executeRoll() {
    this.isRolling = true;
    this.shiftBtn.disabled = true;
    this.turnBanner.textContent = 'ENGAGING GEARBOX SHIFTER...';

    // 1. Audio: Mechanical shift clack
    window.racingAudio.playGearShift();

    // 2. Animate knob through neutral & tachometer surge
    this.setGearPosition(0);
    this.tachNeedle.style.transform = 'rotate(110deg)';
    this.rpmReadout.textContent = '7800';

    // 3. Roll 1 to 6 (Standard Ludo die)
    const rolledGear = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      window.racingAudio.playEngineRev(rolledGear);
      this.setGearPosition(rolledGear);
      this.currentRoll = rolledGear;
      this.isRolling = false;

      // Handle consecutive 6s rule (3 consecutive 6s forfeits turn)
      if (rolledGear === 6) {
        this.consecutiveSixes++;
        if (this.consecutiveSixes === 3) {
          this.turnBanner.textContent = 'ENGINE OVERHEAT! 3 CONSECUTIVE 6s — FORFEIT TURN';
          this.consecutiveSixes = 0;
          this.currentRoll = null;
          setTimeout(() => this.nextTurn(), 1600 / this.gameSpeed);
          return;
        }
      } else {
        this.consecutiveSixes = 0;
      }

      const player = this.getCurrentPlayer();
      const movable = getMovablePieces(player, rolledGear);

      if (movable.length === 0) {
        this.turnBanner.textContent = `GEAR ${rolledGear}: NO LEGAL MOVES AVAILABLE`;
        const bonusRoll = (rolledGear === 6);
        this.currentRoll = null;

        if (bonusRoll) {
          setTimeout(() => {
            this.turnBanner.textContent = `⚡ GEAR 6 BONUS ROLL GRANTED TO ${TEAM_CONFIG[player.team].name}!`;
            this.setGearPosition(0);
            this.updateDashboard();
            this.checkTurnState();
          }, 1200 / this.gameSpeed);
        } else {
          setTimeout(() => this.nextTurn(), 1200 / this.gameSpeed);
        }
      } else if (player.isBot) {
        // AI chooses smartest move
        setTimeout(() => {
          const aiChoice = chooseAiMove(player, rolledGear, this.players);
          if (aiChoice !== null) {
            this.moveCarPiece(player.team, aiChoice, rolledGear);
          } else {
            this.nextTurn();
          }
        }, 750 / this.gameSpeed);
      } else {
        // Human player: if only 1 car can move, auto-move it for smooth flow
        if (movable.length === 1) {
          this.highlightMovableCars();
          setTimeout(() => {
            this.moveCarPiece(player.team, movable[0], rolledGear);
          }, 450 / this.gameSpeed);
        } else {
          this.highlightMovableCars();
        }
      }
    }, 420 / this.gameSpeed);
  }

  handleCarClick(teamId, pieceIdx) {
    const player = this.getCurrentPlayer();
    if (player.isBot || this.isMoving || this.isRolling) return;
    if (player.team !== teamId || this.currentRoll === null) return;

    const movable = getMovablePieces(player, this.currentRoll);
    if (movable.includes(pieceIdx)) {
      document.querySelectorAll('.car-token').forEach(c => c.classList.remove('car-selectable'));
      this.moveCarPiece(teamId, pieceIdx, this.currentRoll);
    }
  }

  /**
   * Step-by-step Car Movement Animation with Drift Smoke
   */
  async moveCarPiece(teamId, pieceIdx, roll) {
    this.isMoving = true;
    this.shiftBtn.disabled = true;
    document.querySelectorAll('.car-token').forEach(c => c.classList.remove('car-selectable'));

    const player = this.players.find(p => p.team === teamId);
    const piece = player.pieces[pieceIdx];
    const initialPos = piece.pos;

    // Case 1: Deploying out of garage onto start tile (Requires 6)
    if (initialPos === -1) {
      piece.pos = 0;
      this.turnBanner.textContent = `${TEAM_CONFIG[teamId].carName} LAUNCHED FROM PIT LANE!`;
      window.racingAudio.playEngineRev(4);
      this.updateCarPosition(teamId, pieceIdx);

      // Emit launch burnout smoke
      const coords = getPieceCoordinates(teamId, pieceIdx, 0);
      const rect = this.boardEl.getBoundingClientRect();
      const tileSize = rect.width / 15;
      this.particleEngine.emitTireSmoke(
        (coords.x + 0.5) * tileSize,
        (coords.y + 0.5) * tileSize,
        coords.angle,
        TEAM_CONFIG[teamId].colorHex,
        true
      );

      await this.sleep(400 / this.gameSpeed);
      await this.handleTileLanding(teamId, pieceIdx, 0, roll);
      return;
    }

    // Case 2: Stepping along track tile-by-tile
    const targetPos = initialPos + roll;
    this.turnBanner.textContent = `${TEAM_CONFIG[teamId].carName} ACCELERATING (${roll} TILES)...`;

    for (let step = initialPos + 1; step <= targetPos; step++) {
      piece.pos = step;
      this.updateCarPosition(teamId, pieceIdx);

      // Emit exhaust smoke & tire sounds at each tile
      const coords = getPieceCoordinates(teamId, pieceIdx, step);
      const rect = this.boardEl.getBoundingClientRect();
      const tileSize = rect.width / 15;
      const posX = (coords.x + 0.5) * tileSize;
      const posY = (coords.y + 0.5) * tileSize;

      const isCorner = coords.trackIdx !== undefined && [5, 11, 12, 18, 24, 25, 31, 37, 38, 44, 50, 51].includes(coords.trackIdx);
      this.particleEngine.emitTireSmoke(posX, posY, coords.angle, TEAM_CONFIG[teamId].colorHex, isCorner);

      if (isCorner) {
        window.racingAudio.playDriftSmoke();
      } else {
        window.racingAudio.playNoiseBurst(0.06, 1200, 0.08, window.racingAudio.ctx?.currentTime || 0);
      }

      await this.sleep(220 / this.gameSpeed);
    }

    // Check landing resolution
    await this.handleTileLanding(teamId, pieceIdx, targetPos, roll);
  }

  /**
   * Resolves collisions (car crashes), safe zones, podium finishes, and bonus turns
   */
  async handleTileLanding(teamId, pieceIdx, finalPos, roll) {
    let earnedBonusTurn = (roll === 6); // Standard Ludo rule: rolling 6 grants an extra turn!
    const attackerCfg = TEAM_CONFIG[teamId];

    // 1. Check Finish Podium (pos 56)
    if (finalPos === 56) {
      window.racingAudio.playVictory();
      this.turnBanner.textContent = `🏆 ${attackerCfg.carName} CROSSED THE FINISH PODIUM!`;
      const coords = getPieceCoordinates(teamId, pieceIdx, 56);
      const rect = this.boardEl.getBoundingClientRect();
      const tileSize = rect.width / 15;
      this.particleEngine.emitVictoryGlow((coords.x + 0.5) * tileSize, (coords.y + 0.5) * tileSize, attackerCfg.colorHex);

      earnedBonusTurn = true; // Entering podium grants extra turn!

      // Check if this player has won (all 4 cars in podium)
      const player = this.players.find(p => p.team === teamId);
      const won = player.pieces.every(p => p.pos === 56);
      if (won) {
        player.hasWon = true;
        this.triggerVictory(teamId);
        return;
      }
    }

    // 2. Check Collision / Accident on Track (pos <= 50)
    else if (finalPos <= 50) {
      const trackIdx = (attackerCfg.startTrackIndex + finalPos) % 52;
      const isSafe = SAFE_TRACK_INDICES.has(trackIdx);

      if (isSafe) {
        window.racingAudio.playSafeZone();
        this.turnBanner.textContent = `🛡️ ${attackerCfg.carName} ENTERED SAFE LAUREL ZONE`;
      } else {
        // Look for enemy cars occupying the exact same track index!
        const crashVictims = [];
        this.players.forEach(other => {
          if (other.team !== teamId) {
            other.pieces.forEach((op, opIdx) => {
              if (op.pos >= 0 && op.pos <= 50) {
                const opTrackIdx = (TEAM_CONFIG[other.team].startTrackIndex + op.pos) % 52;
                if (opTrackIdx === trackIdx) {
                  crashVictims.push({ player: other, pieceIdx: opIdx, piece: op });
                }
              }
            });
          }
        });

        if (crashVictims.length > 0) {
          // Trigger Catastrophic Car Crash!
          await this.triggerCarCrash(teamId, pieceIdx, crashVictims, trackIdx);
          earnedBonusTurn = true; // Crashing an opponent always awards a bonus roll!
        }
      }
    }

    this.isMoving = false;
    this.currentRoll = null;

    if (earnedBonusTurn) {
      const reason = roll === 6 ? 'GEAR 6 ROLLED' : 'CRASH IMPACT WRECK';
      this.turnBanner.textContent = `⚡ ${reason}! BONUS NITRO TURN GRANTED TO ${attackerCfg.name}!`;
      this.setGearPosition(0); // Reset shifter knob to neutral for the bonus turn

      await this.sleep(700 / this.gameSpeed);
      this.updateDashboard();
      this.checkTurnState();
    } else {
      this.nextTurn();
    }
  }

  /**
   * Catastrophic Car Accident Collision Sequence
   */
  async triggerCarCrash(attackerTeam, attackerPieceIdx, victims, trackIdx) {
    const attackerCfg = TEAM_CONFIG[attackerTeam];
    const victim = victims[0];
    const victimCfg = TEAM_CONFIG[victim.player.team];

    // 1. Play Crash Audio
    window.racingAudio.playCrash();

    // 2. Shake Screen
    const gameContainer = document.getElementById('game-wrapper');
    gameContainer.classList.add('screen-shake');
    setTimeout(() => gameContainer.classList.remove('screen-shake'), 650);

    // 3. Canvas Explosion & Debris
    const coord = TRACK_COORDINATES[trackIdx];
    const rect = this.boardEl.getBoundingClientRect();
    const tileSize = rect.width / 15;
    const impactX = (coord.x + 0.5) * tileSize;
    const impactY = (coord.y + 0.5) * tileSize;
    this.particleEngine.emitCrashExplosion(impactX, impactY, attackerCfg.colorHex, victimCfg.colorHex);

    // 4. Dramatic Crash Overlay Banner
    this.crashAttackerText.textContent = `${attackerCfg.name} (${attackerCfg.carName})`;
    this.crashVictimText.textContent = `${victimCfg.name} (${victimCfg.carName})`;
    this.crashBanner.classList.add('active');

    // 5. Spin out the victim car
    victims.forEach(v => {
      const victimEl = document.getElementById(`car-${v.player.team}-${v.pieceIdx}`);
      if (victimEl) {
        victimEl.classList.add('car-crashing');
      }
    });

    await this.sleep(1200 / this.gameSpeed);

    // 6. Send victim cars back to garage
    victims.forEach(v => {
      v.piece.pos = -1;
      const victimEl = document.getElementById(`car-${v.player.team}-${v.pieceIdx}`);
      if (victimEl) {
        victimEl.classList.remove('car-crashing');
      }
      this.updateCarPosition(v.player.team, v.pieceIdx);
    });

    this.crashBanner.classList.remove('active');
  }

  /**
   * Advance to the next player's turn
   */
  nextTurn() {
    this.isMoving = false;
    this.isRolling = false;
    this.currentRoll = null;
    this.consecutiveSixes = 0;

    // Reset gear shifter to neutral
    this.setGearPosition(0);

    // Advance index in active players
    let attempts = 0;
    do {
      this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
      attempts++;
    } while (this.getCurrentPlayer().hasWon && attempts < this.players.length);

    this.updateDashboard();
    this.checkTurnState();
  }

  /**
   * Evaluates if active player is a bot and automatically rolls
   */
  checkTurnState() {
    const player = this.getCurrentPlayer();
    if (player.hasWon) return;

    if (player.isBot) {
      setTimeout(() => {
        if (this.getCurrentPlayer().isBot && !this.isRolling && !this.isMoving) {
          this.executeRoll();
        }
      }, 700 / this.gameSpeed);
    }
  }

  triggerVictory(winningTeam) {
    const cfg = TEAM_CONFIG[winningTeam];
    this.winnerTitle.textContent = `${cfg.name.toUpperCase()} CLAIMS THE COLOSSEUM CROWN!`;
    this.winnerTitle.style.color = cfg.colorHex;
    this.victoryModal.classList.add('active');
    window.racingAudio.playVictory();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new ApexGame();
});
