// Проверка загрузки словаря
if (typeof DICTIONARY === 'undefined') {
    console.error("❌ Словарь не загружен! Проверьте подключение words.js");
    alert("Ошибка загрузки игры. Обновите страницу.");
}
// В самом начале game.js, после проверки словаря, добавьте:

document.addEventListener('DOMContentLoaded', function() {
    // Показываем меню плавно через 100ms после загрузки
    setTimeout(function() {
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.classList.add('loaded');
        }
    }, 100);
});

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
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
        return;
    }
    
    // Проверяем, что мы внутри ВК
    try {
        const isVK = window.location !== window.parent.location;
        if (!isVK) return;
    } catch (e) {
        return;
    }
    
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

// Проверить и показать баннер
function checkAndShowBanner() {
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
        return;
    }
    
    // Проверяем, что мы внутри ВК
    try {
        const isVK = window.location !== window.parent.location;
        if (!isVK) return;
    } catch (e) {
        return;
    }
    
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

// Инициализация VK Bridge
function initVKBridge() {
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
        return;
    }
    
    // ====== ИНИЦИАЛИЗАЦИЯ VK BRIDGE ======
    vkBridge.send('VKWebAppInit', {})
        .then(() => {
            console.log('✅ VK Bridge инициализирован');
            
            // После инициализации показываем баннер
            setTimeout(checkAndShowBanner, 500);
            
            // Подписываемся на события VK
            vkBridge.subscribe((e) => {
                const type = e.detail.type;
                
                // Когда пользователь сворачивает приложение
                if (type === 'VKWebAppViewHide') {
                    console.log('📱 Приложение свернуто');
                    pauseGame();
                }
                
                // Когда пользователь возвращается в приложение
                if (type === 'VKWebAppViewRestore') {
                    console.log('📱 Приложение восстановлено');
                    resumeGame();
                }
                
                // Когда обновляется конфигурация (например, размер окна)
                if (type === 'VKWebAppUpdateConfig') {
                    console.log('📱 Обновлена конфигурация VK');
                }
                
                // Когда пользователь закрывает баннер
                if (type === 'VKWebAppBannerAdClosedByUser') {
                    console.log('ℹ️ Баннер закрыт, пробуем показать снова через 30 сек');
                    setTimeout(checkAndShowBanner, 30000);
                }
            });
        })
        .catch((error) => {
            console.warn('❌ Ошибка инициализации VK Bridge:', error);
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
function calculateBonus(word) {
    // Бонус за слово из 5+ букв: +1 очко
    if (word.length >= 5) {
        return 1;
    }
    return 0;
}
// ========== СОСТОЯНИЕ ИГРЫ ==========
let gameState = {
    level: 1,
    totalScore: 0,
    levelScore: 0,
    hintsLeft: CONFIG.HINTS_START,
    soundEnabled: true,
        bonusScore: 0,    
    
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
    
    // ← НОВОЕ: обновляем бонус
    const bonusCount = document.getElementById("bonusCount");
    if (bonusCount) {
        bonusCount.textContent = `🏆 Бонус: ${gameState.bonusScore}`;
    }
    
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
        gameState.bonusScore = 0;    
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
      //  if (typeof sendscore === 'function') {
      //      sendscore();
      //  }
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
       const bonus = calculateBonus(word); // ← НОВОЕ
    
    gameState.levelScore += points + bonus;  // ← БОНУС ДОБАВЛЯЕТСЯ
    gameState.bonusScore += bonus;            // ← НОВОЕ: общий бонус
    gameState.timeLeft += CONFIG.TIME_BONUS_PER_WORD;
    
    playSound("success");
     // ← ИЗМЕНЕНО: показываем бонус в тосте
    let toastMessage = `✅ "${word}" +${points} очков! +${CONFIG.TIME_BONUS_PER_WORD} сек!`;
    if (bonus > 0) {
        toastMessage += ` 🎁 Бонус +${bonus}!`;
    }
    showToast(toastMessage);
    // ====== ПРОВЕРКА ДОСТИЖЕНИЙ ======
checkAchievements();
// ================================
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
  //  if (typeof sendscore === 'function') {
   //     sendscore();  // вызов вашей функции
  //  }
      // ====== ПРОВЕРКА ДОСТИЖЕНИЙ ======
checkAchievements();
// ================================
    
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
     console.log('🚀 initGame вызвана');
    console.log('📱 Внутри VK?', window.location !== window.parent.location);
    // Проверяем, есть ли слова для загадывания
    if (BASE_WORDS_POOL.length === 0) {
        console.error("❌ Нет слов длиннее 6 букв! Добавьте слова в DICTIONARY.");
        showToast("Ошибка: нет подходящих слов для игры", true);
        return;
    }
    
    initLevel();
    initAudio();
   
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
    
    // 1. Применяем к body и html (глобально)
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
     // ====== ОБНОВЛЯЕМ СТАТИЧЕСКИЙ СТИЛЬ ИЗ HTML ======
    const themeColors = {
        light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        dark: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        blue: 'linear-gradient(135deg, #4a9eff 0%, #6c5ce7 100%)',
        green: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)'
    };
    
    const preloadStyle = document.getElementById('themePreloadStyle');
    if (preloadStyle) {
        preloadStyle.textContent = `
            body {
                background: ${themeColors[theme] || themeColors.light} !important;
                min-height: 100vh;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        `;
    }
    // =====================================================
     // ====== ОБНОВЛЯЕМ СТИЛИ МЕНЮ ======
    const themeColorsFull = {
        light: { card: 'rgba(255, 255, 255, 0.98)', text: '#1f2937', muted: '#9ca3af', border: '#f3f4f6' },
        dark: { card: '#1a1a2e', text: '#e5e7eb', muted: '#9ca3af', border: '#2d2d44' },
        blue: { card: '#f0f8ff', text: '#1a365d', muted: '#5a7a9a', border: '#c5dff8' },
        green: { card: '#f0f7f0', text: '#1a3a1a', muted: '#5a7a5a', border: '#c5e0c5' }
    };
    const colors = themeColorsFull[theme] || themeColorsFull.light;
    const isDark = theme === 'dark';
    
    const menuStyle = document.getElementById('themeMenuStyle');
    if (menuStyle) {
        menuStyle.textContent = `
            /* ===== СТИЛИ ДЛЯ МЕНЮ (ОБНОВЛЯЮТСЯ ПРИ СМЕНЕ ТЕМЫ) ===== */
            #startScreen {
                opacity: 0 !important;
                transition: opacity 0.5s ease !important;
            }
            #startScreen.loaded {
                opacity: 1 !important;
            }
            .start-screen__content {
                background: ${colors.card} !important;
                color: ${colors.text} !important;
                border-radius: 40px;
                padding: 48px 40px 36px;
                max-width: 420px;
                width: 100%;
                text-align: center;
                box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
                transition: background 0.4s ease, color 0.4s ease;
            }
            .start-screen__title {
                color: ${colors.text} !important;
            }
            .start-screen__subtitle {
                color: ${colors.muted} !important;
            }
            .start-screen__bottom {
                border-top-color: ${colors.border} !important;
            }
            .start-screen__btn--rules {
                background: ${isDark ? '#2d2d44' : '#f3f4f6'} !important;
                color: ${isDark ? '#e5e7eb' : '#4b5563'} !important;
            }
            .start-screen__icon-btn {
                background: ${isDark ? '#2d2d44' : '#f3f4f6'} !important;
            }
            .start-screen__footer {
                color: ${isDark ? '#6b7280' : '#d1d5db'} !important;
            }
        `;
    }
    // =================================================
    
    // Обновляем фон start-screen
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        startScreen.style.background = themeColors[theme] || themeColors.light;
    }
    // 2. Обновляем активный класс в списке тем
    document.querySelectorAll('.theme-item').forEach(item => {
        item.classList.toggle('active', item.dataset.theme === theme);
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
    
    // 4. Обновляем фон меню (start-screen)
      if (startScreen) {
        const themeBg = {
            light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            dark: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            blue: 'linear-gradient(135deg, #4a9eff 0%, #6c5ce7 100%)',
            green: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)'
        };
        startScreen.style.background = themeBg[theme] || themeBg.light;
    }
    
    // 5. Обновляем фон body
    document.body.style.background = getThemeColor(theme, 'bg');
    
    // 6. Применяем тему к игровым элементам (если игра запущена)
    applyThemeToGame(theme);
    
    // 7. Обновляем частицы
    updateParticles();
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
            bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            card: 'rgba(255, 255, 255, 0.98)',
            text: '#1f2937',
            bgLight: '#f9fafb',
            border: '#e5e7eb',
            primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            btnSecondary: '#f3f4f6'
        },
        dark: {
            bg: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            card: '#1a1a2e',
            text: '#e5e7eb',
            bgLight: '#1e1e3a',
            border: '#2d2d44',
            primary: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
            btnSecondary: '#2d2d44'
        },
        blue: {
            bg: 'linear-gradient(135deg, #4a9eff 0%, #6c5ce7 100%)',
            card: '#f0f8ff',
            text: '#1a365d',
            bgLight: '#e3f0fa',
            border: '#c5dff8',
            primary: 'linear-gradient(135deg, #4a9eff 0%, #6c5ce7 100%)',
            btnSecondary: '#d4e8f7'
        },
        green: {
            bg: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)',
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
     // Применяем к фону меню
    const startScreen = document.getElementById('startScreen');
    if (startScreen) {
        const themeBg = {
            light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            dark: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            blue: 'linear-gradient(135deg, #4a9eff 0%, #6c5ce7 100%)',
            green: 'linear-gradient(135deg, #43a047 0%, #1b5e20 100%)'
        };
        startScreen.style.background = themeBg[savedTheme] || themeBg.light;
    }
    
    // Обновляем активную кнопку в модалке
    document.querySelectorAll('.theme-item').forEach(btn => {
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
        
        // Показываем игровой контейнер
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.style.display = '';
        }
        
        // === ПРИНУДИТЕЛЬНО СКРЫВАЕМ СТАРТОВЫЙ ЭКРАН ===
        const startScreen = document.getElementById('startScreen');
        if (startScreen) {
            startScreen.style.display = 'none';
            startScreen.classList.add('hidden');
        }
        // =============================================
        
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

// ====== ВЫБОР ТЕМЫ ======
document.querySelectorAll('.theme-item').forEach(btn => {
    btn.onclick = () => {
        const theme = btn.dataset.theme;
        
        // Применяем тему
        applyTheme(theme);
        
        // Обновляем активный класс
        document.querySelectorAll('.theme-item').forEach(item => {
            item.classList.remove('active');
        });
        btn.classList.add('active');
        
        // НЕ ЗАКРЫВАЕМ МОДАЛКУ! Она закроется только по крестику
        // Удаляем setTimeout с закрытием
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

// ========== СИСТЕМА ДОСТИЖЕНИЙ ==========
const ACHIEVEMENTS_KEY = 'wordgame_achievements';

// Список всех достижений
const ACHIEVEMENTS = {
    // Поиск слов
    FIND_5_LETTERS: { id: 'find_5_letters', name: '🪶 Первое длинное слово', description: 'Найти слово из 5 букв', icon: '📝', category: 'Поиск слов' },
    FIND_6_LETTERS: { id: 'find_6_letters', name: '🏹 Меткий стрелок', description: 'Найти слово из 6 букв', icon: '🎯', category: 'Поиск слов' },
    FIND_7_LETTERS: { id: 'find_7_letters', name: '🌟 Слово-алмаз', description: 'Найти слово из 7 букв', icon: '💎', category: 'Поиск слов' },
    FIND_8_LETTERS: { id: 'find_8_letters', name: '🔥 Мастер слова', description: 'Найти слово из 8 букв', icon: '⚡', category: 'Поиск слов' },
    
    // Количество найденных слов
    WORDS_50: { id: 'words_50', name: '🏃 Начало пути', description: 'Найти 50 слов всего', icon: '🌱', category: 'Количество слов' },
    WORDS_100: { id: 'words_100', name: '📚 Любитель слов', description: 'Найти 100 слов всего', icon: '📖', category: 'Количество слов' },
    WORDS_200: { id: 'words_200', name: '🧠 Эрудит', description: 'Найти 200 слов всего', icon: '🧩', category: 'Количество слов' },
    WORDS_300: { id: 'words_300', name: '🎓 Словесный гений', description: 'Найти 300 слов всего', icon: '🎓', category: 'Количество слов' },
    WORDS_400: { id: 'words_400', name: '👑 Король слов', description: 'Найти 400 слов всего', icon: '👑', category: 'Количество слов' },
    WORDS_500: { id: 'words_500', name: '⚡ Легенда словаря', description: 'Найти 500 слов всего', icon: '⚡', category: 'Количество слов' },
    WORDS_800: { id: 'words_800', name: '🗿 Гуру словесности', description: 'Найти 800 слов всего', icon: '🗿', category: 'Количество слов' },
    WORDS_1000: { id: 'words_1000', name: '🏆 Великий мастер', description: 'Найти 1000 слов всего', icon: '🏆', category: 'Количество слов' },
    WORDS_1500: { id: 'words_1500', name: '💪 Неудержимый', description: 'Найти 1500 слов всего', icon: '💪', category: 'Количество слов' },
    WORDS_2000: { id: 'words_2000', name: '🐉 Повелитель слов', description: 'Найти 2000 слов всего', icon: '🐉', category: 'Количество слов' },
    
    // Уровни
    LEVEL_3: { id: 'level_3', name: '🌿 Первые шаги', description: 'Достигнуть 3 уровня', icon: '🌿', category: 'Уровни' },
    LEVEL_5: { id: 'level_5', name: '🌳 Опытный игрок', description: 'Достигнуть 5 уровня', icon: '🌳', category: 'Уровни' },
    LEVEL_10: { id: 'level_10', name: '🏔️ Покоритель высот', description: 'Достигнуть 10 уровня', icon: '🏔️', category: 'Уровни' },
    LEVEL_15: { id: 'level_15', name: '⛰️ Мастер гор', description: 'Достигнуть 15 уровня', icon: '⛰️', category: 'Уровни' },
    LEVEL_20: { id: 'level_20', name: '🗻 Властелин высот', description: 'Достигнуть 20 уровня', icon: '🗻', category: 'Уровни' },
    LEVEL_30: { id: 'level_30', name: '🌟 Созвездие', description: 'Достигнуть 30 уровня', icon: '🌟', category: 'Уровни' },
    LEVEL_50: { id: 'level_50', name: '🌌 Галактика', description: 'Достигнуть 50 уровня', icon: '🌌', category: 'Уровни' },
    
    // Особые
    FIRST_WORD: { id: 'first_word', name: '🎬 Первое слово', description: 'Найти своё первое слово', icon: '🎬', category: 'Особые' },
    PERFECT_LEVEL: { id: 'perfect_level', name: '🎯 Идеальный уровень', description: 'Найти все слова на уровне', icon: '🎯', category: 'Особые' },
    HINT_MASTER: { id: 'hint_master', name: '💡 Мастер подсказок', description: 'Использовать 10 подсказок', icon: '💡', category: 'Особые' },
    SPEEDSTER: { id: 'speedster', name: '⚡ Спринтер', description: 'Найти 5 слов за 15 секунд', icon: '⏱️', category: 'Особые' },
    MARATHON: { id: 'marathon', name: '🏃 Марафонец', description: 'Пройти 10 уровней подряд', icon: '🏃', category: 'Особые' },
    PERFECT_TEN: { id: 'perfect_ten', name: '🎯 Идеальная десятка', description: 'Найти 10 слов за уровень', icon: '🎯', category: 'Особые' },
    BONUS_HUNTER: { id: 'bonus_hunter', name: '🏅 Охотник за бонусами', description: 'Получить 20 бонусов', icon: '🏅', category: 'Особые' },
};

// Загрузка сохранённых достижений
function loadAchievements() {
    try {
        const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
}

// Сохранение достижений
function saveAchievements(achievements) {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
}

// Проверка и разблокировка достижения
function unlockAchievement(achievementId) {
    const achievements = loadAchievements();
    
    // Если уже есть — пропускаем
    if (achievements[achievementId]) return false;
    
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return false;
    
    // Разблокируем
    achievements[achievementId] = {
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon
    };
    
    saveAchievements(achievements);
    
    // Показываем уведомление
    showAchievementPopup(achievement);
    
    return true;
}

// Проверка всех достижений
function checkAchievements() {
    const achievements = loadAchievements();
    
    // Первое слово
    if (gameState.foundWords.size >= 1 && !achievements[ACHIEVEMENTS.FIRST_WORD.id]) {
        unlockAchievement(ACHIEVEMENTS.FIRST_WORD.id);
    }
    
    // Длина слова
    const currentWord = gameState.currentWord.map(item => item.letter).join("");
    if (currentWord.length >= 5 && !achievements[ACHIEVEMENTS.FIND_5_LETTERS.id]) {
        unlockAchievement(ACHIEVEMENTS.FIND_5_LETTERS.id);
    }
    if (currentWord.length >= 6 && !achievements[ACHIEVEMENTS.FIND_6_LETTERS.id]) {
        unlockAchievement(ACHIEVEMENTS.FIND_6_LETTERS.id);
    }
    if (currentWord.length >= 7 && !achievements[ACHIEVEMENTS.FIND_7_LETTERS.id]) {
        unlockAchievement(ACHIEVEMENTS.FIND_7_LETTERS.id);
    }
    if (currentWord.length >= 8 && !achievements[ACHIEVEMENTS.FIND_8_LETTERS.id]) {
        unlockAchievement(ACHIEVEMENTS.FIND_8_LETTERS.id);
    }
    
    // Всего слов
    const totalWords = gameState.foundWords.size;
    const wordMilestones = [50, 100, 200, 300, 400, 500, 800, 1000, 1500, 2000];
    const wordAchievementIds = ['WORDS_50', 'WORDS_100', 'WORDS_200', 'WORDS_300', 'WORDS_400', 'WORDS_500', 'WORDS_800', 'WORDS_1000', 'WORDS_1500', 'WORDS_2000'];
    
    for (let i = 0; i < wordMilestones.length; i++) {
        if (totalWords >= wordMilestones[i] && !achievements[ACHIEVEMENTS[wordAchievementIds[i]].id]) {
            unlockAchievement(ACHIEVEMENTS[wordAchievementIds[i]].id);
        }
    }
    
    // Уровни
    const level = gameState.level;
    const levelMilestones = [3, 5, 10, 15, 20, 30, 50];
    const levelAchievementIds = ['LEVEL_3', 'LEVEL_5', 'LEVEL_10', 'LEVEL_15', 'LEVEL_20', 'LEVEL_30', 'LEVEL_50'];
    
    for (let i = 0; i < levelMilestones.length; i++) {
        if (level >= levelMilestones[i] && !achievements[ACHIEVEMENTS[levelAchievementIds[i]].id]) {
            unlockAchievement(ACHIEVEMENTS[levelAchievementIds[i]].id);
        }
    }
    
    // Идеальный уровень (найдены все возможные слова)
    if (gameState.foundWords.size === gameState.possibleWords.size && 
        gameState.possibleWords.size > 0 && 
        !achievements[ACHIEVEMENTS.PERFECT_LEVEL.id]) {
        unlockAchievement(ACHIEVEMENTS.PERFECT_LEVEL.id);
    }
    
    // 10 слов за уровень
    if (gameState.foundWords.size >= 10 && !achievements[ACHIEVEMENTS.PERFECT_TEN.id]) {
        unlockAchievement(ACHIEVEMENTS.PERFECT_TEN.id);
    }
}

// Всплывающее окно достижения
function showAchievementPopup(achievement) {
    // Ставим игру на паузу
    if (!gamePaused) {
        pauseGame();
        achievementPopupPaused = true;
    }
    
    const modal = document.getElementById('achievementModal');
    if (!modal) return;
    
    document.getElementById('achievementIcon').textContent = achievement.icon || '🏆';
    document.getElementById('achievementName').textContent = achievement.name;
    document.getElementById('achievementDesc').textContent = achievement.description;
    
    modal.classList.add('show');
    
    // Звук достижения
    playSound('levelup');
}

// Закрытие модалки достижения
function closeAchievementPopup() {
    const modal = document.getElementById('achievementModal');
    if (modal) modal.classList.remove('show');
    
    // Снимаем паузу, если она была поставлена достижением
    if (achievementPopupPaused) {
        achievementPopupPaused = false;
        if (!gameState.frozen && gameState.timeLeft > 0) {
            resumeGame();
        }
    }
}

let achievementPopupPaused = false;

// Сброс достижений (для тестирования)
function resetAchievements() {
    localStorage.removeItem(ACHIEVEMENTS_KEY);
    console.log('✅ Достижения сброшены');
}
// ====== ДОСТИЖЕНИЯ ======
// Кнопка достижений в меню
const startAchievementsBtn = document.getElementById('startAchievementsBtn');
if (startAchievementsBtn) {
    startAchievementsBtn.onclick = () => {
        openAchievementsModal();
    };
}

// Модалка достижений
const achievementsModal = document.getElementById('achievementsModal');
const achievementsModalClose = document.getElementById('achievementsModalClose');
const achievementsModalBtn = document.getElementById('achievementsModalBtn');

function openAchievementsModal() {
    renderAchievementsList();
    if (achievementsModal) {
        achievementsModal.classList.add('show');
    }
}

function closeAchievementsModal() {
    if (achievementsModal) {
        achievementsModal.classList.remove('show');
    }
}

if (achievementsModalClose) {
    achievementsModalClose.onclick = closeAchievementsModal;
}

if (achievementsModalBtn) {
    achievementsModalBtn.onclick = closeAchievementsModal;
}

if (achievementsModal) {
    achievementsModal.onclick = (e) => {
        if (e.target === achievementsModal) {
            closeAchievementsModal();
        }
    };
}

function renderAchievementsList() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    
    const achieved = loadAchievements();
    
    const categories = {};
    for (const key in ACHIEVEMENTS) {
        const ach = ACHIEVEMENTS[key];
        if (!categories[ach.category]) categories[ach.category] = [];
        categories[ach.category].push(ach);
    }
    
    let html = '';
    for (const category in categories) {
        html += `<div style="grid-column: 1 / -1; font-weight: 700; color: var(--theme-text, #1f2937); padding: 8px 0 4px; border-bottom: 2px solid var(--theme-border, #e5e7eb);">${category}</div>`;
        
        for (const ach of categories[category]) {
            const unlocked = achieved[ach.id];
            html += `
                <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                    <span class="achievement-item__icon">${ach.icon}</span>
                    <div class="achievement-item__info">
                        <div class="achievement-item__name">${ach.name}</div>
                        <div class="achievement-item__desc">${ach.description}</div>
                    </div>
                    <span class="achievement-item__status">${unlocked ? '✅' : '🔒'}</span>
                </div>
            `;
        }
    }
    
    grid.innerHTML = html;
}