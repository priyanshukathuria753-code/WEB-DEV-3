/**
 * Apex Antiqua - Ludo Board Coordinates & Game Rules Engine
 * Symmetrical 15x15 grid coordinate system, 52-tile perimeter track, 8 safe zones,
 * and AI decision engine.
 */

const LUDO_TEAMS = {
  RED: 'RED',
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  BLUE: 'BLUE'
};

const TEAM_CONFIG = {
  RED: {
    id: 'RED',
    name: 'Crimson Centurion',
    carName: 'Centurion GT',
    colorHex: '#ff2a44',
    secondaryHex: '#990011',
    glowColor: 'rgba(255, 42, 68, 0.6)',
    startTrackIndex: 39,
    garageCenter: { x: 2.5, y: 11.5 },
    garageSlots: [
      { x: 1.8, y: 10.8 },
      { x: 3.2, y: 10.8 },
      { x: 1.8, y: 12.2 },
      { x: 3.2, y: 12.2 }
    ],
    homePath: [
      { x: 7, y: 13 },
      { x: 7, y: 12 },
      { x: 7, y: 11 },
      { x: 7, y: 10 },
      { x: 7, y: 9 }
    ],
    finishSpot: { x: 7, y: 7.8 }
  },
  GREEN: {
    id: 'GREEN',
    name: 'Viper Apex',
    carName: 'Veneno V12',
    colorHex: '#00e676',
    secondaryHex: '#006622',
    glowColor: 'rgba(0, 230, 118, 0.6)',
    startTrackIndex: 0,
    garageCenter: { x: 2.5, y: 2.5 },
    garageSlots: [
      { x: 1.8, y: 1.8 },
      { x: 3.2, y: 1.8 },
      { x: 1.8, y: 3.2 },
      { x: 3.2, y: 3.2 }
    ],
    homePath: [
      { x: 1, y: 7 },
      { x: 2, y: 7 },
      { x: 3, y: 7 },
      { x: 4, y: 7 },
      { x: 5, y: 7 }
    ],
    finishSpot: { x: 6.2, y: 7 }
  },
  YELLOW: {
    id: 'YELLOW',
    name: 'Solaris GT',
    carName: 'Hyperion Gold',
    colorHex: '#ffc400',
    secondaryHex: '#b28900',
    glowColor: 'rgba(255, 196, 0, 0.6)',
    startTrackIndex: 13,
    garageCenter: { x: 11.5, y: 2.5 },
    garageSlots: [
      { x: 10.8, y: 1.8 },
      { x: 12.2, y: 1.8 },
      { x: 10.8, y: 3.2 },
      { x: 12.2, y: 3.2 }
    ],
    homePath: [
      { x: 7, y: 1 },
      { x: 7, y: 2 },
      { x: 7, y: 3 },
      { x: 7, y: 4 },
      { x: 7, y: 5 }
    ],
    finishSpot: { x: 7, y: 6.2 }
  },
  BLUE: {
    id: 'BLUE',
    name: 'Triton Phantom',
    carName: 'Chiron Aero',
    colorHex: '#00b0ff',
    secondaryHex: '#004488',
    glowColor: 'rgba(0, 176, 255, 0.6)',
    startTrackIndex: 26,
    garageCenter: { x: 11.5, y: 11.5 },
    garageSlots: [
      { x: 10.8, y: 10.8 },
      { x: 12.2, y: 10.8 },
      { x: 10.8, y: 12.2 },
      { x: 12.2, y: 12.2 }
    ],
    homePath: [
      { x: 13, y: 7 },
      { x: 12, y: 7 },
      { x: 11, y: 7 },
      { x: 10, y: 7 },
      { x: 9, y: 7 }
    ],
    finishSpot: { x: 7.8, y: 7 }
  }
};

// 52 Common Perimeter Track Tiles (Clockwise standard)
const TRACK_COORDINATES = [
  { x: 1, y: 6 },  // 0: Green Start (Safe)
  { x: 2, y: 6 },  // 1
  { x: 3, y: 6 },  // 2
  { x: 4, y: 6 },  // 3
  { x: 5, y: 6 },  // 4
  { x: 6, y: 5 },  // 5
  { x: 6, y: 4 },  // 6
  { x: 6, y: 3 },  // 7
  { x: 6, y: 2 },  // 8: Safe Star 1
  { x: 6, y: 1 },  // 9
  { x: 6, y: 0 },  // 10
  { x: 7, y: 0 },  // 11: Top Bridge
  { x: 8, y: 0 },  // 12
  { x: 8, y: 1 },  // 13: Yellow Start (Safe)
  { x: 8, y: 2 },  // 14
  { x: 8, y: 3 },  // 15
  { x: 8, y: 4 },  // 16
  { x: 8, y: 5 },  // 17
  { x: 9, y: 6 },  // 18
  { x: 10, y: 6 }, // 19
  { x: 11, y: 6 }, // 20
  { x: 12, y: 6 }, // 21: Safe Star 2
  { x: 13, y: 6 }, // 22
  { x: 14, y: 6 }, // 23
  { x: 14, y: 7 }, // 24: Right Bridge
  { x: 14, y: 8 }, // 25
  { x: 13, y: 8 }, // 26: Blue Start (Safe)
  { x: 12, y: 8 }, // 27
  { x: 11, y: 8 }, // 28
  { x: 10, y: 8 }, // 29
  { x: 9, y: 8 },  // 30
  { x: 8, y: 9 },  // 31
  { x: 8, y: 10 }, // 32
  { x: 8, y: 11 }, // 33
  { x: 8, y: 12 }, // 34: Safe Star 3
  { x: 8, y: 13 }, // 35
  { x: 8, y: 14 }, // 36
  { x: 7, y: 14 }, // 37: Bottom Bridge
  { x: 6, y: 14 }, // 38
  { x: 6, y: 13 }, // 39: Red Start (Safe)
  { x: 6, y: 12 }, // 40
  { x: 6, y: 11 }, // 41
  { x: 6, y: 10 }, // 42
  { x: 6, y: 9 },  // 43
  { x: 5, y: 8 },  // 44
  { x: 4, y: 8 },  // 45
  { x: 3, y: 8 },  // 46
  { x: 2, y: 8 },  // 47: Safe Star 4
  { x: 1, y: 8 },  // 48
  { x: 0, y: 8 },  // 49
  { x: 0, y: 7 },  // 50: Left Bridge
  { x: 0, y: 6 }   // 51
];

// Safe tiles indices on TRACK_COORDINATES
const SAFE_TRACK_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

/**
 * Calculates world tile position and car orientation angle (radians) for a given piece state
 */
function getPieceCoordinates(teamId, pieceIndex, pos) {
  const cfg = TEAM_CONFIG[teamId];

  // In Garage Pit Stall
  if (pos === -1) {
    const slot = cfg.garageSlots[pieceIndex];
    // Facing outward towards pit exit
    let angle = 0;
    if (teamId === 'GREEN') angle = Math.PI * 0.25;
    else if (teamId === 'YELLOW') angle = Math.PI * 0.75;
    else if (teamId === 'BLUE') angle = Math.PI * 1.25;
    else if (teamId === 'RED') angle = -Math.PI * 0.25;
    return { x: slot.x, y: slot.y, angle, inGarage: true, inHome: false, isFinish: false };
  }

  // On Common Track (0 to 50)
  if (pos <= 50) {
    const trackIdx = (cfg.startTrackIndex + pos) % 52;
    const current = TRACK_COORDINATES[trackIdx];
    const nextIdx = (trackIdx + 1) % 52;
    const next = TRACK_COORDINATES[nextIdx];
    const angle = Math.atan2(next.y - current.y, next.x - current.x);
    return { x: current.x, y: current.y, angle, trackIdx, inGarage: false, inHome: false, isFinish: false };
  }

  // In Home Stretch (51 to 55)
  if (pos <= 55) {
    const homeIdx = pos - 51;
    const current = cfg.homePath[homeIdx];
    let next = homeIdx < 4 ? cfg.homePath[homeIdx + 1] : cfg.finishSpot;
    const angle = Math.atan2(next.y - current.y, next.x - current.x);
    return { x: current.x, y: current.y, angle, inGarage: false, inHome: true, isFinish: false };
  }

  // In Finish Podium (56)
  return {
    x: cfg.finishSpot.x,
    y: cfg.finishSpot.y,
    angle: 0,
    inGarage: false,
    inHome: false,
    isFinish: true
  };
}

/**
 * Validates whether a specific car can move given a dice roll
 */
function canCarMove(piece, roll) {
  // If in garage, requires 6 to deploy
  if (piece.pos === -1) {
    return roll === 6;
  }
  // If on track or home, cannot overshoot finish podium (pos 56)
  if (piece.pos + roll <= 56) {
    return true;
  }
  return false;
}

/**
 * Returns list of valid car indices for the current player
 */
function getMovablePieces(player, roll) {
  const movable = [];
  player.pieces.forEach((p, idx) => {
    if (canCarMove(p, roll)) {
      movable.push(idx);
    }
  });
  return movable;
}

/**
 * AI Decision Engine: Evaluates the smartest tactical move for bots
 * Priorities:
 * 1. Capture/Crash opponent car (+100)
 * 2. Enter finish podium (+90)
 * 3. Deploy out of garage on 6 (+80)
 * 4. Move onto a safe star/starting tile (+60)
 * 5. Escape from danger if an opponent is right behind (+50)
 * 6. Advance car furthest down the track (+20)
 */
function chooseAiMove(player, roll, allPlayers) {
  const movable = getMovablePieces(player, roll);
  if (movable.length === 0) return null;
  if (movable.length === 1) return movable[0];

  let bestPieceIdx = movable[0];
  let bestScore = -Infinity;

  movable.forEach(pIdx => {
    const piece = player.pieces[pIdx];
    let score = 0;

    // Deploying from garage
    if (piece.pos === -1) {
      score += 80;
      // Check if enemy is on our start tile (free crash!)
      const ourStartIdx = TEAM_CONFIG[player.team].startTrackIndex;
      allPlayers.forEach(other => {
        if (other.team !== player.team) {
          other.pieces.forEach(op => {
            if (op.pos >= 0 && op.pos <= 50) {
              const opTrackIdx = (TEAM_CONFIG[other.team].startTrackIndex + op.pos) % 52;
              if (opTrackIdx === ourStartIdx) score += 100;
            }
          });
        }
      });
    } else {
      const targetPos = piece.pos + roll;

      // Finish podium entry
      if (targetPos === 56) {
        score += 95;
      }
      // Home stretch entry
      else if (targetPos >= 51) {
        score += 70 + (targetPos - 50) * 4;
      }
      // On common track
      else {
        const targetTrackIdx = (TEAM_CONFIG[player.team].startTrackIndex + targetPos) % 52;

        // Check crash attack on opponent
        if (!SAFE_TRACK_INDICES.has(targetTrackIdx)) {
          allPlayers.forEach(other => {
            if (other.team !== player.team) {
              other.pieces.forEach(op => {
                if (op.pos >= 0 && op.pos <= 50) {
                  const opTrackIdx = (TEAM_CONFIG[other.team].startTrackIndex + op.pos) % 52;
                  if (opTrackIdx === targetTrackIdx) {
                    score += 120; // Massive incentive to crash opponent!
                  }
                }
              });
            }
          });
        }

        // Landing on safe zone
        if (SAFE_TRACK_INDICES.has(targetTrackIdx)) {
          score += 55;
        }

        // Progressive distance bonus
        score += piece.pos * 0.8;
      }
    }

    // Add tiny random variance to make AI feel natural
    score += Math.random() * 5;

    if (score > bestScore) {
      bestScore = score;
      bestPieceIdx = pIdx;
    }
  });

  return bestPieceIdx;
}

/**
 * Dual-Dice AI Decision Engine: Evaluates the smartest tactical move across remaining active dice
 * @param {Object} player
 * @param {Array<{dieIdx: number, val: number}>} activeDice
 * @param {Array<Object>} allPlayers
 * @returns {{pieceIdx: number, dieIdx: number, val: number} | null}
 */
function chooseBestMoveFromDice(player, activeDice, allPlayers) {
  if (!activeDice || activeDice.length === 0) return null;

  let bestMove = null;
  let bestScore = -Infinity;

  activeDice.forEach(dieObj => {
    const roll = dieObj.val;
    const movable = getMovablePieces(player, roll);

    movable.forEach(pIdx => {
      const piece = player.pieces[pIdx];
      let score = 0;

      // Deploying from garage on 6
      if (piece.pos === -1) {
        score += 85;
        const ourStartIdx = TEAM_CONFIG[player.team].startTrackIndex;
        allPlayers.forEach(other => {
          if (other.team !== player.team) {
            other.pieces.forEach(op => {
              if (op.pos >= 0 && op.pos <= 50) {
                const opTrackIdx = (TEAM_CONFIG[other.team].startTrackIndex + op.pos) % 52;
                if (opTrackIdx === ourStartIdx) score += 120;
              }
            });
          }
        });
      } else {
        const targetPos = piece.pos + roll;

        // Finish podium entry
        if (targetPos === 56) {
          score += 100;
        }
        // Home stretch entry
        else if (targetPos >= 51) {
          score += 75 + (targetPos - 50) * 5;
        }
        // Common track
        else {
          const targetTrackIdx = (TEAM_CONFIG[player.team].startTrackIndex + targetPos) % 52;

          // Check crash attack on opponent
          if (!SAFE_TRACK_INDICES.has(targetTrackIdx)) {
            allPlayers.forEach(other => {
              if (other.team !== player.team) {
                other.pieces.forEach(op => {
                  if (op.pos >= 0 && op.pos <= 50) {
                    const opTrackIdx = (TEAM_CONFIG[other.team].startTrackIndex + op.pos) % 52;
                    if (opTrackIdx === targetTrackIdx) {
                      score += 130; // High incentive to crash!
                    }
                  }
                });
              }
            });
          }

          // Safe zone entry
          if (SAFE_TRACK_INDICES.has(targetTrackIdx)) {
            score += 60;
          }

          score += piece.pos * 0.9;
        }
      }

      score += Math.random() * 6;

      if (score > bestScore) {
        bestScore = score;
        bestMove = { pieceIdx: pIdx, dieIdx: dieObj.dieIdx, val: roll };
      }
    });
  });

  return bestMove;
}

window.LUDO_TEAMS = LUDO_TEAMS;
window.TEAM_CONFIG = TEAM_CONFIG;
window.TRACK_COORDINATES = TRACK_COORDINATES;
window.SAFE_TRACK_INDICES = SAFE_TRACK_INDICES;
window.getPieceCoordinates = getPieceCoordinates;
window.canCarMove = canCarMove;
window.getMovablePieces = getMovablePieces;
window.chooseAiMove = chooseAiMove;
window.chooseBestMoveFromDice = chooseBestMoveFromDice;

