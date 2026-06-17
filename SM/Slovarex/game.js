// Проверка загрузки словаря
if (typeof DICTIONARY === 'undefined') {
    console.error("❌ Словарь не загружен! Проверьте подключение words.js");
    alert("Ошибка загрузки игры. Обновите страницу.");
}

// ====== НЕМЕДЛЕННОЕ ПРИМЕНЕНИЕ ТЕМЫ ======
(function() {
    const THEME_KEY = 'wordgame_theme';
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    // Применяем тему к body сразу
    document.body.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
})();
// В самом начале файла, после проверки словаря:
const style = document.createElement('style');
style.textContent = `
    /* Отключаем выделение и контекстное меню */
    * {
        -webkit-tap-highlight-color: transparent !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
    }
    button:focus, button:focus-visible {
        outline: none !important;
        box-shadow: none !important;
    }
    img, a, button, [role="button"] {
        -webkit-touch-callout: none !important;
    }
`;
document.head.appendChild(style);


// ========== VK BRIDGE И БАННЕР ==========
// Показать баннер
function showBannerAd() {
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send('VKWebAppShowBannerAd', { banner_location: 'bottom' })
            .then((data) => {
                if (data.result) {
                    console.log('✅ Баннерная реклама отобразилась');
                    document.body.classList.add('has-vk-banner');
                }
            })
            .catch((error) => {
                console.warn('❌ Ошибка показа баннера:', error);
            });
    }
}

// Проверить и показать баннер
function checkAndShowBanner() {
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send('VKWebAppCheckBannerAd', {})
            .then((data) => {
                if (!data.result) {
                    showBannerAd();
                }
            })
            .catch(() => {
                showBannerAd();
            });
    }
}

// Инициализация VK Bridge
function initVKBridge() {
    if (typeof vkBridge === 'undefined') return;
    
    // Скрываем навигацию
    hideVKView();
    
    // Показываем баннер
    setTimeout(checkAndShowBanner, 500);
    
    // Слушаем события
    vkBridge.subscribe((e) => {
        if (e.detail.type === 'VKWebAppUpdateConfig') {
            setTimeout(updateVKLayout, 100);
        }
        if (e.detail.type === 'VKWebAppBannerAdClosedByUser') {
            console.log('ℹ️ Баннер закрыт, пробуем показать снова через 30 сек');
            setTimeout(checkAndShowBanner, 30000);
        }
    });
}
// ====== УПРАВЛЕНИЕ ЧАСТИЦАМИ ======
function setParticlesBelowGame() {
    const container = document.getElementById('particlesContainer');
    if (container) {
        container.style.zIndex = '0';  // под игрой
    }
}

function setParticlesAboveMenu() {
    const container = document.getElementById('particlesContainer');
    if (container) {
        container.style.zIndex = '10000';  // над фоном меню, но под контентом
    }
}
// Инициализация частиц при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Даём небольшую задержку, чтобы DOM полностью загрузился
    setTimeout(() => {
        createParticles();
        initTheme();
    }, 100);
});

// Показать нативный интерфейс VK (шапка, низ)
function showVKView() {
    if (typeof vkBridge === 'undefined') return;
    vkBridge.send('VKWebAppViewRestore')
        .then(() => console.log('✅ VK View restored'))
        .catch(() => console.log('⚠️ VK View restore error'));
}

// Скрыть нативный интерфейс VK (полноэкранный режим)
function hideVKView() {
    if (typeof vkBridge === 'undefined') return;
    vkBridge.send('VKWebAppViewHide')
        .then(() => console.log('✅ VK View hidden'))
        .catch(() => console.log('⚠️ VK View hide error'));
}

// При старте игры — скрываем навигацию VK
function initVKBridge() {
    if (typeof vkBridge === 'undefined') return;
    
    // Скрываем шапку и низ VK
    hideVKView();
    
    // Подписываемся на изменение размера окна
    vkBridge.subscribe((e) => {
        if (e.detail.type === 'VKWebAppUpdateConfig') {
            // При изменении размера обновляем адаптацию
            setTimeout(updateVKLayout, 100);
        }
    });
}

// Обновление лейаута при изменении размера
function updateVKLayout() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Для маленьких экранов показываем навигацию
    if (width < 500 || height < 700) {
        showVKView();
    } else {
        hideVKView();
    }
}

// Вызываем при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initVKBridge, 300);
});

// Также вызываем при ресайзе
let resizeTimeout = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateVKLayout, 300);
});

// ========== КОНФИГУРАЦИЯ ==========
const CONFIG = {
    MIN_WORD_LEN: 2,
    TIME_PER_LEVEL: 120,
    TIME_BONUS_PER_WORD: 15,
    SCORE_BONUS_PER_LEVEL: 10,
    HINTS_START: 5,
    LEVEL_THRESHOLD_START: 0.4,
    LEVEL_THRESHOLD_STEP: 0.05,
    LEVEL_THRESHOLD_MAX: 0.75,
      WORDS_TO_COMPLETE: 20 
};

// ========== ЧАСТИЦЫ ФОНА ==========
// ========== ЧАСТИЦЫ ФОНА ==========
let particlesCreated = false;

function createParticles() {
    const container = document.getElementById('particlesContainer');
    if (!container) return;
    
    // Очищаем старые частицы
    container.innerHTML = '';
    
    // Определяем цвета частиц в зависимости от темы
    const theme = document.body.getAttribute('data-theme') || 'light';
    let particleClass = 'particle-blue';
    let count = 30;
    
    switch(theme) {
        case 'dark':
            particleClass = 'particle-pink';
            count = 25;
            break;
        case 'blue':
            particleClass = 'particle-blue';
            count = 35;
            break;
        case 'green':
            particleClass = 'particle-gold';
            count = 30;
            break;
        default:
            particleClass = 'particle-blue';
            count = 30;
            break;
    }
    
    // Создаём частицы
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = `particle ${particleClass}`;
        
        const sizes = ['particle-sm', 'particle-md', 'particle-lg', 'particle-xl'];
        const sizeClass = sizes[Math.floor(Math.random() * sizes.length)];
        particle.classList.add(sizeClass);
        
        const delay = Math.floor(Math.random() * 7) + 1;
        particle.classList.add(`particle-delay-${delay}`);
        
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        const duration = 3 + Math.random() * 3;
        particle.style.animationDuration = `${duration}s`;
        
        container.appendChild(particle);
    }
    
    particlesCreated = true;
}

// Обновление частиц при смене темы
function updateParticles() {
    createParticles(); // просто пересоздаём
}


// Обновление частиц при смене темы
function updateParticles() {
    // Пересоздаём частицы
    particlesCreated = false;
    createParticles();
}





// ========== ПАУЗА ПРИ СВЁРТЫВАНИИ ==========
let gamePaused = false;
let pauseStartTime = 0;
let pausedTimeAccumulator = 0; // сколько времени было на паузе

// Функция для постановки игры на паузу
function pauseGame() {
    if (gamePaused || gameState.frozen) return;
    if (!gameState.timerId) return;
    
    gamePaused = true;
    pauseStartTime = Date.now();
    
    // Останавливаем таймер
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
    
    console.log('⏸️ Игра на паузе');
    showToast('⏸️ Игра на паузе');
}

// Функция для возобновления игры
function resumeGame() {
    if (!gamePaused) return;
    if (gameState.frozen) {
        gamePaused = false;
        return;
    }
    
    // Вычисляем, сколько времени прошло на паузе
    const pauseDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
    pausedTimeAccumulator += pauseDuration;
    
    // Отнимаем время паузы от оставшегося времени (чтобы время не тикало на паузе)
    // Но не даём времени стать отрицательным
    gameState.timeLeft = Math.max(0, gameState.timeLeft);
    
    gamePaused = false;
    pauseStartTime = 0;
    
    // Перезапускаем таймер
    if (!gameState.frozen && gameState.timeLeft > 0) {
        startTimer();
        console.log('▶️ Игра возобновлена');
        showToast('▶️ Игра продолжается');
    } else if (gameState.timeLeft <= 0) {
        // Если время уже вышло — обрабатываем
        handleTimeOut();
    }
}

// Обработчик видимости страницы
function handleVisibilityChange() {
    if (document.hidden) {
        // Страница скрыта (свернута или другая вкладка)
        pauseGame();
    } else {
        // Страница видна (пользователь вернулся)
        // Даём небольшую задержку, чтобы всё стабилизировалось
        setTimeout(resumeGame, 100);
    }
}

// Обработчик потери/получения фокуса окном
function handleWindowFocus() {
    // Окно получило фокус
    if (gamePaused) {
        setTimeout(resumeGame, 100);
    }
}

function handleWindowBlur() {
    // Окно потеряло фокус (пользователь переключился на другую программу)
    if (!gamePaused && !gameState.frozen && gameState.timerId) {
        pauseGame();
    }
}

// Функция для очистки всех обработчиков паузы (при перезапуске)
function cleanupPauseHandlers() {
    gamePaused = false;
    pauseStartTime = 0;
    pausedTimeAccumulator = 0;
}

// ========== СОСТОЯНИЕ ИГРЫ ==========
let gameState = {
    level: 1,
    totalScore: 0,
    levelScore: 0,
    hintsLeft: CONFIG.HINTS_START,
    soundEnabled: true,
    
    baseWord: "",
    baseLetters: [],
    baseFreq: {},
    
    currentWord: [],
    
    foundWords: new Set(),      // все найденные слова
    foundList: [],              // порядок найденных
    possibleWords: new Set(),   // все возможные слова из текущего baseWord
    
    timeLeft: CONFIG.TIME_PER_LEVEL,
    timerId: null,
    frozen: false,
    
    thresholdReached: false
};

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function getCurrentThreshold() {
    const step = Math.max(0, gameState.level - 1);
    return Math.min(
        CONFIG.LEVEL_THRESHOLD_MAX,
        CONFIG.LEVEL_THRESHOLD_START + step * CONFIG.LEVEL_THRESHOLD_STEP
    );
}

function updateThresholdFlag() {
    // Теперь порог — это просто 20 найденных слов
    const need = CONFIG.WORDS_TO_COMPLETE;
    const before = gameState.thresholdReached;
    gameState.thresholdReached = gameState.foundWords.size >= need;
    
    if (gameState.thresholdReached && !before && !gameState.frozen) {
        showToast("🎉 Найдено 20 слов! Открыт следующий уровень!");
        playSound("levelup");
        blinkNextButton();
    }
    
    updateNextButton();
    updateProgressBar();
}

function updateNextButton() {
    const btn = document.getElementById("nextLevelBtn");
    if (!btn) return;
    
    if (gameState.thresholdReached && !gameState.frozen) {
        btn.classList.add("active");
        btn.disabled = false;
        btn.textContent = "✨ Следующий уровень ✨";
    } else {
        btn.classList.remove("active");
        btn.disabled = true;
        const need = CONFIG.WORDS_TO_COMPLETE;
        const remain = Math.max(0, need - gameState.foundWords.size);
        btn.textContent = `🔒 Нужно найти ещё ${remain} слов`;
    }
}

function updateProgressBar() {
    const need = CONFIG.WORDS_TO_COMPLETE;
    const percent = (gameState.foundWords.size / need) * 100;
    const fill = document.getElementById("progressFill");
    const text = document.getElementById("progressText");
    if (fill) fill.style.width = `${Math.min(100, percent)}%`;
    if (text) text.textContent = `${gameState.foundWords.size} / ${need}`;
}

function updateUI() {
    document.getElementById("level").textContent = gameState.level;
    document.getElementById("score").textContent = gameState.totalScore + gameState.levelScore;
    document.getElementById("timer").textContent = formatTime(gameState.timeLeft);
    document.getElementById("hintCount").textContent = gameState.hintsLeft;
    document.getElementById("baseWord").textContent = gameState.baseWord;
    
    const timerCard = document.querySelector(".stat-time");
    if (gameState.timeLeft <= 10 && !gameState.frozen) {
        timerCard.classList.add("warning");
    } else {
        timerCard.classList.remove("warning");
    }
    
    updateNextButton();
    updateProgressBar();
    updateSubmitButtonState();
}

function updateSubmitButtonState() {
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
        submitBtn.disabled = gameState.frozen || gameState.currentWord.length === 0;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// ========== ЗВУКИ ==========
let audioContext = null;

async function initAudio() {
    if (!gameState.soundEnabled) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await audioContext.resume();
    } catch (e) {
        console.log("Audio not supported");
    }
}

function playSound(type) {
    if (!gameState.soundEnabled || !audioContext) return;
    
    const frequencies = {
        click: 880,
        success: 1318.52,
        error: 440,
        levelup: 1046.5,
        hint: 1174.66
    };
    
    const freq = frequencies[type] || 880;
    const duration = type === "success" ? 0.2 : 0.15;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        gain.gain.value = 0.3;
        oscillator.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {}
}

// ========== ТОСТЫ ==========
let toastTimeout = null;
function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.background = isError ? "#ef4444" : "#1f2937";
    toast.classList.add("show");
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
}

// ========== ЛОГИКА СЛОВ ==========
function getFrequencyMap(word) {
    const map = {};
    for (const ch of word) {
        map[ch] = (map[ch] || 0) + 1;
    }
    return map;
}

function canCompose(word, baseFreq) {
    const needed = {};
    for (const ch of word) {
        needed[ch] = (needed[ch] || 0) + 1;
        if ((baseFreq[ch] || 0) < needed[ch]) return false;
    }
    return true;
}

function findAllPossibleWords(baseWord) {
    const baseFreq = getFrequencyMap(baseWord);
    const result = new Set();
    
    for (const dictWord of DICTIONARY) {
        if (dictWord === baseWord) continue;
        if (dictWord.length < CONFIG.MIN_WORD_LEN) continue;
        if (canCompose(dictWord, baseFreq)) {
            result.add(dictWord);
        }
    }
    return result;
}

// Выбираем случайное слово из пула (длиннее 6 букв)
function getRandomBaseWord() {
    return BASE_WORDS_POOL[Math.floor(Math.random() * BASE_WORDS_POOL.length)];
}

// ========== УРОВНИ ==========
function initLevel() {
    // Очищаем состояние паузы
    cleanupPauseHandlers();
    
    // Выбираем случайное слово из отфильтрованного пула
    gameState.baseWord = getRandomBaseWord();
    gameState.baseLetters = gameState.baseWord.split("");
    gameState.baseFreq = getFrequencyMap(gameState.baseWord);
    gameState.possibleWords = findAllPossibleWords(gameState.baseWord);
    
    gameState.currentWord = [];
    gameState.foundWords.clear();
    gameState.foundList = [];
    gameState.levelScore = 0;
    gameState.thresholdReached = false;
    gameState.frozen = false;
    gameState.timeLeft = CONFIG.TIME_PER_LEVEL;
    
    if (gameState.timerId) clearInterval(gameState.timerId);
    startTimer();
    
    renderLetters();
    renderCurrentWord();
    renderFoundWords();
    updateUI();
    updateThresholdFlag();
    // ====== ЧАСТИЦЫ В БЛОКЕ НАЙДЕННЫХ СЛОВ ======
    setTimeout(initFoundParticles, 50);
    // ============================================
    
    // Проверяем и показываем баннер на новом уровне
    if (typeof checkAndShowBanner === 'function') {
        checkAndShowBanner();
    }
    
    console.log(`🎮 Новый уровень! Базовое слово: ${gameState.baseWord} (${gameState.baseWord.length} букв)`);
    console.log(`📝 Возможных слов: ${gameState.possibleWords.size}`);
}

function startTimer() {
    // Если игра на паузе — не запускаем таймер
    if (gamePaused) return;
    if (gameState.frozen) return;
    
    // Очищаем старый таймер, если есть
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
    
    // Не запускаем, если время уже вышло
    if (gameState.timeLeft <= 0) {
        handleTimeOut();
        return;
    }
    
    gameState.timerId = setInterval(() => {
        // Проверка: если игра на паузе — просто выходим
        if (gamePaused) return;
        if (gameState.frozen) return;
        
        gameState.timeLeft--;
        updateUI();
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timerId);
            gameState.timerId = null;
            handleTimeOut();
        }
    }, 1000);
}

function handleTimeOut() {
    // Если игра на паузе — не обрабатываем
    if (gamePaused) return;
    
    if (gameState.foundWords.size >= CONFIG.WORDS_TO_COMPLETE) {
        nextLevel();
    } else {
        // ========== ОТПРАВКА УРОВНЯ В ВК ==========
        if (typeof sendscore === 'function') {
            sendscore();
        }
        // ==========================================
        
        showPermanentToast("⏰ Время вышло! Игра окончена. Нажмите «Начать заново»", true);
        gameState.frozen = true;
        updateUI();
    }
}
// ========== ПОСТОЯННЫЙ ТОСТ ==========
let permanentToast = null;

function showPermanentToast(message, isError = false) {
    // Удаляем старый постоянный тост, если есть
    if (permanentToast) {
        permanentToast.remove();
        permanentToast = null;
    }
    
    // Создаём новый тост
    permanentToast = document.createElement("div");
    permanentToast.className = "toast toast-permanent";
    permanentToast.textContent = message;
    permanentToast.style.background = isError ? "#ef4444" : "#1f2937";
    permanentToast.style.position = "fixed";
    permanentToast.style.bottom = "30px";
    permanentToast.style.left = "50%";
    permanentToast.style.transform = "translateX(-50%)";
    permanentToast.style.padding = "14px 28px";
    permanentToast.style.borderRadius = "60px";
    permanentToast.style.fontSize = "16px";
    permanentToast.style.fontWeight = "600";
    permanentToast.style.zIndex = "1001";
    permanentToast.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
    permanentToast.style.whiteSpace = "nowrap";
    permanentToast.style.cursor = "pointer";
    
    permanentToast.innerHTML = `${message} <span style="margin-left:12px; opacity:0.7;">✖</span>`;
    
    permanentToast.onclick = () => {
        if (permanentToast) {
            permanentToast.remove();
            permanentToast = null;
        }
    };
    
    document.body.appendChild(permanentToast);
}

function clearPermanentToast() {
    if (permanentToast) {
        permanentToast.remove();
        permanentToast = null;
    }
}

// ========== РЕНДЕРИНГ ==========
function renderLetters() {
    const grid = document.getElementById("lettersGrid");
    if (!grid) return;
    
    grid.innerHTML = "";
    gameState.baseLetters.forEach((letter, idx) => {
        const btn = document.createElement("button");
        btn.className = "letter-tile";
        btn.textContent = letter;
        btn.dataset.index = idx;
        btn.onclick = () => onLetterClick(idx);
        grid.appendChild(btn);
    });
    updateLettersDisabled();
}

function onLetterClick(idx) {
    if (gameState.frozen) return;
    playSound("click");
    
    const letter = gameState.baseLetters[idx];
    gameState.currentWord.push({ letter, index: idx });
    renderCurrentWord();
    updateLettersDisabled();
    updateSubmitButtonState();
}

function updateLettersDisabled() {
    const usedIndices = new Set(gameState.currentWord.map(item => item.index));
    const tiles = document.querySelectorAll(".letter-tile");
    tiles.forEach((tile, i) => {
        tile.disabled = usedIndices.has(i);
    });
}

function renderCurrentWord() {
    const container = document.getElementById("currentWord");
    if (!container) return;
    
    container.innerHTML = "";
    if (gameState.currentWord.length === 0) {
        container.innerHTML = '<span class="placeholder">Нажмите на буквы...</span>';
        return;
    }
    
    gameState.currentWord.forEach((item, pos) => {
        const chip = document.createElement("span");
        chip.className = "letter-chip";
        chip.textContent = item.letter;
        chip.onclick = () => removeLetterAt(pos);
        container.appendChild(chip);
    });
}

function removeLetterAt(pos) {
    if (gameState.frozen) return;
    gameState.currentWord.splice(pos, 1);
    renderCurrentWord();
    updateLettersDisabled();
    updateSubmitButtonState();
}

function renderFoundWords() {
    const container = document.getElementById("foundWords");
    if (!container) return;
    
    if (gameState.foundList.length === 0) {
        container.innerHTML = '<div class="empty-message">✨ Слова появятся здесь...</div>';
        return;
    }
    
    container.innerHTML = "";
    gameState.foundList.forEach(word => {
        const badge = document.createElement("div");
        badge.className = "found-word";
        badge.innerHTML = `${word} <span>+${word.length}</span>`;
        container.appendChild(badge);
    });
}

// ========== ИГРОВЫЕ ДЕЙСТВИЯ ==========
function submitWord() {
    if (gameState.frozen) return;
    if (gameState.currentWord.length === 0) {
        showToast("Сначала соберите слово!", true);
        return;
    }
    
    const word = gameState.currentWord.map(item => item.letter).join("");
    
    if (word.length < CONFIG.MIN_WORD_LEN) {
        showToast(`Минимальная длина слова — ${CONFIG.MIN_WORD_LEN} буквы`, true);
        playSound("error");
        return;
    }
    
    if (word === gameState.baseWord) {
        showToast("Базовое слово нельзя использовать!", true);
        playSound("error");
        return;
    }
    
    if (gameState.foundWords.has(word)) {
        showToast("Вы уже находили это слово!", true);
        playSound("error");
        return;
    }
    
    if (!DICTIONARY.includes(word)) {
        showToast("Такого слова нет в словаре 😔", true);
        playSound("error");
        return;
    }
    
    if (!canCompose(word, gameState.baseFreq)) {
        showToast("Нельзя составить из этих букв!", true);
        playSound("error");
        return;
    }
    
    // Принимаем слово
    gameState.foundWords.add(word);
    gameState.foundList.push(word);
    
    const points = word.length;
    gameState.levelScore += points;
    gameState.timeLeft += CONFIG.TIME_BONUS_PER_WORD;
    
    playSound("success");
    showToast(`✅ "${word}" +${points} очков! +${CONFIG.TIME_BONUS_PER_WORD} сек!`);
    
    gameState.currentWord = [];
    renderCurrentWord();
    renderFoundWords();
    updateLettersDisabled();
    updateUI();
    updateThresholdFlag();
}

function backspace() {
    if (gameState.frozen) return;
    if (gameState.currentWord.length === 0) return;
    playSound("click");
    gameState.currentWord.pop();
    renderCurrentWord();
    updateLettersDisabled();
    updateSubmitButtonState();
}

function clearWord() {
    if (gameState.frozen) return;
    if (gameState.currentWord.length === 0) return;
    playSound("click");
    gameState.currentWord = [];
    renderCurrentWord();
    updateLettersDisabled();
    updateSubmitButtonState();
}

function shuffleLetters() {
    if (gameState.frozen) return;
    playSound("click");
    for (let i = gameState.baseLetters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.baseLetters[i], gameState.baseLetters[j]] = [gameState.baseLetters[j], gameState.baseLetters[i]];
    }
    renderLetters();
    showToast("🔀 Буквы перемешаны");
}

function useHint() {
    if (gameState.frozen) return;
    if (gameState.hintsLeft <= 0) {
        showToast("Подсказки закончились!", true);
        playSound("error");
        return;
    }
    
    const notFound = [...gameState.possibleWords].filter(w => !gameState.foundWords.has(w));
    if (notFound.length === 0) {
        showToast("Все слова уже найдены! 🎉");
        return;
    }
    
    const hintWord = notFound[Math.floor(Math.random() * notFound.length)];
    gameState.hintsLeft--;
    
    // Добавляем слово через подсказку
    gameState.foundWords.add(hintWord);
    gameState.foundList.push(hintWord);
    
    const points = hintWord.length;
    gameState.levelScore += points;
    gameState.timeLeft += CONFIG.TIME_BONUS_PER_WORD;
    
    playSound("hint");
    showToast(`💡 Подсказка: "${hintWord}" +${points} очков!`);
    
    renderFoundWords();
    updateUI();
    updateThresholdFlag();
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const soundBtn = document.getElementById("soundBtn");
    if (soundBtn) {
        soundBtn.textContent = gameState.soundEnabled ? "🔊" : "🔇";
    }
    if (gameState.soundEnabled && !audioContext) {
        initAudio();
    }
    showToast(gameState.soundEnabled ? "🔊 Звук включён" : "🔇 Звук выключен");
}

// ====== МОДАЛКА ПЕРЕЗАПУСКА ======
const restartModal = document.getElementById('restartModal');
const restartModalCancel = document.getElementById('restartModalCancel');
const restartModalConfirm = document.getElementById('restartModalConfirm');

// Кнопка "Начать заново" в игре
const restartBtn = document.getElementById('restartBtn');
if (restartBtn) {
    restartBtn.onclick = () => {
        if (restartModal) {
            restartModal.classList.add('show');
        }
    };
}

// Отмена — закрываем модалку
if (restartModalCancel) {
    restartModalCancel.onclick = () => {
        restartModal.classList.remove('show');
    };
}

// Клик вне модалки — закрываем
if (restartModal) {
    restartModal.onclick = (e) => {
        if (e.target === restartModal) {
            restartModal.classList.remove('show');
        }
    };
}

// Подтверждение — перезапускаем игру
if (restartModalConfirm) {
    restartModalConfirm.onclick = () => {
        restartModal.classList.remove('show');
        
        // Очищаем паузу
        cleanupPauseHandlers();
        
        // Очищаем постоянный тост
        clearPermanentToast();
        
        // Сбрасываем состояние
        gameState.level = 1;
        gameState.totalScore = 0;
        gameState.hintsLeft = CONFIG.HINTS_START;
        gameState.frozen = false;
        gamePaused = false;
        
        // Показываем баннер
        setTimeout(checkAndShowBanner, 500);
        
        // Запускаем уровень
        initLevel();
        updateUI();
        playSound("click");
        
        // Показываем уведомление
        showToast("🔄 Игра перезапущена!");
    };
}

// Закрытие по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (restartModal && restartModal.classList.contains('show')) {
            restartModal.classList.remove('show');
        }
    }
});

function nextLevel() {
    if (!gameState.thresholdReached) {
        showToast("Сначала достигните порога!", true);
        return;
    }
    
    gameState.totalScore += gameState.levelScore + CONFIG.SCORE_BONUS_PER_LEVEL;
    gameState.level++;
        // ========== ОТПРАВКА УРОВНЯ В ВК ==========
    if (typeof sendscore === 'function') {
        sendscore();  // вызов вашей функции
    }
    // ===========================================
    
    initLevel();
    updateUI();
    showToast(`🎉 Уровень ${gameState.level}! +${CONFIG.SCORE_BONUS_PER_LEVEL} бонусных очков!`);
    playSound("levelup");
}

function blinkNextButton() {
    const btn = document.getElementById("nextLevelBtn");
    if (btn && btn.classList.contains("active")) {
        btn.style.animation = "none";
        btn.offsetHeight;
        btn.style.animation = "pulse 0.5s ease-in-out 2";
        setTimeout(() => {
            btn.style.animation = "";
        }, 1000);
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function initGame() {
        // ====== ПРИМЕНЯЕМ ТЕМУ ======
    applyTheme(currentTheme);
    // Проверяем, есть ли слова для загадывания
    if (BASE_WORDS_POOL.length === 0) {
        console.error("❌ Нет слов длиннее 6 букв! Добавьте слова в DICTIONARY.");
        showToast("Ошибка: нет подходящих слов для игры", true);
        return;
    }
    
    initLevel();
    initAudio();
       initVKBridge(); 
    
    document.getElementById("submitBtn").onclick = submitWord;
    document.getElementById("backspaceBtn").onclick = backspace;
    document.getElementById("clearBtn").onclick = clearWord;
    document.getElementById("shuffleBtn").onclick = shuffleLetters;
    document.getElementById("hintBtn").onclick = useHint;
    document.getElementById("soundBtn").onclick = toggleSound;
 //   document.getElementById("restartBtn").onclick = restartGame;
    document.getElementById("nextLevelBtn").onclick = nextLevel;
/*// Таблица лидеров =================
const leaderboardBtn = document.getElementById("leaderboardBtn");
if (leaderboardBtn) {
    leaderboardBtn.onclick = () => {
        if (typeof top0 === 'function') {
            top0();
        } else {
            console.log("Функция top0 не найдена в App.js");
        }
    };
}  */
// Кнопка "Пригласить"
const shareBtn = document.getElementById("shareBtn");
if (shareBtn) {
    shareBtn.onclick = () => {
        if (typeof share2 === 'function') {
            share2();
        } else {
            console.log("Функция share2 не найдена в App.js");
        }
    };
}
//========================================================
    
    const modal = document.getElementById("modal");
    const modalNext = document.getElementById("modalNextBtn");
    const modalRestart = document.getElementById("modalRestartBtn");
    
    if (modalNext) modalNext.onclick = () => {
        modal.classList.remove("show");
        nextLevel();
    };
    if (modalRestart) modalRestart.onclick = () => {
        modal.classList.remove("show");
        restartGame();
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove("show");
    };
    
    const style = document.createElement("style");
    style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);
    
 // ====== ПОДПИСКА НА СОБЫТИЯ ПАУЗЫ ======
    // Слушаем изменение видимости страницы
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Слушаем фокус окна
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    
    console.log(`✅ Игра запущена! Доступно слов для загадывания: ${BASE_WORDS_POOL.length}`);
}

// ========== НАЧАЛЬНЫЙ ЭКРАН ==========

// Элементы
const startScreen = document.getElementById('startScreen');
const startPlayBtn = document.getElementById('startPlayBtn');
const startRulesBtn = document.getElementById('startRulesBtn');
const startThemeBtn = document.getElementById('startThemeBtn');
const startShareBtn = document.getElementById('startShareBtn');
const startSoundBtn = document.getElementById('startSoundBtn');

// Модалки
const rulesModal = document.getElementById('rulesModal');
const rulesModalClose = document.getElementById('rulesModalClose');
const rulesModalStartBtn = document.getElementById('rulesModalStartBtn');

const themeModal = document.getElementById('themeModal');
const themeModalClose = document.getElementById('themeModalClose');


// ====== УПРАВЛЕНИЕ ТЕМАМИ ======
const THEME_KEY = 'wordgame_theme';
let currentTheme = localStorage.getItem(THEME_KEY) || 'light';

function applyTheme(theme) {
    currentTheme = theme;
    
    // Применяем к body и html
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    // 2. Обновляем активную кнопку в модалке темы
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    // 3. Обновляем подпись в модалке
    const themeNames = {
        light: 'Светлая',
        dark: 'Тёмная',
        blue: 'Голубая',
        green: 'Зелёная'
    };
    const currentLabel = document.getElementById('themeCurrent');
    if (currentLabel) {
        currentLabel.textContent = `Текущая: ${themeNames[theme] || 'Светлая'}`;
    }
    
    // 4. Применяем тему к игровым элементам (если игра уже запущена)
    applyThemeToGame(theme);
    
    // 5. Обновляем частицы фона
    updateParticles();
   // Обновляем частицы в блоке найденных слов
    setTimeout(initFoundParticles, 50);
    
    console.log(`🎨 Тема изменена на: ${themeNames[theme] || theme}`);
}

// Применение темы к элементам игры
function applyThemeToGame(theme) {
    // Игровой контейнер
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.style.background = getThemeColor(theme, 'card');
        gameContainer.style.color = getThemeColor(theme, 'text');
    }
    
    // Статистика
    document.querySelectorAll('.stat-card').forEach(el => {
        el.style.background = getThemeColor(theme, 'bgLight');
        el.style.color = getThemeColor(theme, 'text');
    });
    
    // Базовое слово
    const baseWord = document.getElementById('baseWord');
    if (baseWord) {
        baseWord.style.color = getThemeColor(theme, 'text');
    }
    
    // Буквы
    document.querySelectorAll('.letter-tile').forEach(el => {
        // Оставляем градиент, меняем только фон если нужно
        if (theme === 'dark' || theme === 'green' || theme === 'blue') {
            el.style.background = getThemeColor(theme, 'primary');
        }
    });
    
    // Текущее слово
    const currentWord = document.querySelector('.current-word-section');
    if (currentWord) {
        currentWord.style.background = getThemeColor(theme, 'bgLight');
        currentWord.style.borderColor = getThemeColor(theme, 'border');
    }
    
    // Найденные слова
    const foundSection = document.querySelector('.found-section');
    if (foundSection) {
        foundSection.style.background = getThemeColor(theme, 'bgLight');
    }
    
    // Кнопки
    document.querySelectorAll('.control-btn').forEach(el => {
        if (!el.id || el.id !== 'submitBtn') {
            el.style.background = getThemeColor(theme, 'btnSecondary');
            el.style.color = getThemeColor(theme, 'text');
            el.style.borderColor = getThemeColor(theme, 'border');
        }
    });
}

// Вспомогательная функция для получения цветов темы
function getThemeColor(theme, type) {
    const colors = {
        light: {
            card: 'rgba(255, 255, 255, 0.98)',
            text: '#1f2937',
            bgLight: '#f9fafb',
            border: '#e5e7eb',
            primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            btnSecondary: '#f3f4f6'
        },
        dark: {
            card: '#1a1a2e',
            text: '#e5e7eb',
            bgLight: '#1e1e3a',
            border: '#2d2d44',
            primary: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
            btnSecondary: '#2d2d44'
        },
        blue: {
            card: '#f0f8ff',
            text: '#1a365d',
            bgLight: '#e3f0fa',
            border: '#c5dff8',
            primary: 'linear-gradient(135deg, #4a9eff 0%, #6c5ce7 100%)',
            btnSecondary: '#d4e8f7'
        },
        green: {
            card: '#f0f7f0',
            text: '#1a3a1a',
            bgLight: '#e3f0e3',
            border: '#c5e0c5',
            primary: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
            btnSecondary: '#d4e8d4'
        }
    };
    
    return colors[theme]?.[type] || colors.light[type];
}

function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    currentTheme = savedTheme;
    
    // Применяем к body (уже должно быть, но на всякий случай)
    document.body.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Обновляем активную кнопку в модалке
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === savedTheme);
    });
    
    // Обновляем подпись
    const themeNames = {
        light: 'Светлая',
        dark: 'Тёмная',
        blue: 'Голубая',
        green: 'Зелёная'
    };
    const currentLabel = document.getElementById('themeCurrent');
    if (currentLabel) {
        currentLabel.textContent = `Текущая: ${themeNames[savedTheme] || 'Светлая'}`;
    }
    
    // Применяем тему к элементам игры
    applyThemeToGame(savedTheme);
    
    // Обновляем частицы
    updateParticles();
}

// ========== ЧАСТИЦЫ ДЛЯ БЛОКА НАЙДЕННЫХ СЛОВ ==========
let foundParticlesCreated = false;

function createFoundParticles() {
    const container = document.getElementById('foundWords');
    if (!container) return;
    
    // Очищаем старые частицы (но не трогаем слова)
    const existingParticles = container.querySelectorAll('.found-particle');
    existingParticles.forEach(el => el.remove());
    
    // Определяем цвета в зависимости от темы
    const theme = document.body.getAttribute('data-theme') || 'light';
    let colors = ['#667eea', '#764ba2', '#4a9eff', '#6c5ce7'];
    
    switch(theme) {
        case 'dark':
            colors = ['#6c5ce7', '#a29bfe', '#fd79a8', '#74b9ff'];
            break;
        case 'blue':
            colors = ['#4a9eff', '#6c5ce7', '#74b9ff', '#a29bfe'];
            break;
        case 'green':
            colors = ['#43a047', '#2e7d32', '#66bb6a', '#a5d6a7'];
            break;
        default:
            colors = ['#667eea', '#764ba2', '#4a9eff', '#6c5ce7'];
            break;
    }
    
    // Создаём 8-12 маленьких частиц
    const count = 8 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('span');
        particle.className = 'found-particle';
        particle.style.cssText = `
            position: absolute;
            width: ${3 + Math.random() * 4}px;
            height: ${3 + Math.random() * 4}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: 50%;
            pointer-events: none;
            opacity: 0.3;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: foundParticleFloat ${4 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 3}s;
            transform: translate(-50%, -50%);
            z-index: 0;
        `;
        container.appendChild(particle);
    }
    
    foundParticlesCreated = true;
}

// Обновление частиц при смене темы
function updateFoundParticles() {
    foundParticlesCreated = false;
    createFoundParticles();
}

// ====== МЕНЮ ======
// Кнопка "Начать игру"
if (startPlayBtn) {
    startPlayBtn.onclick = () => {
        applyTheme(currentTheme);
         // Частицы — под игру
        setParticlesBelowGame();
        // Показываем игровой контейнер
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = '';
        }
        
        startScreen.classList.add('hidden');
        setTimeout(() => {
            startScreen.style.display = 'none';
        }, 500);
        
        if (typeof initGame === 'function') {
            initGame();
        }
    };
}

// Кнопка "Как играть"
if (startRulesBtn) {
    startRulesBtn.onclick = () => {
        rulesModal.classList.add('show');
    };
}

// Закрытие модалки правил
if (rulesModalClose) {
    rulesModalClose.onclick = () => {
        rulesModal.classList.remove('show');
    };
}

if (rulesModal) {
    rulesModal.onclick = (e) => {
        if (e.target === rulesModal) {
            rulesModal.classList.remove('show');
        }
    };
}

if (rulesModalStartBtn) {
    rulesModalStartBtn.onclick = () => {
        applyTheme(currentTheme);
          // Частицы — под игру
        setParticlesBelowGame();
        // Показываем игровой контейнер
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = '';
        }
        
        rulesModal.classList.remove('show');
        startScreen.classList.add('hidden');
        setTimeout(() => {
            startScreen.style.display = 'none';
        }, 500);
        
        if (typeof initGame === 'function') {
            initGame();
        }
    };
}

// ====== ТЕМА ======
if (startThemeBtn) {
    startThemeBtn.onclick = () => {
        themeModal.classList.add('show');
    };
}

if (themeModalClose) {
    themeModalClose.onclick = () => {
        themeModal.classList.remove('show');
    };
}

if (themeModal) {
    themeModal.onclick = (e) => {
        if (e.target === themeModal) {
            themeModal.classList.remove('show');
        }
    };
}

// Выбор темы
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
        const theme = btn.dataset.theme;
        applyTheme(theme);
        
        // Если игра уже запущена, обновляем её
        if (typeof applyThemeToGame === 'function') {
            applyThemeToGame(theme);
        }
        
        // Не закрываем модалку сразу, чтобы пользователь видел выбор
        setTimeout(() => {
            themeModal.classList.remove('show');
        }, 300);
    };
});

// ====== ЗВУК В МЕНЮ ======
if (startSoundBtn) {
    // Состояние звука берётся из gameState (если уже инициализирован)
    const updateSoundIcon = () => {
        if (typeof gameState !== 'undefined') {
            startSoundBtn.textContent = gameState.soundEnabled ? '🔊' : '🔇';
        }
    };
    
    startSoundBtn.onclick = () => {
        if (typeof toggleSound === 'function') {
            toggleSound();
            updateSoundIcon();
        }
    };
    
    // Обновляем иконку при загрузке
    setTimeout(updateSoundIcon, 100);
}

// ====== ПРИГЛАСИТЬ ДРУЗЕЙ ======
if (startShareBtn) {
    startShareBtn.onclick = () => {
        if (typeof share2 === 'function') {
            share2();
        } else {
            console.log('Функция share2 не найдена');
            // fallback
            if (navigator.share) {
                navigator.share({
                    title: 'Слова из слова',
                    text: 'Составь слова из букв! Попробуй и ты!',
                    url: window.location.href
                }).catch(() => {});
            }
        }
    };
}
// ====== КНОПКА ВОЗВРАТА В МЕНЮ ======
const menuBtn = document.getElementById('menuBtn');

if (menuBtn) {
    menuBtn.onclick = () => {
        // Показываем модалку подтверждения
        const exitModal = document.getElementById('exitModal');
        if (exitModal) {
            exitModal.classList.add('show');
        }
    };
}

// ====== МОДАЛКА ВЫХОДА В МЕНЮ ======
const exitModal = document.getElementById('exitModal');
const exitModalCancel = document.getElementById('exitModalCancel');
const exitModalConfirm = document.getElementById('exitModalConfirm');

// Отмена — закрываем модалку
if (exitModalCancel) {
    exitModalCancel.onclick = () => {
        exitModal.classList.remove('show');
    };
}

// Клик вне модалки — закрываем
if (exitModal) {
    exitModal.onclick = (e) => {
        if (e.target === exitModal) {
            exitModal.classList.remove('show');
        }
    };
}

// Подтверждение — выходим в меню
if (exitModalConfirm) {
    exitModalConfirm.onclick = () => {
        exitModal.classList.remove('show');
        
        // Останавливаем таймер
        if (gameState.timerId) {
            clearInterval(gameState.timerId);
            gameState.timerId = null;
        }
        
        // Очищаем паузу
        cleanupPauseHandlers();
  // Частицы — над фоном меню
        setParticlesAboveMenu();
        // Показываем начальный экран
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.style.display = 'flex';
            setTimeout(() => {
                startScreen.classList.remove('hidden');
            }, 10);
        }
        
        // Скрываем игровой контейнер
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        
        // Сбрасываем флаг игры
        gameState.frozen = true;
        
        // Показываем VK навигацию (если была скрыта)
        if (typeof showVKView === 'function') {
            setTimeout(showVKView, 300);
        }
        
        // Очищаем тост
        clearPermanentToast();
        
        console.log('🏠 Возврат в главное меню');
    };
}

// ========== ЧАСТИЦЫ В БЛОКЕ НАЙДЕННЫХ СЛОВ ==========
function initFoundParticles() {
    const container = document.querySelector('.found-section');
    if (!container) return;
    
    // Удаляем старые частицы (если есть)
    const oldParticles = container.querySelectorAll('.found-particle');
    oldParticles.forEach(el => el.remove());
    
    // Цвета частиц в зависимости от темы
    const theme = document.body.getAttribute('data-theme') || 'light';
    let colors = ['#667eea', '#764ba2', '#4a9eff', '#6c5ce7', '#a29bfe'];
    
    switch(theme) {
        case 'dark':
            colors = ['#6c5ce7', '#a29bfe', '#fd79a8', '#74b9ff', '#81ecec'];
            break;
        case 'blue':
            colors = ['#4a9eff', '#6c5ce7', '#74b9ff', '#a29bfe', '#81ecec'];
            break;
        case 'green':
            colors = ['#43a047', '#2e7d32', '#66bb6a', '#a5d6a7', '#81c784'];
            break;
        default:
            colors = ['#667eea', '#764ba2', '#4a9eff', '#6c5ce7', '#a29bfe'];
            break;
    }
    
    // Создаём 10-15 частиц
    const count = 10 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'found-particle';
        const size = 3 + Math.random() * 5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            opacity: 0.2;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: foundParticleFloat ${5 + Math.random() * 5}s ease-in-out infinite;
            animation-delay: ${Math.random() * 4}s;
            z-index: 0;
        `;
        container.appendChild(particle);
    }
}

// Закрытие модалки по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const exitModal = document.getElementById('exitModal');
        if (exitModal && exitModal.classList.contains('show')) {
            exitModal.classList.remove('show');
        }
    }
});

// Инициализация темы при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});


// Также применяем тему при её изменении в игре (если функция уже существует)
if (typeof window.applyTheme === 'undefined') {
    window.applyTheme = applyTheme;
}
// ====== ОТКЛЮЧАЕМ КОНТЕКСТНОЕ МЕНЮ ======
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// Отключаем выделение текста
document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
});

// Отключаем перетаскивание
document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
});
document.addEventListener("DOMContentLoaded", initGame);