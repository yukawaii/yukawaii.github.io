// ===== ОХОТА НА ХИРАГАНУ =====
// ===== ДЕБАГ-ФУНКЦИЯ ДЛЯ ОТСЛЕЖИВАНИЯ =====
function logState() {
    console.log('🔍 ТЕКУЩЕЕ СОСТОЯНИЕ:');
    console.log('  foundCount:', gameState.foundCount);
    console.log('  targetCount:', gameState.targetCount);
    console.log('  score:', gameState.score);
    console.log('  lives:', gameState.lives);
    console.log('  isPlaying:', gameState.isPlaying);
    console.log('  currentTarget:', gameState.currentTarget);
}
// Список символов хираганы (с прозрачным фоном или просто текст)
const HIRAGANA = [
    'あ', 'い', 'う', 'え', 'お',
    'か', 'き', 'く', 'け', 'こ',
    'さ', 'し', 'す', 'せ', 'そ',
    'た', 'ち', 'つ', 'て', 'と',
    'な', 'に', 'ぬ', 'ね', 'の',
    'は', 'ひ', 'ふ', 'へ', 'ほ',
    'ま', 'み', 'む', 'め', 'も',
    'や', 'ゆ', 'よ',
    'ら', 'り', 'る', 'れ', 'ろ',
    'わ', 'を', 'ん'
];

// Уровни сложности
const LEVELS = {
    easy: { count: 15, lives: 5, timeBonus: 30 },
    medium: { count: 30, lives: 3, timeBonus: 25 },
    hard: { count: 50, lives: 2, timeBonus: 20 }
};

// Фоновые картинки
const BACKGROUNDS = [
    '../images/bus.jpg',
    '../images/otel.jpg',
    '../images/plaj.jpg',
    '../images/osobnyak.jpg',
    '../images/cafe.jpg',
    '../images/stol.jpg',
    '../images/mag.jpg',
    '../images/bas.jpg',
    '../images/kuh.jpg',
    '../images/per.jpg',
    '../images/vorota.jpg',
    '../images/yuka.jpg',
    '../images/su.jpg',
    '../images/si.jpg',
    '../images/so.jpg',
    '../images/ta.jpg',
    '../images/ti.jpg',
    '../images/tsu.jpg',
    '../images/te.jpg',
    '../images/to.jpg',
    '../images/na.jpg',
    '../images/ni.jpg',
    '../images/nu.jpg',
    '../images/ne.jpg',
    '../images/no.jpg',
    '../images/ha.jpg',
    '../images/hi.jpg',
    '../images/hu.jpg',
    '../images/he.jpg',
    '../images/ho.jpg',
    '../images/MA.jpg',
    '../images/mi.jpg',
    '../images/mu.jpg',
    '../images/me.jpg',
    '../images/mo.jpg',
    '../images/ra.jpg',
    '../images/ri.jpg',
    '../images/ru.jpg',
    '../images/re.jpg',
    '../images/ro.jpg',
    '../images/ya.jpg',
    '../images/yu.jpg',
    '../images/yo.jpg',
    '../images/wa.jpg',
    '../images/wo.jpg',
    '../images/n.jpg',
];

// Состояние игры
let gameState = {
     totalTime: 0,        // ← добавить
    roundStartTime: 0,   // ← добавить
    level: 'easy',
    symbols: [],
    currentTarget: '',
    score: 0,
    lives: 3,
    maxLives: 3,
    targetCount: 10,
    foundCount: 0,
    isPlaying: false,
    startTime: null,
    timerInterval: null,
    elapsedTime: 0,
    symbolsOnField: [],
    isProcessing: false
};

// DOM элементы
const field = document.getElementById('huntField');
const bgImage = document.getElementById('bgImage');
const targetSymbol = document.getElementById('targetSymbol');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const targetCountEl = document.getElementById('targetCount');
const victoryModal = document.getElementById('huntVictory');
const gameOverModal = document.getElementById('huntGameOver');
const finalScoreEl = document.getElementById('finalScore');
const finalTimeEl = document.getElementById('finalTime');
const gameOverScoreEl = document.getElementById('gameOverScore');
const newRoundBtn = document.getElementById('newRoundBtn');

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initGame() {
    // Получаем уровень из URL
    const params = new URLSearchParams(window.location.search);
    const level = params.get('level') || 'easy';
    gameState.level = level;
    const config = LEVELS[level];
    gameState.maxLives = config.lives;
    gameState.lives = config.lives;
    gameState.targetCount = config.count;
     gameState.totalTime = 0;
    gameState.roundStartTime = Date.now();
    gameState.foundCount = 0;
    gameState.score = 0;
    gameState.elapsedTime = 0;
    gameState.isProcessing = false;

    targetCountEl.textContent = gameState.targetCount;
    updateUI();

    // Выбираем случайный фон
    const randomBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    bgImage.src = randomBg;

    // Запускаем раунд
    startRound();

    // Скрываем модалки
    victoryModal.classList.remove('show');
    gameOverModal.classList.remove('show');
    console.log('🚀 Игра инициализирована!');
    logState();
}

// ===== ЗАПУСК РАУНДА =====
function startRound() {
    // Очищаем поле от старых символов
    document.querySelectorAll('.hunt-symbol').forEach(el => el.remove());
    gameState.symbolsOnField = [];
    gameState.isProcessing = false;
     gameState.roundStartTime = Date.now();
 // Меняем фон при каждом новом раунде
    const randomBg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)];
    bgImage.src = randomBg;

    // Выбираем целевой символ
    const available = HIRAGANA.filter(s => !gameState.symbolsOnField.includes(s));
    gameState.currentTarget = available[Math.floor(Math.random() * available.length)];

    // Количество символов на поле
    const totalSymbols = 12 + Math.floor(Math.random() * 6); // 12-18 символов

    // Генерируем символы для поля
    const symbols = [];
    // Добавляем правильный символ
    symbols.push(gameState.currentTarget);

    // Добавляем случайные символы (не повторяющиеся)
    const otherSymbols = HIRAGANA.filter(s => s !== gameState.currentTarget);
    while (symbols.length < totalSymbols) {
        const rand = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
        if (!symbols.includes(rand)) {
            symbols.push(rand);
        }
        // Если закончились символы — выходим
        if (symbols.length >= HIRAGANA.length) break;
    }

    // Перемешиваем
    shuffleArray(symbols);

    // Размещаем на поле
    placeSymbols(symbols);

    // Обновляем задание
    targetSymbol.textContent = gameState.currentTarget;

    // Старт таймера
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(updateTimer, 1000);

    gameState.isPlaying = true;
    updateUI();
}

// ===== РАЗМЕЩЕНИЕ СИМВОЛОВ (РАВНОМЕРНО ПО ВСЕЙ КАРТИНКЕ) =====
function placeSymbols(symbols) {
    // Очищаем старые
    document.querySelectorAll('.hunt-symbol').forEach(el => el.remove());

    const padding = 8; // отступ от края в %
    const symbolSize = window.innerWidth < 500 ? 38 : 48;

    // Сетка для равномерного распределения
    const cols = Math.ceil(Math.sqrt(symbols.length * 1.5));
    const rows = Math.ceil(symbols.length / cols);
    
    // Смешиваем порядок, чтобы символы не шли строго по сетке
    const shuffledSymbols = [...symbols];
    shuffleArray(shuffledSymbols);

    // Добавляем небольшой случайный сдвиг
    shuffledSymbols.forEach((char, index) => {
        const el = document.createElement('div');
        el.className = 'hunt-symbol';
        el.textContent = char;
        el.dataset.char = char;
        el.dataset.index = index;

        // Равномерное распределение по сетке
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        // Базовые координаты в процентах
        let x = (col / (cols - 1)) * (100 - padding * 2) + padding;
        let y = (row / (rows - 1)) * (100 - padding * 2) + padding;

        // Добавляем случайное смещение ±6%, чтобы не было строго по сетке
        const offsetX = (Math.random() - 0.5) * 12;
        const offsetY = (Math.random() - 0.5) * 12;
        x = Math.max(padding, Math.min(100 - padding, x + offsetX));
        y = Math.max(padding, Math.min(100 - padding, y + offsetY));

        el.style.left = x + '%';
        el.style.top = y + '%';
        el.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 40 - 20}deg)`;
        el.style.width = symbolSize + 'px';
        el.style.height = symbolSize + 'px';
        el.style.fontSize = (symbolSize * 0.7) + 'px';

        // Цвет
        const hue = Math.random() * 360;
        el.style.color = `hsl(${hue}, 85%, 75%)`;
        el.style.background = `rgba(0,0,0,0.2)`;
        el.style.borderColor = `hsla(${hue}, 80%, 70%, 0.25)`;
        el.style.textShadow = `0 0 15px hsla(${hue}, 80%, 70%, 0.3)`;

        el.addEventListener('click', () => handleSymbolClick(el));
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleSymbolClick(el);
        }, { passive: false });

        field.appendChild(el);
        gameState.symbolsOnField.push(char);
    });
}

// ===== ОБРАБОТЧИК КЛИКА =====
function handleSymbolClick(el) {
    if (gameState.isProcessing || !gameState.isPlaying) return;
    if (el.classList.contains('found')) return;

    const char = el.dataset.char;

    if (char === gameState.currentTarget) {
        // ПРАВИЛЬНО!
        el.classList.add('found');
        gameState.foundCount++;
         // ДЕБАГ
    logState();
    
        // === НОВАЯ СИСТЕМА ОЧКОВ ===
        let points = 1; // база
        
        // Бонус за скорость (чем быстрее, тем больше)
        if (gameState.elapsedTime < 3) {
            points += 5; // супер-быстро
        } else if (gameState.elapsedTime < 6) {
            points += 3; // быстро
        } else if (gameState.elapsedTime < 10) {
            points += 1; // нормально
        }
        
        // Бонус за сложность
        if (gameState.level === 'hard') points += 2;
        else if (gameState.level === 'medium') points += 1;
        
        gameState.score += points;

        updateUI();

   if (gameState.foundCount >= gameState.targetCount) {
    console.log('🎉 ПОБЕДА! foundCount:', gameState.foundCount, 'targetCount:', gameState.targetCount);
    gameState.isPlaying = false;
    clearInterval(gameState.timerInterval);
    setTimeout(showVictory, 400);
    return;
}

        gameState.isProcessing = true;
        setTimeout(() => {
            startRound();
        }, 500);

    } else {
        // НЕПРАВИЛЬНО!
        el.classList.add('wrong');
        gameState.lives--;
        updateUI();

        setTimeout(() => {
            el.classList.remove('wrong');
        }, 400);

        if (gameState.lives <= 0) {
            gameState.isPlaying = false;
            clearInterval(gameState.timerInterval);
            setTimeout(showGameOver, 500);
        }
    }
}

// ===== ТАЙМЕР =====
function updateTimer() {
    const now = Date.now();
    const roundElapsed = Math.floor((now - gameState.roundStartTime) / 1000);
    gameState.totalTime = Math.floor((now - gameState.startTime) / 1000);
    // Можно показать общее время где-то
}

// ===== ОБНОВЛЕНИЕ UI =====
function updateUI() {
    scoreEl.textContent = gameState.score;
    livesEl.textContent = gameState.lives;
    targetCountEl.textContent = gameState.targetCount;
     foundCountDisplay.textContent = gameState.foundCount;
}

function showVictory() {
    console.log('🏆 Показываем экран победы!');
    finalScoreEl.textContent = gameState.score;
     const totalSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
    finalTimeEl.textContent = totalSeconds;
    victoryModal.classList.add('show');
}

function closeVictory() {
    victoryModal.classList.remove('show');
    initGame();
}

// ===== ПРОИГРЫШ =====
function showGameOver() {
    gameOverScoreEl.textContent = gameState.foundCount;
    gameOverModal.classList.add('show');
}

function closeGameOver() {
    gameOverModal.classList.remove('show');
    initGame();
}

// ===== НОВЫЙ РАУНД =====
newRoundBtn.addEventListener('click', () => {
    initGame();
});

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', initGame);

// Перезапуск при изменении размера окна (для адаптации)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Переразмещаем символы
        if (gameState.isPlaying) {
            // Можно обновить размеры, но не трогаем позиции
        }
    }, 300);
});

console.log('🔍 Охота на катакана загружена!');