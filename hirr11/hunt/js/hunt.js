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
    console.log('  currentTargetRu:', gameState.currentTargetRu);
}

// Список символов хираганы
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

// Русские названия (кириллица) для каждого символа
const HIRAGANA_RU = {
    'あ': 'А', 'い': 'И', 'う': 'У', 'え': 'Э', 'お': 'О',
    'か': 'КА', 'き': 'КИ', 'く': 'КУ', 'け': 'КЭ', 'こ': 'КО',
    'さ': 'СА', 'し': 'СИ', 'す': 'СУ', 'せ': 'СЭ', 'そ': 'СО',
    'た': 'ТА', 'ち': 'ТИ', 'つ': 'ЦУ', 'て': 'ТЭ', 'と': 'ТО',
    'な': 'НА', 'に': 'НИ', 'ぬ': 'НУ', 'ね': 'НЭ', 'の': 'НО',
    'は': 'ХА', 'ひ': 'ХИ', 'ふ': 'ФУ', 'へ': 'ХЭ', 'ほ': 'ХО',
    'ま': 'МА', 'み': 'МИ', 'む': 'МУ', 'め': 'МЭ', 'も': 'МО',
    'や': 'Я', 'ゆ': 'Ю', 'よ': 'Ё',
    'ら': 'РА', 'り': 'РИ', 'る': 'РУ', 'れ': 'РЭ', 'ろ': 'РО',
    'わ': 'ВА', 'を': 'ВО', 'ん': 'Н'
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
    level: 'easy',
    count: 15,
    totalTime: 0,
    roundStartTime: 0,
    currentTarget: '',
    currentTargetRu: '',
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
const foundCountDisplay = document.getElementById('foundCountDisplay');
const victoryModal = document.getElementById('huntVictory');
const gameOverModal = document.getElementById('huntGameOver');
const finalScoreEl = document.getElementById('finalScore');
const finalTimeEl = document.getElementById('finalTime');
const gameOverScoreEl = document.getElementById('gameOverScore');
const newRoundBtn = document.getElementById('newRoundBtn');

// ===== ИНИЦИАЛИЗАЦИЯ =====
function initGame() {
    // Получаем параметры из URL
    const params = new URLSearchParams(window.location.search);
    const level = params.get('level') || 'easy';
    const count = parseInt(params.get('count')) || 15;

    gameState.level = level;
    gameState.count = count;
    gameState.targetCount = count;

    // Устанавливаем жизни в зависимости от уровня
    if (level === 'easy') {
        gameState.maxLives = 5;
    } else { // medium
        gameState.maxLives = 3;
    }
    gameState.lives = gameState.maxLives;

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
    console.log('🚀 Игра инициализирована! Уровень:', level, 'Количество:', count);
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
    const selectedSymbol = available[Math.floor(Math.random() * available.length)];
    gameState.currentTarget = selectedSymbol;
    gameState.currentTargetRu = HIRAGANA_RU[selectedSymbol] || selectedSymbol;

    // Отображаем задание: для лёгкого – символ, для среднего – русское название
    if (gameState.level === 'easy') {
        targetSymbol.textContent = gameState.currentTarget;
    } else {
        targetSymbol.textContent = gameState.currentTargetRu;
    }

    // Количество символов на поле
    const totalSymbols = 12 + Math.floor(Math.random() * 6); // 12-18

    // Генерируем символы для поля
    const symbols = [];
    symbols.push(gameState.currentTarget);
    const otherSymbols = HIRAGANA.filter(s => s !== gameState.currentTarget);
    while (symbols.length < totalSymbols) {
        const rand = otherSymbols[Math.floor(Math.random() * otherSymbols.length)];
        if (!symbols.includes(rand)) {
            symbols.push(rand);
        }
        if (symbols.length >= HIRAGANA.length) break;
    }
    shuffleArray(symbols);

    // Размещаем на поле
    placeSymbols(symbols);

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
    document.querySelectorAll('.hunt-symbol').forEach(el => el.remove());

    const padding = 8;
    const symbolSize = window.innerWidth < 500 ? 38 : 48;
    const cols = Math.ceil(Math.sqrt(symbols.length * 1.5));
    const rows = Math.ceil(symbols.length / cols);
    const shuffledSymbols = [...symbols];
    shuffleArray(shuffledSymbols);

    shuffledSymbols.forEach((char, index) => {
        const el = document.createElement('div');
        el.className = 'hunt-symbol';
        el.textContent = char;
        el.dataset.char = char;
        el.dataset.index = index;

        const col = index % cols;
        const row = Math.floor(index / cols);
        let x = (col / (cols - 1)) * (100 - padding * 2) + padding;
        let y = (row / (rows - 1)) * (100 - padding * 2) + padding;
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
    const isCorrect = (gameState.level === 'easy')
        ? (char === gameState.currentTarget)
        : (HIRAGANA_RU[char] === gameState.currentTargetRu);

    if (isCorrect) {
        el.classList.add('found');
        gameState.foundCount++;
        logState();

        // Начисление очков (как было)
        let points = 1;
        if (gameState.elapsedTime < 3) points += 5;
        else if (gameState.elapsedTime < 6) points += 3;
        else if (gameState.elapsedTime < 10) points += 1;
        if (gameState.level === 'medium') points += 1; // бонус за сложность

        gameState.score += points;
        updateUI();

        if (gameState.foundCount >= gameState.targetCount) {
            console.log('🎉 ПОБЕДА!');
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
    // Можно использовать для отображения времени, если нужно
}

// ===== ОБНОВЛЕНИЕ UI =====
function updateUI() {
    scoreEl.textContent = gameState.score;
    livesEl.textContent = gameState.lives;
    targetCountEl.textContent = gameState.targetCount;
    foundCountDisplay.textContent = gameState.foundCount;
}

// ===== ПОБЕДА (ИСПРАВЛЕНА) =====
function showVictory() {
    console.log('🏆 Показываем экран победы!');
    finalScoreEl.textContent = gameState.score;
    const totalSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
    finalTimeEl.textContent = totalSeconds;

    // ===== НАЧИСЛЕНИЕ ЗВЁЗД =====
    let starCount = 0;
    switch (gameState.targetCount) {
        case 15: starCount = 1; break;
        case 30: starCount = 2; break;
        case 50: starCount = 3; break;
    }
    if (starCount > 0) {
        if (typeof window.addStars === 'function') {
            window.addStars(starCount);
        }
        const starsEl = document.getElementById('victoryStars');
        if (starsEl) {
            starsEl.textContent = '⭐ +' + starCount;
        }
    }

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

// Адаптация к изменению размера окна
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (gameState.isPlaying) {
            // можно обновить размеры, но не обязательно
        }
    }, 300);
});

console.log('🔍 Охота на хирагану загружена!');