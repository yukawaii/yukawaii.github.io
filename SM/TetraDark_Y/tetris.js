// Глобальные переменные
let gameOverModalShown = false;
let arenaWidth = 10;
let arenaHeight = 20;
let arena = [];
let soundMuted = false;  // Мьют для звуков (не музыки)
let musicMuted = false;  // Мьют только для музыки
let currentMusicTrack = null;
let gameOverAnimation = {    active: false,    startTime: 0,    duration: 4000, // 2 секунды моргания
    matrix: null,    pos: { x: 0, y: 0 }};
    // Переменные для пагинации
let currentScrollPage = 1;
const SCROLLS_PER_PAGE = 5;
const TOTAL_SCROLLS = 100;
let loadingScreenElement = null;
// Переменные для пагинации в коллекциях
let currentCollectionPage = 1;
let currentCollectionCategory = null;
const COLLECTION_ITEMS_PER_PAGE = 15;
const CATEGORY_ORDER = ['blocks', 'animals', 'plants', 'space'];
//console.log('=== Проверка глобальных функций ===');
//console.log('typeof notifyGameplayStart:', typeof notifyGameplayStart);
//console.log('typeof window.notifyGameplayStart:', typeof window.notifyGameplayStart);
//console.log('typeof loginYandex:', typeof loginYandex);
//console.log('typeof showYandexLeaderboard:', typeof showYandexLeaderboard);

// Увеличиваем количество клеток в ширь
function calculateOptimalArenaWidth() {
    const container = document.querySelector('.canvas-container');
    if (!container) return 14;    
    const availableWidth = container.getBoundingClientRect().width - 12;    
    if (availableWidth <= 0) return 14;    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);    
    // 🔥 НА ТЕЛЕФОНЕ — БОЛЬШЕ КЛЕТОК (чтобы не было пустот)
    if (isMobile) {
        if (availableWidth >= 500) return 18;  // 18 клеток
        if (availableWidth >= 400) return 16;  // 16 клеток
        return 14;                             
    }    
    // ПК — ещё больше клеток
    if (availableWidth >= 1000) return 24;
    if (availableWidth >= 800) return 22;
    if (availableWidth >= 600) return 20;
    return 22;
}

// Функция создания матрицы
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}
/*function resizeGameField() {

    const newWidth = calculateOptimalArenaWidth();
    if (newWidth === arenaWidth) return;    
    
   // console.log(`Ресайз: ${arenaWidth} → ${newWidth}`);    
    
    // Сохраняем старые данные
    const oldArena = arena;
    const oldWidth = arenaWidth;
    
    // Создаём новую арену
    arenaWidth = newWidth;
    const newArena = createMatrix(arenaWidth, arenaHeight);
    
    // Копируем блоки с центрированием
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
    
    // Корректируем позицию игрока
    if (player && player.matrix) {
        const matrixWidth = player.matrix[0].length;
        const maxX = arenaWidth - matrixWidth;
        if (player.pos.x > maxX) player.pos.x = maxX;
        if (player.pos.x < 0) player.pos.x = 0;
       // console.log(`Позиция игрока после ресайза: x=${player.pos.x}, maxX=${maxX}`);
    }
    
    if (typeof drawGame === 'function') drawGame();
}*/


// ======================== CANVAS И ОТРИСОВКА ========================
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

// Функция обновления размера canvas
// ===== УПРАВЛЕНИЕ РАЗМЕРОМ CANVAS =====
function updateCanvasSize() {
    const container = document.querySelector('.canvas-container');
    if (!container) {
        console.warn('Контейнер .canvas-container не найден');
        return;
    }
    
    const rect = container.getBoundingClientRect();
    const padding = 12;
    
    // Учитываем максимальную высоту окна (чтобы не вылезало за экран)
    const maxHeight = window.innerHeight * 0.85;
    const containerWidth = rect.width - padding;
    const containerHeight = Math.min(rect.height - padding, maxHeight);
    
    // Проверяем, что размеры валидные
    if (containerWidth <= 0 || containerHeight <= 0) {
        console.warn('Невалидные размеры контейнера:', containerWidth, containerHeight);
        return;
    }
    
    // Устанавливаем размеры canvas
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
  //  console.log(`Canvas размер: ${canvas.width}x${canvas.height}`);
}

// ======================== БОНУСЫ ========================
const BONUS_TYPES = {
    STAR: { symbol: '⭐', points: 3, color: '#FFD700', label: 'Звезда' },
    CLOVER: { symbol: '🍀', points: 2, color: '#22c55e', label: 'Клевер' },
    CANDY: { symbol: '🍬', points: 1, color: '#f472b6', label: 'Конфета' }
};

let activeBonus = null; // { type: 'STAR', x: 5, y: 10 }
let bonusSpawnCooldown = 0;
const BONUS_SPAWN_CHANCE = 0.15; // 15% шанс при очистке линии
const BONUS_MAX_COOLDOWN = 7; // Минимум 3 очищенных линии между бонусами
function spawnBonus() {
    // Проверяем, есть ли уже активный бонус
    if (activeBonus) return;
    
    // Проверяем кулдаун
    if (bonusSpawnCooldown > 0) {
        bonusSpawnCooldown--;
        return;
    }
    
    // Случайный выбор типа бонуса
    const types = ['STAR', 'CLOVER', 'CANDY'];
    const typeKey = types[Math.floor(Math.random() * types.length)];
    const bonus = BONUS_TYPES[typeKey];
    
    // 🔥 ОПРЕДЕЛЯЕМ ДИАПАЗОН ПОЯВЛЕНИЯ В ЗАВИСИМОСТИ ОТ СЛОЖНОСТИ
    let maxY;
    if (selectedDifficulty === 'easy') {
        maxY = arenaHeight - 5; // Почти всё поле (кроме 5 нижних строк)
    } else if (selectedDifficulty === 'medium') {
        maxY = arenaHeight - 8; // 2/3 поля
    } else { // hard
        maxY = 5; // Только верхние 5 строк (как сейчас)
    }
    
    // Ищем свободное место для бонуса
    let attempts = 0;
    let posX, posY;
    let placed = false;
    
    while (attempts < 50 && !placed) {
        posY = Math.floor(Math.random() * maxY);
        posX = Math.floor(Math.random() * arenaWidth);
        
        // Проверяем, что место свободно
        if (arena[posY] && arena[posY][posX] === 0) {
            placed = true;
        }
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
        console.log(`✨ Бонус появился: ${bonus.label} (${bonus.points} очков) на (${posX}, ${posY})`);
    }
}

// Цвета фигур
const colors = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];

function drawGame() {
    
    if (!canvas || canvas.width === 0) {
        updateCanvasSize();
    }    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;    
    if (canvasWidth <= 0 || canvasHeight <= 0) return;    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);    
      // 🔥 ДОБАВЛЯЕМ ПРОВЕРКУ НА ОЧЕНЬ МАЛЕНЬКИЙ ЭКРАН
    const isTiny = window.innerWidth <= 360 || window.innerHeight <= 400;
    // Верхняя панель
    let topPanelHeight = isMobile ? 42 : 80;
     if (isTiny) topPanelHeight = isMobile ? 30 : 50; // ещё меньше
    const gameAreaHeight = Math.max(50, canvasHeight - topPanelHeight);    
    // 🔥 НАСТРОЙКА УВЕЛИЧЕНИЯ ФИГУРОК
    const FIGURE_SCALE = 1.8;  // 1.8 = +80% к размеру    
    // Вычисляем базовый размер блока
    let blockSize = Math.min(canvasWidth / arenaWidth, gameAreaHeight / arenaHeight);    
    // 🔥 ПРИМЕНЯЕМ УВЕЛИЧЕНИЕ ДО проверки границ
    let scaledBlockSize = blockSize * FIGURE_SCALE;    
    // 🔥 ПРОВЕРЯЕМ, ПОМЕЩАЕТСЯ ЛИ УВЕЛИЧЕННЫЙ РАЗМЕР
    let finalBlockSize = scaledBlockSize;    
    // Проверка по ширине
    if (finalBlockSize * arenaWidth > canvasWidth) {
        finalBlockSize = canvasWidth / arenaWidth;
     //   console.log("Ограничение по ширине:", finalBlockSize);
    }    
    // Проверка по высоте
    if (finalBlockSize * arenaHeight > gameAreaHeight) {
        finalBlockSize = gameAreaHeight / arenaHeight;
     //   console.log("Ограничение по высоте:", finalBlockSize);
    }
    
    // 🔥 ИСПОЛЬЗУЕМ ФИНАЛЬНЫЙ РАЗМЕР
    blockSize = finalBlockSize;    
   // console.log(`arenaWidth: ${arenaWidth}, blockSize: ${blockSize.toFixed(1)}px, ширина поля: ${(blockSize * arenaWidth).toFixed(1)}px`);    
    // Центрируем поле
    const offsetX = (canvasWidth - (blockSize * arenaWidth)) / 2;
    const offsetY = topPanelHeight + (gameAreaHeight - (blockSize * arenaHeight)) / 2;    
    // Координаты игрового поля
    const arenaLeft = (canvasWidth - (blockSize * arenaWidth)) / 2;
    const arenaTop = topPanelHeight + (gameAreaHeight - (blockSize * arenaHeight)) / 2;
    const arenaWidthPx = blockSize * arenaWidth;
    const arenaHeightPx = blockSize * arenaHeight;
    // Очищаем фон
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvasWidth, canvasHeight);    
    // Фон игровой области
    context.fillStyle = '#0a0a0f';
    context.fillRect(0, topPanelHeight, canvasWidth, gameAreaHeight);    

    // 🔥 КИБЕРПАНК-ОБВОДКА ИГРОВОГО ПОЛЯ ==========
    context.save();
    
    // Тень для свечения (основное)
    context.shadowBlur = 15;
    context.shadowColor = '#22c55e';
    
    // Внешняя тёмно-зелёная обводка
    context.beginPath();
    context.rect(arenaLeft - 1, arenaTop - 1, arenaWidthPx + 2, arenaHeightPx + 2);
    context.strokeStyle = '#166534';
    context.lineWidth = Math.max(2, blockSize * 0.12);
    context.stroke();
    
    // Основная зелёная линия (неон)
    context.beginPath();
    context.rect(arenaLeft, arenaTop, arenaWidthPx, arenaHeightPx);
    context.strokeStyle = '#22c55e';
    context.lineWidth = Math.max(2.5, blockSize * 0.1);
    context.stroke();
    
    // Внутреннее свечение (блик)
    context.beginPath();
    context.rect(arenaLeft + 1, arenaTop + 1, arenaWidthPx - 2, arenaHeightPx - 2);
    context.strokeStyle = '#4ade80';
    context.lineWidth = 1.5;
    context.stroke();
    
    // Угловые акценты (киберпанк-эффект)
    const cornerLength = Math.min(15, blockSize * 1.5);
    context.strokeStyle = '#86efac';
    context.lineWidth = 2;
    
    // Верхний левый угол
    context.beginPath();
    context.moveTo(arenaLeft - 2, arenaTop + cornerLength);
    context.lineTo(arenaLeft - 2, arenaTop - 2);
    context.lineTo(arenaLeft + cornerLength, arenaTop - 2);
    context.stroke();
    
    // Верхний правый угол
    context.beginPath();
    context.moveTo(arenaLeft + arenaWidthPx + 2, arenaTop + cornerLength);
    context.lineTo(arenaLeft + arenaWidthPx + 2, arenaTop - 2);
    context.lineTo(arenaLeft + arenaWidthPx - cornerLength, arenaTop - 2);
    context.stroke();
    
    // Нижний левый угол
    context.beginPath();
    context.moveTo(arenaLeft - 2, arenaTop + arenaHeightPx - cornerLength);
    context.lineTo(arenaLeft - 2, arenaTop + arenaHeightPx + 2);
    context.lineTo(arenaLeft + cornerLength, arenaTop + arenaHeightPx + 2);
    context.stroke();
    
    // Нижний правый угол
    context.beginPath();
    context.moveTo(arenaLeft + arenaWidthPx + 2, arenaTop + arenaHeightPx - cornerLength);
    context.lineTo(arenaLeft + arenaWidthPx + 2, arenaTop + arenaHeightPx + 2);
    context.lineTo(arenaLeft + arenaWidthPx - cornerLength, arenaTop + arenaHeightPx + 2);
    context.stroke();
    
    // Дополнительное свечение (блики)
    context.shadowBlur = 25;
    context.shadowColor = '#22c55e';
    context.beginPath();
    context.rect(arenaLeft, arenaTop, arenaWidthPx, arenaHeightPx);
    context.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    context.lineWidth = 1;
    context.stroke();
    
    context.shadowBlur = 0;
    context.restore();

// ========== РИСУЕМ АРЕНУ ==========
for (let y = 0; y < arenaHeight; y++) {
    for (let x = 0; x < arenaWidth; x++) {
        const value = arena[y][x];
        if (value !== 0 && value !== 'bonus') {
            const posX = offsetX + x * blockSize;
            const posY = offsetY + y * blockSize;
            
            let fillColor;
            if (typeof value === 'string' && value.startsWith('#')) {
                fillColor = value;
            } else {
                fillColor = colors[value] || '#FFF';
            }
            
            context.fillStyle = fillColor;
            context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
            context.strokeStyle = "rgba(0,0,0,0.3)";
            context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
            
        } else if (value === 'bonus') {
            const posX = offsetX + x * blockSize;
            const posY = offsetY + y * blockSize;
            
            // Золотой фон с анимацией
            const pulse = Math.sin(Date.now() / 300) * 0.1 + 0.2;
            context.fillStyle = `rgba(255, 215, 0, ${pulse})`;
            context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
            context.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            context.lineWidth = 2;
            context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
            
            // Иконка бонуса
            let symbol = '⭐';
            if (activeBonus && activeBonus.x === x && activeBonus.y === y) {
                symbol = activeBonus.symbol;
            }
            context.fillStyle = '#000';
            context.font = `${blockSize * 0.55}px sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(symbol, posX + blockSize/2, posY + blockSize/2);
        }
    }
}
// ========== РИСУЕМ ТЕКУЩУЮ ФИГУРУ ==========
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
                if ((isTetra || isPenta) && player.matrix._color) {
                    fillColor = player.matrix._color;
                } else {
                    fillColor = colors[value] || '#FFF';
                }
                
                context.fillStyle = fillColor;
                context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                context.strokeStyle = "rgba(0,0,0,0.4)";
                context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
            }
        }
    }
}  
    // ========== СТАТИСТИКА ==========
// ========== СТАТИСТИКА ==========
context.fillStyle = '#111';
context.fillRect(0, 0, canvasWidth, topPanelHeight);
const t = window.getText || (key => key);

let titleFontSize = isMobile ? Math.min(12, canvasWidth / 25) : Math.min(22, canvasWidth / 20);
let valueFontSize = isMobile ? Math.min(18, canvasWidth / 16) : Math.min(36, canvasWidth / 12);
if (isTiny) {
    titleFontSize *= 0.7;
    valueFontSize *= 0.7;
}

// Определяем отступы для текста и чисел
const labelY = isTiny ? 12 : (isMobile ? 16 : 30);
const valueY = isTiny ? 22 : (isMobile ? 36 : 65);

context.textAlign = "center";

// Score
context.fillStyle = '#888';
context.font = `${titleFontSize}px Russo One`;
context.fillText(t('score'), canvasWidth * 0.12, labelY);
context.fillStyle = '#fff';
context.font = `${valueFontSize}px Russo One`;
context.fillText(player ? player.score : 0, canvasWidth * 0.12, valueY);

// Lines
context.fillStyle = '#888';
context.font = `${titleFontSize * 0.8}px Russo One`;
context.fillText(t('lines'), canvasWidth * 0.32, labelY);
context.fillStyle = '#fff';
context.font = `${valueFontSize}px Russo One`;
context.fillText(player ? player.lines : 0, canvasWidth * 0.32, valueY);

// Level
context.fillStyle = '#888';
context.font = `${titleFontSize * 0.8}px Russo One`;
context.fillText(t('level'), canvasWidth * 0.52, labelY);
context.fillStyle = '#fff';
context.font = `${valueFontSize}px Russo One`;
context.fillText(player ? player.level : 1, canvasWidth * 0.52, valueY);
    
// ========== СЛЕДУЮЩАЯ ФИГУРА ==========
if (player && player.nextMatrix) {
    const nextX = canvasWidth * 0.78;
    const nextY = isMobile ? 5 : 12;
    let blockNext = Math.min(isMobile ? 16 : 20, canvasWidth / 18);
     if (isTiny) blockNext = Math.min(10, canvasWidth / 22); // сильно уменьшаем
    
    context.fillStyle = '#888';
    context.font = `${Math.max(9, titleFontSize * 0.6)}px Russo One`;
   // context.fillText(t('next'), nextX + blockNext, nextY - 2);  // ← След
    
    const isTetra = player.isTetraMode;
    const isPenta = player.isPentaMode;
    
    for (let y = 0; y < player.nextMatrix.length; y++) {
        for (let x = 0; x < player.nextMatrix[y].length; x++) {
            const value = player.nextMatrix[y][x];
            if (value !== 0) {
                let fillColor;
                if ((isTetra || isPenta) && player.nextMatrix._color) {
                    fillColor = player.nextMatrix._color;
                } else {
                    fillColor = colors[value] || '#FFF';
                }
                
                context.fillStyle = fillColor;
                context.fillRect(nextX + x * blockNext, nextY + y * blockNext, blockNext - 1, blockNext - 1);
                context.strokeStyle = "rgba(0,0,0,0.3)";
                context.strokeRect(nextX + x * blockNext, nextY + y * blockNext, blockNext - 1, blockNext - 1);
            }
        }
    }
}
}

// ======================== ОСНОВНЫЕ ПЕРЕМЕННЫЕ ========================
let isGameStarted = false;
let isGameOver = false;
let audioInitialized = false;

// Игрок
const player = {
    pos: { x: 5, y: 0 },
    matrix: null,
    nextMatrix: null,
    score: 0,
    lines: 0,
    level: 1,
    spins: 0,
    crazySpins: false
};
// Состояние игры
const gameState = {
    initialized: false,
    paused: false,
    introSongPlayed: false,
    gameOver: false
};
// Тайминги для падения
let dropCounter = 0;
let dropInterval = 1000;    
    // 🎯 СКОРОСТЬ ПАДЕНИЯ И МНОЖИТЕЛЬ ОЧКОВ
    let difficultyMultiplier = 1;
let lastTime = 0;
let animationFrameId = null;
// Фигуры
const pieces = 'ILJOTSZ';
// ======================== ФИГУРКИ ДЛЯ РЕЖИМА ТЕТРА ========================
const tetraPieces = {
    I: { shape: [[1, 1, 1]], color: '#00f5ff' },      // палка 3 блока — голубой
    L: { shape: [[1, 0], [1, 1]], color: '#ff8c00' }, // уголок — оранжевый
    J: { shape: [[0, 1], [1, 1]], color: '#4169e1' }, // зеркальный уголок — синий
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff4500' }, // зигзаг — красный
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#32cd32' }, // зеркальный зигзаг — зелёный
    O: { shape: [[1, 1], [1, 1]], color: '#ffd700' }, // квадрат — жёлтый
    T: { shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: '#9370db' } // крест — фиолетовый
};

// Список ключей для случайного выбора
const tetraKeys = ['I', 'L', 'J', 'Z', 'S', 'O', 'T'];
// ======================== ФИГУРКИ ДЛЯ РЕЖИМА ПЕНТА ========================
const pentaPieces = {
    // Прямая палка из 5 блоков
    I: {         shape: [[1, 1, 1, 1, 1]],         color: '#00f5ff'     },
    // L-образная (уголок) — зелёная
    L: {         shape: [[1, 0], [1, 0], [1, 0], [1, 1]],         color: '#22c55e'     },
    // J-образная (зеркальный уголок)
    J: {         shape: [[0, 1], [0, 1], [0, 1], [1, 1]],         color: '#4169e1'     },
    // Z-образная (зигзаг)
    Z: {         shape: [[1, 1, 0], [0, 1, 0], [0, 1, 1]],         color: '#ff4500'     },
    // S-образная (зеркальный зигзаг)
    S: {         shape: [[0, 1, 1], [0, 1, 0], [1, 1, 0]],         color: '#32cd32'     },
    // T-образная
    T: {         shape: [[1, 1, 1], [0, 1, 0], [0, 1, 0]],         color: '#9370db'     },
    // O-образная (квадрат 2x2 + один блок) — или "P"-фигура
    P: {         shape: [[1, 1], [1, 1], [1, 0]],         color: '#ffd700'     }
};

const pentaKeys = ['I', 'L', 'J', 'Z', 'S', 'T', 'P'];

function createPentaPiece() {
    const key = pentaKeys[Math.floor(Math.random() * pentaKeys.length)];
    const piece = pentaPieces[key];
    const matrix = piece.shape.map(row => [...row]);
    matrix._color = piece.color;
    matrix._key = key;
   // console.log('Created Penta piece:', key, piece.color); // Для отладки
    return matrix;
}

function rotatePentaMatrix(matrix) {
    const key = matrix._key;
    
  /* запрет на вращение
   if (key === 'P') {
        const newMatrix = matrix.map(row => [...row]);
        newMatrix._color = matrix._color;
        newMatrix._key = matrix._key;
        return newMatrix;
    }*/
    
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

// Создание фигурки для режима Тетра
function createTetraPiece() {
    const key = tetraKeys[Math.floor(Math.random() * tetraKeys.length)];
    const piece = tetraPieces[key];
    // Копируем матрицу, чтобы не менять оригинал
    const matrix = piece.shape.map(row => [...row]);
    // Сохраняем цвет для отрисовки
    matrix._color = piece.color;
    matrix._key = key;
    return matrix;
}
// Вращение матрицы для режима Тетра (с учётом особенностей фигур)
function rotateTetraMatrix(matrix) {
    const key = matrix._key;
    
    // Квадрат O и крест T не вращаются
    if (key === 'O' || key === 'T') {
        const newMatrix = matrix.map(row => [...row]);
        newMatrix._color = matrix._color;  
        newMatrix._key = matrix._key;     
        return newMatrix;
    }
    
    // Для остальных фигур — стандартное вращение на 90 градусов
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
// Проверка коллизии для режима Тетра (с учётом особенностей фигур)
function collideTetra(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0) {
                const arenaY = y + o.y;
                const arenaX = x + o.x;
                // Проверяем выход за границы
                if (arenaY < 0 || arenaY >= arenaHeight || arenaX < 0 || arenaX >= arenaWidth) {
                    return true;
                }
                // Проверяем столкновение с блоками (бонус не считается препятствием)
                const cell = arena[arenaY]?.[arenaX];
                if (cell !== 0 && cell !== 'bonus') {
                    return true;
                }
            }
        }
    }
    return false;
}

// Создание фигуры по типу
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

// Инициализация начального состояния
function initGame() {
    arena = createMatrix(arenaWidth, arenaHeight);
    player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.nextMatrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.pos.x = Math.floor((arenaWidth - player.matrix[0].length) / 2);
    player.pos.y = 0;
    player.score = 0;
    player.lines = 0;
    player.level = 1;
}
// ======================== ИГРОВАЯ ЛОГИКА ========================

function collide(arena, player) {
    if (player.isTetraMode) {
        return collideTetra(arena, player);
    }
    
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0) {
                const arenaY = y + o.y;
                const arenaX = x + o.x;
                if (arenaY < 0 || arenaY >= arenaHeight || arenaX < 0 || arenaX >= arenaWidth) {
                    return true;
                }
                // БОНУС НЕ СЧИТАЕТСЯ ПРЕПЯТСТВИЕМ
                const cell = arena[arenaY]?.[arenaX];
                if (cell !== 0 && cell !== 'bonus') {
                    return true;
                }
            }
        }
    }
    return false;
}
// Слияние фигуры с ареной
function merge(arena, player) {
    // Режим Тетра или Пента — сохраняем цвет
    if (player.isTetraMode || player.isPentaMode) {
        // 🔥 ПОЛУЧАЕМ ЦВЕТ ИЗ МАТРИЦЫ
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
    
    // Классика
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

// Удаление заполненных линий
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
            // Удаляем строку — заполняем нулями (не важно, что было)
            const row = arena.splice(y, 1)[0];
            arena.unshift(new Array(arenaWidth).fill(0));
            rowsCleared++;
            player.lines++;
           // За каждую линию даём очки в зависимости от сложности
                    let pointsPerLine;
                    if (selectedDifficulty === 'easy') {
                        pointsPerLine = 1;
                    } else if (selectedDifficulty === 'hard') {
                        pointsPerLine = 3;
                    } else {
                        pointsPerLine = 2;}

                    player.score += rowMultiplier * pointsPerLine;
                    updateHighScoreDisplay();
            rowMultiplier *= 2;
            y++;
        }
    }
     // 🔥 СПАВНИМ БОНУС ПОСЛЕ ОЧИСТКИ ЛИНИЙ
    if (rowsCleared > 0) {
        // Шанс на появление бонуса
        if (Math.random() < BONUS_SPAWN_CHANCE && !activeBonus) {
            spawnBonus();
        }
        // Уменьшаем кулдаун
        if (bonusSpawnCooldown > 0) {
            bonusSpawnCooldown--;
        }
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



// Падение фигуры
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        checkBonusCollision();  // ← Проверяем бонус перед playerReset
        playerReset();
        arenaSweep();
        if (typeof gameAudio !== 'undefined') {
            gameAudio.playOneShot('collide', 0.05);
        }
    }
    dropCounter = 0;
}

// Движение влево/вправо
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
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
    
    // Проверяем коллизию при спавне
    if (collide(arena, player)) {
        // 🔥 НЕ ВЫЗЫВАЕМ endGame() СРАЗУ!
        // Запускаем анимацию проигрыша
        startGameOverAnimation();
        return;
    }
}

// Поворот матрицы
function rotateMatrix(matrix, dir) {
    // Транспонирование
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    // Отражение
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Поворот фигуры
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    
    // Режим Тетра
    if (player.isTetraMode) {
        const originalMatrix = player.matrix.map(row => [...row]);
        const rotatedMatrix = rotateTetraMatrix(player.matrix);
        player.matrix = rotatedMatrix;
        const maxX = arenaWidth - player.matrix[0].length;
        if (player.pos.x < 0) player.pos.x = 0;
        if (player.pos.x > maxX) player.pos.x = maxX;
        if (collideTetra(arena, player)) {
            player.matrix = originalMatrix;
            return;
        }
        if (typeof gameAudio !== 'undefined') gameAudio.playOneShot('rotate', 0.15);
        return;
    }
    
    // Режим Пента
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
    
    // Классика
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
// ========== ФУНКЦИЯ ПОВОРОТА МАТРИЦЫ (добавьте в tetris.js) ==========

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}
// ======================== БОНУСЫ ========================
function checkBonusCollision() {
    if (!activeBonus) return false;
    
    for (let y = 0; y < player.matrix.length; y++) {
        for (let x = 0; x < player.matrix[y].length; x++) {
            const arenaY = player.pos.y + y;
            const arenaX = player.pos.x + x;
            
            if (arena[arenaY] && arena[arenaY][arenaX] === 'bonus') {
                // Забираем бонус
                const bonus = activeBonus;
                arena[arenaY][arenaX] = 0;  // ← СНАЧАЛА УДАЛЯЕМ ИЗ АРЕНЫ                
                // Начисляем очки
                player.score += bonus.points;  
                updateHighScoreDisplay();              
                // Показываем уведомление
                showBonusNotification(bonus);                
                // Сбрасываем активный бонус
                activeBonus = null;
                bonusSpawnCooldown = BONUS_MAX_COOLDOWN;
                
                if (typeof gameAudio !== 'undefined') {
                    gameAudio.playOneShot('levelup', 0.15);
                }
                
                return true;
            }
        }
    }
    return false;
}
function showBonusNotification(bonus) {
    const t = window.getText || (key => key);
    const bonusText = t('bonus') || 'Бонус!';
    
    const bonusLabels = {
        'STAR': { ru: 'Звезда', en: 'Star', tr: 'Yıldız' },
        'CLOVER': { ru: 'Клевер', en: 'Clover', tr: 'Yonca' },
        'CANDY': { ru: 'Конфета', en: 'Candy', tr: 'Şeker' }
    };
    const lang = window.gameLanguage || 'ru';
    const label = bonusLabels[bonus.type]?.[lang] || bonus.type || 'Бонус';
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: clamp(10px, 3vh, 30px);
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: rgba(20, 20, 30, 0.92);
        border: 2px solid ${bonus.color || '#FFD700'};
        border-radius: clamp(12px, 3vh, 20px);
        padding: clamp(10px, 2vh, 16px) clamp(16px, 4vw, 30px);
        display: flex;
        align-items: center;
        gap: clamp(10px, 2vw, 16px);
        z-index: 99999;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), 0 0 40px ${bonus.color || '#FFD700'}20;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        font-family: 'Russo One', sans-serif;
        pointer-events: none;
        max-width: 90vw;
    `;
    
    notification.innerHTML = `
        <span style="font-size: clamp(24px, 5vw, 32px); line-height: 1;">${bonus.symbol || '⭐'}</span>
        <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <span style="color: #fff; font-size: clamp(14px, 3vw, 20px); letter-spacing: 1px; text-transform: uppercase;">
                ${bonusText}
            </span>
            <span style="color: ${bonus.color || '#FFD700'}; font-size: clamp(10px, 1.8vw, 14px); opacity: 0.8;">
                ${label}
            </span>
        </div>
        <span style="color: ${bonus.color || '#FFD700'}; font-size: clamp(16px, 3vw, 24px); font-weight: bold;">
            +${bonus.points || 0}
        </span>
    `;
    
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-30px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 400);
    }, 2000);
}
// ========== МГНОВЕННОЕ ОБНОВЛЕНИЕ РЕКОРДА ==========
function updateHighScoreDisplay() {
    console.log('updateHighScoreDisplay вызвана, текущий счёт:', player.score, 'рекорд:', localStorage.getItem('localHighscore'));
    if (typeof player === 'undefined' || !player) return;
    const currentScore = player.score;
    if (currentScore <= 0) return;

    // Проверяем локальный рекорд
    const localHighscore = parseInt(localStorage.getItem('localHighscore') || '0');
    if (currentScore > localHighscore) {
        // Обновляем локальный рекорд
        localStorage.setItem('localHighscore', String(currentScore));

        // ✅ Мгновенно обновляем текст на экране
        const t = window.getText || (key => key);
        const recordLabel = t('record') || 'Рекорд';
        updateRecordText(`${recordLabel}: ${currentScore}`);

        // Асинхронно сохраняем в облако (если SDK есть и игрок авторизован)
        if (typeof saveYandexScore === 'function') {
            saveYandexScore(currentScore);
        }
    }
}
// ======================== АУДИО ========================

function initAudioOnFirstInteraction() {
    if (!audioInitialized && typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
        gameAudio.resumeContext();
        audioInitialized = true;
      //  console.log('Аудио контекст активирован');
    }
}

// Переключение звуков (эффекты)
function toggleSound() {
    if (typeof gameAudio === 'undefined') return;
    
    soundMuted = !soundMuted;
    gameAudio.setMuted(soundMuted);
    
    // Обновляем иконку звука
    updateSoundIcon();
}

// Переключение музыки
function toggleMusic() {
    if (typeof gameAudio === 'undefined') return;
    
    musicMuted = !musicMuted;
    gameAudio.setMusicMuted(musicMuted);
    
    // Обновляем иконку музыки
    updateMusicIcon();
    
    // Если музыку включили и игра идёт — запускаем
    if (!musicMuted && isGameStarted && !isGameOver && !gameState.paused) {
        playBackgroundMusic();
    }
}

// Обновление иконки звука
function updateSoundIcon() {
    const soundIcons = document.querySelectorAll('#sound-icon, #menu-sound-icon, #sound-btn svg');
    const isMuted = soundMuted;
    
    soundIcons.forEach(icon => {
        if (isMuted) {
            icon.innerHTML = `
                <path fill="#8899a6" d="M7 10s-2 0-2 2v12c0 2 2 2 2 2h6l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/>
                <path fill="#ccd6dd" d="m13 26l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/>
                <path fill="#8899a6" d="M28.709 25.959a.998.998 0 0 1-.636-1.772A7.98 7.98 0 0 0 31 18a7.97 7.97 0 0 0-2.988-6.236a1 1 0 1 1 1.254-1.558A9.96 9.96 0 0 1 33 18a9.97 9.97 0 0 1-3.657 7.731a1 1 0 0 1-.634.228"/>
            `;
        } else {
            icon.innerHTML = `
                <path fill="#8899a6" d="M2 10s-2 0-2 2v12c0 2 2 2 2 2h6l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/>
                <path fill="#ccd6dd" d="m8 26l8 8s1 1 2 1h1s1 0 1-1V2s0-1-1-1h-1c-1 0-2 1-2 1l-8 8z"/>
                <path fill="#8899a6" d="M29 32.019a.945.945 0 0 1-.615-1.666c3.603-3.071 5.668-7.551 5.668-12.29s-2.066-9.219-5.669-12.29a.947.947 0 0 1 1.229-1.44a18.02 18.02 0 0 1 6.333 13.73a18.02 18.02 0 0 1-6.332 13.729a.94.94 0 0 1-.614.227"/>
                <path fill="#8899a6" d="M26.27 28.959a.927.927 0 0 1-.592-1.645a12.04 12.04 0 0 0 4.394-9.315a12.05 12.05 0 0 0-4.311-9.245a.929.929 0 0 1 1.196-1.422a13.9 13.9 0 0 1 4.973 10.667c0 4.172-1.848 8.089-5.069 10.746a.92.92 0 0 1-.591.214"/>
                <path fill="#8899a6" d="M23.709 25.959a.998.998 0 0 1-.636-1.772A7.98 7.98 0 0 0 26 18a7.97 7.97 0 0 0-2.988-6.236a1 1 0 1 1 1.254-1.558A9.96 9.96 0 0 1 28 18a9.97 9.97 0 0 1-3.657 7.731a1 1 0 0 1-.634.228"/>
            `;
        }
    });
}

// Обновление иконки музыки
function updateMusicIcon() {
    const musicIcons = document.querySelectorAll('#music-icon, #menu-music-icon, #music-btn svg');
    const isMuted = musicMuted;
    
    musicIcons.forEach(icon => {
        if (isMuted) {
            icon.innerHTML = `
                <g fill="none" fill-rule="evenodd" clip-rule="evenodd">
                    <path fill="#8fbffa" d="M12.734.33a1.2 1.2 0 0 0-.55.019L4.605 2.452a1.22 1.22 0 0 0-.897 1.167V9.06a2.463 2.463 0 1 0 1.488 2.09V5.162l.827.736l6.205-1.745v2.458a2.463 2.463 0 1 0 1.488 2.09V1.518A1.216 1.216 0 0 0 12.734.33"/>
                    <path fill="#2859c5" d="M.22.22a.75.75 0 0 0 0 1.06l12.5 12.5a.75.75 0 1 0 1.06-1.06L1.28.22a.75.75 0 0 0-1.06 0"/>
                </g>
            `;
        } else {
            icon.innerHTML = `
                <path fill="#8fbffa" fill-rule="evenodd" d="M12.781.23a1.2 1.2 0 0 0-.555.02h-.006L4.587 2.369a1.23 1.23 0 0 0-.905 1.177V9.04a2.477 2.477 0 1 0 1.5 2.277V6.076l7.09-1.97V6.57a2.477 2.477 0 1 0 1.5 2.345V1.403a1.226 1.226 0 0 0-.99-1.172Z" clip-rule="evenodd"/>
            `;
        }
    });
}

function getMusicTrack() {
    const isClassic = selectedMode === 'classic';
    const difficulty = selectedDifficulty || 'medium';
    
    if (isClassic && difficulty === 'easy') return '2';
    else if (isClassic && difficulty === 'medium') return '4';
    else if (isClassic && difficulty === 'hard') return '1';
    else if (!isClassic && difficulty === 'easy') return '2';
    else if (!isClassic && difficulty === 'medium') return '1';
    else return '1'; // hard для Тетра/Пента
}

function playBackgroundMusic() {
    if (musicMuted || !gameAudio || !gameAudio.initialized) return;
    const track = getMusicTrack();
    currentMusicTrack = track;
    gameAudio.playMusic(track, 0.15);
}

function initAudio() {
    if (!audioInitialized) {
        initAudioOnFirstInteraction();
        return;
    }
    
    if (!gameAudio || !gameAudio.initialized) {
      //  console.log('Аудио не инициализировано, пробуем...');
        gameAudio.init().then(() => {
            if (!soundMuted && !musicMuted) {
                playBackgroundMusic();
            }
        }).catch(e => console.log('Аудио не загружено:', e));
        return;
    }
    
    if (!soundMuted && !musicMuted) {
        playBackgroundMusic();
    }
}

function stopSounds() {
    if (typeof gameAudio !== 'undefined') {
        gameAudio.stopLoop();
         gameAudio.stopMusic();

    }
}

// ======================== УПРАВЛЕНИЕ ИГРОЙ ========================

function pauseGame() {
    // Проверяем, не на паузе ли уже
    if (gameState.paused) {
        console.log('pauseGame: уже на паузе, пропускаем');
        return;
    }
    
    console.log('pauseGame: ставлю игру на паузу');
    gameState.paused = true;
    
    // Останавливаем аудио контекст
    if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
        gameAudio.audioContext.suspend();
    }
    
    // Уведомляем платформу о паузе
    if (typeof window.notifyGameplayStop === 'function') {
        window.notifyGameplayStop();
        console.log('✅ notifyGameplayStop вызван');
    } else {
        console.log('❌ notifyGameplayStop не функция');
    }
    
    // Обновляем текст кнопки
    updatePauseButtonText();
}

function resumeGame() {
    if (!gameState.paused) {
        console.log('resumeGame: игра не на паузе, пропускаем');
        return;
    }
    
    console.log('resumeGame: снимаю паузу');
    gameState.paused = false;
    lastTime = performance.now();
    
    // Возобновляем аудио контекст
    if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
        gameAudio.audioContext.resume().then(() => {
            console.log('Аудио контекст возобновлён');
        }).catch(err => {
            console.log('Ошибка возобновления аудио:', err);
        });
    }
    
    // Уведомляем платформу о продолжении
    if (typeof window.notifyGameplayStart === 'function') {
        window.notifyGameplayStart();
        console.log('✅ notifyGameplayStart вызван');
    } else {
        console.log('⚠️ window.notifyGameplayStart не функция');
    }
    
    // Обновляем текст кнопки
    updatePauseButtonText();
    
    // Запускаем музыку если была
    if (!musicMuted && gameState.introSongPlayed && typeof gameAudio !== 'undefined') {
       if (currentMusicTrack && !musicMuted) {
    gameAudio.playMusic(currentMusicTrack, 0.15);
}
    }
    
    // Продолжаем игровой цикл
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    update();
}

function endGame() {
  console.log("endGame вызван");
   if (gameOverModalShown) {           return;    }
  if (gameOverAnimation.active) return;
  
  if (selectedDifficulty) {    savePlayedDifficulty();
  }
  
  isGameOver = true;
  isGameStarted = false;
  gameState.over = true;
  gameState.initialized = false;
  gameState.paused = false;
  
  stopSounds();
  if (typeof gameAudio !== 'undefined' && gameAudio.playOneShot) {
    gameAudio.playOneShot('gameover', 0.3);
  }
  if (typeof gameAudio !== 'undefined') {
    gameAudio.stopMusic();
  }
  
  if (typeof player !== 'undefined' && typeof saveYandexScore === 'function') {
    saveYandexScore(player.score);
  }
  
  // ✅ Добавляем принудительное обновление отображения рекорда  (и локально, и в облако)
  if (typeof updateHighScoreDisplay === 'function') {
    updateHighScoreDisplay();
  }
  
  if (typeof saveTotalProgress === 'function') {
    saveTotalProgress();
  }
  
  showGameOverModal(player.score);
  updatePauseButtonText();
  if (typeof drawGame === 'function') drawGame();
}

// ======================== МОДАЛЬНОЕ ОКНО ОКОНЧАНИЯ ИГРЫ ========================

function showGameOverModal(score) {
    const modal = document.getElementById('gameover-modal');
    if (!modal) return;

    // Если модалка уже видна, просто обновляем счёт и не перестраиваем заново
    if (modal.style.display === 'flex') {
        const scoreEl = document.getElementById('gameover-score');
        if (scoreEl) scoreEl.textContent = score;
        return;
    }

    // Если модалка скрыта – показываем и обновляем содержимое
    const scoreEl = document.getElementById('gameover-score');
    if (scoreEl) scoreEl.textContent = score;

    // Находим или создаём контейнер для кнопок
    let buttonsContainer = modal.querySelector('.gameover-buttons-container');
    if (!buttonsContainer) {
        // Если контейнера нет — создаём
      const contentDiv = modal.querySelector('.modal-content');
        if (contentDiv) {
            // Удаляем старые кнопки, если они есть
            const oldBtns = contentDiv.querySelectorAll('button');
            oldBtns.forEach(btn => btn.remove());

            // Создаём контейнер для кнопок
            buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'gameover-buttons-container';
            buttonsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-top: 16px;';

            // Создаём кнопки
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
            continueBtn.innerHTML = '📺 Продолжить за рекламу';
            continueBtn.onclick = handleContinueWithAd;

            const newGameBtn = document.createElement('button');
            newGameBtn.style.cssText = `
                width: 100%; padding: 14px; font-size: 16px;
                font-family: 'Russo One', sans-serif; text-transform: uppercase;
                letter-spacing: 2px; color: #fff;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                border: none; border-radius: 14px; cursor: pointer;
                transition: all 0.2s; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
            `;
            newGameBtn.innerHTML = '<span data-i18n="newGame">Новая игра</span>';
            newGameBtn.onclick = closeGameOverModal;

            const menuBtn = document.createElement('button');
            menuBtn.style.cssText = `
                width: 100%; padding: 14px; font-size: 16px;
                font-family: 'Russo One', sans-serif; text-transform: uppercase;
                letter-spacing: 2px; color: #94a3b8;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 14px; cursor: pointer; transition: all 0.2s;
            `;
            menuBtn.innerHTML = '<span data-i18n="toMenu">В меню</span>';
            menuBtn.onclick = closeGameOverModalAndMenu;

            buttonsContainer.appendChild(continueBtn);
            buttonsContainer.appendChild(newGameBtn);
            buttonsContainer.appendChild(menuBtn);

            contentDiv.appendChild(buttonsContainer);
        }
    }

    modal.style.display = 'flex';
    if (typeof updateInterfaceLanguage === 'function') updateInterfaceLanguage();
}
function closeGameOverModal() {
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.style.display = 'none';
    
    // Запускаем новую игру
    if (typeof selectDifficulty === 'function') {
        // Возвращаемся в меню выбора сложности
        const diffModal = document.getElementById('difficulty-modal');
        if (diffModal) diffModal.style.display = 'flex';
    }
}

function closeGameOverModalAndMenu() {
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.style.display = 'none';
    
    // Возвращаемся в главное меню
    if (typeof returnToMenu === 'function') {
        returnToMenu();
    }
}

function startGame() {
    // console.log("startGame вызван");
    
    // 🎯 СОХРАНЯЕМ СЛОЖНОСТЬ СРАЗУ В НАЧАЛЕ
    if (selectedDifficulty) {
        savePlayedDifficulty();
        console.log(`✅ Сложность сохранена: ${selectedDifficulty}`);
    }
    
    
    // Загружаем рекорд из localStorage
    if (typeof loadLocalHighScore === 'function') {
        loadLocalHighScore();
    }

    if (typeof window.notifyGameplayStart === 'function') {
        window.notifyGameplayStart();
    }
    
    // Обновляем размер canvas
    updateCanvasSize();
    
 /*   // 🎯 ОПРЕДЕЛЯЕМ ШИРИНУ ПОЛЯ В ЗАВИСИМОСТИ ОТ УСТРОЙСТВА
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        arenaWidth = 10;
    } else {
        if (selectedDifficulty === 'easy') {
            arenaWidth = 12;
        } else if (selectedDifficulty === 'hard') {
            arenaWidth = 16;
        } else {
            arenaWidth = 14;
        }
    }*/
// Стало:
if (selectedDifficulty === 'easy') arenaWidth = 12;
else if (selectedDifficulty === 'hard') arenaWidth = 16;
else arenaWidth = 14;

    arenaHeight = 18;

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
    
    // Очищаем арену
    arena = createMatrix(arenaWidth, arenaHeight);
    for (let i = 0; i < arenaHeight; i++) {
        for (let j = 0; j < arenaWidth; j++) {
            arena[i][j] = 0;
        }
    }
    
    // Сбрасываем бонусы
    activeBonus = null;
    bonusSpawnCooldown = 0;
    
    // Сбрасываем состояние
    isGameStarted = true;
    isGameOver = false;
    gameState.over = false;
    gameState.paused = false;
    gameState.initialized = true;
    gameState.introSongPlayed = false;
    
    // Сбрасываем текст кнопки на "Пауза"
    updatePauseButtonText();
    
    // Сбрасываем игрока
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    player.spins = 0;
    player.crazySpins = false;
    player.isTetraMode = (selectedMode === 'tetra');
    
    // Создаём фигурки в зависимости от режима
    if (selectedMode === 'tetra') {
        player.matrix = createTetraPiece();
        player.nextMatrix = createTetraPiece();
        player.isTetraMode = true;
        player.isPentaMode = false;
    } else if (selectedMode === 'penta') {
        player.matrix = createPentaPiece();
        player.nextMatrix = createPentaPiece();
        player.isTetraMode = false;
        player.isPentaMode = true;
    } else {
        player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
        player.nextMatrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
        player.isTetraMode = false;
        player.isPentaMode = false;
    }
    
    // Рассчитываем позицию по центру
    const matrixWidth = player.matrix[0].length;
    const maxX = arenaWidth - matrixWidth;
    player.pos.x = Math.floor(maxX / 2);
    player.pos.y = 0;

    // Запускаем звуки
    if (typeof gameAudio !== 'undefined' && gameAudio.initialized && !soundMuted && !musicMuted) {
        playBackgroundMusic();
    }
    
    console.log(`Старт игры: поле ${arenaWidth}x${arenaHeight}, сложность ${selectedDifficulty}, режим ${selectedMode}, интервал ${dropInterval}ms`);
    
    if (collide(arena, player)) {
        console.error("Странно: коллизия при старте на пустом поле!");
    }
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    lastTime = 0;
    dropCounter = 0;
    update();
    if (typeof drawGame === 'function') drawGame();
  
    console.log(`Игра началась на поле ${arenaWidth}x${arenaHeight}`);
}
//========================конец старт гейм

function startGameWithAudio() {
    console.log("startGameWithAudio вызван");
    
    // Активируем аудио контекст (это быстро)
    if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
        gameAudio.resumeContext();
    }
    
    // Сразу запускаем игру, не дожидаясь загрузки аудио
    startGame();
    
    // Аудио загружаем в фоне, если ещё не загружено
    if (typeof gameAudio !== 'undefined' && !gameAudio.initialized) {
        gameAudio.init()
            .then(() => {
                // 🔥 ВОТ ЗДЕСЬ — ПОСЛЕ ЗАГРУЗКИ ЗАПУСКАЕМ МУЗЫКУ!
                console.log('✅ Аудио загружено, запускаем музыку');
                if (!musicMuted && !soundMuted) {
                    playBackgroundMusic();
                }
            })
            .catch(e => console.log('Аудио не загружено:', e));
    } else if (typeof gameAudio !== 'undefined' && gameAudio.initialized) {
        // Если аудио уже загружено — сразу запускаем
        if (!musicMuted && !soundMuted) {
            playBackgroundMusic();
        }
    }
}

// Игровой цикл
function update(time = 0) {
    // Проверяем, активна ли анимация проигрыша
    if (gameOverAnimation.active) {
        drawGameOverAnimation();
        return;
    }
    
    // 🔥 ПРОВЕРКА НА ПАУЗУ — ДОЛЖНА ВЫПОЛНЯТЬСЯ ПЕРВОЙ
    if (gameState.paused) {
        // Рисуем затемнение и сообщение о паузе
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
    
    // Конец игры
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
    // Основной игровой процесс
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    
    // 🔥 ИСПОЛЬЗУЕМ ГЛОБАЛЬНУЮ ПЕРЕМЕННУЮ dropInterval
    // Чем меньше значение, тем быстрее падают фигуры
    const currentInterval = Math.max(80, dropInterval - (player.level * 35));
    
    if (dropCounter > currentInterval) {
        playerDrop();
        if (typeof drawGame === 'function') drawGame();
    }
    
    if (typeof drawGame === 'function') drawGame();
    
    animationFrameId = requestAnimationFrame(update);
}

// ======================== УПРАВЛЕНИЕ С КЛАВИАТУРЫ ========================

document.addEventListener('keydown', event => {
    if (!isGameStarted || isGameOver || gameState.paused) return;
    
    switch (event.code) {
        // WASD управление
        case "KeyW":
            event.preventDefault();
            playerRotate();
            break;
        case "KeyS":
            event.preventDefault();
            playerDrop();
            break;
        case "KeyA":
            event.preventDefault();
            playerMove(-1);
            break;
        case "KeyD":
            event.preventDefault();
            playerMove(+1);
            break;
        
        // 🔥 СТРЕЛКИ ДЛЯ ПК
        case "ArrowUp":
            event.preventDefault();
            playerRotate();
            break;
        case "ArrowDown":
            event.preventDefault();
            playerDrop();
            break;
        case "ArrowLeft":
            event.preventDefault();
            playerMove(-1);
            break;
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
    
    const handleMoveLeft = (e) => {
        e.preventDefault();
        if (isGameStarted && !isGameOver && !gameState.paused) playerMove(-1);
    };
    
    const handleMoveRight = (e) => {
        e.preventDefault();
        if (isGameStarted && !isGameOver && !gameState.paused) playerMove(+1);
    };
    
    const handleRotate = (e) => {
        e.preventDefault();
        if (isGameStarted && !isGameOver && !gameState.paused) playerRotate();
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        if (isGameStarted && !isGameOver && !gameState.paused) playerDrop();
    };
    
    btnLeft.addEventListener('touchstart', handleMoveLeft);
    btnLeft.addEventListener('mousedown', handleMoveLeft);
    
    btnRight.addEventListener('touchstart', handleMoveRight);
    btnRight.addEventListener('mousedown', handleMoveRight);
    
    btnRot.addEventListener('touchstart', handleRotate);
    btnRot.addEventListener('mousedown', handleRotate);
    
    btnDown.addEventListener('touchstart', handleDrop);
    btnDown.addEventListener('mousedown', handleDrop);
}

// Инициализация мобильного управления
initMobileControls();

// ======================== ОБРАБОТЧИКИ СОБЫТИЙ ========================

// Аудио по первому взаимодействию
document.addEventListener('click', initAudioOnFirstInteraction);
document.addEventListener('touchstart', initAudioOnFirstInteraction);

// переключение на другую вкладку:
// Следим за видимостью страницы — только ставим на паузу, но не снимаем!
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Вкладка скрыта — ставим игру на паузу (только если игра активна)
        if (isGameStarted && !isGameOver && !gameState.paused) {
            pauseGame();
         //   console.log('📱 Вкладка скрыта — игра на паузе. Нажмите "Дальше" чтобы продолжить.');
        }
        // Останавливаем аудио
        if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
            gameAudio.audioContext.suspend();
        }
    }
    // НЕТ автоматического resume! Игрок сам нажмёт "Дальше"
});

window.addEventListener('blur', function() {
    // Если игра активна и не на паузе – ставим на паузу
    if (isGameStarted && !isGameOver && !gameState.paused) {
        pauseGame();
        console.log('📱 Окно потеряло фокус – игра на паузе');
               // Останавливаем аудио
        if (typeof gameAudio !== 'undefined' && gameAudio.audioContext) {
            gameAudio.audioContext.suspend();
        }
    }
});

// Блокировка контекстного меню на всей странице
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

canvas.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
});

// ======================== ОТСЛЕЖИВАНИЕ РЕСАЙЗА ========================

let resizeTimeout;

window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
       // console.log("Resize event - обновляем размеры");
        updateCanvasSize();
      //  resizeGameField();
        if (typeof drawGame === 'function') drawGame();
    }, 100);
});
//  фикс фулскрина
document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
        if (typeof drawGame === 'function') drawGame();
    }, 50);
});

// ======================== МЕНЮ И МОДАЛКИ ========================

let selectedMode = 'classic'; // 'classic' или 'tetra'
let selectedDifficulty = 'medium'; // 'easy', 'medium', 'hard'

function selectMode(mode) {
    selectedMode = mode;
    
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'none';
    
    const diffModal = document.getElementById('difficulty-modal');
    const modeName = document.getElementById('difficulty-mode-name');
    if (modeName) {
        // Используем переводы вместо жёстких названий
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
    
    // Возвращаемся в главное меню
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'flex';
}

function selectDifficulty(difficulty) {
    selectedDifficulty = difficulty;
    console.log('🔥 Сложность выбрана:', selectedDifficulty);
    console.log('📝 Сохраняем в localStorage...');
    
    // Сохраняем сразу, чтобы быть уверенными
    const playedDifficulties = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
    if (!playedDifficulties.includes(difficulty)) {
        playedDifficulties.push(difficulty);
        localStorage.setItem('playedDifficulties', JSON.stringify(playedDifficulties));
         saveGameDataToCloud(); // асинхронное сохранение
        console.log('✅ Сложность сохранена в localStorage:', difficulty);
    } else {
        console.log('ℹ️ Сложность уже есть в localStorage:', difficulty);
    }
    
    // Закрываем модалку сложности
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.style.display = 'none';
    
    // Закрываем главное меню
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'none';
    
    // Запускаем игру с выбранными настройками
    console.log(`Запуск игры: режим ${selectedMode}, сложность ${selectedDifficulty}`);
    startGameWithAudio();
}


//==================================================== конец модалок
// ======================== СВИТКИ (СКРОЛЛЫ) ========================


function openScrollsModal() {
    // 🔥 ЗАГРУЖАЕМ СОХРАНЁННЫЙ ПРОГРЕСС ПРИ ОТКРЫТИИ МОДАЛКИ
    if (typeof loadTotalProgress === 'function') {
        loadTotalProgress();
    }
    
    const modal = document.getElementById('scrolls-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderScrolls();
    }
}


function closeScrollsModal() {
    const scrollsModal = document.getElementById('scrolls-modal');
    if (scrollsModal) scrollsModal.style.display = 'none';    
    // Закрываем все другие модалки, которые могли открыться поверх
    const rewardsModal = document.getElementById('rewards-center-modal');
    if (rewardsModal) rewardsModal.style.display = 'flex'; // Возвращаем центр наград
}

function openScrollTextModal(scrollId) {
    const playerScore = player ? player.score : 0;
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const totalScore = Math.max(playerScore, savedScore);
    const progress = getScrollsProgress();
    
    const isAvailable = isScrollUnlocked(scrollId, totalScore);
    const isClaimed = progress[scrollId] || false;
    const isUnlocked = isClaimed;
    
    // Если свиток доступен, но ещё не открыт — открываем автоматически
    if (isAvailable && !isClaimed) {
        claimScroll(scrollId);
        return;
    }
    
    // Если свиток закрыт — показываем модалку с замком
 if (!isAvailable) {
        const t = window.getText || (key => key);
        const neededPoints = scrollId <= 50 ? scrollId * 100 : 5000 + (scrollId - 50) * 300;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'scroll-locked-modal';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <button onclick="this.closest('.modal-overlay').remove()" class="close-btn" style="position: absolute;">✕</button>
                        <h2 style="color: #ef4444; text-transform: uppercase; letter-spacing: 2px;">${t('scrollLockedTitle')}</h2>
                <p style="color: #94a3b8; line-height: 1.6;">${t('scrollLockedText')}</p>
                <p style="color: #fcd34d; margin-bottom: 24px;">💡 ${t('needPoints') || 'Нужно'}: ${neededPoints} ${t('points') || 'очков'}</p>
               <button onclick="this.closest('.modal-overlay').remove()" class="modal-btn" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);">${t('ok')}</button>
            </div>
        `;
        document.body.appendChild(modal);
        return;
    }
    
    // ✅ ОТКРЫТЫЙ СВИТОК — показываем текст
    const modal = document.getElementById('scroll-text-modal');
    const titleEl = document.getElementById('scroll-text-title');
    const contentEl = document.getElementById('scroll-text-content');
    
    if (modal && titleEl && contentEl) {
        titleEl.textContent = `📜 ${getText('scroll')} ${scrollId}`;
        contentEl.textContent = getScrollText(scrollId);
        modal.style.display = 'flex';
        
        if (typeof updateInterfaceLanguage === 'function') {
            updateInterfaceLanguage();
        }
    }
}

function closeScrollTextModal() {
    const modal = document.getElementById('scroll-text-modal');
    if (modal) modal.style.display = 'none';
}

// ======================== ПРОГРЕСС СВИТКОВ ========================

function getScrollsProgress() {
    const saved = localStorage.getItem('scrollsProgress');
    return saved ? JSON.parse(saved) : {};
}

function saveScrollsProgress(progress) {
    localStorage.setItem('scrollsProgress', JSON.stringify(progress));
}

function claimScroll(scrollId) {
    const t = window.getText || (key => key);
    const playerScore = player ? player.score : 0;
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const totalScore = Math.max(playerScore, savedScore);
    
    // Проверяем, доступен ли свиток
    if (!isScrollUnlocked(scrollId, totalScore)) {
        // Показываем модалку с замком (уже есть в openScrollTextModal)
        openScrollTextModal(scrollId);
        return;
    }
    
    const progress = getScrollsProgress();
    if (progress[scrollId]) {
        // Уже открыт — показываем текст
        openScrollTextModal(scrollId);
        return;
    }
    
    // Открываем свиток
    progress[scrollId] = true;
    saveScrollsProgress(progress);

    
    // Обновляем список свитков
    renderScrolls();
     // После сохранения прогресса
    if (typeof window.saveGameDataToCloud === 'function') {
        window.saveGameDataToCloud();
    }
    // Показываем текст свитка
    openScrollTextModal(scrollId);
}

function renderScrolls() {
    const container = document.getElementById('scrolls-container');
    const scoreEl = document.getElementById('scrolls-player-score');
    const pageInfo = document.getElementById('scrolls-page-info');
    
    if (!container) return;
    
    const currentScore = player ? player.score : 0;
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const playerScore = Math.max(currentScore, savedScore);
    const progress = getScrollsProgress(); // ← новая функция для прогресса свитков
    
    if (scoreEl) {
        scoreEl.textContent = formatScore(playerScore);
    }
    
    const startIndex = (currentScrollPage - 1) * SCROLLS_PER_PAGE;
    const endIndex = Math.min(startIndex + SCROLLS_PER_PAGE, TOTAL_SCROLLS);
    
    container.innerHTML = '';
    
    let scrollText = 'Свиток';
    if (typeof window.getText === 'function') {
        const translated = window.getText('scroll');
        if (translated && translated !== 'scroll') {
            scrollText = translated;
        }
    }
    
    for (let i = startIndex + 1; i <= endIndex; i++) {
        const isAvailable = isScrollUnlocked(i, playerScore); // Доступен по очкам
        const isClaimed = progress[i] || false; // Уже открыт
        const isUnlocked = isClaimed;
        
        let icon = '🔒';
        let bgColor = 'rgba(255, 255, 255, 0.02)';
        let borderColor = 'rgba(255, 255, 255, 0.05)';
        let boxShadow = '';
        let animation = '';
        let action = '';
        
        if (isClaimed) {
            // ✅ ОТКРЫТ — галочка
            icon = getCheckmarkSVG();
            bgColor = 'rgba(52, 211, 153, 0.05)';
            borderColor = 'rgba(52, 211, 153, 0.2)';
            boxShadow = 'box-shadow: 0 0 15px rgba(52, 211, 153, 0.05);';
            action = `openScrollTextModal(${i})`;
        } else if (isAvailable) {
            // ✋ ДОСТУПЕН — рука, золотое свечение
            icon = '✋';
            bgColor = 'rgba(255, 215, 0, 0.08)';
            borderColor = 'rgba(255, 215, 0, 0.3)';
            boxShadow = 'box-shadow: 0 0 30px rgba(255, 215, 0, 0.1);';
            animation = 'animation: pulse-gold 1.5s ease-in-out infinite;';
            action = `claimScroll(${i})`;
        } else {
            // 🔒 ЗАКРЫТ
            icon = '🔒';
            bgColor = 'rgba(255, 255, 255, 0.02)';
            borderColor = 'rgba(255, 255, 255, 0.05)';
            action = `openScrollTextModal(${i})`;
        }
        
        const scrollItem = document.createElement('div');
        scrollItem.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: ${bgColor};
            border: 1px solid ${borderColor};
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s;
            ${boxShadow}
            ${animation}
        `;
        scrollItem.onclick = () => {
            if (isClaimed) {
                openScrollTextModal(i);
            } else if (isAvailable) {
                claimScroll(i);
            } else {
                openScrollTextModal(i);
            }
        };
        
        // Наведение
        scrollItem.onmouseover = () => {
            scrollItem.style.borderColor = isClaimed ? 'rgba(52, 211, 153, 0.5)' : 
                                          isAvailable ? 'rgba(255, 215, 0, 0.5)' : 
                                          'rgba(255, 255, 255, 0.15)';
            scrollItem.style.background = isClaimed ? 'rgba(52, 211, 153, 0.08)' : 
                                          isAvailable ? 'rgba(255, 215, 0, 0.12)' : 
                                          'rgba(255, 255, 255, 0.04)';
        };
        scrollItem.onmouseout = () => {
            scrollItem.style.borderColor = isClaimed ? 'rgba(52, 211, 153, 0.2)' : 
                                          isAvailable ? 'rgba(255, 215, 0, 0.3)' : 
                                          'rgba(255, 255, 255, 0.05)';
            scrollItem.style.background = isClaimed ? 'rgba(52, 211, 153, 0.05)' : 
                                          isAvailable ? 'rgba(255, 215, 0, 0.08)' : 
                                          'rgba(255, 255, 255, 0.02)';
        };
        
        scrollItem.innerHTML = `
            <span style="color: ${isClaimed ? '#e2e8f0' : isAvailable ? '#fcd34d' : '#64748b'}; font-family: 'Russo One', sans-serif; font-size: 15px;">
                ${scrollText} ${i}
                ${isAvailable && !isClaimed ? ' <span style="font-size: 11px; color: #fcd34d;">✨</span>' : ''}
            </span>
            <span style="font-size: 22px; transition: all 0.3s; display: flex; align-items: center;">
                ${icon}
            </span>
        `;
        
        container.appendChild(scrollItem);
    }
    
    const totalPages = Math.ceil(TOTAL_SCROLLS / SCROLLS_PER_PAGE);
    if (pageInfo) {
        pageInfo.textContent = `${currentScrollPage} / ${totalPages}`;
    }
}
// ===== АНИМИРОВАННАЯ ГАЛОЧКА =====
function getCheckmarkSVG() {
    return `
        <span class="achievement-item__checkmark" style="display: inline-block; width: 24px; height: 24px; flex-shrink: 0; position: relative;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" stroke="#34d399" stroke-width="2" fill="rgba(52, 211, 153, 0.1)"/>
                <path class="checkmark-path" d="M7 12L10.5 16L17 8" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" 
                      style="stroke-dasharray: 30; stroke-dashoffset: 0; animation: checkmarkDraw 2s ease-in-out infinite;"/>
            </svg>
        </span>
    `;
}

function nextScrollPage() {
    const totalPages = Math.ceil(TOTAL_SCROLLS / SCROLLS_PER_PAGE);
    if (currentScrollPage < totalPages) {
        currentScrollPage++;
        renderScrolls();
    }
}
function prevScrollPage() {
    if (currentScrollPage > 1) {
        currentScrollPage--;
        renderScrolls();
    }
}

// ======================== ПРОДОЛЖЕНИЕ ИГРЫ ЗА РЕКЛАМУ ========================

// Функция показа рекламы для продолжения
function showRewardedAdForContinue() {
    return new Promise((resolve) => {
        if (!ysdkGame || !ysdkGame.adv) {
            console.warn('⚠️ SDK или реклама недоступны');
            resolve(false);
            return;
        }

        // Показываем экран загрузки
        showLoadingScreen();

        ysdkGame.adv.showRewardedVideo({
            callbacks: {
                onOpen: () => {
                    hideLoadingScreen();
                },
                onRewarded: () => {
                    resolve(true);
                },
                onClose: () => {
                    // Если не было вознаграждения (пользователь закрыл до конца) – не засчитываем
                    // Но resolve уже вызван в onRewarded, поэтому ничего не делаем
                },
                onError: (error) => {
                    console.error('❌ Ошибка рекламы:', error);
                    hideLoadingScreen();
                    resolve(false);
                }
            }
        });
    });
}

function showContinueConfirmationModal() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'continue-confirm-modal';
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        };

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 420px;">
                <button onclick="this.closest('.modal-overlay').remove()" class="close-btn" style="position: absolute; background: none; border: none; color: #64748b;cursor: pointer; font-family: 'Russo One', sans-serif;">✕</button>
                <div style="font-size: 48px; margin-bottom: 16px;">🧹</div>
                <h2 style="color: #34d399; text-transform: uppercase; letter-spacing: 2px;">Продолжить эту игру!</h2>
                <p style="color: #94a3b8; line-height: 1.6; margin-bottom: 8px;">
                    Посмотрите рекламу и <strong style="color: #fcd34d;">сотрите 7 верхних строк</strong>, чтобы продолжить этот раунд!
                </p>
                <p style="color: #64748b; font-size: 13px; margin-bottom: 24px;">
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
    });
}

// Стирание верхних 7 рядов
function clearTopRows() {
    const rowsToClear = 7;
    // Проверяем наличие блоков в верхних рядах
    let hasBlocks = false;
    for (let y = 0; y < rowsToClear && y < arenaHeight; y++) {
        for (let x = 0; x < arenaWidth; x++) {
            if (arena[y][x] !== 0 && arena[y][x] !== 'bonus') {
                hasBlocks = true;
                break;
            }
        }
        if (hasBlocks) break;
    }
    
    if (!hasBlocks) {
        showSimpleModal(
            '⚠️ Верхние ряды пусты',
            'Нет блоков для удаления. Продолжайте игру!',
            'info'
        );
        return false;
    }
    
    // Удаляем верхние rowsToClear строк
    arena.splice(0, rowsToClear);
    // Добавляем пустые строки в начало
    for (let i = 0; i < rowsToClear; i++) {
        arena.unshift(new Array(arenaWidth).fill(0));
    }
    
    // Удаляем бонусы в верхних рядах
    for (let y = 0; y < rowsToClear && y < arenaHeight; y++) {
        for (let x = 0; x < arenaWidth; x++) {
            if (arena[y][x] === 'bonus') {
                arena[y][x] = 0;
            }
        }
    }
    
    // Пытаемся разместить текущую фигуру наверху
    player.pos.y = 0;
    const maxX = arenaWidth - player.matrix[0].length;
    player.pos.x = Math.floor(maxX / 2);
    
    // Поднимаем фигуру выше, пока не поместится
    let safe = false;
    for (let yOffset = 0; yOffset >= -4; yOffset--) {
        player.pos.y = yOffset;
        if (!collide(arena, player)) {
            safe = true;
            break;
        }
    }
    if (!safe) {
        // Если не удалось разместить (крайний случай) – запускаем анимацию проигрыша
        startGameOverAnimation();
        return false;
    }
    
    console.log(`🧹 Стерто ${rowsToClear} верхних рядов`);
    return true;
}

// Основная функция обработки нажатия на кнопку "Продолжить за рекламу"
async function handleContinueWithAd() {
    const confirmed = await showContinueConfirmationModal();
    if (!confirmed) return;
    if (!gameState.paused) pauseGame();
    const adShown = await showRewardedAdForContinue();
    if (adShown) {
        const cleared = clearTopRows();
        if (cleared) {
                     isGameOver = false;
            gameState.over = false;
            gameState.initialized = true;
            isGameStarted = true;
            const modal = document.getElementById('gameover-modal');
            if (modal) modal.style.display = 'none';
            if (typeof drawGame === 'function') drawGame();

            // ✅ Используем showSuccessModal – она не вызывает глобальных функций
            showSuccessModal(
                '🧹 Ряды стёрты!',
                '7 верхних строк удалены. Нажмите "Дальше" чтобы продолжить игру!'
            );

            updatePauseButtonText();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            lastTime = 0;
            dropCounter = 0;
            update(); // игра будет на паузе
        } else {
            showSimpleModal(
                '⚠️ Верхние ряды пусты',
                'Нет блоков для удаления. Продолжайте игру!',
                'info'
            );
        }
    } else {
        showSimpleModal(
            '❌ Реклама недоступна',
            'Попробуйте позже или начните новую игру.',
            'error'
        );
    }
}

// ======================== АНИМАЦИЯ ПРОИГРЫША ========================

function startGameOverAnimation() {
    // Сохраняем фигуру для анимации
    gameOverAnimation.active = true;
    gameOverAnimation.startTime = Date.now();
    gameOverAnimation.matrix = player.matrix.map(row => [...row]);
    gameOverAnimation.pos = { x: player.pos.x, y: player.pos.y };
    
    // Останавливаем игру
    gameState.initialized = false;
    isGameStarted = false;
    
    // Убедимся, что игра не на паузе
    gameState.paused = false;
    
    // Останавливаем звуки
    stopSounds();
      
    // Запускаем анимацию
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
     const isTiny = window.innerWidth <= 360 || window.innerHeight <= 400;
    let topPanelHeight = isMobile ? 42 : 80;
         if (isTiny) topPanelHeight = isMobile ? 30 : 50; // ещё меньше
    const gameAreaHeight = Math.max(50, canvasHeight - topPanelHeight);

    
    // Вычисляем размер блока
    let blockSize = Math.min(canvasWidth / arenaWidth, gameAreaHeight / arenaHeight);
    const FIGURE_SCALE = 1.8;
    let scaledBlockSize = blockSize * FIGURE_SCALE;
    let finalBlockSize = scaledBlockSize;
    if (finalBlockSize * arenaWidth > canvasWidth) {
        finalBlockSize = canvasWidth / arenaWidth;
    }
    if (finalBlockSize * arenaHeight > gameAreaHeight) {
        finalBlockSize = gameAreaHeight / arenaHeight;
    }
    blockSize = finalBlockSize;
    
    const offsetX = (canvasWidth - (blockSize * arenaWidth)) / 2;
    const offsetY = topPanelHeight + (gameAreaHeight - (blockSize * arenaHeight)) / 2;
    
    // Рисуем арену с блоками
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.fillStyle = '#0a0a0f';
    context.fillRect(0, topPanelHeight, canvasWidth, gameAreaHeight);
    
    // Рисуем арену
    for (let y = 0; y < arenaHeight; y++) {
        for (let x = 0; x < arenaWidth; x++) {
            const value = arena[y][x];
            if (value !== 0 && value !== 'bonus') {
                const posX = offsetX + x * blockSize;
                const posY = offsetY + y * blockSize;
                let fillColor;
                if (typeof value === 'string' && value.startsWith('#')) {
                    fillColor = value;
                } else {
                    fillColor = colors[value] || '#FFF';
                }
                context.fillStyle = fillColor;
                context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                context.strokeStyle = "rgba(0,0,0,0.3)";
                context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
            } else if (value === 'bonus') {
                // Бонусы не рисуем во время анимации
            }
        }
    }
    
    // Рисуем проигрышную фигуру с морганием
    const elapsed = Date.now() - gameOverAnimation.startTime;
    const maxDuration = gameOverAnimation.duration;
    
    if (elapsed < maxDuration) {
        // Моргание: видимо/невидимо каждые 300ms
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
                    if ((isTetra || isPenta) && matrix._color) {
                        fillColor = matrix._color;
                    } else {
                        fillColor = colors[value] || '#FF0D72';
                    }
                    
                    // Красный цвет для проигрышной фигуры
                    if (alpha < 1) {
                        // Полупрозрачная версия
                        context.globalAlpha = 0.3;
                    }
                    
                    context.fillStyle = fillColor;
                    context.fillRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                    context.strokeStyle = "rgba(255,0,0,0.8)";
                    context.lineWidth = 2;
                    context.strokeRect(posX, posY, blockSize - 0.5, blockSize - 0.5);
                    
                    context.globalAlpha = 1.0;
                    
                    // Красное свечение вокруг фигуры
                    context.shadowBlur = 15;
                    context.shadowColor = 'rgba(255,0,0,0.5)';
                    context.strokeStyle = 'rgba(255,0,0,0.3)';
                    context.lineWidth = 3;
                    context.strokeRect(posX - 2, posY - 2, blockSize + 3, blockSize + 3);
                    context.shadowBlur = 0;
                }
            }
        }
        
        // Текст "Игра окончена" с красным свечением
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
        
        // Запрашиваем следующий кадр
        animationFrameId = requestAnimationFrame(() => {
            if (gameOverAnimation.active) {
                drawGameOverAnimation();
            }
        });
        
    } else {
        // Анимация закончилась — показываем модалку
        gameOverAnimation.active = false;
        endGame();
        updatePauseButtonText();
    }
}


// ======================== ВОЗВРАТ В МЕНЮ ========================

function returnToMenu() {
    // Если игра идёт — ставим на паузу
    if (isGameStarted && !isGameOver && !gameState.paused) {
        pauseGame();
    }
    
    // Останавливаем звуки
    stopSounds();
    
    // Сбрасываем состояние игры
    isGameStarted = false;
    isGameOver = false;
    gameState.initialized = false;
    gameState.paused = false;
    gameState.over = false;
    
    // Останавливаем анимацию
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Показываем главное меню
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'flex';
    
    // Скрываем модалки сложности
    const diffModal = document.getElementById('difficulty-modal');
    if (diffModal) diffModal.style.display = 'none';
    
   // console.log('Возврат в главное меню');
}

// ======================== ПЕРЕКЛЮЧАТЕЛЬ ПАУЗА/ДАЛЬШЕ ========================

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
    
    if (gameState.paused) {
        resumeGame();
    } else {
        pauseGame();
        
        if (typeof showYandexFullscreenAd === 'function') {
            showYandexFullscreenAd();
        }
    }
}

// Обновляем текст кнопки при смене состояния паузы
function updatePauseButtonText() {
    const btn = document.getElementById('pause-resume-btn');
    if (!btn) return;
    
    const t = window.getText || (key => key);
    
    if (gameState.paused) {
        btn.textContent = t('resume');  // ← 'Дальше' или локализация
        btn.setAttribute('data-i18n', 'resume');
    } else {
        btn.textContent = t('pause');   // ← 'Пауза' или локализация
        btn.setAttribute('data-i18n', 'pause');
    }
}


// ======================== ФОРМАТИРОВАНИЕ ЧИСЕЛ ========================

function formatScore(value) {
    if (value >= 1000000) {
        // Если число делится на 1 000 000 без остатка
        const millions = value / 1000000;
        return millions % 1 === 0 ? millions + 'M' : millions.toFixed(1) + 'M';
    } else if (value >= 1000) {
        const thousands = value / 1000;
        return thousands % 1 === 0 ? thousands + 'K' : thousands.toFixed(1) + 'K';
    }
    return value.toString();
}

function openRewardsCenter() {
    console.log("🔥 openRewardsCenter вызвана!");
    
    // Закрываем все другие модалки
    document.querySelectorAll('[id$="-modal"]').forEach(el => {
        if (el.id !== 'rewards-center-modal' && el.id !== 'scroll-text-modal') {
            el.style.display = 'none';
        }
    });
    
    const modal = document.getElementById('rewards-center-modal');
    if (!modal) {
        console.error("❌ rewards-center-modal не найдена!");
        return;
    }
    
    // 🔥 ИЗМЕНЕНО: убрали background из cssText
    modal.style.cssText = `
        display: flex !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 99999 !important;
        justify-content: center !important;
        align-items: center !important;
        overflow: auto !important;
    `;
    
    // 🔥 ДОБАВЛЯЕМ ФОН ОТДЕЛЬНО (с картинкой)
    modal.style.background = "url('1.jpg') no-repeat center center fixed";
    modal.style.backgroundSize = "cover";
    
    // Обновляем счёт в окне центра нград (общие очки за все время, не рекорд)
 // Обновляем счёт с форматированием цифр
    const scoreEl = document.getElementById('rewards-player-score');
    if (scoreEl) {
        const totalScore = parseInt(localStorage.getItem('totalScore') || '0');
        scoreEl.textContent = formatScore(totalScore);
    }
    
    // Обновляем прогресс свитков
    const scrollProgress = document.getElementById('scrolls-progress');
    if (scrollProgress) {
        const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
        if (typeof window.countUnlockedScrolls === 'function') {
            const unlocked = window.countUnlockedScrolls(savedScore);
            scrollProgress.textContent = `${unlocked}/100`;
        } else {
            scrollProgress.textContent = '0/100';
        }
    }
    
    // Обновляем статус ежедневного бонуса
    updateDailyBonusStatus();
    
    // Обновляем прогресс коллекций
    updateCollectionsProgress();
    
    // Показываем модалку
    modal.style.display = 'flex';
   // console.log("✅ Модалка наград открыта!");
}

// ======================== ЦЕНТР НАГРАД ========================

function closeRewardsCenter() {
    const modal = document.getElementById('rewards-center-modal');
    if (modal) modal.style.display = 'none';
    
    // Убеждаемся, что другие модалки тоже закрыты
    const scrollsModal = document.getElementById('scrolls-modal');
    if (scrollsModal) scrollsModal.style.display = 'none';
    
    const scrollTextModal = document.getElementById('scroll-text-modal');
    if (scrollTextModal) scrollTextModal.style.display = 'none';
    
    // Возвращаемся в главное меню
    const menu = document.getElementById('main-menu-modal');
    if (menu) menu.style.display = 'flex';
}

// ======================== СВИТКИ ИЗ ЦЕНТРА НАГРАД ========================

function openScrollsFromRewards() {
    // Закрываем центр наград
    const rewardsModal = document.getElementById('rewards-center-modal');
    if (rewardsModal) rewardsModal.style.display = 'none';
    
    // Открываем модалку свитков
    openScrollsModal();
}

function closeScrollsModal() {
    const scrollsModal = document.getElementById('scrolls-modal');
    if (scrollsModal) scrollsModal.style.display = 'none';
    
    // Возвращаемся в центр наград
    const rewardsModal = document.getElementById('rewards-center-modal');
    if (rewardsModal) rewardsModal.style.display = 'flex';
}

function closeScrollTextModal() {
    const modal = document.getElementById('scroll-text-modal');
    if (modal) modal.style.display = 'none';
    // Возвращаемся в список свитков
    const scrollsModal = document.getElementById('scrolls-modal');
    if (scrollsModal) scrollsModal.style.display = 'flex';
}



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
        // Используем анимированную галочку вместо текста
        statusEl.innerHTML = getCheckmarkSVG();
        statusEl.style.color = '#34d399';
        statusEl.style.fontSize = '20px';
        statusEl.style.display = 'inline-flex';
        statusEl.style.alignItems = 'center';
    } else {
        //statusEl.textContent = '+10 очков';
        statusEl.style.color = '#fcd34d';
        statusEl.style.fontSize = '12px';
    }
}

function openDailyBonus() {
    const todayKey = getTodayKey();
    const lastClaimed = localStorage.getItem('dailyBonusDate');
    const isClaimed = lastClaimed === todayKey;
    
   if (isClaimed) {
        // Красивое модальное окно вместо алерта
        showDailyBonusModal('alreadyClaimed');
        return;
    } 
    
    showDailyBonusModal('claim');
}

function showDailyBonusModal(type) {
    const oldModal = document.getElementById('daily-bonus-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'daily-bonus-modal';
    modal.className = 'modal-overlay'; // добавляем класс оверлея
    modal.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 100002;
        background: url('1.jpg') no-repeat center center fixed;
        background-size: cover;
      `;
    // затемнение (чтобы не дублировать псевдоэлемент)
    const bg = document.createElement('div');
    bg.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        z-index: -1;
    `;
    modal.appendChild(bg);

    const t = window.getText || (key => key);
    let innerHTML = '';

    if (type === 'alreadyClaimed') {
        innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 90%; text-align: center; padding: 30px 20px;">
                <button onclick="this.parentElement.parentElement.remove()" class="close-btn" style="position: absolute; background: none; border: none; color: #64748b; cursor: pointer; font-family: 'Russo One', sans-serif;">
                    ✕
                </button>
                <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
                <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">
                    ${t('alreadyClaimed') || 'Уже получено!'}
                </h2>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px; font-family: 'Russo One', sans-serif;">
                    ${t('dailyBonusAlreadyClaimed') || 'Ты уже получил ежедневный бонус сегодня. Возвращайся завтра!'}
                </p>
                <button onclick="this.closest('.modal-overlay').remove()" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s;">
                    ${t('ok') || 'OK'}
                </button>
            </div>
        `;
    } else {
        innerHTML = `
            <div class="modal-content" style="max-width: 400px; width: 90%; text-align: center; padding: 30px 20px;">
                <button onclick="this.parentElement.parentElement.remove()" class="close-btn" style="position: absolute; background: none; border: none; color: #64748b; cursor: pointer; font-family: 'Russo One', sans-serif;">
                    ✕
                </button>
                <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
                <h2 style="color: #f59e0b; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">
                    ${t('dailyBonus') || 'Ежедневный бонус'}
                </h2>
                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px; font-family: 'Russo One', sans-serif; line-height: 1.6;">
                    ${t('dailyBonusDescription') || 'Получите +10 очков бесплатно или +25 очков за просмотр рекламы!'}
                </p>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
                    <button onclick="this.closest('.modal-overlay').remove()" style="flex: 1; min-width: 100px; padding: 14px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; cursor: pointer; transition: all 0.2s;">
                        ${t('cancel') || 'Отмена'}
                    </button>
                    <button onclick="claimDailyBonus(this, 10)" style="flex: 1; min-width: 100px; padding: 14px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 1px; color: #fff; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3); display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span>🎁</span> ${t('dailyBonusGet10') || '+10'}
                    </button>
                    <button onclick="claimDailyBonusRewarded(this)" style="flex: 1; min-width: 100px; padding: 14px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 1px; color: #fff; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3); display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span>📺</span> ${t('dailyBonusGet25') || '+25'}
                    </button>
                </div>
            </div>
        `;
    }

    modal.innerHTML = innerHTML;
    document.body.appendChild(modal);
}

function claimDailyBonus(btn, points = 10) {
    // Начисляем бонус
    if (typeof player !== 'undefined' && player) {
        player.score += points;
        if (typeof saveTotalProgress === 'function') {
            saveTotalProgress();
        }
        localStorage.setItem('dailyBonusDate', getTodayKey());
        if (typeof saveGameDataToCloud === 'function') {
    saveGameDataToCloud();
}
        
        // Закрываем модалку
        const modal = document.getElementById('daily-bonus-modal');
        if (modal) modal.remove();
        
        // Показываем успех
        const t = window.getText || (key => key);
        if (points === 10) {
            showSuccessModal(
                t('bonusClaimed') || '🎉 Бонус получен!',
                t('bonusClaimedText') || '+10 очков! Возвращайся завтра за новым бонусом.'
            );
        } else {
            // Для +25 используется отдельный текст, но показываем стандартный? Лучше отдельный.
            // Но мы будем вызывать claimDailyBonus только для +10, а +25 через другую функцию.
        }
        
        // Обновляем отображение
        const scoreEl = document.getElementById('rewards-player-score');
        if (scoreEl) {
            const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
            scoreEl.textContent = Math.max(player.score, savedScore);
        }
        updateDailyBonusStatus();
        if (typeof drawGame === 'function') drawGame();
    }
}
function claimDailyBonusRewarded(btn) {
    // Проверяем, есть ли SDK и поддерживается ли реклама
    if (!ysdkGame || !ysdkGame.adv) {
        const t = window.getText || (key => key);
        showSimpleModal(
            t('dailyBonusError') || 'Ошибка',
            t('dailyBonusError') || 'Не удалось загрузить рекламу. Попробуйте позже.',
            'error'
        );
        return;
    }
    
    // Показываем экран загрузки
    showLoadingScreen();
    
    // Вызываем рекламу
    ysdkGame.adv.showRewardedVideo({
        callbacks: {
            onOpen: () => {
                // Реклама открылась – скрываем экран загрузки
                hideLoadingScreen();
                // console.log('Реклама открылась');
            },
            onRewarded: () => {
                // console.log('Реклама просмотрена, начисляем бонус');
                // Начисляем +25
                if (typeof player !== 'undefined' && player) {
                    player.score += 25;
                    if (typeof saveTotalProgress === 'function') {
                        saveTotalProgress();
                    }
                    localStorage.setItem('dailyBonusDate', getTodayKey());
                    
                    // Синхронизируем с облаком
                    if (typeof saveGameDataToCloud === 'function') {
                        saveGameDataToCloud();
                    }
                    
                    // Закрываем модалку бонуса (если ещё открыта)
                    const modal = document.getElementById('daily-bonus-modal');
                    if (modal) modal.remove();
                    
                    // Показываем успех с +25
                    const t = window.getText || (key => key);
                    showSuccessModal(
                        t('dailyBonusRewardedTitle') || '🎉 Бонус получен!',
                        t('dailyBonusRewardedText') || '+25 очков! Спасибо за просмотр рекламы. Возвращайтесь завтра за новым бонусом.'
                    );
                    
                    // Обновляем отображение
                    const scoreEl = document.getElementById('rewards-player-score');
                    if (scoreEl) {
                        const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
                        scoreEl.textContent = Math.max(player.score, savedScore);
                    }
                    updateDailyBonusStatus();
                    if (typeof drawGame === 'function') drawGame();
                }
            },
            onClose: () => {
                // Закрытие рекламы (если не было награды, ничего не делаем)
                // console.log('Реклама закрыта');
            },
            onError: (error) => {
                console.error('Ошибка рекламы:', error);
                hideLoadingScreen();
                const t = window.getText || (key => key);
                showSimpleModal(
                    t('dailyBonusError') || 'Ошибка',
                    t('dailyBonusError') || 'Не удалось загрузить рекламу. Попробуйте позже.',
                    'error'
                );
            }
        }
    });
}

function showLoadingScreen() {
    // Если уже есть, не создаём повторно
    if (loadingScreenElement) return;
    
    const t = window.getText || (key => key);
    const div = document.createElement('div');
    div.id = 'loading-screen-reward';
    div.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(10, 10, 14, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100008;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    `;
    div.innerHTML = `
        <div style="text-align: center; color: #fff; font-family: 'Russo One', sans-serif;">
            <div style="font-size: 60px; margin-bottom: 20px;">📺</div>
            <div style="font-size: 20px; letter-spacing: 2px; animation: pulse-text 1.2s ease-in-out infinite;">${t('dailyBonusLoading') || 'Загрузка рекламы...'}</div>
        </div>
    `;
    document.body.appendChild(div);
    loadingScreenElement = div;
    
    // Добавляем анимацию пульсации
    if (!document.getElementById('loading-animation-style')) {
        const style = document.createElement('style');
        style.id = 'loading-animation-style';
        style.textContent = `
            @keyframes pulse-text {
                0% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.05); }
                100% { opacity: 0.4; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

function hideLoadingScreen() {
    if (loadingScreenElement) {
        loadingScreenElement.remove();
        loadingScreenElement = null;
    }
}

function showSuccessModal(title, text) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'success-modal';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    modal.innerHTML = `
        <div class="modal-content">
            <button onclick="this.closest('.modal-overlay').remove()" class="close-btn" style="position: absolute; background: none; border: none; color: #64748b; cursor: pointer; font-family: 'Russo One', sans-serif;">✕</button>
                     <h2 style="color: #34d399; text-transform: uppercase; letter-spacing: 2px;">${title}</h2>
            <p style="color: #94a3b8; line-height: 1.5;">${text}</p>
            <button onclick="this.closest('.modal-overlay').remove()" style="width: 100%; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s;">
                ${window.getText('ok') || 'OK'}
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

// ======================== КОЛЛЕКЦИИ ========================

const COLLECTIONS = {
    blocks: {
        name: 'Блоки',
        icon: '🧱',
        items: [
            { id: 'block1', name: 'Классический', emoji: '⬛' },
            { id: 'block2', name: 'Золотой', emoji: '🟨' },
            { id: 'block3', name: 'Неоновый', emoji: '🟩' },
            { id: 'block4', name: 'Алмазный', emoji: '💎' },
            { id: 'block5', name: 'Тёмный', emoji: '⬜' }
        ]
    },
    animals: {
        name: 'Животные',
        icon: '🐾',
        items: [
            { id: 'animal1', name: 'Дракон', emoji: '🐉' },
            { id: 'animal2', name: 'Единорог', emoji: '🦄' },
            { id: 'animal3', name: 'Лиса', emoji: '🦊' },
            { id: 'animal4', name: 'Панда', emoji: '🐼' },
            { id: 'animal5', name: 'Феникс', emoji: '🔥' }
        ]
    },
    plants: {
        name: 'Растения',
        icon: '🌿',
        items: [
            { id: 'plant1', name: 'Дуб', emoji: '🌳' },
            { id: 'plant2', name: 'Цветок', emoji: '🌺' },
            { id: 'plant3', name: 'Кактус', emoji: '🌵' },
            { id: 'plant4', name: 'Бамбук', emoji: '🎋' },
            { id: 'plant5', name: 'Роза', emoji: '🌹' }
        ]
    },
    space: {
        name: 'Космос',
        icon: '🚀',
        items: [
            { id: 'space1', name: 'Звезда', emoji: '⭐' },
            { id: 'space2', name: 'Планета', emoji: '🪐' },
            { id: 'space3', name: 'Галактика', emoji: '🌌' },
            { id: 'space4', name: 'Комета', emoji: '☄️' },
            { id: 'space5', name: 'Астронавт', emoji: '🧑‍🚀' }
        ]
    }
};

// Сохранение и загрузка прогресса коллекций
function getCollectionsProgress() {
    const saved = localStorage.getItem('collectionsProgress');
    return saved ? JSON.parse(saved) : {};
}

function saveCollectionsProgress(progress) {
    localStorage.setItem('collectionsProgress', JSON.stringify(progress));
}

function isCollectionUnlocked(itemId, totalScore) {
    // itemId имеет формат: 'block1', 'animal3' и т.д.
    // Извлекаем номер картинки
    const number = parseInt(itemId.replace(/[a-zA-Z]/g, ''));
    
    // Новая логика: картинка #N открывается, если очков >= N * 200
    return totalScore >= number * 200;
}

function countUnlockedCollections(totalScore) {
    let count = 0;
    // 🔥 ИСПОЛЬЗУЕМ COLLECTION_CATEGORIES вместо COLLECTIONS
    for (const [key, category] of Object.entries(COLLECTION_CATEGORIES)) {
        // Проверяем, открыта ли категория
        if (!checkCategoryUnlocked(key)) continue;
        
        // Считаем открытые картинки в категории
        count += getUnlockedCountInCategory(key, totalScore);
    }
    return count;
}


function updateCollectionsProgress() {
    const progressEl = document.getElementById('collections-progress');
    if (!progressEl) return;
    
    // 1. Загружаем общий счет игрока
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    
    // 2. Считаем разблокированные коллекции
    const unlocked = countUnlockedCollections(savedScore);
    
    // 3. 🔥 ИСПРАВЛЕНО: считаем общее количество из COLLECTION_CATEGORIES
    let total = 0;
    if (typeof COLLECTION_CATEGORIES !== 'undefined') {
        total = Object.values(COLLECTION_CATEGORIES).reduce((sum, cat) => sum + cat.total, 0);
    } else {
        // Запасной вариант
        total = 200;
    }
    
    // 4. Обновляем отображение
    progressEl.textContent = `${unlocked}/${total}`;
    
    // 5. Дополнительно: обновляем прогресс в модалке коллекций, если она открыта
    const collectionProgressEl = document.getElementById('collection-progress-display');
    if (collectionProgressEl) {
        collectionProgressEl.textContent = `${unlocked}/${total}`;
    }
    
    // 6. Сохраняем в глобальную переменную для других функций
    window.collectionsProgress = { unlocked, total };
    
    console.log(`📊 Коллекции: ${unlocked}/${total} разблокировано`);
}



// ======================== КОЛЛЕКЦИИ ========================

const COLLECTION_CATEGORIES = {
    blocks: {
        id: 'blocks',
        nameKey: 'collectionBlocks',
        icon: '🧱',
        folder: 'blocks',
        requirement: 'easy', // только на лёгкой сложности
        total: 50,
        price: 200
    },
    animals: {
        id: 'animals',
        nameKey: 'collectionAnimals',
        icon: '🐾',
        folder: 'animals',
        requirement: 'medium', // только на средней сложности
        total: 50,
        price: 200
    },
    plants: {
        id: 'plants',
        nameKey: 'collectionPlants',
        icon: '🌿',
        folder: 'plants',
        requirement: 'medium',
        total: 50,
        price: 200
    },
    space: {
        id: 'space',
        nameKey: 'collectionSpace',
        icon: '🚀',
        folder: 'cos',
        requirement: 'hard', // только на сложной сложности
        total: 50,
        price: 200
    }
};

function openCollections() {
    const rewardsModal = document.getElementById('rewards-center-modal');
    if (rewardsModal) rewardsModal.style.display = 'none';
    
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');

    const oldModal = document.getElementById('collections-modal');
    if (oldModal) oldModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'collections-modal';
    modal.onclick = (e) => {
        if (e.target === modal) closeCollections();
    };
    
    let html = `
        <div class="modal-content" style="max-width: 550px;  overflow-y: auto;">
   <button onclick="closeCollections()" class="close-btn" style="position: absolute; color: #64748b; z-index: 10; background: none; border: none; cursor: pointer; font-family: 'Russo One', sans-serif;">
    ✕
</button>
            <h2 style="color: #34d399; text-transform: uppercase; letter-spacing: 2px;">
                🖼️ ${t('collections')}
            </h2>
            <p style="color: #64748b; letter-spacing: 1px;">
                ${t('yourScore')} ${savedScore}
            </p>
            <div class="button-group">
    `;
    
    for (const [key, category] of Object.entries(COLLECTION_CATEGORIES)) {
        const name = t(category.nameKey);
        const isUnlocked = checkCategoryUnlocked(key);
        const unlockedCount = isUnlocked ? getUnlockedCountInCategory(key, savedScore) : 0;
        const total = category.total;
        const isComplete = isUnlocked && unlockedCount >= total;
        
        let buttonStyle = '';
        let onClickAction = '';
        let rightText = '';
        
        if (isUnlocked) {
            buttonStyle = `color: #fff; background: ${isComplete ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)'}; border: none; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3); cursor: pointer;`;
            onClickAction = `onclick="openCollectionCategory('${key}')"`;
            rightText = `
                <span style="color: ${isComplete ? '#86efac' : '#93c5fd'}; font-weight: normal; margin-left: auto; display: flex; align-items: center; gap: 6px;">
                    ${unlockedCount}/${total}
                    ${isComplete ? getCheckmarkSVG() : ''}
                </span>
            `;
        } else {
            buttonStyle = `color: #64748b; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); cursor: default;`;
            onClickAction = `onclick="showLockedCategory('${key}')"`;
            rightText = `<span style="color: #475569; margin-left: auto;">🔒</span>`;
        }
        
        html += `
            <button ${onClickAction}
                    style="width: 100%; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; 
                           ${buttonStyle}
                           display: flex; align-items: center; gap: 12px; justify-content: center;
                           border-radius: 16px; transition: all 0.2s;">
                <span>${category.icon}</span>
                <span>${name}</span>
                ${rightText}
            </button>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
}

// ======================== ФУНКЦИИ ДЛЯ КОЛЛЕКЦИЙ ========================

function showLockedCategory(categoryId) {
    const t = window.getText || (key => key);
    const category = COLLECTION_CATEGORIES[categoryId];
    if (!category) {
        console.error('❌ Категория не найдена:', categoryId);
        return;
    }
    
    console.log('🔒 showLockedCategory вызвана для:', categoryId);
    
    // Проверяем, открыта ли категория
    const isUnlocked = checkCategoryUnlocked(categoryId);
    console.log('  - isUnlocked:', isUnlocked);
    
    if (isUnlocked) {
        // Категория открыта, но возможно не собрана предыдущая
        const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
        const categoryIndex = CATEGORY_ORDER.indexOf(categoryId);
        let hasPrevious = false;
        let prevName = '';
        
        for (let i = 0; i < categoryIndex; i++) {
            const prevCategoryId = CATEGORY_ORDER[i];
            const prevCategory = COLLECTION_CATEGORIES[prevCategoryId];
            const neededScore = (i + 1) * prevCategory.total * 200;
            if (savedScore < neededScore) {
                hasPrevious = true;
                prevName = t(prevCategory.nameKey);
                break;
            }
        }
        
        if (hasPrevious) {
            showSimpleModal(
                t('scrollLockedTitle') || '🔒 Закрыто',
                `${t('collectAllPrevious') || 'Соберите все картинки в категории'} "${prevName}" ${t('toUnlockNext') || 'чтобы открыть следующую'}.`,
                'info'
            );
        } else {
            // Категория открыта и предыдущие собраны — но почему-то не пускает
            // Пробуем открыть принудительно
            console.log('✅ Категория открыта, открываем:', categoryId);
            openCollectionCategory(categoryId);
        }
    } else {
        // Категория не открыта — показываем требование по сложности
        const difficultyNames = {
            'easy': t('easy') || 'Легко',
            'medium': t('medium') || 'Средне',
            'hard': t('hard') || 'Сложно'
        };
        
        const reqName = difficultyNames[category.requirement] || category.requirement;
        showSimpleModal(
            t('scrollLockedTitle') || '🔒 Закрыто',
            `${t('collectionUnlockRequirement') || 'Чтобы открыть эту коллекцию, сыграйте на сложности'} "${reqName}".`,
            'info'
        );
    }
}

function checkCategoryUnlocked(categoryId) {
    const category = COLLECTION_CATEGORIES[categoryId];
    if (!category) return false;
    
    const playedDifficulties = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
    const requirement = category.requirement;
    
   // console.log(`🔍 Проверка ${categoryId}: требуется "${requirement}", сыграно:`, playedDifficulties);
    
    let result = false;
    if (requirement === 'easy') {
        result = playedDifficulties.includes('easy');
    } else if (requirement === 'medium') {
        result = playedDifficulties.includes('medium');
    } else if (requirement === 'hard') {
        result = playedDifficulties.includes('hard');
    }
    
   // console.log(`🔍 Результат для ${categoryId}: ${result}`);
    return result;
}
function showPreviousCategoryRequired(prevCategoryId) {
    const t = window.getText || (key => key);
    const prevCategory = COLLECTION_CATEGORIES[prevCategoryId];
    const prevName = t(prevCategory.nameKey);
    const total = prevCategory.total;
    const neededScore = total * 200;
    
    showSimpleModal(
        t('scrollLockedTitle') || '🔒 Закрыто',
        `${t('collectAllPrevious') || 'Соберите все'} ${total} ${t('pictures') || 'картинок'} ${t('inCategory') || 'в категории'} "${prevName}" (${neededScore} ${t('points') || 'очков'}) ${t('toUnlockNext') || 'чтобы открыть следующую'}.`,
        'info'
    );
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
            position: fixed;
            left: ${Math.random() * 100}vw;
            top: -10px;
            width: ${isCircle ? size : size * 0.4}px;
            height: ${isCircle ? size : size * 1.2}px;
            background: ${color};
            border-radius: ${isCircle ? '50%' : '2px'};
            z-index: 100007;
            pointer-events: none;
            opacity: 0;
            transform: rotate(${Math.random() * 360}deg);
            animation: confetti-fall ${Math.random() * 2 + 1.5}s ease-in forwards;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        
        document.body.appendChild(confetti);
        
        // Удаляем после анимации
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}

// Добавляем CSS-анимацию для конфетти
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confetti-fall {
        0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(${window.innerHeight + 50}px) rotate(${Math.random() * 720 + 360}deg) scale(0.5);
        }
    }
`;
document.head.appendChild(confettiStyle);

function getUnlockedCountInCategory(categoryId, totalScore) {
    const category = COLLECTION_CATEGORIES[categoryId];
    const categoryIndex = CATEGORY_ORDER.indexOf(categoryId);
    
    // Базовое количество очков, нужное чтобы дойти до этой категории
    const baseScore = categoryIndex * category.total * 200;
    
    // Если очков меньше базовых — категория полностью закрыта (все картинки под замком)
    if (totalScore < baseScore) {
        return 0;
    }
    
    // Сколько очков осталось для картинок в этой категории
    const remainingScore = totalScore - baseScore;
    
    // Сколько картинок можно открыть
    let count = Math.floor(remainingScore / 200);
    
    // Не больше, чем всего картинок в категории
    return Math.min(count, category.total);
}


function showSimpleModal(title, text, icon = 'info') {
    const modal = document.createElement('div');
        modal.className = 'modal-overlay'; 
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 100005;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    // 🔥 ДОБАВЛЯЕМ ФОН С КАРТИНКОЙ И ЗАТЕНЕНИЕМ
    modal.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('1.jpg') no-repeat center center fixed;
            background-size: cover;
            z-index: -1;
        ">
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: -1;
            "></div>
        </div>
        
        <div  class="modal-content" style="background: rgba(20, 20, 30, 0.85); border: 2px solid rgba(52, 211, 153, 0.3); width: 90%; max-width: 400px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
       <button onclick="this.parentElement.parentElement.remove()"  class="close-btn"  style="position: absolute; background: none; border: none; color: #64748b; cursor: pointer; font-family: 'Russo One', sans-serif;">
    ✕
</button>
            <div style="font-size: 48px; margin-bottom: 16px;">${icon === 'info' ? 'ℹ️' : icon === 'success' ? '✅' : icon === 'warning' ? '⚠️' : '❌'}</div>
            <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">
                ${title}
            </h2>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 24px; font-family: 'Russo One', sans-serif;">
                ${text}
            </p>
            <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s;">
                ${window.getText('ok') || 'OK'}
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeCollections() {
    const modal = document.getElementById('collections-modal');
    if (modal) modal.remove();
    
    // Возвращаемся в центр наград, а не в главное меню
    const rewardsModal = document.getElementById('rewards-center-modal');
    if (rewardsModal) rewardsModal.style.display = 'flex';
}

// 🔥 НОВАЯ ФУНКЦИЯ — обновление конкретной карточки
function updateCollectionCard(categoryId, index, page) {
    // Находим модалку с картинками
    const modal = document.getElementById('collection-category-modal');
    if (!modal) return;
    
    // Находим контейнер с картинками
    const grid = modal.querySelector('div[style*="grid-template-columns: repeat(5, 1fr)"]');
    if (!grid) return;
    
    // Находим все карточки в сетке
    const cards = grid.querySelectorAll('div[style*="aspect-ratio: 3/4"]');
    
    // Определяем позицию карточки на текущей странице
    const startIndex = (page - 1) * COLLECTION_ITEMS_PER_PAGE;
    const cardIndex = index - startIndex - 1;
    
    if (cardIndex >= 0 && cardIndex < cards.length) {
        const card = cards[cardIndex];
        const category = COLLECTION_CATEGORIES[categoryId];
        const imgPath = `images/${category.folder}/${index}.png`;
        const t = window.getText || (key => key);
        
        // Обновляем карточку на открытую
        card.style.background = 'rgba(52, 211, 153, 0.08)';
        card.style.borderColor = 'rgba(52, 211, 153, 0.4)';
        card.style.boxShadow = '';
        card.style.animation = '';
        card.onclick = function() {
            openFullImage(imgPath, index, categoryId);
        };
        
        // Меняем содержимое на картинку
        card.innerHTML = `
            <img src="${imgPath}" alt="${category.nameKey} ${index}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'">
        `;
        
        // Обновляем прогресс в заголовке
        const progressEl = modal.querySelector('p[style*="color: #64748b; font-size: 13px"]');
        if (progressEl) {
            const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
            const unlockedCount = getUnlockedCountInCategory(categoryId, savedScore);
            progressEl.textContent = `${t('collectionProgress') || 'Прогресс'}: ${unlockedCount}/${category.total}`;
        }
        
        // Обновляем прогресс в кнопке категории (если модалка коллекций открыта)
        const categoryBtn = document.querySelector(`button[onclick*="openCollectionCategory('${categoryId}')"]`);
        if (categoryBtn) {
            const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
            const unlockedCount = getUnlockedCountInCategory(categoryId, savedScore);
            const span = categoryBtn.querySelector('span:last-child');
            if (span) {
                const isComplete = unlockedCount >= category.total;
                span.innerHTML = `
                    ${unlockedCount}/${category.total}
                    ${isComplete ? getCheckmarkSVG() : ''}
                `;
            }
        }
    }
}

function claimCollectionItem(categoryId, index, page) {
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const progress = getCollectionsProgress();
    const itemId = `${categoryId}${index}`;
    const category = COLLECTION_CATEGORIES[categoryId];
    
    // Проверяем, доступна ли картинка
    const categoryIndex = CATEGORY_ORDER.indexOf(categoryId);
    const baseScore = categoryIndex * category.total * 200;
    const remainingScore = savedScore - baseScore;
    const isAvailable = remainingScore >= index * 200;
    
    if (!isAvailable) {
        showSimpleModal(
            t('notEnoughPoints') || 'Недостаточно очков',
            t('needMorePoints') || `Нужно ${index * 200} очков для этой картинки.`,
            'info'
        );
        return;
    }
    
    if (progress[itemId]) {
        showSimpleModal(
            t('alreadyClaimed') || '✅ Уже получено',
            t('alreadyClaimedText') || 'Эта картинка уже в вашей коллекции.',
            'info'
        );
        return;
    }
    
    // Отмечаем как полученную
    progress[itemId] = true;
    saveCollectionsProgress(progress);
     if (typeof window.saveGameDataToCloud === 'function') {
        window.saveGameDataToCloud();
    }
        // 🎊 ЗАПУСКАЕМ КОНФЕТТИ
    createConfetti(100);
    
    // Находим название
    const categoryName = t(category.nameKey);
    const itemName = `${category.icon} ${categoryName} #${index}`;
    const imgPath = `images/${category.folder}/${index}.png`;

       // 🔥 ОБНОВЛЯЕМ КАРТОЧКУ В МОДАЛКЕ (без перезагрузки всей страницы)
    updateCollectionCard(categoryId, index, page);


 // Показываем модалку

const modal = document.createElement('div');
    modal.className = 'modal-overlay'; // добавляем класс оверлея
modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100006;
    display: flex;
    justify-content: center;
    align-items: center;
    background: url('1.jpg') no-repeat center center fixed;
    background-size: cover;
`;

/*/ 🔥 ДОБАВЛЯЕМ ПСЕВДОЭЛЕМЕНТ ДЛЯ ЗАТЕНЕНИЯ
const style = document.createElement('style');
style.textContent = `
    #collection-claim-modal::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: -1;
    }
`;*/
modal.id = 'collection-claim-modal';


modal.innerHTML = `
    <div  class="modal-content" style="background: rgba(20, 20, 30, 0.85); border: 2px solid rgba(52, 211, 153, 0.4); width: 90%; max-width: 420px; border-radius: 30px; padding: 35px 30px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
     <button onclick="this.parentElement.parentElement.remove()"  class="close-btn"  style="position: absolute; background: none; border: none; color: #64748b; cursor: pointer; font-family: 'Russo One', sans-serif;">
    ✕
</button>
        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
        <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; font-family: 'Russo One', sans-serif;">
            ${t('newExhibit') || 'Новый экспонат!'}
        </h2>
        <p style="color: #94a3b8; font-size: 16px; margin-bottom: 8px; font-family: 'Russo One', sans-serif;">
            ${t('youGot') || 'Ты получил'}
        </p>
        <p style="color: #34d399; font-size: 20px; margin-bottom: 24px; font-family: 'Russo One', sans-serif; font-weight: bold;">
            ${itemName}
        </p>
<button onclick="
    openFullImage('${imgPath}', ${index}, '${categoryId}');
    setTimeout(() => {
        const modal = document.getElementById('collection-claim-modal');
        if (modal) modal.remove();
    }, 100);
" style="width: 100%; padding: 14px; font-size: 16px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);">
    ${t('showPicture') || 'Показать картинку'}
</button>
        <button onclick="
            this.parentElement.parentElement.remove();
            renderCollectionCategory('${categoryId}', ${page});
        " style="width: 100%; margin-top: 8px; padding: 12px; font-size: 14px; font-family: 'Russo One', sans-serif; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; cursor: pointer; transition: all 0.2s;">
            ${t('ok') || 'OK'}
        </button>
    </div>
`;
    document.body.appendChild(modal);
}


function savePlayedDifficulty() {
    if (!selectedDifficulty) {
        console.warn('⚠️ selectedDifficulty не определена');
        return;
    }
    
    const playedDifficulties = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
    console.log('📋 Текущие сохранённые сложности:', playedDifficulties);
    
    if (!playedDifficulties.includes(selectedDifficulty)) {
        playedDifficulties.push(selectedDifficulty);
        localStorage.setItem('playedDifficulties', JSON.stringify(playedDifficulties));
      //  console.log('✅ Сохранена сложность:', selectedDifficulty);
     //   console.log('📋 Теперь сохранено:', playedDifficulties);
    } else {
      //  console.log('ℹ️ Сложность уже сохранена:', selectedDifficulty);
    }
}

function openCollectionCategory(categoryId) {
   // console.log('🔥🔥🔥 openCollectionCategory ВЫЗВАНА для:', categoryId);
    
    const category = COLLECTION_CATEGORIES[categoryId];
    if (!category) {
        console.error('❌ Категория не найдена:', categoryId);
        return;
    }
    
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    
    // 1. Проверяем, что категория разблокирована (сыграна нужная сложность)
    if (!checkCategoryUnlocked(categoryId)) {
      //  console.log('🔒 Категория заблокирована (не сыграна сложность):', categoryId);
        showLockedCategory(categoryId);
        return;
    }
    
    // ✅ УБИРАЕМ ПРОВЕРКУ НА ПРЕДЫДУЩИЕ КАТЕГОРИИ!
    // Категория открывается просто за игру на нужной сложности
    
    // Всё ок — открываем категорию
    currentCollectionCategory = categoryId;
    currentCollectionPage = 1;
    renderCollectionCategory(categoryId, 1);
}

function showPreviousCategoryRequired(prevCategoryId) {
    const t = window.getText || (key => key);
    const prevCategory = COLLECTION_CATEGORIES[prevCategoryId];
    const prevName = t(prevCategory.nameKey);
    const total = prevCategory.total;
    const neededScore = total * 200;
    
    showSimpleModal(
        t('scrollLockedTitle') || '🔒 Закрыто',
        `${t('collectAllPrevious') || 'Соберите все'} ${total} ${t('pictures') || 'картинок'} ${t('inCategory') || 'в категории'} "${prevName}" (${neededScore} ${t('points') || 'очков'}) ${t('toUnlockNext') || 'чтобы открыть следующую'}.`,
        'info'
    );
}

function showLockReason(categoryId, index) {
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    const category = COLLECTION_CATEGORIES[categoryId];
    const categoryIndex = CATEGORY_ORDER.indexOf(categoryId);
    
    // Проверяем, собрана ли предыдущая категория
    let prevCategoryId = null;
    let prevCategoryName = '';
    let prevTotal = 0;
    
    for (let i = categoryIndex - 1; i >= 0; i--) {
        const prevId = CATEGORY_ORDER[i];
        const prevCategory = COLLECTION_CATEGORIES[prevId];
        const neededScore = (i + 1) * prevCategory.total * 200;
        if (savedScore < neededScore) {
            prevCategoryId = prevId;
            prevCategoryName = t(prevCategory.nameKey);
            prevTotal = prevCategory.total;
            break;
        }
    }
    
    // Если предыдущая категория не собрана
    if (prevCategoryId) {
        showSimpleModal(
            t('scrollLockedTitle') || '🔒 Закрыто',
            `${t('collectAllPrevious') || 'Соберите все'} ${prevTotal} ${t('pictures') || 'картинок'} ${t('inCategory') || 'в категории'} "${prevCategoryName}" ${t('toUnlockNext') || 'чтобы открыть следующую'}.`,
            'info'
        );
        return;
    }
    
    // Проверяем, достаточно ли очков для этой картинки
    const baseScore = categoryIndex * category.total * 200;
    const remainingScore = savedScore - baseScore;
    const neededScore = index * 200;
    
    if (remainingScore < neededScore) {
        const missingPoints = neededScore - remainingScore;
        showSimpleModal(
            t('notEnoughPoints') || 'Недостаточно очков',
            `${t('needMorePointsFor') || 'Нужно ещё'} ${missingPoints} ${t('points') || 'очков'} ${t('toUnlockPicture') || 'чтобы открыть эту картинку'}.`,
            'info'
        );
        return;
    }
    
    // Если ничего не подошло — общее сообщение
    showSimpleModal(
        t('notEnoughPoints') || 'Недостаточно очков',
        t('pictureNotAvailable') || 'Эта картинка пока недоступна.',
        'info'
    );
}


function renderCollectionCategory(categoryId, page) {
    const category = COLLECTION_CATEGORIES[categoryId];
    const t = window.getText || (key => key);
    const savedScore = parseInt(localStorage.getItem('totalScore') || '0');
    
    if (!checkCategoryUnlocked(categoryId)) {
        showLockedCategory(categoryId);
        return;
    }
    
    const totalItems = category.total;
    const totalPages = Math.ceil(totalItems / COLLECTION_ITEMS_PER_PAGE);
    const unlockedCount = getUnlockedCountInCategory(categoryId, savedScore);
    const startIndex = (page - 1) * COLLECTION_ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + COLLECTION_ITEMS_PER_PAGE, totalItems);
    
    const oldModal = document.getElementById('collection-category-modal');
    if (oldModal) oldModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'collection-category-modal';
    modal.onclick = (e) => {
        if (e.target === modal) closeCollectionCategory();
    };
    
    let html = `
        <div class="modal-content" style="max-width: 550px; max-height: 85vh; overflow-y: auto; padding: 25px 20px;">
         <button onclick="closeCollectionCategory()" class="close-btn" style="position: absolute; color: #64748b; z-index: 10; background: none; border: none; cursor: pointer; font-family: 'Russo One', sans-serif;">
    ✕
</button>
            <h2 style="color: #34d399; text-transform: uppercase; letter-spacing: 2px;">
                ${category.icon} ${t(category.nameKey)}
            </h2>
            <p style="color: #64748b; letter-spacing: 1px;">
                ${t('collectionProgress')}: ${unlockedCount}/${totalItems}
            </p>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 16px;">
    `;
    
    for (let i = startIndex + 1; i <= endIndex; i++) {
        const progress = getCollectionsProgress();
        const itemId = `${categoryId}${i}`;
        const isAvailable = i <= unlockedCount;
        const isClaimed = progress[itemId] || false;
        const imgPath = `images/${category.folder}/${i}.png`;
        
        let bgColor = 'rgba(30,30,40,0.5)';
        let borderColor = 'rgba(255,255,255,0.05)';
        let boxShadow = '';
        let animation = '';
        let clickAction = '';
        let content = '';
        
        if (isClaimed) {
            bgColor = 'rgba(52, 211, 153, 0.08)';
            borderColor = 'rgba(52, 211, 153, 0.4)';
            clickAction = `openFullImage('${imgPath}', ${i}, '${categoryId}')`;
            content = `<img src="${imgPath}" alt="${category.nameKey} ${i}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'">`;
        } else if (isAvailable) {
            bgColor = 'rgba(255, 215, 0, 0.08)';
            borderColor = 'rgba(255, 215, 0, 0.3)';
            boxShadow = '0 0 30px rgba(255, 215, 0, 0.1)';
            animation = 'animation: pulse-gold 1.5s ease-in-out infinite;';
            clickAction = `claimCollectionItem('${categoryId}', ${i}, ${page})`;
            content = `
                <div style="width: 100%; height: 100%; background: #1a1a2e; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <span style="font-size: clamp(24px, 5vw, 32px);">✋</span>
                    <span style="font-size: clamp(8px, 1.5vw, 9px); color: #fcd34d; font-family: 'Russo One', sans-serif; margin-top: 2px;">Забрать</span>
                </div>
            `;
        } else {
            bgColor = 'rgba(30,30,40,0.5)';
            borderColor = 'rgba(255,255,255,0.05)';
            clickAction = `showLockReason('${categoryId}', ${i})`;
            content = `
                <div style="width: 100%; height: 100%; background: #1a1a2e; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <span style="font-size: clamp(24px, 5vw, 32px);">🔒</span>
                </div>
            `;
        }
        
        html += `
            <div style="
                aspect-ratio: 3/4;
                background: ${bgColor};
                border: 2px solid ${borderColor};
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 4px;
                cursor: pointer;
                transition: all 0.2s;
                ${boxShadow}
                ${animation}
            " onclick="${clickAction}">
                ${content}
            </div>
        `;
    }
    
    html += `
            </div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 20px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                <button onclick="changeCollectionPage(-1)" class="pagination-btn">◀</button>
                <span style="color: #64748b; font-family: 'Russo One', sans-serif;">${page} / ${totalPages}</span>
                <button onclick="changeCollectionPage(1)" class="pagination-btn">▶</button>
            </div>
        </div>
    `;
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
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
    
    // Возвращаемся к списку категорий
    openCollections();
}

function openFullImage(imgPath, index, categoryId) {
    const category = COLLECTION_CATEGORIES[categoryId];
    const t = window.getText || (key => key);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'image-viewer-modal';
    modal.style.display = 'flex'; // ← КЛЮЧЕВАЯ СТРОКА – включает отображение
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div class="modal-content" style="position: relative; max-width: 90%; max-height: 90%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(20,20,30,0.95); border-radius: 20px; box-shadow: 0 25px 60px rgba(0,0,0,0.8);">
            <button onclick="this.parentElement.parentElement.remove()" class="close-btn" style="position: absolute; background: none; border: none; color: #fff; cursor: pointer; font-family: 'Russo One', sans-serif; z-index: 10; text-shadow: 0 0 20px rgba(0,0,0,0.8);">
                ✕
            </button>
            <img src="${imgPath}" alt="${t(category.nameKey)} ${index}" style="max-width: 100%; max-height: 70vh; border-radius: 12px; box-shadow: 0 0 60px rgba(0,0,0,0.8);" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22%3E%3Crect width=%22300%22 height=%22400%22 fill=%22%231a1a2e%22/%3E%3Ctext x=%22150%22 y=%22200%22 text-anchor=%22middle%22 fill=%22%2364748b%22 font-family=%22sans-serif%22 font-size=%2220%22%3ENo image%3C/text%3E%3C/svg%3E'">
            <p style="color: #94a3b8; text-align: center; margin-top: 12px; font-family: 'Russo One', sans-serif; font-size: 14px; text-shadow: 0 0 20px rgba(0,0,0,0.8);">
                ${t(category.nameKey)} ${index}
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
}
// ======================== ИНИЦИАЛИЗАЦИЯ ========================

// Показываем контейнер после загрузки
function showGameContainer() {
    const container = document.querySelector('.canvas-container');
    if (container) container.classList.add('ready');
}

// Инициализация с задержкой для устранения моргания
setTimeout(() => {
    updateCanvasSize();
    arena = createMatrix(arenaWidth, arenaHeight);
    player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.nextMatrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.pos.x = Math.floor((arenaWidth - player.matrix[0].length) / 2);
    
    showGameContainer();
    update();
  //  console.log("Игра инициализирована");
}, 100);

// Обновление после полной загрузки страницы
window.addEventListener('load', function() {
    setTimeout(function() {
        updateCanvasSize();
       // resizeGameField();
        drawGame();
        showGameContainer();
    }, 200);
});

// Блокировка скролла и скролл-касаний (разрешен в модалках)
document.body.addEventListener('touchmove', (e) => {
    // Разрешаем скроллинг внутри модалок и их скроллящихся контейнеров
    const scrollableElements = e.target.closest('.modal-content, #scrolls-container, .modal-overlay, .scrollable');
    if (scrollableElements) {
        // Позволяем событию идти дальше (скролл)
        return;
    }
    // Блокируем только касания вне модалок (игровое поле, кнопки)
    if (e.target.closest('.d-btn, .rotate-btn, .iksweb, .iksweb1, canvas, .canvas-container')) return;
    e.preventDefault();
}, { passive: false });

// Скрываем контейнер сразу после рендера
const container = document.querySelector('.canvas-container');
if (container) {
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';
}

// Показываем через 200ms после инициализации
setTimeout(() => {
    if (container) {
        container.style.opacity = '1';
    }
}, 200);

// ======================== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ========================
// Звук
window.toggleSound = toggleSound;
window.toggleMusic = toggleMusic;
window.updateSoundIcon = updateSoundIcon;
window.updateMusicIcon = updateMusicIcon;

// Свитки
window.openScrollsModal = openScrollsModal;
window.closeScrollsModal = closeScrollsModal;
window.openScrollTextModal = openScrollTextModal;
window.closeScrollTextModal = closeScrollTextModal;
window.prevScrollPage = prevScrollPage;
window.nextScrollPage = nextScrollPage;
window.renderScrolls = renderScrolls;
window.countUnlockedScrolls = countUnlockedScrolls;

// Меню
window.selectMode = selectMode;
window.selectDifficulty = selectDifficulty;
window.closeDifficultyModal = closeDifficultyModal;
window.returnToMenu = returnToMenu;
window.togglePauseResume = togglePauseResume;
//центр наград
window.openDailyBonus = openDailyBonus;
window.claimDailyBonus = claimDailyBonus;
window.showDailyBonusModal = showDailyBonusModal;
window.showSuccessModal = showSuccessModal;
//коллекции
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

// Игра
window.startGameWithAudio = startGameWithAudio;
window.showYandexLeaderboard = showYandexLeaderboard;
window.closeLeaderboardModal = closeLeaderboardModal;
window.closeGameOverModal = closeGameOverModal;
window.closeGameOverModalAndMenu = closeGameOverModalAndMenu;
window.loginYandex = loginYandex;

window.openRewardsCenter = openRewardsCenter;
window.closeRewardsCenter = closeRewardsCenter;
window.openScrollsFromRewards = openScrollsFromRewards;
window.openDailyBonus = openDailyBonus;
window.openCollections = openCollections;
window.closeCollections = closeCollections;
window.claimCollectionItem = claimCollectionItem;
// Экспортируем в глобальную область
window.updateCollectionsProgress = updateCollectionsProgress;
window.countUnlockedCollections = countUnlockedCollections;
window.claimDailyBonus = claimDailyBonus;
window.claimDailyBonusRewarded = claimDailyBonusRewarded;
window.showLoadingScreen = showLoadingScreen;
window.hideLoadingScreen = hideLoadingScreen;


console.log("Игра загружена");
