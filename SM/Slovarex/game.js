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

// Где-то в начале, после загрузки
if (typeof initVKBridge === 'function') {
    initVKBridge();
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
    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge не доступен');
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
    
    // Просто инициализируем — без проверки isVK
    vkBridge.send('VKWebAppInit', {})
        .then(() => {
            console.log('✅ VK Bridge инициализирован');
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
    SCORE_BONUS_PER_LEVEL: 0,
    HINTS_START: 3,
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
     //   bonusScore: 0,    
    
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
    // Считаем порог как процент от возможных слов
    const percentNeed = Math.ceil(gameState.possibleWords.size * getCurrentThreshold());
    // Но не больше WORDS_TO_COMPLETE
    const need = Math.min(percentNeed, CONFIG.WORDS_TO_COMPLETE);
    
    const before = gameState.thresholdReached;
    gameState.thresholdReached = gameState.foundWords.size >= need;
    
    if (gameState.thresholdReached && !before && !gameState.frozen) {
        showToast(`🎉 Найдено ${gameState.foundWords.size} слов! Открыт следующий уровень!`);
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
        const percentNeed = Math.ceil(gameState.possibleWords.size * getCurrentThreshold());
        const need = Math.min(percentNeed, CONFIG.WORDS_TO_COMPLETE);
        const remain = Math.max(0, need - gameState.foundWords.size);
        btn.textContent = `🔒 Нужно найти ещё ${remain} слов`;
    }
}

function updateProgressBar() {
    const percentNeed = Math.ceil(gameState.possibleWords.size * getCurrentThreshold());
    const need = Math.min(percentNeed, CONFIG.WORDS_TO_COMPLETE);
    const percent = (gameState.foundWords.size / need) * 100;
    const fill = document.getElementById("progressFill");
    const text = document.getElementById("progressText");
    if (fill) fill.style.width = `${Math.min(100, percent)}%`;
    if (text) text.textContent = `${gameState.foundWords.size} / ${need}`;
}

function updateUI() {
document.getElementById("level").textContent = gameState.level;   
    document.getElementById("score").textContent = gameState.levelScore;
    document.getElementById("timer").textContent = formatTime(gameState.timeLeft);
    document.getElementById("hintCount").textContent = gameState.hintsLeft;
    document.getElementById("baseWord").textContent = gameState.baseWord;       
  /* const bonusCount = document.getElementById("bonusCount");
    if (bonusCount) {
        bonusCount.textContent = `🏆 Бонус: ${gameState.bonusScore}`;
    }   */ 
    const timerCard = document.querySelector(".stat-time");
    if (gameState.timeLeft <= 10 && !gameState.frozen) {
        timerCard.classList.add("warning");
    } else {
        timerCard.classList.remove("warning");
    }    
    updateNextButton();
    updateProgressBar();
    updateSubmitButtonState();
    updateTotalScoreInMenu();
}
// Обновление отображения общих очков в меню
function updateTotalScoreInMenu() {
    const totalScoreEl = document.getElementById('totalScoreDisplay');
    if (totalScoreEl) { totalScoreEl.textContent = `💎 ${gameState.totalScore || 0}`;
    }
}

function addToTotalScore(amount) {
    if (!amount || amount <= 0) return;    
    gameState.totalScore = (gameState.totalScore || 0) + amount;    
    // Мгновенная синхронизация
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, gameState.totalScore);
    }    
    // Мгновенное обновление в меню
    if (typeof updateTotalScoreInMenu === 'function') {
        updateTotalScoreInMenu();
    }
    
    console.log(`💎 Алмазы обновлены: ${gameState.totalScore}`);
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
      //  gameState.bonusScore = 0;    
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
        // ====== НЕ ЗАПУСКАЕМ ТАЙМЕР, ЕСЛИ МЕНЮ ВИДНО ======
    const startScreen = document.getElementById('startScreen');
    if (startScreen && startScreen.style.display !== 'none') {
        console.log('ℹ️ Таймер не запускается — меню активно');
        return;
    }
    // ===================================================
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


        // ========== ОТПРАВКА УРОВНЯ В ВК ==========
      //  if (typeof sendscore === 'function') {
      //      sendscore();
      //  }
        // ==========================================
function handleTimeOut() {
    if (gamePaused) return;
      // ====== НЕ ПОКАЗЫВАЕМ МОДАЛКУ, ЕСЛИ МЕНЮ ВИДНО ======
    const startScreen = document.getElementById('startScreen');
    if (startScreen && startScreen.style.display !== 'none') {
        console.log('ℹ️ Пропускаем timeout — меню активно');
        return;
    }
    // ===================================================
    const percentNeed = Math.ceil(gameState.possibleWords.size * getCurrentThreshold());
    const need = Math.min(percentNeed, CONFIG.WORDS_TO_COMPLETE);
    
    if (gameState.foundWords.size >= need) {
        nextLevel();
    } else {
        // ========== ОТПРАВКА УРОВНЯ В ВК ==========
        if (typeof sendscore === 'function') {
            sendscore();
        }
        // ==========================================
        
        gameState.frozen = true;
        updateUI();
        
        // Показываем модалку завершения (ВМЕСТО тоста)
        showGameOverModal();
    }
}

// ====== МОДАЛКА ЗАВЕРШЕНИЯ ИГРЫ ======
function showGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    if (!modal) return;
    
    // Заполняем статистику
    const stats = document.getElementById('gameoverStats');
    if (stats) {
      stats.innerHTML = `
    <div class="stat-item">
        <span class="stat-label">📊 Уровень</span>
        <span class="stat-value highlight">${gameState.level}</span>
    </div>
    <div class="stat-item">
        <span class="stat-label">🎯 Найдено слов</span>
        <span class="stat-value">${gameState.foundWords.size}</span>
    </div>
    <div class="stat-item">
        <span class="stat-label">💎 Общие очки</span>
        <span class="stat-value">${gameState.totalScore}</span>
    </div>
    <div class="stat-item">
        <span class="stat-label">Очки уровня (будут потеряны)</span>
        <span class="stat-value highlight">${gameState.levelScore}</span>
    </div>
    <div class="stat-item">
        <span class="stat-label">💡 Подсказок</span>
        <span class="stat-value">${gameState.hintsLeft}</span>
    </div>
`;
    }
    
    modal.classList.add('show');
}

function closeGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    if (modal) modal.classList.remove('show');
}

function gameOverToMenu() {
    closeGameOverModal();    
    // Останавливаем таймер
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }    
    // Очищаем паузу 
    cleanupPauseHandlers();    
      setParticlesAboveMenu();   
        gameState.levelScore = 0;
   // gameState.bonusScore = 0;
    gameState.frozen = true;
    // Синхронизация
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage(VK_STORAGE_KEYS.LEVEL, gameState.level);
        saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, gameState.totalScore);
    } 
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
    // Показываем VK навигацию
    if (typeof showVKView === 'function') {
        setTimeout(showVKView, 300);
    }
      
    // Очищаем тост
    clearPermanentToast();    
    console.log('🏠 Возврат в главное меню');
}
function gameOverRestart() {
    closeGameOverModal();   
    cleanupPauseHandlers();    
    clearPermanentToast();
    
    // ====== НЕ ОБНУЛЯЕМ УРОВЕНЬ! и очки-звезды общие======
    gameState.levelScore = 0;
 //   gameState.bonusScore = 0;
    gameState.frozen = false;
    gamePaused = false;
    
    // ====== СИНХРОНИЗАЦИЯ ======
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage(VK_STORAGE_KEYS.LEVEL, gameState.level);
        saveToVKStorage(VK_STORAGE_KEYS.HINTS, gameState.hintsLeft);
         saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, gameState.totalScore);
        console.log(`☁️ Данные синхронизированы после gameOverRestart: уровень ${gameState.level}`);
    }
    // ===========================
    
    setTimeout(checkAndShowBanner, 500);
    initLevel();
    updateUI();
    playSound("click");
    showToast(`🔄 Игра перезапущена на уровне ${gameState.level}!`);
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
    
    gameState.foundWords.add(word);
    gameState.foundList.push(word);
    
    updateGalaxyProgress(1);
    
    // ====== НОВАЯ СИСТЕМА ОЧКОВ ======
    // Слова до 5 букв (включительно) — 1 очко
    // Слова от 6 букв и длиннее — 2 очка
    const points = word.length <= 5 ? 1 : 2;
    // ==================================
    
    // Бонус больше не нужен, удаляем
    // const bonus = calculateBonus(word);
    
    gameState.levelScore += points;
    // gameState.bonusScore += bonus; // удаляем или оставляем 0
    gameState.timeLeft += CONFIG.TIME_BONUS_PER_WORD;
    
    playSound("success");
    
    // Показываем тост
    let toastMessage = `✅ "${word}" +${points} очков! +${CONFIG.TIME_BONUS_PER_WORD} сек!`;
    showToast(toastMessage);
    
    checkAchievements(word);
    
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
    
    // Если подсказок нет — предлагаем получить через рекламу
    if (gameState.hintsLeft <= 0) {
        checkHintsAndShowAd();
        return;
    }
    
    const notFound = [...gameState.possibleWords].filter(w => !gameState.foundWords.has(w));
    if (notFound.length === 0) {
        showToast("Все слова уже найдены! 🎉");
        return;
    }
    
    const hintWord = notFound[Math.floor(Math.random() * notFound.length)];
    gameState.hintsLeft--;
    // ====== СИНХРОНИЗАЦИЯ ПОДСКАЗОК С VK STORAGE ======
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage(VK_STORAGE_KEYS.HINTS, gameState.hintsLeft);
        console.log('☁️ Подсказки синхронизированы с VK Storage');
    }  
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
     // ====== СИНХРОНИЗАЦИЯ С VK STORAGE ======
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage(VK_STORAGE_KEYS.SOUND, gameState.soundEnabled ? '1' : '0');
        console.log('☁️ Звук синхронизирован с VK Storage');
    }
    // =========================================
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
        // ====== НЕ ОБНУЛЯЕМ УРОВЕНЬ! и общие очки-звезды
           gameState.levelScore = 0;
     //   gameState.bonusScore = 0;     
        // Снимаем фриз и паузу
        gameState.frozen = false;
        gamePaused = false;        
        // ====== СИНХРОНИЗАЦИЯ ПОСЛЕ ПЕРЕЗАПУСКА ======
        if (typeof saveToVKStorage === 'function') {
            // Сохраняем текущий уровень и подсказки
            saveToVKStorage(VK_STORAGE_KEYS.LEVEL, gameState.level);
            saveToVKStorage(VK_STORAGE_KEYS.HINTS, gameState.hintsLeft);
             saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, gameState.totalScore);
            console.log(`☁️ Данные синхронизированы после перезапуска: уровень ${gameState.level}, подсказок ${gameState.hintsLeft}`);
        }        
        // Показываем баннер
        setTimeout(checkAndShowBanner, 500);        
        // Запускаем уровень с сохраненным уровнем
        initLevel();
        updateUI();
        playSound("click");        
        showToast(`🔄 Игра перезапущена на уровне ${gameState.level}!`);
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
    if (!gameState.thresholdReached) { showToast("Сначала достигните порога!", true); return; }    
    // ← ИЗМЕНЕНО: добавляем очки уровня к общим
    const levelBonus = CONFIG.SCORE_BONUS_PER_LEVEL;
    const totalToAdd = gameState.levelScore + levelBonus;    
    // Добавляем к общим очкам
    addToTotalScore(totalToAdd);    gameState.level++;       
      // ====== ПРОВЕРКА ДОСТИЖЕНИЙ ======
checkAchievements();
// ====== МГНОВЕННАЯ СИНХРОНИЗАЦИЯ ======
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage(VK_STORAGE_KEYS.LEVEL, gameState.level);
        saveToVKStorage(VK_STORAGE_KEYS.HINTS, gameState.hintsLeft);
        saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, gameState.totalScore);
    }
    // Мгновенно обновляем меню (если видно)
    if (typeof updateTotalScoreInMenu === 'function') {
        updateTotalScoreInMenu();
    }
    // =====================================
    initLevel();
    updateUI();
    showToast(`🎉 Уровень ${gameState.level}! +${CONFIG.SCORE_BONUS_PER_LEVEL} бонусных очков!`);
    playSound("levelup");
     // ====== СИНХРОНИЗАЦИЯ С VK STORAGE ======
    if (typeof syncAllDataToVK === 'function') {
        syncAllDataToVK();
        console.log('☁️ Данные синхронизированы после перехода на уровень', gameState.level);
    } else if (typeof saveToVKStorage === 'function') {
        // Если syncAllDataToVK недоступна, сохраняем основные данные
        const galaxy = getGalaxyProgress();
        saveToVKStorage('wordgame_galaxy_v2', galaxy);
        const achievements = loadAchievements();
        saveToVKStorage('wordgame_achievements_v2', achievements);
        console.log('☁️ Данные синхронизированы с VK Storage');
    }
    // =========================================
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
    applyTheme(currentTheme);
    
    if (BASE_WORDS_POOL.length === 0) {
        console.error("❌ Нет слов длиннее 6 букв!");
        showToast("Ошибка: нет подходящих слов для игры", true);
        return;
    }
    
    // ====== ЗАГРУЗКА УРОВНЯ И ПОДСКАЗОК ИЗ VK STORAGE ======
    // Проверяем, есть ли мост и интернет
    const hasVKBridge = typeof vkBridge !== 'undefined' && typeof loadFromVKStorage === 'function';
    
    if (hasVKBridge) {
        // Пытаемся загрузить данные с таймаутом 3 секунды
        const loadPromise = Promise.all([
            loadFromVKStorage(VK_STORAGE_KEYS.LEVEL),
            loadFromVKStorage(VK_STORAGE_KEYS.HINTS)
        ]);
        
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                console.warn('⏰ Таймаут загрузки из VK Storage, используем локальные данные');
                resolve([null, null]);
            }, 13000);
        });
        
        Promise.race([loadPromise, timeoutPromise])
            .then(([levelData, hintsData]) => {
                // Загружаем уровень (максимальное значение)
                if (levelData !== null && levelData !== undefined) {
                    const vkLevel = Number(levelData) || 1;
                    if (vkLevel > gameState.level) {
                        gameState.level = vkLevel;
                        console.log(`📥 Уровень загружен из VK: ${gameState.level}`);
                    } else {
                        console.log(`📤 Локальный уровень ${gameState.level} >= VK (${vkLevel})`);
                    }
                }
                
                // Загружаем подсказки
                if (hintsData !== null && hintsData !== undefined) {
                    const vkHints = Number(hintsData) || CONFIG.HINTS_START;
                    // Подсказки не могут быть меньше 0 и больше разумного максимума
                    gameState.hintsLeft = Math.max(0, Math.min(vkHints, CONFIG.HINTS_START * 3));
                    console.log(`📥 Подсказки загружены из VK: ${gameState.hintsLeft}`);
                }
                
                // Запускаем игру в любом случае
                startGameAfterLoad();
            })
            .catch((error) => {
                // Ошибка загрузки (нет интернета) — просто запускаем игру
                console.warn('⚠️ Ошибка загрузки из VK (возможно нет интернета):', error);
                showToast('ℹ️ Игра загружена с локальными данными');
                startGameAfterLoad();
            });
    } else {
        // VK Bridge недоступен — сразу запускаем
        console.log('ℹ️ VK Bridge не доступен, используем локальные данные');
        startGameAfterLoad();
    }
}

// Вспомогательная функция для запуска игры после загрузки данных
function startGameAfterLoad() {
    // Проверяем, не запущена ли уже игра
    if (gameState.timerId) {
        console.log('ℹ️ Игра уже запущена');
        return;
    }
    
    // Убеждаемся, что уровень не меньше 1
    if (!gameState.level || gameState.level < 1) {
        gameState.level = 1;
    }
    
    // Убеждаемся, что подсказки не отрицательные
    if (gameState.hintsLeft < 0) {
        gameState.hintsLeft = CONFIG.HINTS_START;
    }
    
    console.log(`🎮 Запуск игры: уровень ${gameState.level}, подсказок ${gameState.hintsLeft}`);
    
    initLevel();
    initAudio();
    
    // Привязываем обработчики
    document.getElementById("submitBtn").onclick = submitWord;
    document.getElementById("backspaceBtn").onclick = backspace;
    document.getElementById("clearBtn").onclick = clearWord;
    document.getElementById("shuffleBtn").onclick = shuffleLetters;
    document.getElementById("hintBtn").onclick = useHint;
    document.getElementById("soundBtn").onclick = toggleSound;
    document.getElementById("nextLevelBtn").onclick = nextLevel;
    
    const shareBtn = document.getElementById("shareBtn");
    if (shareBtn) shareBtn.onclick = () => { if (typeof share2 === 'function') share2(); };
    
    const modal = document.getElementById("modal");
    const modalNext = document.getElementById("modalNextBtn");
    const modalRestart = document.getElementById("modalRestartBtn");
    
    if (modalNext) modalNext.onclick = () => { modal.classList.remove("show"); nextLevel(); };
    if (modalRestart) modalRestart.onclick = () => { modal.classList.remove("show"); restartGame(); };
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove("show"); };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    
    console.log(`✅ Игра запущена! Уровень: ${gameState.level}, Подсказок: ${gameState.hintsLeft}`);
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
     // ====== СИНХРОНИЗАЦИЯ С VK STORAGE ======
       if (typeof saveToVKStorage === 'function') {
        saveToVKStorage('wordgame_theme_v2', theme);    
        console.log('☁️ Тема синхронизирована с VK Storage');
    }
    // =========================================
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
         gameState.levelScore = 0;
     //   gameState.bonusScore = 0;
        // Сбрасываем флаг игры
        gameState.frozen = true;        
        // Очищаем тост
        clearPermanentToast();
          updateTotalScoreInMenu();
        console.log('🏠 Возврат в главное меню');
         // Синхронизация перед выходом
        if (typeof saveToVKStorage === 'function') {
            saveToVKStorage(VK_STORAGE_KEYS.LEVEL, gameState.level);
            saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, gameState.totalScore);
        }
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
// Загрузка сохранённых достижений
function loadAchievements() {
    try {
        const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
        console.log('📂 Загрузка достижений из localStorage:', saved);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error('❌ Ошибка загрузки достижений:', e);
        return {};
    }
}

// Сохранение достижений
function saveAchievements(achievements) {
    try {
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
        // ↓ ДОБАВЬТЕ ЭТИ 3 СТРОЧКИ ↓
        if (typeof saveToVKStorage === 'function') {
            saveToVKStorage('wordgame_achievements_v2', achievements);
        }
    } catch (e) {
        console.error('❌ Ошибка сохранения достижений:', e);
    }
}

// Проверка и разблокировка достижения
function unlockAchievement(achievementId) {
    console.log('🔓 Попытка разблокировать:', achievementId);
    
    const achievements = loadAchievements();
    console.log('📦 Текущие достижения:', achievements);
    
    // Если уже есть — пропускаем
    if (achievements[achievementId]) {
        console.log('⏭️ Уже разблокировано:', achievementId);
        return false;
    }
    
    // Ищем достижение по id
    let achievement = null;
    for (const key in ACHIEVEMENTS) {
        if (ACHIEVEMENTS[key].id === achievementId) {
            achievement = ACHIEVEMENTS[key];
            break;
        }
    }
    
    if (!achievement) {
        console.error('❌ Достижение не найдено:', achievementId);
        console.log('📋 Доступные достижения:', Object.keys(ACHIEVEMENTS).map(k => ACHIEVEMENTS[k].id));
        return false;
    }
    
    // Разблокируем
    achievements[achievementId] = {
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon
    };
    
    saveAchievements(achievements);
    console.log('💾 Достижение сохранено:', achievements);
     // ====== СИНХРОНИЗАЦИЯ С VK STORAGE ======
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage('wordgame_achievements_v2', achievements);
        console.log('☁️ Достижения синхронизированы с VK Storage');
    }
    // =========================================
    // Показываем уведомление
    showAchievementPopup(achievement);
    
    return true;
}

// Проверка всех достижений
function checkAchievements(submittedWord) {
    const achievements = loadAchievements();
    console.log('🔍 Проверка достижений, найдено слов:', gameState.foundWords.size);
     console.log('📋 Достижения в ACHIEVEMENTS:', Object.keys(ACHIEVEMENTS));
    
    // Первое слово
    if (gameState.foundWords.size >= 1 && !achievements[ACHIEVEMENTS.FIRST_WORD.id]) {
        console.log('🏆 Разблокируем "Первое слово"');
        unlockAchievement(ACHIEVEMENTS.FIRST_WORD.id);
    }
    
    // Длина слова (используем переданное слово)
    if (submittedWord && submittedWord.length >= 5 && !achievements[ACHIEVEMENTS.FIND_5_LETTERS.id]) {
        unlockAchievement(ACHIEVEMENTS.FIND_5_LETTERS.id);
    }
    if (submittedWord && submittedWord.length >= 6 && !achievements[ACHIEVEMENTS.FIND_6_LETTERS.id]) {
        unlockAchievement(ACHIEVEMENTS.FIND_6_LETTERS.id);
    }
    if (submittedWord && submittedWord.length >= 7 && !achievements[ACHIEVEMENTS.FIND_7_LETTERS.id]) {
        unlockAchievement(ACHIEVEMENTS.FIND_7_LETTERS.id);
    }
    if (submittedWord && submittedWord.length >= 8 && !achievements[ACHIEVEMENTS.FIND_8_LETTERS.id]) {
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
// Всплывающее окно достижения
function showAchievementPopup(achievement) {
    console.log('🎉 Показываем достижение:', achievement);
    
    // Ставим игру на паузу
    if (!gamePaused) {
        pauseGame();
        achievementPopupPaused = true;
    }
    
    const modal = document.getElementById('achievementModal');
    if (!modal) {
        console.error('❌ Модалка achievementModal не найдена!');
        return;
    }
    
    const iconEl = document.getElementById('achievementIcon');
    const nameEl = document.getElementById('achievementName');
    const descEl = document.getElementById('achievementDesc');
    
    if (iconEl) iconEl.textContent = achievement.icon || '🏆';
    if (nameEl) nameEl.textContent = achievement.name;
    if (descEl) descEl.textContent = achievement.description;
    
    modal.classList.add('show');
    console.log('✅ Модалка достижения показана');
    
    // Звук достижения
    playSound('levelup');
}

// Закрытие модалки достижения
function closeAchievementPopup() {
    console.log('❌ Закрываем модалку достижения');
    const modal = document.getElementById('achievementModal');
    if (modal) modal.classList.remove('show');
    
    // Снимаем паузу, если она была поставлена достижением
    if (achievementPopupPaused) {
        achievementPopupPaused = false;
        if (!gameState.frozen && gameState.timeLeft > 0) {
            resumeGame();
            console.log('▶️ Игра возобновлена после достижения');
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
                    <span class="achievement-item__status">
${unlocked ? `
    <span class="achievement-item__checkmark">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="checkmark-path" 
                  d="M3.5 12.5L9 18L20.5 5" 
                  stroke="#10b981" 
                  stroke-width="3" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  fill="none"/>
        </svg>
    </span>
` : `
    <span class="achievement-item__lock">🔒</span>
`}
                    </span>
                </div>
            `;
        }
    }
    
    grid.innerHTML = html;
}

// ========== БЕСКОНЕЧНАЯ ГАЛАКТИКА ==========
const GALAXY_KEY = 'wordgame_galaxy';

// Все записки (100 штук)
const SCROLLS = [
    // Цитаты учёных и мыслителей
    { id: 1, text: '«Две вещи наполняют душу всегда новым и всё более сильным удивлением и благоговением, чем чаще и продолжительнее мы размышляем о них, — это звёздное небо надо мной и моральный закон во мне.» — Иммануил Кант' },
    { id: 2, text: '«Мы — способ, которым Вселенная познает себя.» — Карл Саган' },
    { id: 3, text: '«Где бы мы ни были, мы всегда находимся в центре Вселенной.» — Джон Арчибальд Уилер' },
    { id: 4, text: '«Вселенная не обязана быть понятной. Она просто есть.» — Нил Деграсс Тайсон' },
    { id: 5, text: '«Мы все — звёздная пыль, размышляющая о звёздах.» — Карл Саган' },
    { id: 6, text: '«Космос — это всё, что есть, всё, что когда-либо было и всё, что когда-либо будет.» — Карл Саган' },
    { id: 7, text: '«Глаза — это окна в душу. А телескопы — окна во Вселенную.» — неизвестный астроном' },
    { id: 8, text: '«Земля — это колыбель разума, но нельзя вечно жить в колыбели.» — Константин Циолковский' },
    { id: 9, text: '«Человечество — это часть Вселенной, которая пытается понять саму себя.» — Стивен Хокинг' },
    { id: 10, text: '«В бесконечной Вселенной всё возможно.» — Стивен Хокинг' },
    
    // Факты о планетах
    { id: 11, text: '🔭 Юпитер — самая большая планета Солнечной системы. В него можно поместить более 1300 Земель!' },
    { id: 12, text: '🌕 На Венере день длиннее года. Один оборот вокруг оси занимает 243 земных дня, а вокруг Солнца — 225 дней.' },
    { id: 13, text: '🪐 Сатурн настолько лёгкий, что мог бы плавать в воде — его плотность меньше плотности воды.' },
    { id: 14, text: '🔴 Марс называют Красной планетой из-за оксида железа (ржавчины) на его поверхности.' },
    { id: 15, text: '🌍 Земля — единственная известная планета, где есть жизнь. Но мы всё ещё ищем соседей.' },
    { id: 16, text: '☀️ Солнце составляет 99,86% всей массы Солнечной системы. Оно огромно!' },
    { id: 17, text: '❄️ Уран — самая холодная планета с температурой -224°C. И он вращается на боку!' },
    { id: 18, text: '🌊 На спутнике Юпитера Европе под ледяной коркой скрывается океан — возможно, с жизнью.' },
    { id: 19, text: '⛰️ Олимп на Марсе — высочайшая гора в Солнечной системе. Её высота — 21,9 км!' },
    { id: 20, text: '💨 На Нептуне дуют самые сильные ветры — до 2100 км/ч!' },
    
    // Интересные факты о космосе
    { id: 21, text: '🌌 Млечный Путь содержит от 100 до 400 миллиардов звёзд. А мы видим только малую часть.' },
    { id: 22, text: '⏳ Самый старый свет, который мы видим, — это реликтовое излучение. Ему 13,8 миллиардов лет.' },
    { id: 23, text: '🕳️ В центре нашей галактики находится сверхмассивная чёрная дыра — Стрелец A*.' },
    { id: 24, text: '💫 Каждую секунду в наблюдаемой Вселенной рождается около 10 новых звёзд.' },
    { id: 25, text: '🌠 Метеорит, который упал в Челябинске в 2013 году, весил около 10 000 тонн до входа в атмосферу.' },
    { id: 26, text: '🔭 Телескоп Хаббл помог определить возраст Вселенной — 13,8 миллиардов лет.' },
    { id: 27, text: '🌙 Луна постепенно удаляется от Земли со скоростью 3,8 см в год.' },
    { id: 28, text: '☄️ Кометы — это остатки материала из ранней Солнечной системы. Они содержат лёд и органику.' },
    { id: 29, text: '✨ Белые карлики — это остатки звёзд, сжатые до размеров Земли. Они невероятно плотные.' },
    { id: 30, text: '💥 Взрыв сверхновой за несколько секунд выделяет больше энергии, чем Солнце за всю свою жизнь.' },
    
    // Больше фактов
    { id: 31, text: '🪐 Кольца Сатурна состоят из миллиардов частиц льда и камня размером от пылинки до дома.' },
    { id: 32, text: '🔴 На Марсе есть самый длинный каньон — Долина Маринер. Он протянулся на 4000 км!' },
    { id: 33, text: '☀️ Температура на поверхности Солнца — около 5500°C, а в ядре — 15 миллионов градусов.' },
    { id: 34, text: '🌍 Если собрать всю воду на Земле в шар, его диаметр будет всего 1385 км.' },
    { id: 35, text: '🪐 У Сатурна 146 известных спутников. Самый большой — Титан, крупнее Меркурия.' },
    { id: 36, text: '🌕 Луна имеет очень тонкую атмосферу — экзосферу. Она почти вакуум.' },
    { id: 37, text: '💫 Звёзды рождаются в туманностях — огромных облаках газа и пыли.' },
    { id: 38, text: '⏳ 1 год на Нептуне длится 165 земных лет — там очень долгая зима!' },
    { id: 39, text: '🌌 Туманность Ориона — одна из самых ярких и изученных туманностей на небе.' },
    { id: 40, text: '🚀 «Вояджер-1» уже покинул Солнечную систему и продолжает лететь в межзвёздном пространстве.' },
    
    { id: 41, text: '🌠 В день на Землю падает около 100 тонн космической пыли и мелких метеоритов.' },
    { id: 42, text: '🌍 Земля не идеальный шар — она немного приплюснута у полюсов.' },
    { id: 43, text: '☀️ Свет от Солнца доходит до Земли за 8 минут 20 секунд.' },
    { id: 44, text: '🌙 Затмения происходят потому, что Луна и Земля идеально выстраиваются на одной линии.' },
    { id: 45, text: '🪐 Астрономы обнаружили планету, где идут дожди из расплавленного стекла — HD 189733b.' },
    { id: 46, text: '🔴 Марс имеет полярные шапки из замороженного углекислого газа и воды.' },
    { id: 47, text: '💫 Самая близкая к нам звезда — Проксима Центавра. До неё 4,2 световых года.' },
    { id: 48, text: '🌌 Млечный Путь и галактика Андромеды движутся навстречу друг другу. Встретятся через 4,5 млрд лет.' },
    { id: 49, text: '🚀 Первый человек в космосе — Юрий Гагарин. Его полёт длился 108 минут.' },
    { id: 50, text: '💥 Чёрные дыры испаряются! Это открытие Стивена Хокинга называется «излучением Хокинга».' },
    
    { id: 51, text: '🌠 Метеорные потоки возникают, когда Земля проходит через шлейф пыли комет.' },
    { id: 52, text: '🔭 В телескоп можно увидеть галактику Андромеды невооружённым глазом в ясную ночь.' },
    { id: 53, text: '🌕 С Земли всегда видна только одна сторона Луны — она синхронно вращается.' },
    { id: 54, text: '☀️ Солнце станет красным гигантом через 5 миллиардов лет и поглотит Землю.' },
    { id: 55, text: '🪐 У Сатурна есть спутник Пан, который напоминает пельмень из-за своей формы.' },
    { id: 56, text: '🌍 Если бы Земля была размером с яблоко, то атмосфера была бы тоньше кожуры.' },
    { id: 57, text: '💫 Пульсары — это нейтронные звёзды, которые вращаются сотни раз в секунду.' },
    { id: 58, text: '🚀 Космический корабль «Новые горизонты» долетел до Плутона за 9,5 лет.' },
    { id: 59, text: '🌌 Туманность Конская Голова — одна из самых узнаваемых тёмных туманностей.' },
    { id: 60, text: '⏳ На Меркурии день длится 59 земных дней, а год — 88 дней.' },
    
    { id: 61, text: '🌠 Космическая станция МКС вращается вокруг Земли со скоростью 27 600 км/ч.' },
    { id: 62, text: '🔴 На Марсе есть подземные озёра с жидкой водой — возможно, там есть жизнь.' },
    { id: 63, text: '🌍 Земля делает полный оборот вокруг своей оси за 23 часа 56 минут.' },
    { id: 64, text: '💫 Звёзды бывают разных цветов: голубые — самые горячие, красные — прохладные.' },
    { id: 65, text: '🪐 У Юпитера есть Большое Красное Пятно — гигантский шторм, бушующий столетиями.' },
    { id: 66, text: '🚀 Космический телескоп «Джеймс Уэбб» позволяет заглянуть в раннюю Вселенную.' },
    { id: 67, text: '🌙 Луна имеет следы от метеоритов на поверхности — они не исчезают из-за отсутствия атмосферы.' },
    { id: 68, text: '☀️ Каждую секунду Солнце сжигает 600 миллионов тонн водорода.' },
    { id: 69, text: '🌌 Вселенная расширяется быстрее, чем считалось ранее — это открытие получило Нобелевскую премию.' },
    { id: 70, text: '🔭 Галилей первым использовал телескоп для наблюдения звёзд в 1609 году.' },
    
    { id: 71, text: '🌠 Метеориты, упавшие на Землю, иногда содержат органические молекулы — кирпичики жизни.' },
    { id: 72, text: '🌍 Атмосфера Земли защищает нас от солнечного ветра и космической радиации.' },
    { id: 73, text: '💫 Бетельгейзе — красный сверхгигант, который может взорваться в любой момент.' },
    { id: 74, text: '🚀 Первая женщина в космосе — Валентина Терешкова, совершила полёт в 1963 году.' },
    { id: 75, text: '🌌 Галактики часто сталкиваются и сливаются, рождая новые звёзды.' },
    { id: 76, text: '🔴 На Марсе есть каньон длиной 4000 км — Долина Маринер, в 10 раз длиннее Гранд-Каньона.' },
    { id: 77, text: '🌕 У Земли есть второй «спутник» — астероид 3753 Круитни, который движется по сложной орбите.' },
    { id: 78, text: '☀️ Солнце вращается вокруг центра галактики со скоростью 220 км/с.' },
    { id: 79, text: '🪐 Кольца Сатурна настолько тонкие, что их толщина всего несколько километров.' },
    { id: 80, text: '🌠 Зодиакальный свет — это слабое свечение, вызванное пылью в Солнечной системе.' },
    
    { id: 81, text: '🔭 «Хаббл» сделал снимок поля глубокого космоса, где видно 10 000 галактик.' },
    { id: 82, text: '🌍 Земля вращается со скоростью 1670 км/ч на экваторе.' },
    { id: 83, text: '💫 Белые карлики остывают миллиарды лет — это самые старые объекты во Вселенной.' },
    { id: 84, text: '🚀 Космический шаттл «Дискавери» совершил 39 полётов — больше всех.' },
    { id: 85, text: '🌌 Туманность Ориона видна невооружённым глазом как размытое пятно.' },
    { id: 86, text: '🔴 Марсианский день называется «сол» и длится 24 часа 39 минут.' },
    { id: 87, text: '🌙 На Луне есть «моря» — это тёмные равнины из застывшей лавы.' },
    { id: 88, text: '☀️ Солнечный ветер состоит из заряженных частиц, летящих со скоростью 400–800 км/с.' },
    { id: 89, text: '🪐 У Юпитера 95 известных спутников. Четыре самых больших — это Галилеевы спутники.' },
    { id: 90, text: '🌠 Космическое излучение может повредить ДНК — поэтому астронавты защищены.' },
    
    { id: 91, text: '🔭 Телескоп «Кеплер» обнаружил более 2600 экзопланет.' },
    { id: 92, text: '🌍 Площадь поверхности Земли — 510 миллионов км², из них 70% покрыто водой.' },
    { id: 93, text: '💫 Нейтронные звёзды имеют массу Солнца, но размер всего 20 км в диаметре.' },
    { id: 94, text: '🚀 Первый искусственный спутник Земли — «Спутник-1», запущен в 1957 году.' },
    { id: 95, text: '🌌 Галактика Треугольник — третья по величине галактика в нашей группе.' },
    { id: 96, text: '🔴 Спутник Марса Фобос постепенно разрушается и через 30–50 млн лет упадёт на планету.' },
    { id: 97, text: '🌙 Лунные камни, привезённые с «Аполлона», старше большинства земных пород.' },
    { id: 98, text: '☀️ Солнечное затмение происходит примерно раз в 18 месяцев где-то на Земле.' },
    { id: 99, text: '🪐 Экзопланета WASP-12b настолько горячая, что её атмосфера испаряется.' },
    { id: 100, text: '🌠 Ты — часть Вселенной. Ты — её глаза, уши, мысли. Продолжай исследовать!' },
    { id: 101, text: '«Мы — это способ, которым космос познает себя.» — Карл Саган' },
{ id: 102, text: '«Если вы хотите построить космический корабль, не собирайте людей вместе, чтобы дать им инструкции. Вдохновите их на мечту.» —  приписывается Артуру Кларку' },
{ id: 103, text: '«Космос не так уж и далёк. Всего час езды, если ваша машина едет вертикально вверх.» — Фред Хойл' },
{ id: 104, text: '«Мы живём на маленькой планете, которая вращается вокруг маленькой звезды на окраине одной из многих галактик. Но мы можем осознавать это.» — Стивен Хокинг' },
{ id: 105, text: '«Вселенная не просто удивительнее, чем мы предполагаем. Она удивительнее, чем мы можем предположить.» — Джон Бёрдон Холдейн' },
{ id: 106, text: '«Ищите жизнь во Вселенной. Если мы её не найдём, это будет ужасной тратой пространства.» — приписывается Карлу Сагану' },
{ id: 107, text: '«Каждый атом твоего тела образовался в ядре взорвавшейся звезды. Ты — это звёздный материал, который осознал себя.» — Лоуренс Краусс' },
{ id: 108, text: '«Границы космоса — это границы нашего воображения.» — приписывается Стивену Хокингу' },
{ id: 109, text: '«Возможно, жизнь на других планетах — это не просто биология, а нечто, что мы даже не можем вообразить.» — Карл Саган' },
{ id: 110, text: '«Мы не можем судить о жизни во Вселенной по единственному известному нам примеру. Но мы обязаны искать.» — Сара Сигер' },
{ id: 111, text: '«Земля — это единственный дом, который у нас есть. Но мы — народ звёзд, и мы не должны оставаться здесь навсегда.» — Рэй Брэдбери' },
{ id: 112, text: '«Биосфера Земли — это тончайшая плёнка жизни на камне, вращающемся в бесконечности.» — Джеймс Лавлок' },
{ id: 113, text: '«Жизнь на Земле возникла из химии. Но химия во Вселенной везде одинакова. Значит, жизнь должна быть распространена.» — Роберт Хейзен' },
{ id: 114, text: '«Органические молекулы найдены в метеоритах, в кометах, в туманностях. Кирпичики жизни — повсюду.» — Джеффри Бэда' },
{ id: 115, text: '«Глубоководные гидротермальные источники — это модель того, как могла зародиться жизнь на Земле. И такие источники есть на спутниках Юпитера.» — Майкл Рассел' },
{ id: 116, text: '«РНК-мир — это гипотеза о том, что первая жизнь была основана на РНК. И это могло произойти где угодно, где есть вода и энергия.» — Уолтер Гилберт' },
{ id: 117, text: '«Если жизнь возникла на Земле так быстро после её охлаждения, то она должна возникать везде, где есть условия.» — Майкл Рассел' },
{ id: 118, text: '«Спутник Европа — главный кандидат на поиск жизни. Подо льдом — океан, который существует миллиарды лет.» — Роберт Паппалардо' },
{ id: 119, text: '«Энцелад — спутник Сатурна — выбрасывает гейзеры воды из подлёдного океана. Мы можем просто пролететь сквозь них и взять пробу.» — Каролин Порко' },
{ id: 120, text: '«Титан — спутник Сатурна — имеет атмосферу, моря из метана и органический туман. Это похоже на раннюю Землю.» — Крис Маккей' },
{ id: 121, text: '«Марс был тёплым и влажным миллиарды лет назад. Если жизнь могла возникнуть там, она может быть там до сих пор под поверхностью.» — Джон Гротцингер' },
{ id: 122, text: '«Земля существует 4,5 миллиарда лет. Жизнь на ней появилась почти сразу — через 500 миллионов лет после образования.» — Стивен Мойжжис' },
{ id: 123, text: '«Кембрийский взрыв 540 миллионов лет назад — это момент, когда жизнь вдруг стала сложной и разнообразной. Почему? Мы не знаем.» — Стивен Гулд' },
{ id: 124, text: '«Человечество — это всего лишь один из экспериментов Вселенной. Но мы — первый эксперимент, который может покинуть свою планету.» — приписывается Артуру Кларку' },
{ id: 125, text: '«Вселенная бесконечна в пространстве и времени. Мы видим лишь крошечную часть. Представьте, что скрывается за горизонтом.» — Алан Гут' },
{ id: 126, text: '«Инфляционная теория говорит, что Вселенная расширилась в 10²⁶ раз за долю секунды. За этим стоит невероятная физика.» — Андрей Линде' },
{ id: 127, text: '«Мультивселенная — это не фантастика. Это прямое следствие инфляции. Возможно, нас — бесконечно много копий.» — Макс Тегмарк' },
{ id: 128, text: '«Тёмная материя составляет 85% всей материи во Вселенной. Мы её не видим, но мы знаем, что она есть.» — Вера Рубин' },
{ id: 129, text: '«Тёмная энергия разгоняет расширение Вселенной. Мы не знаем, что это такое, но она управляет судьбой космоса.» — Сол Перлмуттер, Нобелевская лекция, 2011' },
{ id: 130, text: '«Кварк-глюонная плазма — это состояние материи, которое существовало через микросекунды после Большого взрыва.» — Дэвид Гросс' },
{ id: 131, text: '«Гамма-всплески — самые мощные взрывы во Вселенной. За несколько секунд они выделяют энергии больше, чем Солнце за всё время.» — Нил Герелс' },
{ id: 132, text: '«Быстрые радиовсплески — это загадочные сигналы из далёких галактик. Мы не знаем, что их вызывает.» — Виктория Каспи' },
{ id: 133, text: '«Гравитационные волны — это рябь пространства-времени. Их открытие — новый способ смотреть на Вселенную.» — Кип Торн' },
{ id: 134, text: '«Слияние двух чёрных дыр порождает гравитационные волны. Так мы впервые услышали Вселенную.» — Райнер Вайсс, Нобелевская лекция, 2017' },
{ id: 135, text: '«Чёрные дыры — это не просто объекты. Они — самая экстремальная физика, где пространство и время перестают существовать.» — Роджер Пенроуз' },
{ id: 136, text: '«Горизонт событий чёрной дыры — это точка невозврата. Мы никогда не узнаем, что там внутри.» — Стивен Хокинг' },
{ id: 137, text: '«Экзопланеты бывают такими разными: горячие юпитеры, суперземли, планеты-океаны, планеты-пустыни.» — Дидье Кело' },
{ id: 138, text: '«Зона обитаемости — это расстояние от звезды, где вода может быть жидкой. Но жизнь может быть и в других зонах.» — Джеймс Кастинг' },
{ id: 139, text: '«Биосигнатуры — это следы жизни, которые мы ищем: кислород, метан, хлорофилл, сложные органические молекулы.» — Сара Сигер' },
{ id: 140, text: '«Миссия «Джеймс Уэбб» может обнаружить признаки жизни на экзопланетах уже через несколько лет.» — Натали Баталья' },
{ id: 141, text: '«Панспермия — это гипотеза о том, что жизнь пришла на Землю из космоса. На метеоритах или кометах.» — Фред Хойл' },
{ id: 142, text: '«Бактерии могут выживать в космосе, в вакууме, под радиацией. Жизнь может путешествовать между планетами.» — Герда Хорнек' },
{ id: 143, text: '«Тихоходки — самые выносливые существа на Земле. Они выживают в открытом космосе и могут жить везде.» — Ральф Шилл' },
{ id: 144, text: '«Экстремофилы живут в кипятке, во льду, в кислоте, в радиоактивных отходах. Жизнь найдёт способ.» — Томас Брок' },
{ id: 145, text: '«Земля — это уникальная планета, но уникальность не означает одиночества.» — Карл Саган, книга «Pale Blue Dot»' },
{ id: 146, text: '«Мы ищем разумную жизнь, но мы не умеем искать. Может быть, они уже здесь, в другой форме.» — Стэнтон Фридман' },
{ id: 147, text: '«Парадокс Ферми — если Вселенная полна жизни, то где все? Может быть, они прячутся или мы слишком примитивны.» — Энрико Ферми' },
{ id: 148, text: '«Великий фильтр — это идея о том, что существует некое препятствие, которое уничтожает цивилизации на пути к звёздам.» — Робин Хэнсон' },
{ id: 149, text: '«SETI ищет сигналы разума уже 60 лет. Мы не нашли ничего, но это значит только то, что мы плохо искали.» — Джилл Тартер' },
{ id: 150, text: '«Мы передаём сигналы в космос с 1930-х годов. Любая цивилизация в радиусе 100 световых лет могла бы нас услышать.» — Сет Шостак' },
{ id: 151, text: '«Послание Аресибо — это радиосигнал, отправленный в космос в 1974 году. Он достигнет звёздного скопления через 25 000 лет.» — Фрэнк Дрейк' },
{ id: 152, text: '«Золотая пластинка «Вояджера» содержит звуки Земли, музыку и изображения. Это послание в бутылке для Вселенной.» — Карл Саган' },
{ id: 153, text: '«Если инопланетяне найдут «Вояджер», они узнают о нас через музыку Бетховена и приветствия на 55 языках.» — Энн Друян' },
{ id: 154, text: '«Вселенная настолько стара, что первые цивилизации могли возникнуть миллиарды лет назад. Где они сейчас?» — Пол Дэвис' },
{ id: 155, text: '«Техносигнатуры — это искусственные сигналы, которые мы ищем: радио, лазеры, мегаструктуры.» — Джейсон Райт' },
{ id: 156, text: '«Сфера Дайсона — это гигантская структура вокруг звезды для сбора энергии. Если она существует, мы её найдём.» — Фримен Дайсон' },
{ id: 157, text: '«Космические лифты, звёздные паруса, терраформирование — это технологии будущего, которые могут сделать нас межпланетными.» — Митио Каку' },
{ id: 158, text: '«Астероиды содержат триллионы долларов в металлах. Добыча на них может стать основой космической экономики.» — Нил Деграсс Тайсон' },
{ id: 159, text: '«Космический мусор — это серьёзная проблема. На орбите Земли — более 100 миллионов фрагментов.» — Дональд Кесслер' },
{ id: 160, text: '«Солнечный парус — это способ путешествовать по космосу без топлива, используя давление солнечного света.» — Карл Саган' },
{ id: 161, text: '«Ионные двигатели — это слабые, но очень эффективные двигатели для длительных космических путешествий.» — Роберт Бубба' },
{ id: 162, text: '«Космические путешествия изменяют человека: кости становятся хрупкими, мышцы атрофируются, зрение портится.» — Скотт Келли' },
{ id: 163, text: '«Радиационный пояс Ван Аллена защищает Землю, но он — опасность для астронавтов.» — Джеймс Ван Аллен' },
{ id: 164, text: '«Магнитное поле Земли — это невидимый щит. Оно защищает нас от солнечного ветра. Без него атмосфера бы исчезла.» — Гэри Глейзмайер' },
{ id: 165, text: '«Озоновый слой — это ещё один щит, который защищает нас от ультрафиолета. Мы почти его уничтожили, но восстановили.» — Марио Молина' },
{ id: 166, text: '«Земля дышит. Каждый год океаны поглощают 25% углекислого газа, который мы производим.» — Джеймс Лавлок' },
{ id: 167, text: '«Атмосфера Земли — это смесь газов, которая уникальна. Кислород — это биосигнатура.» — Джеймс Кастинг' },
{ id: 168, text: '«Жизнь на Земле — это невероятное разнообразие: 8,7 миллионов видов, и мы описали только 1,2 миллиона.» — Камило Мора' },
{ id: 169, text: '«Эволюция — это не просто теория. Это факт. Она объясняет всё разнообразие жизни на Земле.» — Ричард Докинз' },
{ id: 170, text: '«Человечество — это продукт эволюции. Но мы первый вид, который может направлять свою эволюцию.» — Джеймс Уотсон' },
{ id: 171, text: '«Геном человека содержит 3 миллиарда пар оснований. Но 98% из них — это «мусорная» ДНК.» — Фрэнсис Коллинз' },
{ id: 172, text: '«Мы делим 60% нашей ДНК с бананами. Жизнь на Земле — это одна большая семья.» — неизвестный' },
{ id: 173, text: '«Древо жизни показывает, что все живые организмы — от бактерий до человека — связаны общим происхождением.» — Карл Вёзе' },
{ id: 174, text: '«Вирусы — это не живые существа, но они управляют эволюцией жизни на Земле.» — Дэвид Балтимор' },
{ id: 175, text: '«Бактерии в нашем организме (микробиом) — это отдельный орган, который влияет на всё: настроение, иммунитет, вес.» — Эмма Аллен-Верко' },
{ id: 176, text: '«Земля — это одна из миллиардов планет. Но пока — это единственный известный рай. Берегите его.» — Карл Саган' },
{ id: 177, text: '«Мы не унаследовали Землю от родителей. Мы взяли её взаймы у детей.» — индейская пословица' },
{ id: 178, text: '«Солнечная система — это наш дом, и мы только начинаем его исследовать. За порогом — миллиарды домов.» — Брайан Кокс' },
{ id: 179, text: '«Первые звезды зажглись через 100 миллионов лет после Большого взрыва. Они были огромными и недолговечными.» — Роберт Кируш' },
{ id: 180, text: '«Звёзды — это фабрики элементов. Всё, кроме водорода и гелия, было создано в звёздах.» — Маргарет Бёрбидж' },
{ id: 181, text: '«Сверхновые звёзды — это кузницы тяжелых элементов. Золото, серебро, уран — всё рождается в их смерти.» — Кэти Томпсон' },
{ id: 182, text: '«Атомы углерода в твоём теле были созданы в ядре трёх звёзд, которые взорвались до рождения Солнца.» — Нил Деграсс Тайсон' },
{ id: 183, text: '«Космос — это не тишина. Это шумный мир из радиоволн, ударных волн и гравитационных ряби.» — Джордж Смут' },
{ id: 184, text: '«Радиоизлучение Юпитера в 100 раз мощнее, чем у Солнца. Планеты тоже могут «разговаривать».» — Бенджамин Карр' },
{ id: 185, text: '«Шум большого взрыва — это реликтовое излучение. Мы слышим его как шипение на радиоволнах.» — Арно Пензиас' },
{ id: 186, text: '«Космический микроволновый фон — это древнейший свет, который мы можем видеть. Он несет историю Вселенной.» — Роберт Уилсон' },
{ id: 187, text: '«Вселенная расширяется, и свет от далёких галактик краснеет. Красное смещение — это космический доплер.» — Эдвин Хаббл' },
{ id: 188, text: '«Хаббл обнаружил, что галактики разлетаются. Это было первое доказательство того, что Вселенная началась с взрыва.» — Джордж Леметр' },
{ id: 189, text: '«Большой взрыв — это не взрыв в пространстве. Это взрыв пространства и времени.» — Стивен Хокинг' },
{ id: 190, text: '«До Большого взрыва не было «до». Время родилось вместе со Вселенной.» — Стивен Хокинг' },
{ id: 191, text: '«Квантовая флуктуация могла породить Вселенную из ничего. Это не фантастика, а серьёзная физика.» — Александр Виленкин' },
{ id: 192, text: '«Наша Вселенная — это один из возможных вакуумов. Есть теория, что другие вакуумы могут породить другие вселенные.» — Франк Вильчек' },
{ id: 193, text: '«Теория струн предполагает, что существует 11 измерений. Мы живём только в трёх пространственных и одном временном.» — Эдвард Виттен' },
{ id: 194, text: '«Мы можем быть голограммами. Теория о том, что наша Вселенная — это проекция с двумерной поверхности.» — Леонард Сасскинд' },
{ id: 195, text: '«Квантовая запутанность — это странность, где частицы влияют друг на друга на любом расстоянии.» — Альберт Эйнштейн' },
{ id: 196, text: '«Эйнштейн называл запутанность «призрачным действием на расстоянии». Но это реальность.» — Ален Аспе' },
{ id: 197, text: '«Наблюдатель влияет на результат в квантовой механике. Сознание может быть фундаментальным.» — Юджин Вигнер' },
{ id: 198, text: '«Парадокс кота Шрёдингера — это мысленный эксперимент о том, что объект может быть в двух состояниях одновременно.» — Эрвин Шрёдингер' },
{ id: 199, text: '«Вселенная может быть симуляцией. Если это так, то законы физики — это код.» — Ник Бостром' },
{ id: 200, text: '«Если это симуляция, то где-то есть компьютер, который её запускает. Но кто создал тот компьютер?» — Илон Маск' },
{ id: 201, text: '«Мы ищем смысл жизни, а жизнь — это просто способ Вселенной создавать смысл.» — Юваль Ной Харари' },
{ id: 202, text: '«ДНК — это код жизни. Но кто написал этот код? Ответ — эволюция, но у эволюции нет разума.» — Фрэнсис Крик' },
{ id: 203, text: '«Рибосомы — это молекулярные машины, которые собирают белки. Они работают уже 4 миллиарда лет.» — Ада Йонат' },
{ id: 204, text: '«Митохондрии — это бывшие бактерии, которые стали органеллами. Они дают нам энергию и управляют старением.» — Линн Маргулис' },
{ id: 205, text: '«Симбиоз — это основа эволюции. Клетки объединялись, чтобы создать сложную жизнь.» — Линн Маргулис' },
{ id: 206, text: '«Планктон в океане производит 50% кислорода на Земле. Мы дышим благодаря микроскопической жизни.» — Джон Холланд' },
{ id: 207, text: '«Грибы — это отдельное царство жизни. Они связывают леса под землёй и обмениваются питанием.» — Пол Стаметс' },
{ id: 208, text: '«Растения чувствуют свет, гравитацию, прикосновения. Они общаются друг с другом через корни.» — Стефано Манкузо' },
{ id: 209, text: '«Интеллект — это не только мозг. Слизевики могут решать лабиринты без нервной системы.» — Тосиюки Накагаки' },
{ id: 210, text: '«Осьминоги — это инопланетяне на Земле. Они имеют три сердца, синюю кровь и девять мозгов.» — Сидни Бреннер' },
{ id: 211, text: '«Гигантский кальмар — это существо, которое живёт в глубине океана. Мы видели его только в 2004 году.» — Цунами Куботира' },
{ id: 212, text: '«Океан покрывает 70% Земли, но мы исследовали только 5%. Там скрыто больше тайн, чем в космосе.» — Роберт Баллард' },
{ id: 213, text: '«Гидротермальные источники на дне океана — это оазисы жизни в полной темноте. Они могут быть моделями для Европы.» — Синди Ван Довер' },
{ id: 214, text: '«Жизнь может существовать в жидком метане на Титане. Там другие молекулы, другие мембраны, другая биохимия.» — Джонатан Лунин' },
{ id: 215, text: '«Кремниевая жизнь — это научно-фантастическая идея, но на других планетах она может быть реальна.» — Мартин Фокс' },
{ id: 216, text: '«Вода — это универсальный растворитель для жизни на Земле. Но на других планетах растворителем может быть аммиак или метан.» — Дэвид Стивенсон' },
{ id: 217, text: '«Жизнь — это просто химия. Но химия настолько сложна, что кажется магией.» — Роальд Хоффманн' },
{ id: 218, text: '«Если Вселенная бесконечна, то где-то есть копия Земли, где ты читаешь это же сообщение на другой планете.» — Макс Тегмарк' },
{ id: 219, text: '«Бесконечная Вселенная означает, что всё возможное где-то существует.» — Брайан Грин' },
{ id: 220, text: '«Странная Вселенная, странные законы, странная жизнь. Но мы здесь, чтобы удивляться.» — Роберт Оруэлл' },
{ id: 221, text: '«Астрономия — это путешествие во времени. Когда мы смотрим на звёзды, мы видим прошлое.» — Мартин Рис' },
{ id: 222, text: '«Свет от ближайшей галактики Андромеды идёт к нам 2,5 миллиона лет. Мы видим её такой, какой она была, когда появились первые люди.» — Эдвин Хаббл' },
{ id: 223, text: '«Глубокое поле Хаббла — это изображение кусочка неба размером с песчинку. Там тысячи галактик.» — Роберт Уильямс' },
{ id: 224, text: '«Каждая галактика — это миллиарды звёзд. Каждая звезда — это потенциальная солнечная система.» — Карл Саган' },
{ id: 225, text: '«Мы живём во Вселенной, где количество звёзд превышает количество песчинок на всех пляжах Земли.» — Карл Саган' },
{ id: 226, text: '«Мы — результат космической эволюции. Частицы превратились в звёзды, звёзды — в планеты, планеты — в жизнь.» — Эрик Чайсон' },
{ id: 227, text: '«Вселенная молода. Ей только 13,8 миллиарда лет. Звёзды будут гореть ещё триллионы лет.» — Фред Адамс' },
{ id: 228, text: '«Мы живём в золотую эпоху астрономии. Мы узнали больше за последние 100 лет, чем за всю историю.» — Нил Деграсс Тайсон' },
{ id: 229, text: '«Каждый новый телескоп — это новый глаз для человечества. С каждым открытием мы видим больше.» — Джон Барроу' },
{ id: 230, text: '«Глаза человека могут видеть только малую часть спектра. Мы используем инструменты, чтобы увидеть невидимое.» — Роберт Киршнер' },
{ id: 231, text: '«Радиоастрономия показывает нам Вселенную в радиоволнах. Рентгеновская астрономия — в рентгене. И так для каждого диапазона.» — Джеффри Марси' },
{ id: 232, text: '«Гамма-телескопы видят самые энергичные события во Вселенной: взрывы сверхновых, гамма-всплески.» — Дэвид Томпсон' },
{ id: 233, text: '«Нейтринные телескопы ловят частицы, которые проходят сквозь Землю. Они рассказывают о недрах звёзд.» — Джон Баколл' },
{ id: 234, text: '«Гравитационно-волновые обсерватории — это новый вид астрономии. Мы слышим Вселенную, а не видим.» — Барри Бэриш' },
{ id: 235, text: '«Космические лучи — это частицы из далёких уголков Вселенной. Они несут информацию, которую мы учимся читать.» — Джеймс Кронин' },
{ id: 236, text: '«Солнце — это обычная звезда. Но для нас она особенная, потому что она даёт нам жизнь.» — Ричард Кэрингтон' },
{ id: 237, text: '«Наше Солнце — это третий по счёту владелец Земли. Ранее здесь уже были звёзды, которые взорвались.» — Майкл Дж. Томпсон' },
{ id: 238, text: '«Солнечная система — это остатки туманности, которая сжалась под силой гравитации.» — Пьер-Симон Лаплас' },
{ id: 239, text: '«Планеты образуются из протопланетного диска — из пыли и газа вокруг молодой звезды.» — Виктор Сафронов' },
{ id: 240, text: '«Астероидный пояс — это материал, который не смог стать планетой из-за гравитации Юпитера.» — Дэвид Джуитт' },
{ id: 241, text: '«Пояс Койпера — это регион за Нептуном. Там тысячи объектов, включая Плутон.» — Джерард Койпер' },
{ id: 242, text: '«Облако Оорта — это гигантская оболочка вокруг Солнечной системы. Оттуда приходят долгопериодические кометы.» — Ян Оорт' },
{ id: 243, text: '«Хаумеа — это карликовая планета в поясе Койпера. Она имеет форму яйца из-за быстрого вращения.» — Хосе Луис Ортис' },
{ id: 244, text: '«Эрида — это карликовая планета, которая больше Плутона. Её открытие заставило пересмотреть определение планеты.» — Майкл Браун' },
{ id: 245, text: '«Церера — это карликовая планета в поясе астероидов. У неё есть подземный океан.» — Джули Кастильо-Рохес' },
{ id: 246, text: '«Плутон имеет сердце — это ледник из замороженного азота. Он виден на снимках «Новых горизонтов».» — Алан Стерн' },
{ id: 247, text: '«Спутники планет — это мини-миры. У Юпитера и Сатурна их больше 100.» — Скотт Шеппард' },
{ id: 248, text: '«Ио — спутник Юпитера — самый вулканический объект в Солнечной системе.» — Стэнтон Пил' },
{ id: 249, text: '«Ганимед — самый большой спутник в Солнечной системе. Он больше Меркурия.» — Джон Спенсер' },
{ id: 250, text: '«Каллисто — это старейший спутник Юпитера. Его поверхность покрыта кратерами миллиарды лет.» — Пол Шенк' },
{ id: 251, text: '«Мимас — спутник Сатурна — похож на Звезду Смерти из «Звёздных войн» из-за огромного кратера.» — Линда Спилкер' },
{ id: 252, text: '«Энцелад — спутник Сатурна — извергает гейзеры из подлёдного океана. Это одно из главных мест для поиска жизни.» — Каролин Порко' },
{ id: 253, text: '«Тритон — спутник Нептуна — вращается в обратную сторону. Это захваченный объект из пояса Койпера.» — Дейл Крукшенк' },
{ id: 254, text: '«Луна Земли — это самый крупный спутник относительно своей планеты. Она стабилизирует нашу ось.» — Джек Лиссауэр' },
{ id: 255, text: '«Без Луны Земля колебалась бы хаотично. Это сделало бы жизнь невозможной.» — Жак Ласкар' },
{ id: 256, text: '«Приливы на Земле — это результат гравитации Луны. Они влияют на океаны и даже на мантию.» — Джордж Дарвин' },
{ id: 257, text: '«Солнечные затмения возможны, потому что Луна идеально закрывает Солнце по размеру. Это совпадение.» — Нил Деграсс Тайсон' },
{ id: 258, text: '«Луна постепенно замедляет вращение Земли. Дни становятся длиннее на 1,7 миллисекунды в столетие.» — Лесли Моррисон' },
{ id: 259, text: '«Кольца Сатурна могут быть остатками разрушенного спутника. Возможно, они образовались недавно по космическим меркам.» — Сара Стюарт' },
{ id: 260, text: '«Кольца Юпитера, Урана и Нептуна очень тусклые. Их почти не видно с Земли.» — Марк Шоуолтер' },
{ id: 261, text: '«Уран вращается на боку, потому что в него врезался объект размером с Землю.» — Робин Кэнап' },
{ id: 262, text: '«Плутон и Харон — это двойная система. Они вращаются вокруг общего центра масс.» — Стерн Алан' },
{ id: 263, text: '«Харон — спутник Плутона — такой большой, что некоторые астрономы называют их двойной планетой.» — Нил Деграсс Тайсон' },
{ id: 264, text: '«Марсоход Curiosity нашёл органические молекулы на Марсе. Жизнь там могла существовать.» — Джон Гротцингер' },
{ id: 265, text: '«Марсоход Perseverance собирает образцы на Марсе. Они вернутся на Землю к 2030 году.» — Кенни Фарли' },
{ id: 266, text: '«Гелий-3 на Луне может стать топливом для термоядерных реакторов. На Земле его почти нет.» — Джеральд Кульчински' },
{ id: 267, text: '«Лунная база — это следующий шаг. NASA планирует построить её к 2030-м годам.» — Джим Брайденстайн' },
{ id: 268, text: '«Марсианская база — цель SpaceX. Мы планируем отправить людей в 2030-х.» — Илон Маск' },
{ id: 269, text: '«Терраформирование Марса — это изменение атмосферы, чтобы сделать его пригодным для жизни.» — Кристофер Маккей' },
{ id: 270, text: '«Космический туризм уже существует. В 2021 году состоялся первый гражданский полёт на орбиту.» — Джаред Айзекман' },
{ id: 271, text: '«Космос становится доступнее. Коммерческие компании снижают стоимость запусков.» — Питер Бек' },
{ id: 272, text: '«Космические экосистемы — это искусственная среда на орбите. Мы учимся выращивать там еду.» — Анна-Лиза Пол' },
{ id: 273, text: '«3D-печать в космосе позволит строить инструменты и жильё на месте.» — Трейси Гиллиам' },
{ id: 274, text: '«Астероидная добыча может обеспечить ресурсами будущие миссии.» — Фил Метцгер' },
{ id: 275, text: '«Космический мусор угрожает спутникам. Мы должны научиться его убирать.» — Томас Шилд' },
{ id: 276, text: '«Мы стоим на пороге новой эры. В этой эре человечество станет многопланетным.» — Базз Олдрин' },
{ id: 277, text: '«Человечество — это крошечная искра в бесконечной тьме. Но эта искра мечтает стать огнём.» — Рэй Брэдбери' },
{ id: 278, text: '«Мы не знаем, что ждёт нас в космосе. Но мы знаем, что мы должны туда идти.» — Стивен Хокинг' },
{ id: 279, text: '«Вселенная ждёт нас. Она терпелива. Она старше нас на миллиарды лет.» — Мэри Робинетт Коваль' },
{ id: 280, text: '«Всё, что мы есть, и всё, что мы знаем, — это часть космоса. Мы вернулись туда, откуда пришли.» — Юрий Гагарин, интервью после полёта, 1961' },
{ id: 281, text: '«Мы — дети Земли, и мы — наследники Вселенной.» — Константин Циолковский, книга «Грёзы о Земле и небе»' },
{ id: 282, text: '«Каждый из нас — это маленькая Вселенная. У нас есть звёзды в крови, и космос в наших глазах.» — Владимир Вернадский' },
{ id: 283, text: '«Исследование космоса — это не просто наука. Это путь к пониманию себя.» — Януш Зберски' },
{ id: 284, text: '«Космос — это зеркало. Мы видим там отражение нашей мечты о бесконечности.» — Стэнли Кубрик' },
{ id: 285, text: '«Зачем мы идём в космос? Потому что мы — люди. Потому что мы любопытны. Потому что мы должны.» — Джин Родденберри' },
{ id: 286, text: '«Мы исследовали все уголки Земли. Остался только космос.» — Жюль Верн' },
{ id: 287, text: '«Каждое поколение думает, что оно живёт в центре Вселенной. Каждое поколение ошибается.» — Айзек Азимов' },
{ id: 288, text: '«Мы узнали, что Земля — это не центр Вселенной. Мы узнали, что мы не одни. Мы узнали, что мы малы.» — Артур Кларк' },
{ id: 289, text: '«Но мы малы не в смысле ничтожности. Мы малы в смысле скромности перед величием космоса.» — Карл Саган' },
{ id: 290, text: '«И в этой скромности — наша сила. Потому что мы можем удивляться.» — Ричард Фейнман' },
{ id: 291, text: '«Удивление — это начало мудрости. А космос — это бесконечное удивление.» — Сократ' },
{ id: 292, text: '«Смотрите на звёзды. Помните, что вы — часть чего-то большего.» — Нил Армстронг' },
{ id: 293, text: '«Мечтайте о далёких мирах. Мечты — это карта, по которой мы идём.» — Уильям Шекспир' },
{ id: 294, text: '«Космос — это не конечная точка. Это начало. Вселенная только начинает раскрывать свои тайны.» — Брюс Грим' },
{ id: 295, text: '«Мы не знаем, что будет через миллиард лет. Но мы знаем, что мы есть сейчас. И это чудо.» — Мартин Хайдеггер' },
{ id: 296, text: '«Жизнь — это чудо. Вселенная — это чудо. И мы — часть этого чуда.» — Джон Милтон' },
{ id: 297, text: '«Мы — космос, который осознал себя. Мы — Вселенная, которая смотрит на себя.» — Карл Саган' },
{ id: 298, text: '«И в этом взгляде — наша миссия: понять, кто мы, откуда мы и куда мы идём.» — Стивен Спилберг' },
{ id: 299, text: '«Иди в космос. Или останься здесь. Но никогда не переставай смотреть вверх.» — Томас Х. Гиббонс' },
{ id: 300, text: '«Ты — часть звёздного потока. Ты — часть вечности. И ты — часть этой бесконечной истории.» — Генри Дэвид Торо, книга «Уолден» ' },
{ id: 301, text: '«Человечество не останется вечно на Земле, но в погоне за светом и пространством сначала робко проникнет за пределы атмосферы, а затем завоюет себе всё околосолнечное пространство.» — Константин Циолковский' },
{ id: 302, text: '«Планета есть колыбель разума, но нельзя вечно жить в колыбели.» — Константин Циолковский' },
{ id: 303, text: '«Земля — это очень маленькая колыбель. Космос — это наш дом.» — Константин Циолковский' },
{ id: 304, text: '«Сначала неизбежно идут: мысль, фантазия, сказка. За ними шествует научный расчёт. И уже в конце концов исполнение венчает мысль.» — Константин Циолковский' },
{ id: 305, text: '«Вселенная бесконечна, и жизнь в ней должна быть бесконечна во всех её формах.» — Константин Циолковский' },
{ id: 306, text: '«Мы должны стремиться в космос, потому что там наше будущее.» — Сергей Королёв' },
{ id: 307, text: '«Космос — это не просто высота. Это будущее человечества.» — Сергей Королёв' },
{ id: 308, text: '«То, что казалось несбыточным, на протяжении веков, что сегодня является смелой мечтой, завтра может стать реальностью.» — Сергей Королёв' },
{ id: 309, text: '«Гагарин улыбнулся всему миру. И мир улыбнулся ему.» — Сергей Королёв' },
{ id: 310, text: '«Космонавтика — это не просто техника. Это философия будущего.» — Сергей Королёв' },
{ id: 311, text: '«Я вижу Землю! Она такая красивая!» — Юрий Гагарин' },
{ id: 312, text: '«Облетев Землю в корабле-спутнике, я увидел, как прекрасна наша планета. Люди, будем хранить и приумножать эту красоту, а не разрушать её!» — Юрий Гагарин' },
{ id: 313, text: '«Поехали!» — Юрий Гагарин' },
{ id: 314, text: '«Земля голубая... какая она красивая!» — Юрий Гагарин' },
{ id: 315, text: '«Космос зовёт тех, кто смел и добр. Мы вернёмся, чтобы рассказать о нём другим.» — Юрий Гагарин' },
{ id: 316, text: '«Космос — это не мужское дело. Это дело человеческое.» — Валентина Терешкова' },
{ id: 317, text: '«Если женщина может быть космонавтом, то она может быть кем угодно.» — Валентина Терешкова' },
{ id: 318, text: '«Небо не имеет границ, и моя мечта не имела границ.» — Валентина Терешкова' },
{ id: 319, text: '«Космос — это наша судьба, наше будущее.» — Валентина Терешкова' },
{ id: 320, text: '«Человек должен летать. Это его природа, его предназначение.» — Алексей Леонов' },
{ id: 321, text: '«Когда я вышел в открытый космос, я понял, что Земля — это наш общий дом.» — Алексей Леонов' },
{ id: 322, text: '«Космос прекрасен и опасен одновременно. Но он стоит того, чтобы его покорять.» — Алексей Леонов' },
{ id: 323, text: '«Мы не знаем всех тайн Вселенной, но мы знаем, что они существуют.» — Алексей Леонов' },
{ id: 324, text: '«Земля — это наш единственный дом, но мы должны смотреть за его пределы.» — Герман Титов' },
{ id: 325, text: '«Космос — это величайшее приключение человечества.» — Герман Титов' },
{ id: 326, text: '«Я был готов к невесомости, но не был готов к красоте Земли.» — Герман Титов' },
{ id: 327, text: '«Мы приходим в космос как посланцы всей Земли.» — Павел Попович' },
{ id: 328, text: '«Космос объединяет людей. За его пределами нет стран, есть только одна планета.» — Павел Попович' },
{ id: 329, text: '«Вселенная — это книга, которая открывается перед нами по странице.» — Владимир Вернадский' },
{ id: 330, text: '«Мысль есть проявление жизни, и она не ограничена пределами Земли.» — Владимир Вернадский' },
{ id: 331, text: '«Биосфера переходит в ноосферу, а ноосфера — в космос.» — Владимир Вернадский' },
{ id: 332, text: '«Человек есть мера всех вещей, но Вселенная есть мера человека.» — Владимир Вернадский' },
{ id: 333, text: '«Науку нельзя остановить. Космос будет покорён.» — Александр Чижевский' },
{ id: 334, text: '«Земля дышит в ритме космоса. Мы — часть этого ритма.» — Александр Чижевский' },
{ id: 335, text: '«Солнечная активность управляет историей человечества.» — Александр Чижевский' },
{ id: 336, text: '«Мы связаны с космосом невидимыми нитями. Мы — дети Солнца.» — Александр Чижевский' },
{ id: 337, text: '«В космосе нет ни времени, ни расстояния. Есть только бесконечность.» — Иван Ефремов' },
{ id: 338, text: '«Человечество станет бессмертным, когда выйдет в космос.» — Иван Ефремов' },
{ id: 339, text: '«Вселенная полна жизни, и мы не одиноки в ней.» — Иван Ефремов' },
{ id: 340, text: '«Космос — это не пустота. Это пространство, наполненное смыслом.» — Иван Ефремов' },
{ id: 341, text: '«Тысячи планет ждут человека. Мы должны прийти к ним.» — Александр Казанцев' },
{ id: 342, text: '«Космос — это зеркало нашей души. Каждый видит в нём своё отражение.» — Александр Казанцев' },
{ id: 343, text: '«Мы — дети звёзд, и мы вернёмся к звёздам.» — Александр Казанцев' },
{ id: 344, text: '«Встреча с иным разумом — это встреча с самими собой.» — Александр Казанцев' },
{ id: 345, text: '«Космос — это не только бездна, но и бесконечные возможности.» — братья Стругацкие (Аркадий и Борис Стругацкие)' },
{ id: 346, text: '«Человечество должно расти, и расти оно будет в космос.» — братья Стругацкие (Аркадий и Борис Стругацкие)' },
{ id: 347, text: '«Вселенная населена, и это самое замечательное её свойство.» — братья Стругацкие (Аркадий и Борис Стругацкие)' },
{ id: 348, text: '«Звёзды — это не просто огоньки. Это другие миры, другие судьбы.» — братья Стругацкие (Аркадий и Борис Стругацкие)' },
{ id: 349, text: '«Мы обязаны лететь к звёздам, потому что это наша судьба.» — Николай Носов' },
{ id: 350, text: '«Космос — это не фантастика. Это будущее, которое уже наступило.» — Николай Носов' },
{ id: 351, text: '«Для того, чтобы лететь в космос, нужно не только умение, но и желание мечтать.» — Николай Носов' },
{ id: 352, text: '«Мечты о космосе делают нас лучше, добрее и чище.» — Николай Носов' },
{ id: 353, text: '«Космос — это наша общая мечта. И мы должны сделать её реальностью.» — Владимир Джанибеков' },
{ id: 354, text: '«С Землёй я разговариваю, как с живым существом. Она чувствует нас, мы чувствуем её.» — Владимир Джанибеков' },
{ id: 355, text: '«Эффект Джанибекова — это не просто физика. Это напоминание о том, как удивителен мир.» — Владимир Джанибеков' },
{ id: 356, text: '«В космосе понимаешь, как хрупка наша планета.» — Владимир Джанибеков' },
{ id: 357, text: '«Земля — это наш корабль, и мы все — его экипаж.» — Владимир Джанибеков' },
{ id: 358, text: '«Космос начинается там, где заканчивается атмосфера. Но в душе он начинается всегда.» — Георгий Гречко' },
{ id: 359, text: '«Я видел Землю из космоса, и она была самой прекрасной из всех планет.» — Георгий Гречко' },
{ id: 360, text: '«Космос учит нас смирению и величию одновременно.» — Георгий Гречко' },
{ id: 361, text: '«В невесомости понимаешь, что такое свобода.» — Георгий Гречко' },
{ id: 362, text: '«Космический полёт — это не работа, а состояние души.» — Владимир Ковалёнок' },
{ id: 363, text: '«Земля из космоса кажется живым организмом.» — Владимир Ковалёнок' },
{ id: 364, text: '«Мы все связаны с космосом, и мы все несём ответственность за Землю.» — Владимир Ковалёнок' },
{ id: 365, text: '«Космос — это проверка на человечность.» — Владимир Ковалёнок' },
{ id: 366, text: '«Главное в космосе — это не техника, а люди.» — Виктор Савиных' },
{ id: 367, text: '«Космос — это судьба. Мы не выбираем её, она выбирает нас.» — Виктор Савиных' },
{ id: 368, text: '«Наша планета — это песчинка в океане Вселенной. Но песчинка бесценная.» — Виктор Савиных' },
{ id: 369, text: '«Станция «Мир» — это наш маленький мир в большом космосе.» — Виктор Савиных' },
{ id: 370, text: '«Космос — это бесконечность, которая ждёт нас.» — Анатолий Соловьёв' },
{ id: 371, text: '«Выход в открытый космос — это танец с бесконечностью.» — Анатолий Соловьёв' },
{ id: 372, text: '«Космос не прощает ошибок, но он вознаграждает смелость.» — Анатолий Соловьёв' },
{ id: 373, text: '«С Земли космос кажется холодным. А из космоса Земля кажется тёплой.» — Анатолий Соловьёв' },
{ id: 374, text: '«Наша миссия — не просто летать. Наша миссия — познавать.» — Сергей Крикалёв' },
{ id: 375, text: '«Космос — это наша лаборатория, наш дом и наша мечта.» — Сергей Крикалёв' },
{ id: 376, text: '«Чем больше мы узнаём о космосе, тем больше понимаем, что мы его часть.» — Сергей Крикалёв' },
{ id: 377, text: '«Космос — это зеркало, в котором мы видим своё будущее.» — Сергей Крикалёв' },
{ id: 378, text: '«Я всегда знал, что звёзды не так далеки, как кажутся.» — Юрий Усачёв' },
{ id: 379, text: '«Космос — это наша родина. Мы просто забыли об этом.» — Юрий Усачёв' },
{ id: 380, text: '«В космосе время течёт иначе. Там осознаёшь вечность.» — Юрий Усачёв' },
{ id: 381, text: '«Мы не просто летаем в космос. Мы возвращаемся домой.» — Павел Виноградов' },
{ id: 382, text: '«Космос — это не граница. Это начало нового пути.» — Павел Виноградов' },
{ id: 383, text: '«С каждым полётом мы становимся больше, чем просто земляне.» — Павел Виноградов' },
{ id: 384, text: '«Космос — это единственное место, где можно увидеть всю планету целиком.» — Олег Котов' },
{ id: 385, text: '«Мы живём на красивейшей планете. И мы должны беречь её.» — Олег Котов' },
{ id: 386, text: '«Космический полёт — это привилегия и ответственность.» — Олег Котов' },
{ id: 387, text: '«За пределами Земли нет политики, есть только общая судьба.» — Михаил Корниенко' },
{ id: 388, text: '«Космос — это международный язык, который понимают все.» — Михаил Корниенко' },
{ id: 389, text: '«Мы все — граждане Вселенной.» — Михаил Корниенко' },
{ id: 390, text: '«Космос — это величайшая загадка, и мы пытаемся её разгадать.» — Александр Волков' },
{ id: 391, text: '«Нам нужен космос, чтобы помнить о том, как мы малы.» — Александр Волков' },
{ id: 392, text: '«Каждый полёт — это шаг к пониманию себя.» — Александр Волков' },
{ id: 393, text: '«Космос — это не только наука. Это и искусство, и философия.» — Геннадий Падалка' },
{ id: 394, text: '«Самый долгий полёт начинается с первого шага.» — Геннадий Падалка' },
{ id: 395, text: '«Мы летаем, чтобы найти ответы на вопросы, которые ещё не задали.» — Геннадий Падалка' },
{ id: 396, text: '«Космос — это наша история, наше настоящее и наше будущее.» — Фёдор Юрчихин' },
{ id: 397, text: '«Звёзды — это маяки, которые ведут нас вперёд.» — Фёдор Юрчихин' },
{ id: 398, text: '«Вселенная не имеет границ, и наши мечты не должны их иметь.» — Фёдор Юрчихин' },
{ id: 399, text: '«Мы — часть космоса, и наша задача — познать его.» — Александр Скворцов' },
{ id: 400, text: '«Космос — это великое путешествие, которое начинается внутри каждого из нас.» — Александр Скворцов' }
];

// Длинный сюжет (показывается 1 раз)
const STORY_WINDOWS_FULL = [
    { icon: '🌌', title: 'Галактика в опасности!', text: 'Ты — последний <strong>Хранитель</strong>  древнего созвездия Астерия.<br>Злой космический вихрь, Тёмный Хаос, разбил нашу галактику на тысячи осколков.<br>Звёзды погасли. Мир погрузился во тьму.<br><br>Только ты можешь восстановить свет.' },
    { icon: '🌟', title: 'Собирай звёздную пыль!', text: 'Каждое найденное слово — это частица света.<br>Чем больше слов — тем ярче загораются звёзды.<br><br>Когда ты найдёшь <span class="story-highlight">50 слов</span> — зажжётся первая звезда!<br>Зажги все звёзды — и галактика возродится!' },
    { icon: '🏅', title: 'Что ты получишь?', text: '⭐ <strong>Звёзды</strong> — за каждые 50 найденных слов<br>📜 <strong>Древние свитки</strong> — за каждые 5 звёзд<br>🗝️ <strong>Ключи к новым созвездиям</strong> — за каждые 10 звёзд.' },
    { icon: '🚀', title: 'Готов спасти галактику?', text: 'Каждое слово — новый шанс зажечь звёзды.<br>Возвращайся каждый день — и мир станет светлее!<br><br>Ты — последняя <strong>надежда Вселенной!</strong> ✨' }
];

// Краткий сюжет (показывается всегда после первого раза)
// Краткий сюжет (показывается всегда после первого раза)
const STORY_WINDOWS_SHORT = [
    { 
        icon: '💫', 
        title: 'Продолжай сиять!', 
        text: 'Ты уже зажёг много звёзд в этой бесконечной галактике.<br>Каждые <span class="story-highlight">50 слов</span> — новая звезда.<br>Каждые <span class="story-highlight">5 звёзд</span> — свиток мудрости.<br><br>Галактика бесконечна, как и твой путь. Вперёд, Хранитель! 🌌' 
    }
];

function getGalaxyProgress() {
    try {
        const saved = localStorage.getItem(GALAXY_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            if (data.totalStars === undefined) data.totalStars = data.stars || 0;
            if (data.unlockedScrolls === undefined) data.unlockedScrolls = [];
            if (data.currentMilestone === undefined) data.currentMilestone = 0;
            if (data.shownIntro === undefined) data.shownIntro = false;
            return data;
        }
    } catch {}
    return {
        totalWords: 0,
        totalStars: 0,
        stars: 0,
        currentMilestone: 0,
        unlockedScrolls: [],
        shownIntro: false,
        lastDailyBonus: null
    };
}

function saveGalaxyProgress(data) {
    localStorage.setItem(GALAXY_KEY, JSON.stringify(data));
    // ↓ ДОБАВЬТЕ ЭТИ 3 СТРОЧКИ ↓
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage('wordgame_galaxy_v2', data);
    }
}


function getNextStarTarget(progress) {
    const totalWords = progress.totalWords || 0;
    const nextStarWords = Math.ceil((totalWords + 1) / 50) * 50;
    const wordsNeeded = nextStarWords - totalWords;
    return {
        wordsNeeded: wordsNeeded > 0 ? wordsNeeded : 1,
        totalWordsTarget: nextStarWords,
        starNumber: progress.totalStars + 1
    };
}

function updateGalaxyProgress(wordsFound) {
    const progress = getGalaxyProgress();
    progress.totalWords += wordsFound;
    
    const targetStars = Math.floor(progress.totalWords / 50);
    const newStars = targetStars - progress.totalStars;
    
    if (newStars > 0) {
        progress.totalStars += newStars;
        progress.stars += newStars;
        
// Свитки (каждые 5 звёзд, максимум 100)
const totalScrollsUnlocked = Math.min(100, Math.floor(progress.totalStars / 5));
for (let i = progress.unlockedScrolls.length; i < totalScrollsUnlocked; i++) {
    const scrollIndex = i % SCROLLS.length;
    progress.unlockedScrolls.push(SCROLLS[scrollIndex].id);
    showScrollUnlocked(SCROLLS[scrollIndex]);
}
        // Рубежи (каждые 50 звёзд)
        const newMilestone = Math.floor(progress.totalStars / 50);
        if (newMilestone > progress.currentMilestone) {
            progress.currentMilestone = newMilestone;
            showMilestoneReached(newMilestone);
        }
        
        // Уведомление о звезде
        showStarUnlocked(progress.totalStars);
    }
    
    saveGalaxyProgress(progress);
     // ====== СИНХРОНИЗАЦИЯ С VK STORAGE ======
    if (newStars > 0 && typeof saveToVKStorage === 'function') {
        saveToVKStorage('wordgame_galaxy_v2', progress);
        console.log('☁️ Галактика синхронизирована с VK Storage');
    }
    // =========================================
    return progress;
}

function showStarUnlocked(starCount) {
    const message = starCount <= 5 ? `⭐ ${starCount}-я звезда зажглась!` :
                    starCount <= 20 ? `⭐ ${starCount} звёзд! Галактика оживает!` :
                    `⭐ ${starCount} звёзд! Ты — легенда!`;
    showToast(message);
    playSound('levelup');
}

function showScrollUnlocked(scroll) {
    showToast(`📜 Свиток найден: "${scroll.text}"`);
    playSound('hint');
}

function showMilestoneReached(milestone) {
    const titles = ['', '🌿 Первый рубеж!', '🌳 Искатель!', '🌲 Хранитель!', '🏔️ Покоритель!'];
    const title = titles[milestone] || `🚀 Рубеж ${milestone + 1}!`;
    showToast(`🎉 ${title}`);
}

function renderGalaxyModal() {
    const progress = getGalaxyProgress();
    const nextStar = getNextStarTarget(progress);
    
    const totalStars = progress.totalStars || 0;
    const totalWords = progress.totalWords || 0;
    const scrollsCount = progress.unlockedScrolls?.length || 0;
    const milestone = progress.currentMilestone || 0;
    const maxScrolls = SCROLLS.length;
            
    const progressPercent = totalWords > 0 ? (totalWords % 50) / 50 * 100 : 0;
    const lastBonus = progress.lastDailyBonus;
    const today = new Date().toDateString();
    const canClaimBonus = lastBonus !== today;
    
    const milestoneNames = [
        '🌱 Начало пути',
        '🌿 Первые шаги',
        '🌳 Искатель',
        '🌲 Хранитель',
        '🏔️ Покоритель',
        '⛰️ Странник',
        '🗻 Восходитель',
        '🌄 Проводник',
        '🌅 Светоч',
        '🌟 Звездочёт'
    ];
    const milestoneName = milestone < milestoneNames.length ? 
        milestoneNames[milestone] : 
        `🚀 Странник (${milestone + 1})`;
    
    const body = document.getElementById('galaxyModalBody');
    if (!body) return;
    
    // Собираем HTML для бонуса
    let bonusHtml = '';
    if (canClaimBonus) {
        bonusHtml = `<button class="galaxy-bonus-btn" onclick="openBonusModal()">🎁 Забрать ежедневный бонус</button>`;
    } else {
        bonusHtml = `✅ Бонус уже получен сегодня! Возвращайся завтра.`;
    }
    
    body.innerHTML = `
        <div class="galaxy-modal">
            <h2>🌌 Галактика</h2>            
               <div class="galaxy-total-stars">
                ⭐ Всего звёзд: <strong>${totalStars}</strong>
            </div>
            
            <div class="galaxy-progress"style="padding: 8px 10px; margin: 4px 0 8px;">
                📊 Слов найдено: <strong>${totalWords}</strong>
                <br>
                🎯 До следующей звезды: <strong>${nextStar.wordsNeeded}</strong> слов
                <div class="galaxy-progress-bar">
                    <div class="galaxy-progress-fill" style="width: ${progressPercent}%;"></div>
                </div>
            </div>
            
<div class="galaxy-scrolls ${scrollsCount > 0 ? 'galaxy-scrolls--active' : ''}" onclick="${scrollsCount > 0 ? "openScrollsModal()" : ""}">
    📜 Свитков собрано: <strong>${scrollsCount} / ${maxScrolls}</strong>
    ${scrollsCount > 0 ? `<span style="font-size:14px; margin-left:6px;">✨ нажмите, чтобы открыть</span>` : ''}
    ${scrollsCount < maxScrolls ? 
        `` : 
        `<span class="galaxy-scrolls-complete">✅ Все 100 свитков собраны! Ты — Хранитель Мудрости!</span>`
    }
</div>
            
            <div class="galaxy-milestone">
                🚀 Рубеж: <strong>${milestone + 1}</strong> — ${milestoneName}
                ${milestone === 0 ? '' : `⚡ ${milestone * 50} звёзд за плечами!`}
            </div>
            
            <div class="galaxy-daily">
                ${bonusHtml}
            </div>
            
            <button class="galaxy-close-btn" onclick="closeGalaxyModal()">✨ Продолжить путь</button>
        </div>
    `;
}
// ====== ЕЖЕДНЕВНЫЙ БОНУС ======

function openBonusModal() {
    const modal = document.getElementById('bonusModal');
    if (modal) modal.classList.add('show');
}

function closeBonusModal() {
    const modal = document.getElementById('bonusModal');
    if (modal) modal.classList.remove('show');
}

// ====== ЕЖЕДНЕВНЫЙ БОНУС (с рекламой) ======
function claimDailyBonus() {
    const progress = getGalaxyProgress();
    const today = new Date().toDateString();

    // Проверяем, не получал ли уже сегодня
    if (progress.lastDailyBonus === today) {
        showToast('✅ Бонус уже получен сегодня!');
        closeBonusModal();
        return;
    }

    // Показываем рекламу за вознаграждение
    showRewardedAd().then((success) => {
        if (success) {
            // Реклама просмотрена – начисляем бонус 5 слов в галактиках и 5 алмазов
            progress.totalWords += 5;
            addToTotalScore(5); 
            progress.lastDailyBonus = today;
            saveGalaxyProgress(progress);

            showToast('🎁 +5 слов к прогрессу!');
            playSound('levelup');
            closeBonusModal();
            renderGalaxyModal(); // обновляем содержимое модалки галактики
        } else {
            // Реклама не показана – бонус не выдаём
            showToast('❌ Реклама недоступна. Попробуйте позже.', true);
        }
    });
}

// Закрытие модалки бонуса по клику вне
const bonusModal = document.getElementById('bonusModal');
if (bonusModal) {
    bonusModal.onclick = (e) => {
        if (e.target === bonusModal) {
            closeBonusModal();
        }
    };
}

// Закрытие по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const bonusModal = document.getElementById('bonusModal');
        if (bonusModal && bonusModal.classList.contains('show')) {
            closeBonusModal();
        }
    }
});
function openGalaxyModal() {
    // Всегда показываем сюжет (длинный или краткий)
    showStoryWindows(0);
}

function closeGalaxyModal() {
    const modal = document.getElementById('galaxyModal');
    if (modal) modal.classList.remove('show');
}

function showStoryWindows(index) {
    const progress = getGalaxyProgress();
    
    // Определяем, какой сюжет показывать
    let storyWindows;
    if (!progress.shownIntro) {
        storyWindows = STORY_WINDOWS_FULL;
    } else {
        storyWindows = STORY_WINDOWS_SHORT;
    }
    
    // Если сюжет закончился — показываем прогресс
    if (index >= storyWindows.length) {
        if (!progress.shownIntro) {
            progress.shownIntro = true;
            saveGalaxyProgress(progress);
        }
        // ====== ПОКАЗЫВАЕМ ПРОГРЕСС ======
        renderGalaxyModal();
        const modal = document.getElementById('galaxyModal');
        if (modal) modal.classList.add('show');
        // =================================
        return;
    }
    const story = storyWindows[index];
    const isLast = index === storyWindows.length - 1;
    const isShort = storyWindows === STORY_WINDOWS_SHORT;
    
    const body = document.getElementById('galaxyModalBody');
    if (!body) return;
    
    let textHtml = '';
    if (story.text) {
        let text = story.text;
        // Подставляем количество звёзд в текст
        if (text.includes('${getGalaxyProgress().totalStars')) {
            text = text.replace(/\$\{getGalaxyProgress\(\)\.totalStars\}/g, progress.totalStars || 0);
        }
        textHtml = `<p>${text}</p>`;
    }
    
    let dotsHtml = '';
    if (!isShort) {
        dotsHtml = storyWindows.map((_, i) => 
            `<span class="${i === index ? 'active' : ''}"></span>`
        ).join('');
        dotsHtml = `<div class="story-dots">${dotsHtml}</div>`;
    }
    
    body.innerHTML = `
        <div class="story-window">
            <div class="story-icon">${story.icon}</div>
            <h3>${story.title}</h3>
            <div class="story-text">${textHtml}</div>
            ${dotsHtml}
            <div class="story-nav">
                <button class="story-next" onclick="showStoryWindows(${index + 1})">
                    ${isLast ? (isShort ? '🚀 К прогрессу' : '🚀 Начать!') : 'Далее →'}
                </button>
            </div>
        </div>
    `;
    
    const modal = document.getElementById('galaxyModal');
    if (modal) modal.classList.add('show');
}

// ====== КНОПКА ГАЛАКТИКИ В МЕНЮ ======
const startGalaxyBtn = document.getElementById('startGalaxyBtn');
if (startGalaxyBtn) {
    startGalaxyBtn.onclick = openGalaxyModal;
}

// ====== ЗАКРЫТИЕ МОДАЛКИ ======
const galaxyModalClose = document.getElementById('galaxyModalClose');
if (galaxyModalClose) {
    galaxyModalClose.onclick = closeGalaxyModal;
}

const galaxyModal = document.getElementById('galaxyModal');
if (galaxyModal) {
    galaxyModal.onclick = (e) => {
        if (e.target === galaxyModal) {
            closeGalaxyModal();
        }
    };
}

// ====== СИСТЕМА СВИТКОВ (100 шт) ======

let scrollsCurrentPage = 1;
const SCROLLS_PER_PAGE = 10;

// Открыть модалку со всеми свитками
function openScrollsModal() {
    scrollsCurrentPage = 1;
    renderScrollsPage();
    const modal = document.getElementById('scrollsModal');
    if (modal) modal.classList.add('show');
}

function closeScrollsModal() {
    const modal = document.getElementById('scrollsModal');
    if (modal) modal.classList.remove('show');
}

// Рендер текущей страницы свитков
function renderScrollsPage() {
    const grid = document.getElementById('scrollsGrid');
    if (!grid) return;
    
    const progress = getGalaxyProgress();
    const unlockedIds = progress.unlockedScrolls || [];
    const totalPages = Math.ceil(SCROLLS.length / SCROLLS_PER_PAGE);
    
    // Получаем свитки для текущей страницы
    const startIndex = (scrollsCurrentPage - 1) * SCROLLS_PER_PAGE;
    const endIndex = Math.min(startIndex + SCROLLS_PER_PAGE, SCROLLS.length);
    const pageScrolls = SCROLLS.slice(startIndex, endIndex);
    
    let html = '';
    pageScrolls.forEach((scroll) => {
        const unlocked = unlockedIds.includes(scroll.id);
        const realIndex = SCROLLS.indexOf(scroll) + 1;
        html += `
            <div class="scroll-item ${unlocked ? 'unlocked' : 'locked'}" 
                 ${unlocked ? `onclick="openScrollTextModal(${scroll.id})"` : ''}>
                <span class="scroll-item__icon">${unlocked ? '📜' : '🔒'}</span>
                <div class="scroll-item__info">
                    <div class="scroll-item__number">Свиток ${realIndex}</div>
                    <div class="scroll-item__text">${unlocked ? scroll.text.substring(0, 30) + (scroll.text.length > 30 ? '...' : '') : '🔒 Заперто'}</div>
                </div>
                <span class="scroll-item__status">${unlocked ? '✨' : '🔒'}</span>
            </div>
        `;
    });
    
    grid.innerHTML = html;
    
    // Обновляем навигацию
    updateScrollsPagination(totalPages);
}

// Обновление пагинации
function updateScrollsPagination(totalPages) {
    const pagination = document.getElementById('scrollsPagination');
    if (!pagination) return;
    
    const progress = getGalaxyProgress();
    const unlockedIds = progress.unlockedScrolls || [];
    const unlockedCount = unlockedIds.length;
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding: 0 4px;">
            <button class="scrolls-page-btn ${scrollsCurrentPage <= 1 ? 'disabled' : ''}" 
                    onclick="${scrollsCurrentPage > 1 ? `scrollsGoToPage(${scrollsCurrentPage - 1})` : ''}" 
                    ${scrollsCurrentPage <= 1 ? 'disabled' : ''}>
                ◀ Назад
            </button>
            <span style="font-size: 14px; color: var(--theme-muted, #9ca3af);">
                 ${scrollsCurrentPage}/${totalPages}
            </span>
            <button class="scrolls-page-btn ${scrollsCurrentPage >= totalPages ? 'disabled' : ''}" 
                    onclick="${scrollsCurrentPage < totalPages ? `scrollsGoToPage(${scrollsCurrentPage + 1})` : ''}" 
                    ${scrollsCurrentPage >= totalPages ? 'disabled' : ''}>
                Вперед ▶
            </button>
        </div>
    `;
    
    pagination.innerHTML = html;
}

// Переход на страницу
function scrollsGoToPage(page) {
    const totalPages = Math.ceil(SCROLLS.length / SCROLLS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    scrollsCurrentPage = page;
    renderScrollsPage();
}

// Открыть модалку с текстом свитка
function openScrollTextModal(scrollId) {
    const scroll = SCROLLS.find(s => s.id === scrollId);
    if (!scroll) return;
    
    document.getElementById('scrollTextTitle').textContent = `Свиток ${scrollId}`;
    document.getElementById('scrollTextBody').textContent = scroll.text;
    
    const modal = document.getElementById('scrollTextModal');
    if (modal) modal.classList.add('show');
}

function closeScrollTextModal() {
    const modal = document.getElementById('scrollTextModal');
    if (modal) modal.classList.remove('show');
}

// Показ уведомления о получении свитка
function showScrollUnlocked(scroll) {
    showToast(`📜 Свиток ${scroll.id} получен! Нажмите на свиток в галактике, чтобы прочитать.`);
    playSound('hint');
}
// ====== ЗАКРЫТИЕ МОДАЛКИ СПИСКА СВИТКОВ ======
const scrollsModalClose = document.getElementById('scrollsModalClose');
if (scrollsModalClose) {
    scrollsModalClose.onclick = closeScrollsModal;
}

const scrollsModalBtn = document.getElementById('scrollsModalBtn');
if (scrollsModalBtn) {
    scrollsModalBtn.onclick = closeScrollsModal;
}

const scrollsModal = document.getElementById('scrollsModal');
if (scrollsModal) {
    scrollsModal.addEventListener('click', (e) => {
        if (e.target === scrollsModal) closeScrollsModal();
    });
}

// ====== ЗАКРЫТИЕ МОДАЛКИ ТЕКСТА СВИТКА ======
const scrollTextModalClose = document.getElementById('scrollTextModalClose');
if (scrollTextModalClose) {
    scrollTextModalClose.onclick = closeScrollTextModal;
}

const scrollTextModalBtn = document.getElementById('scrollTextModalBtn');
if (scrollTextModalBtn) {
    scrollTextModalBtn.onclick = closeScrollTextModal;
}

const scrollTextModal = document.getElementById('scrollTextModal');
if (scrollTextModal) {
    scrollTextModal.addEventListener('click', (e) => {
        if (e.target === scrollTextModal) closeScrollTextModal();
    });
}

// ====== ПРОДЛЕНИЕ ВРЕМЕНИ ЗА РЕКЛАМУ ======

function gameOverContinueWithAd() {
    closeGameOverModal();
    
    showRewardedAd().then((success) => {
        if (success) {
            // Реклама просмотрена → +2 минуты
            gameState.timeLeft += 120;
            gameState.frozen = false;
            startTimer();
            updateUI();
            showToast('🎉 +2 минуты! Продолжайте игру!');
            playSound('levelup');
        } else {
            // ====== РЕКЛАМА НЕДОСТУПНА ======            
            // Вариант 1: +1 минута 
            gameState.timeLeft += 60;
            gameState.frozen = false;
            startTimer();
            updateUI();
            showToast('⏱️ Реклама недоступна, но вы получаете +1 минуту!');
            playSound('hint');
            
            // Вариант 2: ничего не давать
            // showToast('❌ Реклама недоступна, попробуйте позже', true);
            // setTimeout(showGameOverModal, 500);
            // ===================================
        }
    });
}

// Закрытие по Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const scrollTextModal = document.getElementById('scrollTextModal');
        if (scrollTextModal && scrollTextModal.classList.contains('show')) {
            closeScrollTextModal();
        }
        const scrollsModal = document.getElementById('scrollsModal');
        if (scrollsModal && scrollsModal.classList.contains('show')) {
            closeScrollsModal();
        }
        const bonusModal = document.getElementById('bonusModal');
        if (bonusModal && bonusModal.classList.contains('show')) {
            closeBonusModal();
        }
        const galaxyModal = document.getElementById('galaxyModal');
        if (galaxyModal && galaxyModal.classList.contains('show') && !galaxyModal.querySelector('.story-window')) {
            // Не закрываем, если это окно сюжета
        }
        // ====== ЗАКРЫТИЕ МОДАЛКИ ПОДСКАЗОК ПО ESCAPE ======
                const hintAdModal = document.getElementById('hintAdModal');
        if (hintAdModal && hintAdModal.classList.contains('show')) {
            closeHintAdModal();
        }
        //закрытие модалки конца игры по эскеип, возврат в меню
        const gameOverModal = document.getElementById('gameOverModal');
        if (gameOverModal && gameOverModal.classList.contains('show')) {
            closeGameOverModal();
            // Возвращаем в меню
            gameOverToMenu();
        }
    }
});

