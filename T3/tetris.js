// ======================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ========================
let arenaWidth = 10;
let arenaHeight = 20;
let arena = [];
let soundMuted = false;
let musicMuted = false;
let currentMusicTrack = null;
let isGameStarted = false;
let isGameOver = false;
let audioInitialized = false;
let selectedMode = 'classic';
let selectedDifficulty = 'medium';
let difficultyMultiplier = 1;
let slowDownInterval = null;
let isSlowDownActive = false;
let comboDisplayTimer = null;
// ======================== ПЕРЕМЕННЫЕ ДЛЯ ПАГИНАЦИИ ========================
let currentScrollPage = 1;
const SCROLLS_PER_PAGE = 5;
const TOTAL_SCROLLS = 100;

let currentCollectionPage = 1;
let currentCollectionCategory = null;
const COLLECTION_ITEMS_PER_PAGE = 15;
const CATEGORY_ORDER = ['blocks', 'animals', 'plants', 'space'];

// ======================== БОНУСЫ ========================
const BONUS_TYPES = {
    STAR: { symbol: '⭐', points: 3, color: '#FFD700', label: 'Звезда' },
    CLOVER: { symbol: '🍀', points: 2, color: '#22c55e', label: 'Клевер' },
    CANDY: { symbol: '🍬', points: 1, color: '#f472b6', label: 'Конфета' }
};

let activeBonus = null;
let bonusSpawnCooldown = 0;
const BONUS_SPAWN_CHANCE = 0.15;
const BONUS_MAX_COOLDOWN = 7;

// ======================== CANVAS ========================
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

// ======================== ЦВЕТА ========================
const colors = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];

// ======================== РАЗМЕР ПОЛЯ ========================
function calculateOptimalArenaWidth() {
    const container = document.querySelector('.canvas-container');
    if (!container) return 14;
    const availableWidth = container.getBoundingClientRect().width - 12;
    if (availableWidth <= 0) return 14;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        if (availableWidth >= 500) return 18;
        if (availableWidth >= 400) return 16;
        return 14;
    }
    
    if (availableWidth >= 1000) return 24;
    if (availableWidth >= 800) return 22;
    if (availableWidth >= 600) return 20;
    return 22;
}

function resizeGameField() {
    const newWidth = calculateOptimalArenaWidth();
    if (newWidth === arenaWidth) return;
    
    const oldArena = arena;
    const oldWidth = arenaWidth;
    arenaWidth = newWidth;
    const newArena = createMatrix(arenaWidth, arenaHeight);
    
    const offsetX = Math.floor((arenaWidth - oldWidth) / 2);
    for (let y = 0; y < arenaHeight; y++) {
        if (oldArena[y]) {
            for (let x = 0; x < oldWidth; x++) {
                const value = oldArena[y][x];
                if (value !== 0 && value !== 'bonus') {
                    const newX = x + offsetX;
                    if (newX >= 0 && newX < arenaWidth) {
                        newArena[y][newX] = value;
                    }
                }
            }
        }
    }
    arena = newArena;
    
    if (player && player.matrix) {
        const matrixWidth = player.matrix[0].length;
        const maxX = arenaWidth - matrixWidth;
        if (player.pos.x > maxX) player.pos.x = maxX;
        if (player.pos.x < 0) player.pos.x = 0;
    }
}

function updateCanvasSize() {
    const container = document.querySelector('.canvas-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const padding = 12;
    const maxHeight = window.innerHeight * 0.85;
    const containerWidth = rect.width - padding;
    const containerHeight = Math.min(rect.height - padding, maxHeight);
    if (containerWidth <= 0 || containerHeight <= 0) return;
    canvas.width = containerWidth;
    canvas.height = containerHeight;
}

// ======================== ФУНКЦИИ СОЗДАНИЯ МАТРИЦ ========================
function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function createPiece(type) {
    switch (type) {
        case "T": return [[0,0,0], [1,1,1], [0,1,0]];
        case "O": return [[2,2], [2,2]];
        case "L": return [[0,3,0], [0,3,0], [0,3,3]];
        case "J": return [[0,4,0], [0,4,0], [4,4,0]];
        case "I": return [[0,5,0,0], [0,5,0,0], [0,5,0,0], [0,5,0,0]];
        case "S": return [[0,6,6], [6,6,0], [0,0,0]];
        case "Z": return [[7,7,0], [0,7,7], [0,0,0]];
        default: return [[0]];
    }
}

const pieces = 'ILJOTSZ';

// ======================== РЕЖИМ ТЕТРА ========================
const tetraPieces = {
    I: { shape: [[1, 1, 1]], color: '#00f5ff' },
    L: { shape: [[1, 0], [1, 1]], color: '#ff8c00' },
    J: { shape: [[0, 1], [1, 1]], color: '#4169e1' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff4500' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#32cd32' },
    O: { shape: [[1, 1], [1, 1]], color: '#ffd700' },
    T: { shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: '#9370db' }
};
const tetraKeys = ['I', 'L', 'J', 'Z', 'S', 'O', 'T'];

function createTetraPiece() {
    const key = tetraKeys[Math.floor(Math.random() * tetraKeys.length)];
    const piece = tetraPieces[key];
    const matrix = piece.shape.map(row => [...row]);
    matrix._color = piece.color;
    matrix._key = key;
    return matrix;
}

function rotateTetraMatrix(matrix) {
    const key = matrix._key;
    if (key === 'O' || key === 'T') {
        const newMatrix = matrix.map(row => [...row]);
        newMatrix._color = matrix._color;
        newMatrix._key = matrix._key;
        return newMatrix;
    }
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];
    for (let x = 0; x < cols; x++) {
        rotated[x] = [];
        for (let y = rows - 1; y >= 0; y--) {
            rotated[x].push(matrix[y][x]);
        }
    }
    rotated._color = matrix._color;
    rotated._key = matrix._key;
    return rotated;
}

// ======================== РЕЖИМ ПЕНТА ========================
const pentaPieces = {
    I: { shape: [[1, 1, 1, 1, 1]], color: '#00f5ff' },
    L: { shape: [[1, 0], [1, 0], [1, 0], [1, 1]], color: '#22c55e' },
    J: { shape: [[0, 1], [0, 1], [0, 1], [1, 1]], color: '#4169e1' },
    Z: { shape: [[1, 1, 0], [0, 1, 0], [0, 1, 1]], color: '#ff4500' },
    S: { shape: [[0, 1, 1], [0, 1, 0], [1, 1, 0]], color: '#32cd32' },
    T: { shape: [[1, 1, 1], [0, 1, 0], [0, 1, 0]], color: '#9370db' },
    P: { shape: [[1, 1], [1, 1], [1, 0]], color: '#ffd700' }
};
const pentaKeys = ['I', 'L', 'J', 'Z', 'S', 'T', 'P'];

function createPentaPiece() {
    const key = pentaKeys[Math.floor(Math.random() * pentaKeys.length)];
    const piece = pentaPieces[key];
    const matrix = piece.shape.map(row => [...row]);
    matrix._color = piece.color;
    matrix._key = key;
    return matrix;
}

function rotatePentaMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];
    for (let x = 0; x < cols; x++) {
        rotated[x] = [];
        for (let y = rows - 1; y >= 0; y--) {
            rotated[x].push(matrix[y][x]);
        }
    }
    rotated._color = matrix._color;
    rotated._key = matrix._key;
    return rotated;
}

// ======================== ИГРОК ========================
const player = {
    pos: { x: 5, y: 0 },
    matrix: null,
    nextMatrix: null,
    score: 0,
    lines: 0,
    level: 1,
    spins: 0,
    crazySpins: false,
    isTetraMode: false,
    isPentaMode: false
};

// ======================== СОСТОЯНИЕ ИГРЫ ========================
const gameState = {
    initialized: false,
    paused: false,
    introSongPlayed: false,
    gameOver: false
};

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationFrameId = null;

// ======================== АНИМАЦИЯ ПРОИГРЫША ========================
let gameOverAnimation = {
    active: false,
    startTime: 0,
    duration: 4000,
    matrix: null,
    pos: { x: 0, y: 0 }
};

// ======================== ФУНКЦИИ КОЛЛИЗИИ ========================
function collide(arena, player) {
    if (player.isTetraMode) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0) {
                    const arenaY = y + o.y;
                    const arenaX = x + o.x;
                    if (arenaY < 0 || arenaY >= arenaHeight || arenaX < 0 || arenaX >= arenaWidth) return true;
                    const cell = arena[arenaY]?.[arenaX];
                    if (cell !== 0 && cell !== 'bonus') return true;
                }
            }
        }
        return false;
    }
    
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0) {
                const arenaY = y + o.y;
                const arenaX = x + o.x;
                if (arenaY < 0 || arenaY >= arenaHeight || arenaX < 0 || arenaX >= arenaWidth) return true;
                const cell = arena[arenaY]?.[arenaX];
                if (cell !== 0 && cell !== 'bonus') return true;
            }
        }
    }
    return false;
}

// ======================== БОНУСЫ ========================
function spawnBonus() {
    if (activeBonus) return;
    if (bonusSpawnCooldown > 0) {
        bonusSpawnCooldown--;
        return;
    }
    
    const types = ['STAR', 'CLOVER', 'CANDY'];
    const typeKey = types[Math.floor(Math.random() * types.length)];
    const bonus = BONUS_TYPES[typeKey];
    
    let maxY;
    if (selectedDifficulty === 'easy') maxY = arenaHeight - 5;
    else if (selectedDifficulty === 'medium') maxY = arenaHeight - 8;
    else maxY = 5;
    
    let attempts = 0;
    let posX, posY;
    let placed = false;
    while (attempts < 50 && !placed) {
        posY = Math.floor(Math.random() * maxY);
        posX = Math.floor(Math.random() * arenaWidth);
        if (arena[posY] && arena[posY][posX] === 0) placed = true;
        attempts++;
    }
    
    if (placed) {
        activeBonus = {
            type: typeKey,
            x: posX,
            y: posY,
            symbol: bonus.symbol,
            points: bonus.points,
            color: bonus.color
        };
        arena[posY][posX] = 'bonus';
        console.log(`✨ Бонус появился: ${bonus.label} на (${posX}, ${posY})`);
    }
}

function checkBonusCollision() {
    if (!activeBonus) return false;
    for (let y = 0; y < player.matrix.length; y++) {
        for (let x = 0; x < player.matrix[y].length; x++) {
            const arenaY = player.pos.y + y;
            const arenaX = player.pos.x + x;
            if (arena[arenaY] && arena[arenaY][arenaX] === 'bonus') {
                const bonus = activeBonus;
                arena[arenaY][arenaX] = 0;
                player.score += bonus.points;
                showBonusNotification(bonus);
                activeBonus = null;
                bonusSpawnCooldown = BONUS_MAX_COOLDOWN;
                if (typeof gameAudio !== 'undefined') gameAudio.playOneShot('levelup', 0.15);
                return true;
            }
        }
    }
    return false;
}

function showBonusNotification(bonus) {
    const t = window.getText || (key => key);
    const bonusText = t('bonus') || 'Бонус!';
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; bottom: 30px; left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: rgba(20, 20, 30, 0.92);
        border: 2px solid ${bonus.color || '#FFD700'};
        border-radius: 20px; padding: 16px 30px;
        display: flex; align-items: center; gap: 16px;
        z-index: 99999; opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(20px);
        font-family: 'Russo One', sans-serif;
        pointer-events: none;
    `;
    notification.innerHTML = `
        <span style="font-size: 32px;">${bonus.symbol}</span>
        <div>
            <span style="color: #fff; font-size: 20px; text-transform: uppercase;">${bonusText}</span>
            <span style="color: ${bonus.color}; font-size: 14px; display: block;">${bonus.label}</span>
        </div>
        <span style="color: ${bonus.color}; font-size: 24px; font-weight: bold;">+${bonus.points}</span>
    `;
    document.body.appendChild(notification);
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-30px)';
        setTimeout(() => { if (notification.parentNode) notification.remove(); }, 400);
    }, 2000);
}

// ======================== ИГРОВАЯ ЛОГИКА ========================
function merge(arena, player) {
    if (player.isTetraMode || player.isPentaMode) {
        const color = player.matrix._color || '#ff0000';
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const arenaY = player.pos.y + y;
                    const arenaX = player.pos.x + x;
                    if (arenaY >= 0 && arenaY < arenaHeight && arenaX >= 0 && arenaX < arenaWidth) {
                        if (arena[arenaY][arenaX] !== 'bonus') {
                            arena[arenaY][arenaX] = color;
                        }
                    }
                }
            });
        });
        return;
    }
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const arenaY = player.pos.y + y;
                const arenaX = player.pos.x + x;
                if (arenaY >= 0 && arenaY < arenaHeight && arenaX >= 0 && arenaX < arenaWidth) {
                    if (arena[arenaY][arenaX] !== 'bonus') {
                        arena[arenaY][arenaX] = value;
                    }
                }
            }
        });
    });
}

function arenaSweep() {
    let rowsCleared = 0;
    let rowMultiplier = 1;
    
    for (let y = arenaHeight - 1; y >= 0; y--) {
        let full = true;
        for (let x = 0; x < arenaWidth; x++) {
            if (arena[y][x] === 0 || arena[y][x] === 'bonus') {
                full = false;
                break;
            }
        }
        if (full) {
            const row = arena.splice(y, 1)[0];
            arena.unshift(new Array(arenaWidth).fill(0));
            rowsCleared++;
            player.lines++;
            
            let pointsPerLine;
            if (selectedDifficulty === 'easy') pointsPerLine = 1;
            else if (selectedDifficulty === 'hard') pointsPerLine = 3;
            else pointsPerLine = 2;
            
            player.score += rowMultiplier * pointsPerLine;
            rowMultiplier *= 2;
            y++;
        }
    }
    
            // ====== ПОКАЗЫВАЕМ КОМБО ЕСЛИ ОЧИЩЕНО > 1 ЛИНИИ ======
        if (rowsCleared > 1) {
            showComboDisplay(rowsCleared);  // ← передаём количество линий
        }
    
    // Бонусы
    if (rowsCleared > 0) {
        if (Math.random() < BONUS_SPAWN_CHANCE && !activeBonus) spawnBonus();
        if (bonusSpawnCooldown > 0) bonusSpawnCooldown--;
    }
    
    // Повышение уровня
    let oldLevel = player.level;
    if (player.lines >= 5 && player.level === 1) player.level = 2;
    else if (player.lines >= 10 && player.level === 2) player.level = 3;
    else if (player.lines >= 20 && player.level === 3) player.level = 4;
    else if (player.lines >= 40 && player.level === 4) player.level = 5;
    else if (player.lines >= 80 && player.level === 5) player.level = 6;
    else if (player.lines >= 160 && player.level === 6) player.level = 7;
    else if (player.lines >= 320 && player.level === 7) player.level = 8;
    else if (player.lines >= 640 && player.level === 8) player.level = 9;
    
    if (oldLevel !== player.level && typeof gameAudio !== 'undefined') {
        gameAudio.playOneShot('levelup', 0.2);
    }
    if (rowsCleared > 0 && typeof gameAudio !== 'undefined') {
        gameAudio.playOneShot('sweep', 0.25);
    }
    
    return rowsCleared;
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        checkBonusCollision();
        playerReset();
        arenaSweep();
        if (typeof gameAudio !== 'undefined') gameAudio.playOneShot('collide', 0.05);
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) player.pos.x -= dir;
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    
    if (player.isTetraMode) {
        const originalMatrix = player.matrix.map(row => [...row]);
        const rotatedMatrix = rotateTetraMatrix(player.matrix);
        player.matrix = rotatedMatrix;
        const maxX = arenaWidth - player.matrix[0].length;
        if (player.pos.x < 0) player.pos.x = 0;
        if (player.pos.x > maxX) player.pos.x = maxX;
        if (collide(arena, player)) {
            player.matrix = originalMatrix;
            return;
        }
        if (typeof gameAudio !== 'undefined') gameAudio.playOneShot('rotate', 0.15);
        return;
    }
    
    if (player.isPentaMode) {
        const originalMatrix = player.matrix.map(row => [...row]);
        const rotatedMatrix = rotatePentaMatrix(player.matrix);
        player.matrix = rotatedMatrix;
        const maxX = arenaWidth - player.matrix[0].length;
        if (player.pos.x < 0) player.pos.x = 0;
        if (player.pos.x > maxX) player.pos.x = maxX;
        if (collide(arena, player)) {
            player.matrix = originalMatrix;
            return;
        }
        if (typeof gameAudio !== 'undefined') gameAudio.playOneShot('rotate', 0.15);
        return;
    }
    
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
    if (!player.crazySpins) {
        if (typeof gameAudio !== 'undefined') gameAudio.playOneShot('rotate', 0.15);
        player.spins++;
    }
    if (player.spins > 25) {
        player.crazySpins = true;
        if (typeof gameAudio !== 'undefined') gameAudio.pauseLoop();
        if (typeof gameAudio !== 'undefined') gameAudio.playOneShot('highspins', 0.2);
        player.spins = 0;
        setTimeout(() => {
            player.crazySpins = false;
            if (isGameStarted && !isGameOver && !gameState.paused && !soundMuted) {
                if (typeof gameAudio !== 'undefined') gameAudio.resumeLoop();
            }
        }, 2000);
    }
}

function playerReset() {
    if (player.isTetraMode) {
        player.matrix = player.nextMatrix;
        player.nextMatrix = createTetraPiece();
    } else if (player.isPentaMode) {
        player.matrix = player.nextMatrix;
        player.nextMatrix = createPentaPiece();
    } else {
        player.matrix = player.nextMatrix;
        player.nextMatrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    }
    player.pos.y = 0;
    const maxX = arenaWidth - player.matrix[0].length;
    player.pos.x = Math.floor(maxX / 2);
    if (collide(arena, player)) {
        startGameOverAnimation();
    }
}

// ======================== АНИМАЦИЯ ПРОИГРЫША ========================
function startGameOverAnimation() {
    gameOverAnimation.active = true;
    gameOverAnimation.startTime = Date.now();
    gameOverAnimation.matrix = player.matrix.map(row => [...row]);
    gameOverAnimation.pos = { x: player.pos.x, y: player.pos.y };
    gameState.initialized = false;
    isGameStarted = false;
    gameState.paused = false;
    stopSounds();
    if (typeof gameAudio !== 'undefined') gameAudio.playOneShot('gameover', 0.3);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    lastTime = 0;
    dropCounter = 0;
    update();
}

function drawGameOverAnimation() {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    if (!canvasWidth || !canvasHeight) return;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const topPanelHeight = isMobile ? 42 : 80;
    const gameAreaHeight = Math.max(50, canvasHeight - topPanelHeight);
    
    let blockSize = Math.min(canvasWidth / arenaWidth, gameAreaHeight / arenaHeight);
    const FIGURE_SCALE = 1.8;
    let scaledBlockSize = blockSize * FIGURE_SCALE;
    let finalBlockSize = scaledBlockSize;
    if (finalBlockSize * arenaWidth > canvasWidth) finalBlockSize = canvasWidth / arenaWidth;
    if (finalBlockSize * arenaHeight > gameAreaHeight) finalBlockSize = gameAreaHeight / arenaHeight;
    blockSize = finalBlockSize;
    
    const offsetX = (canvasWidth - (blockSize * arenaWidth)) / 2;
    const offsetY = topPanelHeight + (gameAreaHeight - (blockSize * arenaHeight)) / 2;
    
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = '#0a0a0f';
    context.fillRect(0, topPanelHeight, canvasWidth, gameAreaHeight);
    
    for (let y = 0; y < arenaHeight; y++) {
        for (let x = 0; x < arenaWidth; x++) {
            const value = arena[y][x];
            if (value !== 0 && value !== 'bonus') {
                const posX = offsetX + x * blockSize;
                const posY = offsetY + y * blockSize;
                let fillColor;
                if (typeof value === 'string' && value.startsWith('#')) fillColor = value;
                else fillColor = colors[value] || '#FFF';
                context.fillStyle = fillColor;
                context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                context.strokeStyle = "rgba(0,0,0,0.3)";
                context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
            }
        }
    }
    
    const elapsed = Date.now() - gameOverAnimation.startTime;
    const maxDuration = gameOverAnimation.duration;
    if (elapsed < maxDuration) {
        const blinkPhase = Math.floor(elapsed / 300) % 2;
        const alpha = blinkPhase ? 0.3 : 1.0;
        const matrix = gameOverAnimation.matrix;
        const pos = gameOverAnimation.pos;
        const isTetra = player.isTetraMode;
        const isPenta = player.isPentaMode;
        
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                const value = matrix[y][x];
                if (value !== 0) {
                    const posX = offsetX + (pos.x + x) * blockSize;
                    const posY = offsetY + (pos.y + y) * blockSize;
                    let fillColor;
                    if ((isTetra || isPenta) && matrix._color) fillColor = matrix._color;
                    else fillColor = colors[value] || '#FF0D72';
                    if (alpha < 1) context.globalAlpha = 0.3;
                    context.fillStyle = fillColor;
                    context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                    context.strokeStyle = "rgba(255,0,0,0.8)";
                    context.lineWidth = 2;
                    context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                    context.globalAlpha = 1.0;
                    context.shadowBlur = 15;
                    context.shadowColor = 'rgba(255,0,0,0.5)';
                    context.strokeStyle = 'rgba(255,0,0,0.3)';
                    context.lineWidth = 3;
                    context.strokeRect(posX - 2, posY - 2, blockSize + 3, blockSize + 3);
                    context.shadowBlur = 0;
                }
            }
        }
        
        const t = window.getText || (key => key);
        context.fillStyle = 'rgba(0,0,0,0.4)';
        context.fillRect(0, canvasHeight / 2 - 60, canvasWidth, 120);
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.shadowBlur = 30;
        context.shadowColor = 'rgba(255,0,0,0.5)';
        context.fillStyle = '#ef4444';
        context.font = `${Math.min(42, canvasWidth / 10)}px Russo One`;
        context.fillText(t('gameOverTitle') || 'ИГРА ОКОНЧЕНА', canvasWidth / 2, canvasHeight / 2 - 10);
        context.shadowBlur = 0;
        context.fillStyle = '#94a3b8';
        context.font = `${Math.min(18, canvasWidth / 20)}px Russo One`;
        context.fillText(t('gameOverBlocked') || 'Фигура не помещается', canvasWidth / 2, canvasHeight / 2 + 40);
        
        animationFrameId = requestAnimationFrame(() => {
            if (gameOverAnimation.active) drawGameOverAnimation();
        });
    } else {
        gameOverAnimation.active = false;
        showGameOverModal(player.score);
        updatePauseButtonText();
    }
}

// ======================== ОТРИСОВКА ========================
function drawGame() {
    if (!canvas || canvas.width === 0) updateCanvasSize();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    if (canvasWidth <= 0 || canvasHeight <= 0) return;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const topPanelHeight = isMobile ? 42 : 80;
    const gameAreaHeight = Math.max(50, canvasHeight - topPanelHeight);
    
    const FIGURE_SCALE = 1.8;
    let blockSize = Math.min(canvasWidth / arenaWidth, gameAreaHeight / arenaHeight);
    let scaledBlockSize = blockSize * FIGURE_SCALE;
    let finalBlockSize = scaledBlockSize;
    if (finalBlockSize * arenaWidth > canvasWidth) finalBlockSize = canvasWidth / arenaWidth;
    if (finalBlockSize * arenaHeight > gameAreaHeight) finalBlockSize = gameAreaHeight / arenaHeight;
    blockSize = finalBlockSize;
    
    const offsetX = (canvasWidth - (blockSize * arenaWidth)) / 2;
    const offsetY = topPanelHeight + (gameAreaHeight - (blockSize * arenaHeight)) / 2;
    const arenaLeft = (canvasWidth - (blockSize * arenaWidth)) / 2;
    const arenaTop = topPanelHeight + (gameAreaHeight - (blockSize * arenaHeight)) / 2;
    const arenaWidthPx = blockSize * arenaWidth;
    const arenaHeightPx = blockSize * arenaHeight;
    
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = '#0a0a0f';
    context.fillRect(0, topPanelHeight, canvasWidth, gameAreaHeight);
    
    // Обводка поля
    context.save();
    context.shadowBlur = 15;
    context.shadowColor = '#22c55e';
    context.beginPath();
    context.rect(arenaLeft - 1, arenaTop - 1, arenaWidthPx + 2, arenaHeightPx + 2);
    context.strokeStyle = '#166534';
    context.lineWidth = Math.max(2, blockSize * 0.12);
    context.stroke();
    context.beginPath();
    context.rect(arenaLeft, arenaTop, arenaWidthPx, arenaHeightPx);
    context.strokeStyle = '#22c55e';
    context.lineWidth = Math.max(2.5, blockSize * 0.1);
    context.stroke();
    context.beginPath();
    context.rect(arenaLeft + 1, arenaTop + 1, arenaWidthPx - 2, arenaHeightPx - 2);
    context.strokeStyle = '#4ade80';
    context.lineWidth = 1.5;
    context.stroke();
    const cornerLength = Math.min(15, blockSize * 1.5);
    context.strokeStyle = '#86efac';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(arenaLeft - 2, arenaTop + cornerLength);
    context.lineTo(arenaLeft - 2, arenaTop - 2);
    context.lineTo(arenaLeft + cornerLength, arenaTop - 2);
    context.stroke();
    context.beginPath();
    context.moveTo(arenaLeft + arenaWidthPx + 2, arenaTop + cornerLength);
    context.lineTo(arenaLeft + arenaWidthPx + 2, arenaTop - 2);
    context.lineTo(arenaLeft + arenaWidthPx - cornerLength, arenaTop - 2);
    context.stroke();
    context.beginPath();
    context.moveTo(arenaLeft - 2, arenaTop + arenaHeightPx - cornerLength);
    context.lineTo(arenaLeft - 2, arenaTop + arenaHeightPx + 2);
    context.lineTo(arenaLeft + cornerLength, arenaTop + arenaHeightPx + 2);
    context.stroke();
    context.beginPath();
    context.moveTo(arenaLeft + arenaWidthPx + 2, arenaTop + arenaHeightPx - cornerLength);
    context.lineTo(arenaLeft + arenaWidthPx + 2, arenaTop + arenaHeightPx + 2);
    context.lineTo(arenaLeft + arenaWidthPx - cornerLength, arenaTop + arenaHeightPx + 2);
    context.stroke();
    context.shadowBlur = 25;
    context.shadowColor = '#22c55e';
    context.beginPath();
    context.rect(arenaLeft, arenaTop, arenaWidthPx, arenaHeightPx);
    context.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    context.lineWidth = 1;
    context.stroke();
    context.shadowBlur = 0;
    context.restore();
    
    // Арена
    for (let y = 0; y < arenaHeight; y++) {
        for (let x = 0; x < arenaWidth; x++) {
            const value = arena[y][x];
            if (value !== 0 && value !== 'bonus') {
                const posX = offsetX + x * blockSize;
                const posY = offsetY + y * blockSize;
                let fillColor;
                if (typeof value === 'string' && value.startsWith('#')) fillColor = value;
                else fillColor = colors[value] || '#FFF';
                context.fillStyle = fillColor;
                context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                context.strokeStyle = "rgba(0,0,0,0.3)";
                context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
            } else if (value === 'bonus') {
                const posX = offsetX + x * blockSize;
                const posY = offsetY + y * blockSize;
                const pulse = Math.sin(Date.now() / 300) * 0.1 + 0.2;
                context.fillStyle = `rgba(255, 215, 0, ${pulse})`;
                context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                context.strokeStyle = 'rgba(255, 215, 0, 0.6)';
                context.lineWidth = 2;
                context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                let symbol = '⭐';
                if (activeBonus && activeBonus.x === x && activeBonus.y === y) symbol = activeBonus.symbol;
                context.fillStyle = '#000';
                context.font = `${blockSize * 0.55}px sans-serif`;
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText(symbol, posX + blockSize/2, posY + blockSize/2);
            }
        }
    }
    
    // Текущая фигура
    if (player && player.matrix) {
        const isTetra = player.isTetraMode;
        const isPenta = player.isPentaMode;
        for (let y = 0; y < player.matrix.length; y++) {
            for (let x = 0; x < player.matrix[y].length; x++) {
                const value = player.matrix[y][x];
                if (value !== 0) {
                    const posX = offsetX + (player.pos.x + x) * blockSize;
                    const posY = offsetY + (player.pos.y + y) * blockSize;
                    let fillColor;
                    if ((isTetra || isPenta) && player.matrix._color) fillColor = player.matrix._color;
                    else fillColor = colors[value] || '#FFF';
                    context.fillStyle = fillColor;
                    context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                    context.strokeStyle = "rgba(0,0,0,0.4)";
                    context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                }
            }
        }
    }
    
    // Статистика
    const t = window.getText || (key => key);
    context.fillStyle = '#111';
    context.fillRect(0, 0, canvasWidth, topPanelHeight);
    const titleFontSize = isMobile ? Math.min(12, canvasWidth / 25) : Math.min(22, canvasWidth / 20);
    const valueFontSize = isMobile ? Math.min(18, canvasWidth / 16) : Math.min(36, canvasWidth / 12);
    
    context.textAlign = "center";
    context.fillStyle = '#888';
    context.font = `${titleFontSize}px Russo One`;
    context.fillText(t('score'), canvasWidth * 0.12, isMobile ? 16 : 30);
    context.fillStyle = '#fff';
    context.font = `${valueFontSize}px Russo One`;
    context.fillText(player ? player.score : 0, canvasWidth * 0.12, isMobile ? 36 : 65);
    
    context.fillStyle = '#888';
    context.font = `${titleFontSize * 0.8}px Russo One`;
    context.fillText(t('lines'), canvasWidth * 0.32, isMobile ? 16 : 30);
    context.fillStyle = '#fff';
    context.font = `${valueFontSize}px Russo One`;
    context.fillText(player ? player.lines : 0, canvasWidth * 0.32, isMobile ? 36 : 65);
    
    context.fillStyle = '#888';
    context.font = `${titleFontSize * 0.8}px Russo One`;
    context.fillText(t('level'), canvasWidth * 0.52, isMobile ? 16 : 30);
    context.fillStyle = '#fff';
    context.font = `${valueFontSize}px Russo One`;
    context.fillText(player ? player.level : 1, canvasWidth * 0.52, isMobile ? 36 : 65);
    
    // Следующая фигура
    if (player && player.nextMatrix) {
        const nextX = canvasWidth * 0.70;
        const nextY = isMobile ? 5 : 12;
        let blockNext = Math.min(isMobile ? 9 : 12, canvasWidth / 18);
        const isTetra = player.isTetraMode;
        const isPenta = player.isPentaMode;
        for (let y = 0; y < player.nextMatrix.length; y++) {
            for (let x = 0; x < player.nextMatrix[y].length; x++) {
                const value = player.nextMatrix[y][x];
                if (value !== 0) {
                    let fillColor;
                    if ((isTetra || isPenta) && player.nextMatrix._color) fillColor = player.nextMatrix._color;
                    else fillColor = colors[value] || '#FFF';
                    context.fillStyle = fillColor;
                    context.fillRect(nextX + x * blockNext, nextY + y * blockNext, blockNext - 1, blockNext - 1);
                    context.strokeStyle = "rgba(0,0,0,0.3)";
                    context.strokeRect(nextX + x * blockNext, nextY + y * blockNext, blockNext - 1, blockNext - 1);
                }
            }
        }
    }
}

// ======================== ИГРОВОЙ ЦИКЛ ========================
function update(time = 0) {
    if (gameOverAnimation.active) {
        drawGameOverAnimation();
        return;
    }
    
    if (gameState.paused) {
        if (typeof drawGame === 'function') drawGame();
        if (canvas && context) {
            const t = window.getText || (key => key);
            context.fillStyle = 'rgba(0,0,0,0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.font = `${Math.min(32, canvas.width / 15)}px Russo One`;
            context.textAlign = "center";
            context.fillText(t('pauseTitle') || 'ПАУЗА', canvas.width / 2, canvas.height / 2);
            context.font = `${Math.min(18, canvas.width / 25)}px Russo One`;
            context.fillText(t('pauseHint') || 'Нажмите "Дальше"', canvas.width / 2, canvas.height / 1.7);
        }
        animationFrameId = requestAnimationFrame(update);
        return;
    }
    
    if (isGameOver || !isGameStarted) {
        if (typeof drawGame === 'function') drawGame();
        if (isGameOver && canvas && context) {
            const t = window.getText || (key => key);
            context.fillStyle = 'rgba(0,0,0,0.7)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.font = `${Math.min(32, canvas.width / 15)}px Russo One`;
            context.textAlign = "center";
            context.fillText(t('gameOverTitle') || 'ИГРА ОКОНЧЕНА', canvas.width / 2, canvas.height / 2);
            context.font = `${Math.min(18, canvas.width / 25)}px Russo One`;
            context.fillText(t('tryAgain') || 'Попробуйте ещё раз', canvas.width / 2, canvas.height / 1.7);
        }
        animationFrameId = requestAnimationFrame(update);
        return;
    }
    
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    const currentInterval = Math.max(80, dropInterval - (player.level * 35));
    if (dropCounter > currentInterval) {
        playerDrop();
        if (typeof drawGame === 'function') drawGame();
    }
    if (typeof drawGame === 'function') drawGame();
    animationFrameId = requestAnimationFrame(update);
}

// ======================== УПРАВЛЕНИЕ ИГРОЙ ========================
function startGame() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) arenaWidth = 10;
    else {
        if (selectedDifficulty === 'easy') arenaWidth = 12;
        else if (selectedDifficulty === 'hard') arenaWidth = 16;
        else arenaWidth = 14;
    }
    arenaHeight = 20;
    
    if (selectedDifficulty === 'easy') {
        difficultyMultiplier = 0.5;
        dropInterval = 1400;
    } else if (selectedDifficulty === 'hard') {
        difficultyMultiplier = 1.5;
        dropInterval = 500;
    } else {
        difficultyMultiplier = 1;
        dropInterval = 1000;
    }
    
    arena = createMatrix(arenaWidth, arenaHeight);
    for (let i = 0; i < arenaHeight; i++) {
        for (let j = 0; j < arenaWidth; j++) arena[i][j] = 0;
    }
    
    activeBonus = null;
    bonusSpawnCooldown = 0;
    isGameStarted = true;
    isGameOver = false;
    gameState.over = false;
    gameState.paused = false;
    gameState.initialized = true;
    gameState.introSongPlayed = false;
    updatePauseButtonText();
    
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    player.spins = 0;
    player.crazySpins = false;
    
    if (selectedMode === 'tetra') {
        player.isTetraMode = true;
        player.isPentaMode = false;
        player.matrix = createTetraPiece();
        player.nextMatrix = createTetraPiece();
    } else if (selectedMode === 'penta') {
        player.isTetraMode = false;
        player.isPentaMode = true;
        player.matrix = createPentaPiece();
        player.nextMatrix = createPentaPiece();
    } else {
        player.isTetraMode = false;
        player.isPentaMode = false;
        player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
        player.nextMatrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    }
    
    const matrixWidth = player.matrix[0].length;
    const maxX = arenaWidth - matrixWidth;
    player.pos.x = Math.floor(maxX / 2);
    player.pos.y = 0;
    
    if (typeof gameAudio !== 'undefined' && gameAudio.initialized && !soundMuted && !musicMuted) {
        playBackgroundMusic();
    }
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    lastTime = 0;
    dropCounter = 0;
    update();
}

function startGameWithAudio() {
    if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
        gameAudio.resumeContext();
    }
    startGame();
    if (typeof gameAudio !== 'undefined' && !gameAudio.initialized) {
        gameAudio.init().then(() => {
            if (!musicMuted && !soundMuted) playBackgroundMusic();
        }).catch(e => console.log('Аудио не загружено:', e));
    } else if (typeof gameAudio !== 'undefined' && gameAudio.initialized) {
        if (!musicMuted && !soundMuted) playBackgroundMusic();
    }
}

function endGame() {
    if (gameOverAnimation.active) return;
    if (selectedDifficulty) savePlayedDifficulty();
    isGameOver = true;
    isGameStarted = false;
    gameState.over = true;
    gameState.initialized = false;
    gameState.paused = false;
    stopSounds();
    if (typeof gameAudio !== 'undefined') gameAudio.playOneShot('gameover', 0.3);
    
    if (typeof player !== 'undefined' && typeof saveVKScore === 'function') {
        saveVKScore(player.score);
    }
    if (typeof saveTotalProgress === 'function') {
        saveTotalProgress();
    }
    
    // Показываем обновлённую модалку с кнопкой "Продолжить за рекламу"
    showGameOverModal(player.score);
    updatePauseButtonText();
    if (typeof drawGame === 'function') drawGame();
}

function pauseGame() {
    if (gameState.paused) return;
    gameState.paused = true;
    if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
        gameAudio.audioContext.suspend();
    }
    if (typeof window.notifyGameplayStop === 'function') {
        window.notifyGameplayStop();
    }
    updatePauseButtonText();
}

function resumeGame() {
    if (!gameState.paused) return;
    gameState.paused = false;
    lastTime = performance.now();
    if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
        gameAudio.audioContext.resume().catch(err => console.log('Ошибка возобновления аудио:', err));
    }
    if (typeof window.notifyGameplayStart === 'function') {
        window.notifyGameplayStart();
    }
    updatePauseButtonText();
    if (!musicMuted && gameState.introSongPlayed && typeof gameAudio !== 'undefined') {
        gameAudio.stopLoop();
        gameAudio.playLoop('loop', 0.15);
    }
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    update();
}

function togglePauseResume() {
    const t = window.getText || (key => key);
    if (!isGameStarted) {
        showCustomModal({
            title: t('attention') || 'Внимание!',
            text: t('startGameFirst') || 'Сначала начните игру через главное меню!',
            type: 'warning',
            button: t('ok') || 'OK'
        });
        return;
    }
    if (isGameOver) {
        showCustomModal({
            title: t('gameOverTitle') || 'Игра завершена!',
            text: t('newGameFromMenu') || 'Начните новую игру через главное меню!',
            type: 'info',
            button: t('ok') || 'OK'
        });
        return;
    }
    if (gameState.paused) resumeGame();
    else {
        pauseGame();
        if (typeof showVKFullscreenAd === 'function') showVKFullscreenAd();
    }
}

function returnToMenu() {
    if (isGameStarted && !isGameOver && !gameState.paused) pauseGame();
    stopSounds();
    isGameStarted = false;
    isGameOver = false;
    gameState.initialized = false;
    gameState.paused = false;
    gameState.over = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'flex';
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.style.display = 'none';
}

function updatePauseButtonText() {
    const btn = document.getElementById('pause-resume-btn');
    if (!btn) return;
    const t = window.getText || (key => key);
    if (gameState.paused) {
        btn.textContent = t('resume');
        btn.setAttribute('data-i18n', 'resume');
    } else {
        btn.textContent = t('pause');
        btn.setAttribute('data-i18n', 'pause');
    }
}

// ======================== МУЗЫКА И ЗВУКИ ========================
function playBackgroundMusic() {
    if (musicMuted || !gameAudio || !gameAudio.initialized) return;
    const isClassic = selectedMode === 'classic';
    let track;
    if (isClassic && selectedDifficulty === 'easy') track = '2';
    else if (isClassic && selectedDifficulty === 'medium') track = '4';
    else if (isClassic && selectedDifficulty === 'hard') track = '1';
    else if (!isClassic && selectedDifficulty === 'easy') track = '2';
    else if (!isClassic && selectedDifficulty === 'medium') track = '3';
    else track = '1';
    currentMusicTrack = track;
    gameAudio.playMusic(track, 0.15);
}

function stopSounds() {
    if (typeof gameAudio !== 'undefined') gameAudio.stopLoop();
}

function toggleSound() {
    if (typeof gameAudio === 'undefined') return;
    soundMuted = !soundMuted;
    gameAudio.setMuted(soundMuted);
    updateSoundIcon();
}

function toggleMusic() {
    if (typeof gameAudio === 'undefined') return;
    musicMuted = !musicMuted;
    gameAudio.setMusicMuted(musicMuted);
    updateMusicIcon();
    if (!musicMuted && isGameStarted && !isGameOver && !gameState.paused) {
        playBackgroundMusic();
    }
}

function updateSoundIcon() {
    const soundIcons = document.querySelectorAll('#sound-icon, #menu-sound-icon, #sound-btn svg');
    const isMuted = soundMuted;
    soundIcons.forEach(icon => {
        if (isMuted) {
            icon.innerHTML = `<path fill="#8899a6" d="M7 10s-2 0-2 2v12c0 2 2 2 2 2h6l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/><path fill="#ccd6dd" d="m13 26l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/><path fill="#8899a6" d="M28.709 25.959a.998.998 0 0 1-.636-1.772A7.98 7.98 0 0 0 31 18a7.97 7.97 0 0 0-2.988-6.236a1 1 0 1 1 1.254-1.558A9.96 9.96 0 0 1 33 18a9.97 9.97 0 0 1-3.657 7.731a1 1 0 0 1-.634.228"/>`;
        } else {
            icon.innerHTML = `<path fill="#8899a6" d="M2 10s-2 0-2 2v12c0 2 2 2 2 2h6l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/><path fill="#ccd6dd" d="m8 26l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/><path fill="#8899a6" d="M29 32.019a.945.945 0 0 1-.615-1.666c3.603-3.071 5.668-7.551 5.668-12.29s-2.066-9.219-5.669-12.29a.947.947 0 0 1 1.229-1.44a18.02 18.02 0 0 1 6.333 13.73a18.02 18.02 0 0 1-6.332 13.729a.94.94 0 0 1-.614.227"/><path fill="#8899a6" d="M26.27 28.959a.927.927 0 0 1-.592-1.645a12.04 12.04 0 0 0 4.394-9.315a12.05 12.05 0 0 0-4.311-9.245a.929.929 0 0 1 1.196-1.422a13.9 13.9 0 0 1 4.973 10.667c0 4.172-1.848 8.089-5.069 10.746a.92.92 0 0 1-.591.214"/><path fill="#8899a6" d="M23.709 25.959a.998.998 0 0 1-.636-1.772A7.98 7.98 0 0 0 26 18a7.97 7.97 0 0 0-2.988-6.236a1 1 0 1 1 1.254-1.558A9.96 9.96 0 0 1 28 18a9.97 9.97 0 0 1-3.657 7.731a1 1 0 0 1-.634.228"/>`;
        }
    });
}

function updateMusicIcon() {
    const musicIcons = document.querySelectorAll('#music-icon, #menu-music-icon, #music-btn svg');
    const isMuted = musicMuted;
    musicIcons.forEach(icon => {
        if (isMuted) {
            icon.innerHTML = `<g fill="none" fill-rule="evenodd" clip-rule="evenodd"><path fill="#8fbffa" d="M12.734.33a1.2 1.2 0 0 0-.55.019L4.605 2.452a1.22 1.22 0 0 0-.897 1.167V9.06a2.463 2.463 0 1 0 1.488 2.09V5.162l.827.736l6.205-1.745v2.458a2.463 2.463 0 1 0 1.488 2.09V1.518A1.216 1.216 0 0 0 12.734.33"/><path fill="#2859c5" d="M.22.22a.75.75 0 0 0 0 1.06l12.5 12.5a.75.75 0 1 0 1.06-1.06L1.28.22a.75.75 0 0 0-1.06 0"/></g>`;
        } else {
            icon.innerHTML = `<path fill="#8fbffa" fill-rule="evenodd" d="M12.781.23a1.2 1.2 0 0 0-.555.02h-.006L4.587 2.369a1.23 1.23 0 0 0-.905 1.177V9.04a2.477 2.477 0 1 0 1.5 2.277V6.076l7.09-1.97V6.57a2.477 2.477 0 1 0 1.5 2.345V1.403a1.226 1.226 0 0 0-.99-1.172Z" clip-rule="evenodd"/>`;
        }
    });
}

function initAudio() {
    if (!audioInitialized) {
        if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
            gameAudio.resumeContext();
            audioInitialized = true;
        }
        return;
    }
    if (!gameAudio || !gameAudio.initialized) {
        gameAudio.init().then(() => {
            if (!soundMuted && !musicMuted) playBackgroundMusic();
        }).catch(e => console.log('Аудио не загружено:', e));
        return;
    }
    if (!soundMuted && !musicMuted) playBackgroundMusic();
}

// ======================== МОДАЛКИ ========================
function showGameOverModal(score) {
    const modal = document.getElementById('gameover-modal');
    const scoreEl = document.getElementById('gameover-score');
    
    if (modal) {
        if (scoreEl) scoreEl.textContent = score;
        
        // Находим или создаём контейнер для кнопок
        let buttonsContainer = modal.querySelector('.gameover-buttons-container');
        if (!buttonsContainer) {
            // Если контейнера нет — создаём
            const contentDiv = modal.querySelector('div[style*="border: 2px solid rgba(239, 68, 68, 0.4)"]');
            if (contentDiv) {
                // Удаляем старые кнопки, если они есть
                const oldBtns = contentDiv.querySelectorAll('button');
                oldBtns.forEach(btn => {
                    // Сохраняем только кнопку "Новая игра" и "В меню", если они есть
                    const text = btn.textContent.trim();
                    if (text.includes('Новая игра') || text.includes('В меню')) {
                        // оставляем
                    } else {
                        btn.remove();
                    }
                });
                
                // Создаём контейнер для кнопок
                buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'gameover-buttons-container';
                buttonsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-top: 16px;';
                
                // Переносим существующие кнопки в контейнер
                const existingBtns = contentDiv.querySelectorAll('button');
                const newGameBtn = contentDiv.querySelector('button[onclick*="closeGameOverModal"]');
                const menuBtn = contentDiv.querySelector('button[onclick*="closeGameOverModalAndMenu"]');
                
                // Создаём новую кнопку "Продолжить за рекламу"
                const continueBtn = document.createElement('button');
                continueBtn.style.cssText = `
                    width: 100%; padding: 14px; font-size: 16px;
                    font-family: 'Russo One', sans-serif; text-transform: uppercase;
                    letter-spacing: 2px; color: #fff;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    border: none; border-radius: 14px; cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                `;
                continueBtn.innerHTML = '🧹 Продолжить за рекламу';
                continueBtn.onclick = handleContinueWithAd;
                
                // Собираем все кнопки в контейнер
                buttonsContainer.appendChild(continueBtn);
                
                if (newGameBtn) {
                    // Изменяем стиль кнопки "Новая игра"
                    newGameBtn.style.cssText = `
                        width: 100%; padding: 14px; font-size: 16px;
                        font-family: 'Russo One', sans-serif; text-transform: uppercase;
                        letter-spacing: 2px; color: #fff;
                        background: linear-gradient(135deg, #22c55e, #16a34a);
                        border: none; border-radius: 14px; cursor: pointer;
                        transition: all 0.2s; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
                    `;
                    buttonsContainer.appendChild(newGameBtn);
                }
                
                if (menuBtn) {
                    // Изменяем стиль кнопки "В меню"
                    menuBtn.style.cssText = `
                        width: 100%; padding: 14px; font-size: 16px;
                        font-family: 'Russo One', sans-serif; text-transform: uppercase;
                        letter-spacing: 2px; color: #94a3b8;
                        background: rgba(255,255,255,0.03);
                        border: 1px solid rgba(255,255,255,0.08);
                        border-radius: 14px; cursor: pointer; transition: all 0.2s;
                    `;
                    buttonsContainer.appendChild(menuBtn);
                }
                
                // Добавляем контейнер в модалку
                contentDiv.appendChild(buttonsContainer);
            }
        }
        
        modal.style.display = 'flex';
        if (typeof updateInterfaceLanguage === 'function') updateInterfaceLanguage();
    }
}

function closeGameOverModal() {
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.style.display = 'none';
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.style.display = 'flex';
}

function closeGameOverModalAndMenu() {
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.style.display = 'none';
    if (typeof returnToMenu === 'function') returnToMenu();
}

// ======================== ВЫБОР РЕЖИМА И СЛОЖНОСТИ ========================
function selectMode(mode) {
    selectedMode = mode;
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'none';
    const diffModal = document.getElementById('difficulty-modal');
    const modeName = document.getElementById('difficulty-mode-name');
    if (modeName) {
        const t = window.getText || (key => key);
        if (mode === 'classic') modeName.textContent = t('modeClassic');
        else if (mode === 'tetra') modeName.textContent = t('modeTetra');
        else if (mode === 'penta') modeName.textContent = t('modePenta');
    }
    if (diffModal) diffModal.style.display = 'flex';
}

function closeDifficultyModal() {
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.style.display = 'none';
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'flex';
}

function selectDifficulty(difficulty) {
    selectedDifficulty = difficulty;
    savePlayedDifficulty();
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.style.display = 'none';
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'none';
    startGameWithAudio();
}

// ======================== ОБЩИЙ ПРОГРЕСС ========================
function saveTotalProgress() {
    if (typeof player === 'undefined' || !player) return;
    const currentGameScore = player.score || 0;
    const currentTotal = parseInt(localStorage.getItem('totalScore') || '0');
    const newTotal = currentTotal + currentGameScore;
    localStorage.setItem('totalScore', newTotal);
    window.totalScore = newTotal;
    
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage('tetris_total_score_v1', newTotal);
    }
    console.log(`📊 Общий прогресс: +${currentGameScore} = ${newTotal} очков`);
}

function savePlayedDifficulty() {
    if (!selectedDifficulty) return;
    const playedDifficulties = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
    if (!playedDifficulties.includes(selectedDifficulty)) {
        playedDifficulties.push(selectedDifficulty);
        localStorage.setItem('playedDifficulties', JSON.stringify(playedDifficulties));
        if (typeof saveToVKStorage === 'function') {
            saveToVKStorage('tetris_difficulties_v1', playedDifficulties);
        }
        console.log('✅ Сохранена сложность:', selectedDifficulty);
    }
}

// ======================== УПРАВЛЕНИЕ С КЛАВИАТУРЫ ========================
document.addEventListener('keydown', event => {
    if (!isGameStarted || isGameOver || gameState.paused) return;
    switch (event.code) {
        case "KeyW":
        case "ArrowUp":
            event.preventDefault();
            playerRotate(-1);
            break;
        case "KeyS":
        case "ArrowDown":
            event.preventDefault();
            playerDrop();
            break;
        case "KeyA":
        case "ArrowLeft":
            event.preventDefault();
            playerMove(-1);
            break;
        case "KeyD":
        case "ArrowRight":
            event.preventDefault();
            playerMove(+1);
            break;
        case "Escape":
            event.preventDefault();
            if (!gameState.paused) pauseGame();
            else resumeGame();
            break;
    }
});

// ======================== МОБИЛЬНОЕ УПРАВЛЕНИЕ ========================
function initMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnDown = document.getElementById('btn-down');
    const btnRot = document.getElementById('btn-rot');
    if (!btnLeft) return;
    
    const handleMoveLeft = (e) => { e.preventDefault(); if (isGameStarted && !isGameOver && !gameState.paused) playerMove(-1); };
    const handleMoveRight = (e) => { e.preventDefault(); if (isGameStarted && !isGameOver && !gameState.paused) playerMove(+1); };
    const handleRotate = (e) => { e.preventDefault(); if (isGameStarted && !isGameOver && !gameState.paused) playerRotate(-1); };
    const handleDrop = (e) => { e.preventDefault(); if (isGameStarted && !isGameOver && !gameState.paused) playerDrop(); };
    
    btnLeft.addEventListener('touchstart', handleMoveLeft);
    btnLeft.addEventListener('mousedown', handleMoveLeft);
    btnRight.addEventListener('touchstart', handleMoveRight);
    btnRight.addEventListener('mousedown', handleMoveRight);
    btnRot.addEventListener('touchstart', handleRotate);
    btnRot.addEventListener('mousedown', handleRotate);
    btnDown.addEventListener('touchstart', handleDrop);
    btnDown.addEventListener('mousedown', handleDrop);
}
initMobileControls();

// ======================== ОБРАБОТЧИКИ СОБЫТИЙ ========================
document.addEventListener('click', initAudio);
document.addEventListener('touchstart', initAudio);

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        if (isGameStarted && !isGameOver && !gameState.paused) pauseGame();
        if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
            gameAudio.audioContext.suspend();
        }
    }
});

document.addEventListener('contextmenu', (e) => { e.preventDefault(); return false; });
canvas.addEventListener('selectstart', (e) => { e.preventDefault(); return false; });

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateCanvasSize();
        resizeGameField();
        if (typeof drawGame === 'function') drawGame();
    }, 100);
});

document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
        if (typeof drawGame === 'function') drawGame();
    }, 50);
});

document.body.addEventListener('touchmove', (e) => {
    if (e.target.closest('.d-btn, .rotate-btn, .iksweb, .iksweb1')) return;
    e.preventDefault();
}, { passive: false });

// ======================== ИНИЦИАЛИЗАЦИЯ ========================
setTimeout(() => {
    updateCanvasSize();
    arena = createMatrix(arenaWidth, arenaHeight);
    player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.nextMatrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.pos.x = Math.floor((arenaWidth - player.matrix[0].length) / 2);
    const container = document.querySelector('.canvas-container');
    if (container) {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.2s ease';
        setTimeout(() => { container.style.opacity = '1'; }, 200);
    }
    update();
}, 100);

window.addEventListener('load', function() {
    setTimeout(function() {
        updateCanvasSize();
        resizeGameField();
        drawGame();
        const container = document.querySelector('.canvas-container');
        if (container) container.style.opacity = '1';
    }, 200);
});

// ======================== КОЛЛЕКЦИИ ========================
const COLLECTION_CATEGORIES = {
    blocks: {
        id: 'blocks', nameKey: 'collectionBlocks', icon: '🧱', folder: 'blocks',
        requirement: 'easy', total: 50, price: 200
    },
    animals: {
        id: 'animals', nameKey: 'collectionAnimals', icon: '🐾', folder: 'animals',
        requirement: 'medium', total: 50, price: 200
    },
    plants: {
        id: 'plants', nameKey: 'collectionPlants', icon: '🌿', folder: 'plants',
        requirement: 'medium', total: 50, price: 200
    },
    space: {
        id: 'space', nameKey: 'collectionSpace', icon: '🚀', folder: 'cos',
        requirement: 'hard', total: 50, price: 200
    }
};

function checkCategoryUnlocked(categoryId) {
    const category = COLLECTION_CATEGORIES[categoryId];
    if (!category) return false;
    const playedDifficulties = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
    return playedDifficulties.includes(category.requirement);
}

function getUnlockedCountInCategory(categoryId, totalScore) {
    const category = COLLECTION_CATEGORIES[categoryId];
    const categoryIndex = CATEGORY_ORDER.indexOf(categoryId);
    const baseScore = categoryIndex * category.total * 200;
    if (totalScore < baseScore) return 0;
    const remainingScore = totalScore - baseScore;
    return Math.min(Math.floor(remainingScore / 200), category.total);
}

function updateCollectionsProgress() {
    const progressEl = document.getElementById('collections-progress');
    if (!progressEl) return;
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    let unlocked = 0;
    let total = 0;
    for (const [key, category] of Object.entries(COLLECTION_CATEGORIES)) {
        total += category.total;
        if (checkCategoryUnlocked(key)) {
            unlocked += getUnlockedCountInCategory(key, savedScore);
        }
    }
    progressEl.textContent = `${unlocked}/${total}`;
    window.collectionsProgress = { unlocked, total };
}

    function openCollections() {
        const rewardsModal = document.getElementById('rewards-center-modal');
        if (rewardsModal) rewardsModal.style.display = 'none';
        
        const t = window.getText || (key => key);
        const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
        
        let html = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 10, 14, 0.92); z-index: 10001; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(20px);" id="collections-modal" onclick="if(event.target===this)closeCollections()">
                <div style="background: rgba(20, 20, 30, 0.95); border: 2px solid rgba(52, 211, 153, 0.3); width: 92%; max-width: 560px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.05); backdrop-filter: blur(20px); position: relative; text-align: center; max-height: 90vh; overflow-y: auto;">
                    <button onclick="closeCollections()" style="position: sticky; top: 0; float: right; background: none; border: none; color: #64748b; font-size: 32px; cursor: pointer; font-family: 'Russo One', sans-serif; z-index: 10; padding: 0 8px;">✕</button>
                    <h2 style="color: #34d399; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; font-family: 'Russo One', sans-serif;">🖼️ ${t('collections') || 'Коллекции'}</h2>
                    <p style="color: #64748b; font-size: 15px; letter-spacing: 1px; margin-bottom: 25px; font-family: 'Russo One', sans-serif;">
                        ${t('yourScore') || 'Ваш счёт'}: <span style="color: #34d399; font-weight: bold;">${savedScore}</span>
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 14px;">
        `;
        
        for (const [key, category] of Object.entries(COLLECTION_CATEGORIES)) {
            // 🔥 ИСПРАВЛЕНО: используем t() с правильным ключом
            const name = t(category.nameKey) || category.nameKey;
            const isUnlocked = checkCategoryUnlocked(key);
            const unlockedCount = isUnlocked ? getUnlockedCountInCategory(key, savedScore) : 0;
            const total = category.total;
            const isComplete = isUnlocked && unlockedCount >= total;
            
            let buttonStyle, onClickAction, rightText;
            if (isUnlocked) {
                buttonStyle = `color: #fff; background: ${isComplete ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)'}; border: none; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3); cursor: pointer;`;
                onClickAction = `onclick="openCollectionCategory('${key}')"`;
                rightText = `
                    <span style="font-size: 13px; color: ${isComplete ? '#86efac' : '#93c5fd'}; font-weight: normal; margin-left: auto; display: flex; align-items: center; gap: 8px;">
                        ${unlockedCount}/${total}
                        ${isComplete ? getCheckmarkSVG() : ''}
                    </span>
                `;
            } else {
                buttonStyle = `color: #64748b; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); cursor: default;`;
                onClickAction = `onclick="showLockedCategory('${key}')"`;
                rightText = `<span style="font-size: 18px; color: #475569; margin-left: auto;">🔒</span>`;
            }
            
            html += `
                <button ${onClickAction}
                        style="width: 100%; padding: 18px 20px; font-size: 18px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; 
                            ${buttonStyle}
                            display: flex; align-items: center; gap: 16px; justify-content: center;
                            border-radius: 16px; transition: all 0.2s; min-height: 64px;">
                    <span style="font-size: 28px;">${category.icon}</span>
                    <span style="flex: 1; text-align: left;">${name}</span>
                    ${rightText}
                </button>
            `;
        }
        
        html += `
                    </div>
                    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05);">
                        <button onclick="closeCollections()" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; cursor: pointer; transition: all 0.2s;">
                            ${t('close') || 'Закрыть'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const oldModal = document.getElementById('collections-modal');
        if (oldModal) oldModal.remove();
        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);
    }

function closeCollections() {
    const modal = document.getElementById('collections-modal');
    if (modal) modal.remove();
    const rewardsModal = document.getElementById('rewards-center-modal');
    if (rewardsModal) rewardsModal.style.display = 'flex';
}

    function openCollectionCategory(categoryId) {
        const category = COLLECTION_CATEGORIES[categoryId];
        if (!category) {
            console.error('❌ Категория не найдена:', categoryId);
            return;
        }
        
        const t = window.getText || (key => key);
        const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
        
        if (!checkCategoryUnlocked(categoryId)) {
            showLockedCategory(categoryId);
            return;
        }
        
        currentCollectionCategory = categoryId;
        currentCollectionPage = 1;
        renderCollectionCategory(categoryId, 1);
    }

function renderCollectionCategory(categoryId, page) {
    const category = COLLECTION_CATEGORIES[categoryId];
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    
    if (!checkCategoryUnlocked(categoryId)) {
        showLockedCategory(categoryId);
        return;
    }
    
    // 🔥 ИСПРАВЛЕНО: правильное название категории
    const categoryName = t(category.nameKey) || category.nameKey;
    
    const totalItems = category.total;
    const totalPages = Math.ceil(totalItems / COLLECTION_ITEMS_PER_PAGE);
    const unlockedCount = getUnlockedCountInCategory(categoryId, savedScore);
    const startIndex = (page - 1) * COLLECTION_ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + COLLECTION_ITEMS_PER_PAGE, totalItems);
    
    let html = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 10, 14, 0.92); z-index: 10002; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(20px);" id="collection-category-modal" onclick="if(event.target===this)closeCollectionCategory()">
            <div style="background: rgba(20, 20, 30, 0.95); border: 2px solid rgba(52, 211, 153, 0.3); width: 92%; max-width: 650px; border-radius: 30px; padding: 30px 25px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.05); backdrop-filter: blur(20px); position: relative; text-align: center; max-height: 90vh; overflow-y: auto;">
                <button onclick="closeCollectionCategory()" style="position: sticky; top: 0; float: right; background: none; border: none; color: #64748b; font-size: 32px; cursor: pointer; font-family: 'Russo One', sans-serif; z-index: 10; padding: 0 8px;">✕</button>
                <h2 style="color: #34d399; font-size: 26px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; font-family: 'Russo One', sans-serif;">
                    ${category.icon} ${categoryName}
                </h2>
                <p style="color: #64748b; font-size: 14px; letter-spacing: 1px; margin-bottom: 18px; font-family: 'Russo One', sans-serif;">
                    ${t('collectionProgress') || 'Прогресс'}: ${unlockedCount}/${totalItems}
                </p>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 18px;">
    `;
    
    const progress = JSON.parse(localStorage.getItem('collectionsProgress') || '{}');
    for (let i = startIndex + 1; i <= endIndex; i++) {
        const itemId = `${categoryId}${i}`;
        const isAvailable = i <= unlockedCount;
        const isClaimed = progress[itemId] || false;
        const imgPath = `images/${category.folder}/${i}.png`;
        
        let bgColor = 'rgba(30,30,40,0.5)';
        let borderColor = 'rgba(255,255,255,0.05)';
        let clickAction = '';
        let content = '';
        
        if (isClaimed) {
            bgColor = 'rgba(52, 211, 153, 0.08)';
            borderColor = 'rgba(52, 211, 153, 0.4)';
            clickAction = `openFullImage('${imgPath}', ${i}, '${categoryId}')`;
            content = `<img src="${imgPath}" alt="${categoryName} ${i}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'">`;
        } else if (isAvailable) {
            bgColor = 'rgba(255, 215, 0, 0.08)';
            borderColor = 'rgba(255, 215, 0, 0.3)';
            clickAction = `claimCollectionItem('${categoryId}', ${i}, ${page})`;
            content = `
                <div style="width: 100%; height: 100%; background: #1a1a2e; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <span style="font-size: 36px;">✋</span>
                    <span style="font-size: 9px; color: #fcd34d; font-family: 'Russo One', sans-serif; margin-top: 2px;">${t('getBonus') || 'Забрать'}</span>
                </div>
            `;
        } else {
            clickAction = `showLockReason('${categoryId}', ${i})`;
            content = `
                <div style="width: 100%; height: 100%; background: #1a1a2e; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <span style="font-size: 36px;">🔒</span>
                </div>
            `;
        }
        
        html += `
            <div style="aspect-ratio: 3/4; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; cursor: pointer; transition: all 0.2s; overflow: hidden;" onclick="${clickAction}">
                ${content}
            </div>
        `;
    }
    
    html += `
                </div>
                <div style="display: flex; justify-content: center; align-items: center; gap: 25px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                    <button onclick="changeCollectionPage(-1)" style="width: 44px; height: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 50%; cursor: pointer; color: #94a3b8; font-size: 20px; transition: all 0.2s; font-family: 'Russo One', sans-serif;">◀</button>
                    <span style="color: #64748b; font-size: 15px; font-family: 'Russo One', sans-serif;">${page} / ${totalPages}</span>
                    <button onclick="changeCollectionPage(1)" style="width: 44px; height: 44px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 50%; cursor: pointer; color: #94a3b8; font-size: 20px; transition: all 0.2s; font-family: 'Russo One', sans-serif;">▶</button>
                </div>
            </div>
        </div>
    `;
    
    const oldModal = document.getElementById('collection-category-modal');
    if (oldModal) oldModal.remove();
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstElementChild);
}

function changeCollectionPage(direction) {
    const category = COLLECTION_CATEGORIES[currentCollectionCategory];
    const totalPages = Math.ceil(category.total / COLLECTION_ITEMS_PER_PAGE);
    const newPage = currentCollectionPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentCollectionPage = newPage;
        renderCollectionCategory(currentCollectionCategory, currentCollectionPage);
    }
}

function closeCollectionCategory() {
    const modal = document.getElementById('collection-category-modal');
    if (modal) modal.remove();
    openCollections();
}

function claimCollectionItem(categoryId, index, page) {
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const itemId = `${categoryId}${index}`;
    const category = COLLECTION_CATEGORIES[categoryId];
    const categoryIndex = CATEGORY_ORDER.indexOf(categoryId);
    const baseScore = categoryIndex * category.total * 200;
    const remainingScore = savedScore - baseScore;
    
    if (remainingScore < index * 200) {
        showSimpleModal(t('notEnoughPoints') || 'Недостаточно очков', `${t('needMorePointsFor') || 'Нужно ещё'} ${index * 200 - remainingScore} ${t('points') || 'очков'}.`, 'info');
        return;
    }
    
    const progress = JSON.parse(localStorage.getItem('collectionsProgress') || '{}');
    if (progress[itemId]) {
        showSimpleModal(t('alreadyClaimed') || '✅ Уже получено', t('alreadyClaimedText') || 'Эта картинка уже в вашей коллекции.', 'info');
        return;
    }
    
    progress[itemId] = true;
    localStorage.setItem('collectionsProgress', JSON.stringify(progress));
    
    // Синхронизация с VK Storage
    if (typeof claimCollectionItemWithSync === 'function') {
        claimCollectionItemWithSync(itemId);
    } else if (typeof saveToVKStorage === 'function') {
        saveToVKStorage('tetris_collections_v1', progress);
    }
    
    createConfetti(100);
    const categoryName = t(category.nameKey);
    const itemName = `${category.icon} ${categoryName} #${index}`;
    const imgPath = `images/${category.folder}/${index}.png`;
    updateCollectionCard(categoryId, index, page);
    
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100006; display: flex; justify-content: center; align-items: center; background: url('1.jpg') no-repeat center center fixed; background-size: cover;`;
    modal.id = 'collection-claim-modal';
    modal.innerHTML = `
        <div style="background: rgba(20, 20, 30, 0.85); border: 2px solid rgba(52, 211, 153, 0.4); width: 90%; max-width: 420px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: #64748b; font-size: 28px; cursor: pointer; font-family: 'Russo One', sans-serif;">✕</button>
            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
            <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">${t('newExhibit') || 'Новый экспонат!'}</h2>
            <p style="color: #94a3b8; font-size: 16px; margin-bottom: 8px; font-family: 'Russo One', sans-serif;">${t('youGot') || 'Ты получил'}</p>
            <p style="color: #34d399; font-size: 20px; margin-bottom: 24px; font-family: 'Russo One', sans-serif; font-weight: bold;">${itemName}</p>
            <button onclick="openFullImage('${imgPath}', ${index}, '${categoryId}'); setTimeout(() => { const modal = document.getElementById('collection-claim-modal'); if(modal) modal.remove(); }, 100);" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);">${t('showPicture') || 'Показать картинку'}</button>
            <button onclick="this.parentElement.parentElement.remove(); renderCollectionCategory('${categoryId}', ${page});" style="width: 100%; margin-top: 8px; padding: 12px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; cursor: pointer; transition: all 0.2s;">${t('ok') || 'OK'}</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function updateCollectionCard(categoryId, index, page) {
    const modal = document.getElementById('collection-category-modal');
    if (!modal) return;
    const grid = modal.querySelector('div[style*="grid-template-columns: repeat(5, 1fr)"]');
    if (!grid) return;
    const cards = grid.querySelectorAll('div[style*="aspect-ratio: 3/4"]');
    const startIndex = (page - 1) * COLLECTION_ITEMS_PER_PAGE;
    const cardIndex = index - startIndex - 1;
    if (cardIndex >= 0 && cardIndex < cards.length) {
        const card = cards[cardIndex];
        const category = COLLECTION_CATEGORIES[categoryId];
        const imgPath = `images/${category.folder}/${index}.png`;
        const t = window.getText || (key => key);
        card.style.background = 'rgba(52, 211, 153, 0.08)';
        card.style.borderColor = 'rgba(52, 211, 153, 0.4)';
        card.onclick = function() { openFullImage(imgPath, index, categoryId); };
        card.innerHTML = `<img src="${imgPath}" alt="${category.nameKey} ${index}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'">`;
        const progressEl = modal.querySelector('p[style*="color: #64748b; font-size: 13px"]');
        if (progressEl) {
            const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
            const unlockedCount = getUnlockedCountInCategory(categoryId, savedScore);
            progressEl.textContent = `${t('collectionProgress') || 'Прогресс'}: ${unlockedCount}/${category.total}`;
        }
    }
}

function openFullImage(imgPath, index, categoryId) {
    const category = COLLECTION_CATEGORIES[categoryId];
    const t = window.getText || (key => key);
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10, 10, 14, 0.92); z-index: 10003; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(20px);`;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `
        <div style="position: relative; max-width: 80%; max-height: 80%;">
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: -50px; right: -10px; background: none; border: none; color: #fff; font-size: 32px; cursor: pointer; font-family: 'Russo One', sans-serif; z-index: 10; text-shadow: 0 0 20px rgba(0,0,0,0.8);">✕</button>
            <img src="${imgPath}" alt="${t(category.nameKey)} ${index}" style="max-width: 100%; max-height: 80vh; border-radius: 16px; box-shadow: 0 0 60px rgba(0,0,0,0.8);" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22%3E%3Crect width=%22300%22 height=%22400%22 fill=%22%231a1a2e%22/%3E%3Ctext x=%22150%22 y=%22200%22 text-anchor=%22middle%22 fill=%22%2364748b%22 font-family=%22sans-serif%22 font-size=%2220%22%3ENo image%3C/text%3E%3C/svg%3E'">
            <p style="color: #94a3b8; text-align: center; margin-top: 12px; font-family: 'Russo One', sans-serif; font-size: 14px; text-shadow: 0 0 20px rgba(0,0,0,0.8);">${t(category.nameKey)} ${index}</p>
        </div>
    `;
    document.body.appendChild(modal);
}

function showLockedCategory(categoryId) {
    const t = window.getText || (key => key);
    const category = COLLECTION_CATEGORIES[categoryId];
    const difficultyNames = { 'easy': t('easy') || 'Легко', 'medium': t('medium') || 'Средне', 'hard': t('hard') || 'Сложно' };
    const reqName = difficultyNames[category.requirement] || category.requirement;
    showSimpleModal(t('scrollLockedTitle') || '🔒 Закрыто', `${t('collectionUnlockRequirement') || 'Чтобы открыть эту коллекцию, сыграйте на сложности'} "${reqName}".`, 'info');
}

function showLockReason(categoryId, index) {
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const category = COLLECTION_CATEGORIES[categoryId];
    const categoryIndex = CATEGORY_ORDER.indexOf(categoryId);
    const baseScore = categoryIndex * category.total * 200;
    const remainingScore = savedScore - baseScore;
    const neededScore = index * 200;
    if (remainingScore < neededScore) {
        const missingPoints = neededScore - remainingScore;
        showSimpleModal(t('notEnoughPoints') || 'Недостаточно очков', `${t('needMorePointsFor') || 'Нужно ещё'} ${missingPoints} ${t('points') || 'очков'}.`, 'info');
        return;
    }
    showSimpleModal(t('notEnoughPoints') || 'Недостаточно очков', t('pictureNotAvailable') || 'Эта картинка пока недоступна.', 'info');
}

function showSimpleModal(title, text, icon = 'info') {
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100005; display: flex; justify-content: center; align-items: center;`;
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: url('1.jpg') no-repeat center center fixed; background-size: cover; z-index: -1;"><div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); z-index: -1;"></div></div>
        <div style="background: rgba(20, 20, 30, 0.85); border: 2px solid rgba(52, 211, 153, 0.3); width: 90%; max-width: 400px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
            <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: #64748b; font-size: 28px; cursor: pointer; font-family: 'Russo One', sans-serif;">✕</button>
            <div style="font-size: 48px; margin-bottom: 16px;">${icon === 'info' ? 'ℹ️' : icon === 'success' ? '✅' : icon === 'warning' ? '⚠️' : '❌'}</div>
            <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">${title}</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px; font-family: 'Russo One', sans-serif;">${text}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s;">${window.getText('ok') || 'OK'}</button>
        </div>
    `;
    document.body.appendChild(modal);
}

// ======================== КОНФЕТТИ ========================
function createConfetti(count = 80) {
    const colors = ['#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#34d399', '#f472b6', '#f59e0b'];
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        const size = Math.random() * 8 + 4;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const isCircle = Math.random() > 0.5;
        confetti.style.cssText = `
            position: fixed; left: ${Math.random() * 100}vw; top: -10px;
            width: ${isCircle ? size : size * 0.4}px; height: ${isCircle ? size : size * 1.2}px;
            background: ${color}; border-radius: ${isCircle ? '50%' : '2px'};
            z-index: 100007; pointer-events: none; opacity: 0;
            transform: rotate(${Math.random() * 360}deg);
            animation: confetti-fall ${Math.random() * 2 + 1.5}s ease-in forwards;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

// ======================== СВИТКИ ========================
function getScrollsProgress() {
    return JSON.parse(localStorage.getItem('scrollsProgress') || '{}');
}

function claimScroll(scrollId) {
    const t = window.getText || (key => key);
    const playerScore = player ? player.score : 0;
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const totalScore = Math.max(playerScore, savedScore);
    if (!isScrollUnlocked(scrollId, totalScore)) {
        openScrollTextModal(scrollId);
        return;
    }
    const progress = getScrollsProgress();
    if (progress[scrollId]) {
        openScrollTextModal(scrollId);
        return;
    }
    progress[scrollId] = true;
    localStorage.setItem('scrollsProgress', JSON.stringify(progress));
    
    // Синхронизация с VK Storage
    if (typeof claimScrollWithSync === 'function') {
        claimScrollWithSync(scrollId);
    } else if (typeof saveToVKStorage === 'function') {
        saveToVKStorage('tetris_scrolls_v1', progress);
    }
    
    renderScrolls();
    openScrollTextModal(scrollId);
}

function isScrollUnlocked(scrollId, playerScore) {
    const totalScore = Math.max(playerScore || 0, parseInt(localStorage.getItem('totalScore') || '0'));
    if (scrollId <= 50) return totalScore >= scrollId * 100;
    else {
        const baseScore = 50 * 100;
        const additional = (scrollId - 50) * 300;
        return totalScore >= baseScore + additional;
    }
}

function getScrollText(id) {
    let lang = window.gameLanguage || 'ru';
    const RUSSIAN_LANGS = ['ru', 'uk', 'be', 'kk', 'uz', 'ky', 'tg', 'hy', 'az', 'ka', 'mo', 'tk'];
    if (RUSSIAN_LANGS.includes(lang)) lang = 'ru';
    else if (lang === 'tr') lang = 'tr';
    else lang = 'en';
    const textObj = window.SCROLLS_TEXT ? window.SCROLLS_TEXT[id] : null;
    if (!textObj) {
        if (lang === 'ru') return '📜 Текст будет добавлен позже.';
        if (lang === 'tr') return '📜 Metin daha sonra eklenecek.';
        return '📜 Text will be added later.';
    }
    return textObj[lang] || textObj['en'] || textObj['ru'] || 'Текст не найден';
}

function renderScrolls() {
    const container = document.getElementById('scrolls-container');
    const scoreEl = document.getElementById('scrolls-player-score');
    const pageInfo = document.getElementById('scrolls-page-info');
    if (!container) return;
    const currentScore = player ? player.score : 0;
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const playerScore = Math.max(currentScore, savedScore);
    const progress = getScrollsProgress();
    if (scoreEl) scoreEl.textContent = formatScore(playerScore);
    const startIndex = (currentScrollPage - 1) * SCROLLS_PER_PAGE;
    const endIndex = Math.min(startIndex + SCROLLS_PER_PAGE, TOTAL_SCROLLS);
    container.innerHTML = '';
    let scrollText = window.getText ? window.getText('scroll') : 'Свиток';
    if (scrollText === 'scroll') scrollText = 'Свиток';
    for (let i = startIndex + 1; i <= endIndex; i++) {
        const isAvailable = isScrollUnlocked(i, playerScore);
        const isClaimed = progress[i] || false;
        let icon = '🔒', bgColor = 'rgba(255, 255, 255, 0.02)', borderColor = 'rgba(255, 255, 255, 0.05)', boxShadow = '', animation = '', action = '';
        if (isClaimed) {
            icon = getCheckmarkSVG();
            bgColor = 'rgba(52, 211, 153, 0.05)';
            borderColor = 'rgba(52, 211, 153, 0.2)';
            boxShadow = 'box-shadow: 0 0 15px rgba(52, 211, 153, 0.05);';
            action = `openScrollTextModal(${i})`;
        } else if (isAvailable) {
            icon = '✋';
            bgColor = 'rgba(255, 215, 0, 0.08)';
            borderColor = 'rgba(255, 215, 0, 0.3)';
            boxShadow = 'box-shadow: 0 0 30px rgba(255, 215, 0, 0.1);';
            animation = 'animation: pulse-gold 1.5s ease-in-out infinite;';
            action = `claimScroll(${i})`;
        } else {
            icon = '🔒';
            action = `openScrollTextModal(${i})`;
        }
        const scrollItem = document.createElement('div');
        scrollItem.style.cssText = `display: flex; justify-content: space-between; align-items: center; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; ${boxShadow} ${animation}`;
        scrollItem.onclick = () => { if (isClaimed) openScrollTextModal(i); else if (isAvailable) claimScroll(i); else openScrollTextModal(i); };
        scrollItem.onmouseover = () => { scrollItem.style.borderColor = isClaimed ? 'rgba(52, 211, 153, 0.5)' : isAvailable ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 255, 255, 0.15)'; scrollItem.style.background = isClaimed ? 'rgba(52, 211, 153, 0.08)' : isAvailable ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 255, 255, 0.04)'; };
        scrollItem.onmouseout = () => { scrollItem.style.borderColor = isClaimed ? 'rgba(52, 211, 153, 0.2)' : isAvailable ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)'; scrollItem.style.background = isClaimed ? 'rgba(52, 211, 153, 0.05)' : isAvailable ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)'; };
        scrollItem.innerHTML = `<span style="color: ${isClaimed ? '#e2e8f0' : isAvailable ? '#fcd34d' : '#64748b'}; font-family: 'Russo One', sans-serif; font-size: 15px;">${scrollText} ${i}${isAvailable && !isClaimed ? ' <span style="font-size: 11px; color: #fcd34d;">✨</span>' : ''}</span><span style="font-size: 22px; transition: all 0.3s; display: flex; align-items: center;">${icon}</span>`;
        container.appendChild(scrollItem);
    }
    const totalPages = Math.ceil(TOTAL_SCROLLS / SCROLLS_PER_PAGE);
    if (pageInfo) pageInfo.textContent = `${currentScrollPage} / ${totalPages}`;
}

function getCheckmarkSVG() {
    return `<span class="achievement-item__checkmark" style="display: inline-block; width: 24px; height: 24px; flex-shrink: 0; position: relative;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" stroke="#34d399" stroke-width="2" fill="rgba(52, 211, 153, 0.1)"/>
            <path class="checkmark-path" d="M7 12L10.5 16L17 8" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray: 30; stroke-dashoffset: 0; animation: checkmarkDraw 2s ease-in-out infinite;"/>
        </svg>
    </span>`;
}

function nextScrollPage() {
    const totalPages = Math.ceil(TOTAL_SCROLLS / SCROLLS_PER_PAGE);
    if (currentScrollPage < totalPages) { currentScrollPage++; renderScrolls(); }
}

function prevScrollPage() {
    if (currentScrollPage > 1) { currentScrollPage--; renderScrolls(); }
}

function openScrollsModal() {
    if (typeof loadTotalProgress === 'function') loadTotalProgress();
    const modal = document.getElementById('scrolls-modal');
    if (modal) { modal.style.display = 'flex'; renderScrolls(); }
}

function closeScrollsModal() {
    const scrollsModal = document.getElementById('scrolls-modal');
    if (scrollsModal) scrollsModal.style.display = 'none';
    const rewardsModal = document.getElementById('rewards-center-modal');
    if (rewardsModal) rewardsModal.style.display = 'flex';
}

function openScrollTextModal(scrollId) {
    const playerScore = player ? player.score : 0;
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const totalScore = Math.max(playerScore, savedScore);
    const progress = getScrollsProgress();
    const isAvailable = isScrollUnlocked(scrollId, totalScore);
    const isClaimed = progress[scrollId] || false;
    if (isAvailable && !isClaimed) { claimScroll(scrollId); return; }
    if (!isAvailable) {
        const t = window.getText || (key => key);
        const neededPoints = scrollId <= 50 ? scrollId * 100 : 5000 + (scrollId - 50) * 300;
        const modal = document.createElement('div');
        modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100001; display: flex; justify-content: center; align-items: center; background: url('1.jpg') no-repeat center center fixed; background-size: cover;`;
        const overlay = document.createElement('div');
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.65); z-index: -1;`;
        modal.appendChild(overlay);
        modal.innerHTML += `
            <div style="background: rgba(20, 20, 30, 0.85); border: 2px solid rgba(239, 68, 68, 0.3); width: 90%; max-width: 400px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
                <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: #64748b; font-size: 28px; cursor: pointer; font-family: 'Russo One', sans-serif;">✕</button>
                <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
                <h2 style="color: #ef4444; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">${t('scrollLockedTitle')}</h2>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 12px; font-family: 'Russo One', sans-serif; line-height: 1.6;">${t('scrollLockedText')}</p>
                <p style="color: #fcd34d; font-size: 13px; font-family: 'Russo One', sans-serif; margin-bottom: 24px;">💡 ${t('needPoints') || 'Нужно'}: ${neededPoints} ${t('points') || 'очков'}</p>
                <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s;">${t('ok')}</button>
            </div>
        `;
        document.body.appendChild(modal);
        return;
    }
    const modal = document.getElementById('scroll-text-modal');
    const titleEl = document.getElementById('scroll-text-title');
    const contentEl = document.getElementById('scroll-text-content');
    if (modal && titleEl && contentEl) {
        titleEl.textContent = `📜 ${window.getText ? window.getText('scroll') : 'Свиток'} ${scrollId}`;
        contentEl.textContent = getScrollText(scrollId);
        modal.style.display = 'flex';
        if (typeof updateInterfaceLanguage === 'function') updateInterfaceLanguage();
    }
}

function closeScrollTextModal() {
    const modal = document.getElementById('scroll-text-modal');
    if (modal) modal.style.display = 'none';
}

// ======================== ЦЕНТР НАГРАД ========================
function openRewardsCenter() {
    document.querySelectorAll('[id$="-modal"]').forEach(el => {
        if (el.id !== 'rewards-center-modal' && el.id !== 'scroll-text-modal') {
            el.style.display = 'none';
        }
    });
    const modal = document.getElementById('rewards-center-modal');
    if (!modal) return;
    modal.style.cssText = `display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; z-index: 99999 !important; justify-content: center !important; align-items: center !important; overflow: auto !important; padding: 20px !important; background: url('1.jpg') no-repeat center center fixed; background-size: cover;`;
    const scoreEl = document.getElementById('rewards-player-score');
    if (scoreEl) {
        const totalScore = parseInt(localStorage.getItem('totalScore') || '0');
        scoreEl.textContent = formatScore(totalScore);
    }
    const scrollProgress = document.getElementById('scrolls-progress');
    if (scrollProgress) {
        const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
        const unlocked = countUnlockedScrolls(savedScore);
        scrollProgress.textContent = `${unlocked}/100`;
    }
    updateDailyBonusStatus();
    updateCollectionsProgress();
    modal.style.display = 'flex';
}

function closeRewardsCenter() {
    const modal = document.getElementById('rewards-center-modal');
    if (modal) modal.style.display = 'none';
    const scrollsModal = document.getElementById('scrolls-modal');
    if (scrollsModal) scrollsModal.style.display = 'none';
    const scrollTextModal = document.getElementById('scroll-text-modal');
    if (scrollTextModal) scrollTextModal.style.display = 'none';
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'flex';
}

function openScrollsFromRewards() {
    const rewardsModal = document.getElementById('rewards-center-modal');
    if (rewardsModal) rewardsModal.style.display = 'none';
    openScrollsModal();
}

function formatScore(value) {
    if (value >= 1000000) {
        const millions = value / 1000000;
        return millions % 1 === 0 ? millions + 'M' : millions.toFixed(1) + 'M';
    } else if (value >= 1000) {
        const thousands = value / 1000;
        return thousands % 1 === 0 ? thousands + 'K' : thousands.toFixed(1) + 'K';
    }
    return value.toString();
}

function countUnlockedScrolls(playerScore) {
    let count = 0;
    for (let i = 1; i <= TOTAL_SCROLLS; i++) {
        if (isScrollUnlocked(i, playerScore)) count++;
    }
    return count;
}

// ======================== ЕЖЕДНЕВНЫЙ БОНУС ========================
// ======================== ЕЖЕДНЕВНЫЙ БОНУС ========================

function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
}

function updateDailyBonusStatus() {
    const statusEl = document.getElementById('daily-bonus-status');
    if (!statusEl) return;
    const todayKey = getTodayKey();
    const lastClaimed = localStorage.getItem('dailyBonusDate');
    const isClaimed = lastClaimed === todayKey;
    if (isClaimed) {
        statusEl.innerHTML = getCheckmarkSVG();
        statusEl.style.color = '#34d399';
        statusEl.style.fontSize = '20px';
        statusEl.style.display = 'inline-flex';
        statusEl.style.alignItems = 'center';
    } else {
        statusEl.textContent = '+10 очков';
        statusEl.style.color = '#fcd34d';
        statusEl.style.fontSize = '12px';
    }
}

function openDailyBonus() {
    const todayKey = getTodayKey();
    const lastClaimed = localStorage.getItem('dailyBonusDate');
    const isClaimed = lastClaimed === todayKey;
    
    // Всегда показываем модалку с обоими вариантами
    showDailyBonusModal(isClaimed);
}

function showDailyBonusModal(isClaimed) {
    const t = window.getText || (key => key);
    const oldModal = document.getElementById('daily-bonus-modal');
    if (oldModal) oldModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'daily-bonus-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 100002;
        display: flex;
        justify-content: center;
        align-items: center;
        background: url('1.jpg') no-repeat center center fixed;
        background-size: cover;
    `;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: -1;
    `;
    modal.appendChild(overlay);
    
    let content = '';
    
    if (isClaimed) {
        // Бонус уже получен — показываем усиленный вариант за рекламу
        content = `
            <div style="background: rgba(20, 20, 30, 0.92); border: 2px solid rgba(245, 158, 11, 0.3); width: 90%; max-width: 400px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
                <button onclick="this.closest('#daily-bonus-modal').remove()" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: #64748b; font-size: 28px; cursor: pointer; font-family: 'Russo One', sans-serif;">✕</button>
                <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
                <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">
                    ${t('alreadyClaimed') || 'Уже получено!'}
                </h2>
                <p style="color: #94a3b8; font-size: 14px; font-family: 'Russo One', sans-serif; margin-bottom: 6px;">
                    ${t('dailyBonusAlreadyClaimed') || 'Ты уже получил ежедневный бонус сегодня.'}
                </p>
                <p style="color: #fcd34d; font-size: 14px; font-family: 'Russo One', sans-serif; margin-bottom: 20px;">
                    🎯 Посмотри рекламу и получи <strong>+25 очков</strong> вместо +10!
                </p>
                <div style="display: flex; gap: 12px;">
                    <button onclick="this.closest('#daily-bonus-modal').remove()" style="flex: 1; padding: 14px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; cursor: pointer; transition: all 0.2s;">
                        ${t('cancel') || 'Отмена'}
                    </button>
                    <button onclick="claimEnhancedDailyBonus()" style="flex: 1; padding: 14px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);">
                        🎁 +25
                    </button>
                </div>
            </div>
        `;
    } else {
        // Бонус ещё не получен — показываем обычный и усиленный
        content = `
            <div style="background: rgba(20, 20, 30, 0.92); border: 2px solid rgba(52, 211, 153, 0.3); width: 90%; max-width: 400px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
                <button onclick="this.closest('#daily-bonus-modal').remove()" style="position: absolute; top: 15px; right: 20px; background: none; border: none; color: #64748b; font-size: 28px; cursor: pointer; font-family: 'Russo One', sans-serif;">✕</button>
                <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
                <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">
                    ${t('dailyBonus') || 'Ежедневный бонус'}
                </h2>
                <p style="color: #94a3b8; font-size: 14px; font-family: 'Russo One', sans-serif; margin-bottom: 20px;">
                    ${t('dailyBonusText') || 'Получить +10 очков?'}
                </p>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button onclick="this.closest('#daily-bonus-modal').remove()" style="flex: 1; min-width: 80px; padding: 14px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; cursor: pointer; transition: all 0.2s;">
                        ${t('cancel') || 'Отмена'}
                    </button>
                    <button onclick="claimDailyBonus()" style="flex: 1; min-width: 100px; padding: 14px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);">
                        ✅ +10
                    </button>
                    <button onclick="claimEnhancedDailyBonus()" style="flex: 1; min-width: 120px; padding: 14px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);">
                        🎁 +25
                    </button>
                </div>
            </div>
        `;
    }
    
    modal.innerHTML += content;
    document.body.appendChild(modal);
}

// Обычный бонус (+10)
function claimDailyBonus() {
    if (typeof player !== 'undefined' && player) {
        player.score += 10;
        if (typeof saveTotalProgress === 'function') saveTotalProgress();
        localStorage.setItem('dailyBonusDate', getTodayKey());
        
        // Синхронизация с VK Storage
        if (typeof claimDailyBonusWithSync === 'function') {
            claimDailyBonusWithSync();
        } else if (typeof saveToVKStorage === 'function') {
            saveToVKStorage('tetris_daily_bonus_v1', getTodayKey());
        }
        
        const modal = document.getElementById('daily-bonus-modal');
        if (modal) modal.remove();
        
        const t = window.getText || (key => key);
        showSuccessModal(
            t('bonusClaimed') || '🎉 Бонус получен!',
            '+10 очков! Возвращайся завтра за новым бонусом.'
        );
        
        updateDailyBonusStatus();
        if (typeof drawGame === 'function') drawGame();
    }
}

// Усиленный бонус за рекламу (+25)
function claimEnhancedDailyBonus() {
    // Ставим игру на паузу, если она идёт
    if (isGameStarted && !isGameOver && !gameState.paused) {
        pauseGame();
    }
    
    // Закрываем модалку бонуса
    const modal = document.getElementById('daily-bonus-modal');
    if (modal) modal.remove();
    
    showRewardedAdForContinue().then((success) => {
        if (success) {
            // Реклама просмотрена — начисляем бонус
            if (typeof player !== 'undefined' && player) {
                player.score += 25;
                if (typeof saveTotalProgress === 'function') saveTotalProgress();
                localStorage.setItem('dailyBonusDate', getTodayKey());
                
                if (typeof claimDailyBonusWithSync === 'function') {
                    claimDailyBonusWithSync();
                } else if (typeof saveToVKStorage === 'function') {
                    saveToVKStorage('tetris_daily_bonus_v1', getTodayKey());
                }
                
                showCustomModal({
                    title: '🎉 Усиленный бонус получен!',
                    text: '+25 очков! Приятной игры!',
                    type: 'success',
                    button: 'OK'
                });
                
                updateDailyBonusStatus();
                if (typeof drawGame === 'function') drawGame();
            }
        } else {
            // Реклама не показана
            showCustomModal({
                title: '❌ Реклама недоступна',
                text: 'Попробуйте позже или возьмите обычный бонус (+10).',
                type: 'error',
                button: 'OK'
            });
            
            // Возобновляем игру, если была на паузе
            if (gameState.paused && isGameStarted && !isGameOver) {
                resumeGame();
            }
        }
    });
}

function showSuccessModal(title, text) {
    const modal = document.createElement('div');
    modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100003; display: flex; justify-content: center; align-items: center; background: url('1.jpg') no-repeat center center fixed; background-size: cover;`;
    const overlay = document.createElement('div');
    overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: -1;`;
    modal.appendChild(overlay);
    modal.innerHTML += `
        <div style="background: rgba(20, 20, 30, 0.85); border: 2px solid rgba(34, 197, 94, 0.3); width: 90%; max-width: 400px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
            <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">${title}</h2>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px; font-family: 'Russo One', sans-serif;">${text}</p>
            <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s;">${window.getText('ok') || 'OK'}</button>
        </div>
    `;
    document.body.appendChild(modal);
}
//стирание рядов за рекламу
        // ======================== СТИРАНИЕ ВЕРХНИХ РЯДОВ ========================
        function clearTopRows() {
            const rowsToClear = 7;
            let clearedCount = 0;
            
            // Проверяем, есть ли блоки в верхних рядах
            for (let y = 0; y < rowsToClear && y < arenaHeight; y++) {
                let hasBlocks = false;
                for (let x = 0; x < arenaWidth; x++) {
                    if (arena[y][x] !== 0 && arena[y][x] !== 'bonus') {
                        hasBlocks = true;
                        break;
                    }
                }
                if (hasBlocks) {
                    clearedCount++;
                }
            }
            
            // Если верхние ряды пустые — ничего не делаем
            if (clearedCount === 0) {
                showCustomModal({
                    title: '⚠️ Верхние ряды пусты',
                    text: 'Нет блоков для удаления. Продолжайте игру!',
                    type: 'info',
                    button: 'OK'
                });
                return false;
            }
            
            // Удаляем верхние ряды и сдвигаем всё вверх
            for (let i = 0; i < rowsToClear; i++) {
                // Удаляем первый ряд (верхний)
                arena.shift();
                // Добавляем пустой ряд вниз
                arena.push(new Array(arenaWidth).fill(0));
            }
            
            // Удаляем бонусы, которые могли оказаться в верхних рядах
            for (let y = 0; y < rowsToClear && y < arenaHeight; y++) {
                for (let x = 0; x < arenaWidth; x++) {
                    if (arena[y][x] === 'bonus') {
                        arena[y][x] = 0;
                    }
                }
            }
            
            console.log(`🧹 Стерто ${rowsToClear} верхних рядов`);
            return true;
        }
        // ======================== РЕКЛАМА ЗА ВОЗНАГРАЖДЕНИЕ ========================
let isRewardedAdLoading = false;

function showRewardedAdForContinue() {
    return new Promise((resolve) => {
        if (isRewardedAdLoading) {
            resolve(false);
            return;
        }
        
        if (!vkInitialized) {
            console.warn('⚠️ VK не инициализирован');
            resolve(false);
            return;
        }
        
        isRewardedAdLoading = true;
        
        // Показываем модалку загрузки
        showLoadingAdModal();
        
        // Приостанавливаем музыку и звуки
        if (typeof gameAudio !== 'undefined') {
            gameAudio.pauseAll();
        }
        
        // Показываем рекламу за вознаграждение
        vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
            .then((data) => {
                console.log('✅ Реклама за вознаграждение показана:', data);
                closeLoadingAdModal();
                isRewardedAdLoading = false;
                resolve(true);
            })
            .catch((error) => {
                console.error('❌ Ошибка показа рекламы за вознаграждение:', error);
                closeLoadingAdModal();
                isRewardedAdLoading = false;
                resolve(false);
            });
    });
}

// ====== МОДАЛКА ЗАГРУЗКИ РЕКЛАМЫ ======
function showLoadingAdModal() {
    const modal = document.createElement('div');
    modal.id = 'loading-ad-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 100010;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(10, 10, 14, 0.85);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
    `;
    modal.innerHTML = `
        <div style="text-align: center; color: #fff;">
            <div style="font-size: 48px; margin-bottom: 20px; animation: pulse 1s ease-in-out infinite;">📺</div>
            <h2 style="color: #34d399; font-size: 24px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
                Загрузка рекламы...
            </h2>
            <p style="color: #94a3b8; font-size: 14px; font-family: 'Russo One', sans-serif;">
                Пожалуйста, подождите
            </p>
            <div style="margin-top: 20px; width: 60px; height: 60px; margin-left: auto; margin-right: auto;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; width: 100%; height: 100%;">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Добавляем стили для анимаций, если их нет
    if (!document.getElementById('ad-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'ad-animation-styles';
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function closeLoadingAdModal() {
    const modal = document.getElementById('loading-ad-modal');
    if (modal) modal.remove();
}

    // ====== МОДАЛКА ПОДТВЕРЖДЕНИЯ ПРОДОЛЖЕНИЯ ======
    function showContinueConfirmationModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.id = 'continue-confirm-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100011;
                display: flex;
                justify-content: center;
                align-items: center;
                background: url('1.jpg') no-repeat center center fixed;
                background-size: cover;
            `;
            
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: -1;
            `;
            modal.appendChild(overlay);
            
            modal.innerHTML += `
                <div style="background: rgba(20, 20, 30, 0.92); border: 2px solid rgba(52, 211, 153, 0.4); width: 90%; max-width: 420px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🧹</div>
                    <h2 style="color: #34d399; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; font-family: 'Russo One', sans-serif;">
                        Продолжить эту игру!
                    </h2>
                    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; font-family: 'Russo One', sans-serif; margin-bottom: 8px;">
                        Посмотрите рекламу и <strong style="color: #fcd34d;">сотрите 7 верхних строк</strong>, чтобы продолжить этот раунд!
                    </p>
                    <p style="color: #64748b; font-size: 13px; font-family: 'Russo One', sans-serif; margin-bottom: 24px;">
                        ⚡ Ваши очки и прогресс сохранятся
                    </p>
                    <div style="display: flex; gap: 12px;">
                        <button onclick="document.getElementById('continue-confirm-modal').remove(); resolve(false);" style="flex: 1; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; cursor: pointer; transition: all 0.2s;">
                            Отмена
                        </button>
                        <button onclick="document.getElementById('continue-confirm-modal').remove(); resolve(true);" style="flex: 1; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);">
                            Продолжить
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Сохраняем resolve для использования в кнопках
            modal._resolve = resolve;
            
            // Переопределяем кнопки с использованием сохранённого resolve
            modal.querySelectorAll('button').forEach(btn => {
                const originalOnclick = btn.onclick;
                btn.onclick = function(e) {
                    if (originalOnclick) {
                        // Вызываем оригинальный обработчик, который удалит модалку
                        originalOnclick.call(this, e);
                    }
                    // Затем резолвим Promise
                    const isConfirm = this.textContent.includes('Продолжить');
                    modal._resolve(isConfirm);
                };
            });
        });
    }
    // ======================== ПРОДОЛЖЕНИЕ ИГРЫ ЗА РЕКЛАМУ ========================
async function handleContinueWithAd() {
    // Сначала показываем модалку подтверждения
    const confirmed = await showContinueConfirmationModal();
    
    if (!confirmed) {
        return;
    }
    
    // Ставим игру на паузу (если не на паузе)
    if (!gameState.paused) {
        pauseGame();
    }
    
    // Показываем рекламу
    const adShown = await showRewardedAdForContinue();
    
    if (adShown) {
        // Реклама показана — стираем верхние ряды
        const cleared = clearTopRows();
        
        if (cleared) {
            // Сбрасываем флаг gameOver, чтобы можно было продолжить
            isGameOver = false;
            gameState.over = false;
            gameState.initialized = true;
            isGameStarted = true;
            
            // Закрываем модалку окончания игры
            const modal = document.getElementById('gameover-modal');
            if (modal) modal.style.display = 'none';
            
            // Обновляем отображение
            if (typeof drawGame === 'function') drawGame();
            
            // Показываем уведомление об успехе
            showCustomModal({
                title: '🧹 Ряды стёрты!',
                text: '7 верхних строк удалены. Нажмите "Дальше" чтобы продолжить игру!',
                type: 'success',
                button: 'OK'
            });
            
            // Обновляем текст кнопки паузы
            updatePauseButtonText();
            
            // Игра остаётся на паузе — игрок сам нажмёт "Дальше"
            // Музыка и звуки уже приостановлены в showRewardedAdForContinue()
        } else {
            // Нечего стирать — просто закрываем модалку
            showCustomModal({
                title: '⚠️ Верхние ряды пусты',
                text: 'Нет блоков для удаления. Продолжайте игру!',
                type: 'info',
                button: 'OK'
            });
        }
    } else {
        // Реклама не показана
        showCustomModal({
            title: '❌ Реклама недоступна',
            text: 'Попробуйте позже или начните новую игру.',
            type: 'error',
            button: 'OK'
        });
        
        // Возобновляем звуки
        if (typeof gameAudio !== 'undefined') {
            gameAudio.resumeAll();
        }
    }
}

// ====== МОДАЛКА ПОДТВЕРЖДЕНИЯ (ПРОМИС) ======
function showContinueConfirmationModal() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.id = 'continue-confirm-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 100011;
            display: flex;
            justify-content: center;
            align-items: center;
            background: url('1.jpg') no-repeat center center fixed;
            background-size: cover;
        `;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: -1;
        `;
        modal.appendChild(overlay);
        
        modal.innerHTML += `
            <div style="background: rgba(20, 20, 30, 0.92); border: 2px solid rgba(52, 211, 153, 0.4); width: 90%; max-width: 420px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
                <div style="font-size: 48px; margin-bottom: 16px;">🧹</div>
                <h2 style="color: #34d399; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; font-family: 'Russo One', sans-serif;">
                    Продолжить эту игру!
                </h2>
                <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; font-family: 'Russo One', sans-serif; margin-bottom: 8px;">
                    Посмотрите рекламу и <strong style="color: #fcd34d;">сотрите 7 верхних строк</strong>, чтобы продолжить этот раунд!
                </p>
                <p style="color: #64748b; font-size: 13px; font-family: 'Russo One', sans-serif; margin-bottom: 24px;">
                    ⚡ Ваши очки и прогресс сохранятся
                </p>
                <div style="display: flex; gap: 12px;">
                    <button id="continue-cancel-btn" style="flex: 1; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; cursor: pointer; transition: all 0.2s;">
                        Отмена
                    </button>
                    <button id="continue-confirm-btn" style="flex: 1; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.3);">
                        Продолжить
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('continue-cancel-btn').onclick = function() {
            modal.remove();
            resolve(false);
        };
        
        document.getElementById('continue-confirm-btn').onclick = function() {
            modal.remove();
            resolve(true);
        };
        
        // Закрытие по клику вне модалки
        modal.onclick = function(e) {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };
    });
}
// ======================== ЗАМЕДЛЕНИЕ ПАДЕНИЯ (ЧЕРЕПАШКА) ========================
function showSlowDownModal() {
    // Проверяем, что игра идёт
    if (!isGameStarted || isGameOver) {
        showCustomModal({
            title: '⚠️ Игра не активна',
            text: 'Начните игру, чтобы использовать замедление!',
            type: 'info',
            button: 'OK'
        });
        return;
    }
    
    // Проверяем, не активно ли уже замедление
    if (isSlowDownActive) {
        showCustomModal({
            title: '🐢 Замедление уже активно!',
            text: 'Подождите, пока эффект закончится.',
            type: 'info',
            button: 'OK'
        });
        return;
    }
    
    // Ставим игру на паузу
    if (!gameState.paused) {
        pauseGame();
    }
    
    // Показываем модалку подтверждения
    const modal = document.createElement('div');
    modal.id = 'slowdown-confirm-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 100020;
        display: flex;
        justify-content: center;
        align-items: center;
        background: url('1.jpg') no-repeat center center fixed;
        background-size: cover;
    `;
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: -1;
    `;
    modal.appendChild(overlay);
    
    modal.innerHTML += `
        <div style="background: rgba(20, 20, 30, 0.92); border: 2px solid rgba(52, 211, 153, 0.4); width: 90%; max-width: 420px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
            <div style="font-size: 48px; margin-bottom: 16px;">🐢</div>
            <h2 style="color: #34d399; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; font-family: 'Russo One', sans-serif;">
                Замедлить?
            </h2>
            <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; font-family: 'Russo One', sans-serif; margin-bottom: 8px;">
                Посмотрите рекламу и <strong style="color: #fcd34d;">замедлите падение фигурок</strong> на <strong>15 секунд</strong>!
            </p>
            <p style="color: #64748b; font-size: 13px; font-family: 'Russo One', sans-serif; margin-bottom: 24px;">
                ⏱️ Идеально для сложных моментов!
            </p>
            <div style="display: flex; gap: 12px;">
                <button onclick="document.getElementById('slowdown-confirm-modal').remove(); if (gameState.paused) resumeGame();" style="flex: 1; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; cursor: pointer; transition: all 0.2s;">
                    Отмена
                </button>
                <button onclick="activateSlowDown()" style="flex: 1; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #34d399, #059669); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(52, 211, 153, 0.3);">
                    🐢 Замедлить
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function activateSlowDown() {
    // Закрываем модалку подтверждения
    const confirmModal = document.getElementById('slowdown-confirm-modal');
    if (confirmModal) confirmModal.remove();
    
    // Показываем рекламу
    showRewardedAdForContinue().then((success) => {
        if (success) {
            // Реклама просмотрена — активируем замедление
            applySlowDownEffect();
            
            showCustomModal({
                title: '🐢 Фигурки замедлятся!',
                text: 'Падение замедлено на 15 секунд!',
                type: 'success',
                button: 'OK',
                timer: 2000
            });
            
            // Снимаем паузу после закрытия модалки (или по таймеру)
            setTimeout(() => {
                if (gameState.paused && isGameStarted && !isGameOver) {
                    resumeGame();
                }
            }, 2500);
            
        } else {
            // Реклама не показана
            showCustomModal({
                title: '❌ Реклама недоступна',
                text: 'Попробуйте позже.',
                type: 'error',
                button: 'OK'
            });
            
            // Возобновляем игру, если была на паузе
            if (gameState.paused && isGameStarted && !isGameOver) {
                resumeGame();
            }
        }
    });
}

function applySlowDownEffect() {
    if (isSlowDownActive) return;
    
    isSlowDownActive = true;
    
    // Сохраняем оригинальный интервал
    const originalDropInterval = dropInterval;
    
    // Замедляем в 3 раза (увеличиваем интервал)
    dropInterval = originalDropInterval * 3;
    
    // Показываем визуальный индикатор
    showSlowDownIndicator();
    
    console.log('🐢 Замедление активировано на 15 секунд');
    
    // Через 15 секунд возвращаем скорость
    setTimeout(() => {
        dropInterval = originalDropInterval;
        isSlowDownActive = false;
        hideSlowDownIndicator();
        console.log('⏱️ Замедление закончилось');
        
        showCustomModal({
            title: '⏱️ Время вышло!',
            text: 'Скорость падения восстановлена.',
            type: 'info',
            button: 'OK',
            timer: 1500
        });
    }, 15000);
}

function showSlowDownIndicator() {
    // Показываем индикатор замедления над игровым полем
    let indicator = document.getElementById('slowdown-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'slowdown-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            color: #34d399;
            text-shadow: 0 0 40px rgba(52, 211, 153, 0.5);
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            font-family: 'Russo One', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        `;
        indicator.innerHTML = `
            <span>🐢</span>
            <span style="font-size: 16px; color: #94a3b8;">ЗАМЕДЛЕНИЕ</span>
            <span style="font-size: 12px; color: #64748b;" id="slowdown-timer">15с</span>
        `;
        document.body.appendChild(indicator);
    }
    
    // Показываем с анимацией
    setTimeout(() => {
        indicator.style.opacity = '1';
    }, 100);
    
    // Запускаем обратный отсчёт
    let seconds = 15;
    const timerEl = document.getElementById('slowdown-timer');
    if (timerEl) {
        timerEl.textContent = `${seconds}с`;
        const interval = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                clearInterval(interval);
                return;
            }
            timerEl.textContent = `${seconds}с`;
        }, 1000);
    }
}

function hideSlowDownIndicator() {
    const indicator = document.getElementById('slowdown-indicator');
    if (indicator) {
        indicator.style.opacity = '0';
        setTimeout(() => {
            if (indicator.parentNode) indicator.remove();
        }, 400);
    }
}

// ======================== КОМБО-СИСТЕМА ========================


function showComboDisplay(rowsCleared) {
    // Удаляем старую надпись, если есть
    const oldDisplay = document.getElementById('combo-display');
    if (oldDisplay) oldDisplay.remove();
    
    // Очищаем старый таймер
    if (comboDisplayTimer) {
        clearTimeout(comboDisplayTimer);
        comboDisplayTimer = null;
    }
    
    // Создаём элемент
    const display = document.createElement('div');
    display.id = 'combo-display';
    display.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.5);
        font-family: 'Russo One', sans-serif;
        font-size: ${rowsCleared >= 5 ? 80 : rowsCleared >= 4 ? 72 : rowsCleared >= 3 ? 60 : 48}px;
        font-weight: bold;
        color: #fff;
        text-shadow: 
            0 0 30px rgba(255, 215, 0, 0.8),
            0 0 60px rgba(255, 215, 0, 0.4),
            0 4px 20px rgba(0, 0, 0, 0.5);
        z-index: 9998;
        pointer-events: none;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-align: center;
        line-height: 1.2;
    `;
    
    // Выбираем цвет в зависимости от количества линий
    let color = '#fcd34d'; // золотой
    let glowColor = 'rgba(255, 215, 0, 0.8)';
    if (rowsCleared >= 5) {
        color = '#ff6b6b';
        glowColor = 'rgba(255, 107, 107, 0.8)';
    } else if (rowsCleared >= 4) {
        color = '#ff922b';
        glowColor = 'rgba(255, 146, 43, 0.8)';
    } else if (rowsCleared >= 3) {
        color = '#fcc419';
        glowColor = 'rgba(252, 196, 25, 0.8)';
    }
    
    // Текст комбо
    let comboText = `x${rowsCleared}`;
    let subText = `${rowsCleared} линии`;
    if (rowsCleared === 2) subText = `${rowsCleared} линии`;
    else if (rowsCleared === 3) subText = `${rowsCleared} линии`;
    else if (rowsCleared === 4) subText = `${rowsCleared} линии`;
    else if (rowsCleared >= 5) subText = `${rowsCleared} линий`;
    
    display.innerHTML = `
        <div style="color: ${color}; text-shadow: 0 0 40px ${glowColor}, 0 0 80px ${glowColor}40;">
            ${comboText}
        </div>
        <div style="font-size: ${rowsCleared >= 5 ? 20 : 16}px; color: #94a3b8; text-shadow: none; margin-top: -8px;">
            ${subText}
        </div>
    `;
    
    document.body.appendChild(display);
    
    // Анимация появления
    requestAnimationFrame(() => {
        display.style.opacity = '1';
        display.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    
    // ====== ЗАПУСКАЕМ КОНФЕТТИ ПРИ x3 И ВЫШЕ ======
    if (rowsCleared >= 3) {
        let confettiCount = 20;
        if (rowsCleared >= 5) confettiCount = 80;
        else if (rowsCleared >= 4) confettiCount = 50;
        createConfetti(confettiCount);
    }
    
    // Автоматическое исчезновение через 1.5 секунды
    comboDisplayTimer = setTimeout(() => {
        if (display) {
            display.style.opacity = '0';
            display.style.transform = 'translate(-50%, -50%) scale(1.2)';
            setTimeout(() => {
                if (display.parentNode) display.remove();
            }, 400);
        }
        comboDisplayTimer = null;
    }, 1500);
}

// ======================== ЭКСПОРТ ========================
window.selectMode = selectMode;
window.selectDifficulty = selectDifficulty;
window.closeDifficultyModal = closeDifficultyModal;
window.startGameWithAudio = startGameWithAudio;
window.togglePauseResume = togglePauseResume;
window.returnToMenu = returnToMenu;
window.toggleSound = toggleSound;
window.toggleMusic = toggleMusic;
window.updateSoundIcon = updateSoundIcon;
window.updateMusicIcon = updateMusicIcon;
window.showGameOverModal = showGameOverModal;
window.closeGameOverModal = closeGameOverModal;
window.closeGameOverModalAndMenu = closeGameOverModalAndMenu;
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;
window.endGame = endGame;
window.drawGame = drawGame;
window.update = update;
window.player = player;
window.gameState = gameState;
window.isGameStarted = isGameStarted;
window.isGameOver = isGameOver;
window.selectedDifficulty = selectedDifficulty;
window.selectedMode = selectedMode;
window.saveTotalProgress = saveTotalProgress;

// Свитки
window.openScrollsModal = openScrollsModal;
window.closeScrollsModal = closeScrollsModal;
window.openScrollTextModal = openScrollTextModal;
window.closeScrollTextModal = closeScrollTextModal;
window.prevScrollPage = prevScrollPage;
window.nextScrollPage = nextScrollPage;
window.renderScrolls = renderScrolls;
window.countUnlockedScrolls = countUnlockedScrolls;
window.claimScroll = claimScroll;
window.getScrollsProgress = getScrollsProgress;

// Коллекции
window.openCollections = openCollections;
window.closeCollections = closeCollections;
window.openCollectionCategory = openCollectionCategory;
window.renderCollectionCategory = renderCollectionCategory;
window.changeCollectionPage = changeCollectionPage;
window.closeCollectionCategory = closeCollectionCategory;
window.openFullImage = openFullImage;
window.checkCategoryUnlocked = checkCategoryUnlocked;
window.getUnlockedCountInCategory = getUnlockedCountInCategory;
window.showLockedCategory = showLockedCategory;
window.showSimpleModal = showSimpleModal;
window.claimCollectionItem = claimCollectionItem;
window.updateCollectionsProgress = updateCollectionsProgress;

// Центр наград
window.openRewardsCenter = openRewardsCenter;
window.closeRewardsCenter = closeRewardsCenter;
window.openScrollsFromRewards = openScrollsFromRewards;
window.openDailyBonus = openDailyBonus;
window.claimDailyBonus = claimDailyBonus;
window.showDailyBonusModal = showDailyBonusModal;
window.showSuccessModal = showSuccessModal;
window.updateDailyBonusStatus = updateDailyBonusStatus;
// ======================== рекл за вознагр
window.handleContinueWithAd = handleContinueWithAd;
window.clearTopRows = clearTopRows;
window.showContinueConfirmationModal = showContinueConfirmationModal;
// Бонусы
window.claimDailyBonus = claimDailyBonus;
window.claimEnhancedDailyBonus = claimEnhancedDailyBonus;
window.openDailyBonus = openDailyBonus;
window.showDailyBonusModal = showDailyBonusModal;
window.updateDailyBonusStatus = updateDailyBonusStatus;

// Замедление
window.showSlowDownModal = showSlowDownModal;
window.activateSlowDown = activateSlowDown;
window.applySlowDownEffect = applySlowDownEffect;

console.log('🔥 Тетрис Дарк загружен!');