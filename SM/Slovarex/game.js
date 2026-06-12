// Проверка загрузки словаря
if (typeof DICTIONARY === 'undefined') {
    console.error("❌ Словарь не загружен! Проверьте подключение words.js");
    alert("Ошибка загрузки игры. Обновите страницу.");
}


// ========== КОНФИГУРАЦИЯ ==========
const CONFIG = {
    MIN_WORD_LEN: 2,
    TIME_PER_LEVEL: 120,
    TIME_BONUS_PER_WORD: 15,
    SCORE_BONUS_PER_LEVEL: 100,
    HINTS_START: 5,
    LEVEL_THRESHOLD_START: 0.4,
    LEVEL_THRESHOLD_STEP: 0.05,
    LEVEL_THRESHOLD_MAX: 0.75
};

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
    const need = Math.ceil(gameState.possibleWords.size * getCurrentThreshold());
    const before = gameState.thresholdReached;
    gameState.thresholdReached = gameState.foundWords.size >= need;
    
    if (gameState.thresholdReached && !before && !gameState.frozen) {
        showToast("🎉 Порог достигнут! Можно переходить на следующий уровень!");
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
        const need = Math.ceil(gameState.possibleWords.size * getCurrentThreshold());
        const remain = Math.max(0, need - gameState.foundWords.size);
        btn.textContent = `🔒 Нужно найти ещё ${remain} слов`;
    }
}

function updateProgressBar() {
    const need = Math.ceil(gameState.possibleWords.size * getCurrentThreshold());
    const percent = gameState.possibleWords.size > 0 
        ? (gameState.foundWords.size / need) * 100 
        : 0;
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
    }, 2000);
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
    
    console.log(`🎮 Новый уровень! Базовое слово: ${gameState.baseWord} (${gameState.baseWord.length} букв)`);
    console.log(`📝 Возможных слов: ${gameState.possibleWords.size}`);
}

function startTimer() {
    gameState.timerId = setInterval(() => {
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
    const need = Math.ceil(gameState.possibleWords.size * getCurrentThreshold());
    if (gameState.foundWords.size >= need) {
        nextLevel();
    } else {
        showToast("⏰ Время вышло! Игра окончена.", true);
        gameState.frozen = true;
        updateUI();
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

function restartGame() {
    if (confirm("Начать игру заново? Весь прогресс будет потерян.")) {
        gameState.level = 1;
        gameState.totalScore = 0;
        gameState.hintsLeft = CONFIG.HINTS_START;
        initLevel();
        updateUI();
        playSound("click");
    }
}

function nextLevel() {
    if (!gameState.thresholdReached) {
        showToast("Сначала достигните порога!", true);
        return;
    }
    
    gameState.totalScore += gameState.levelScore + CONFIG.SCORE_BONUS_PER_LEVEL;
    gameState.level++;
    
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
    document.getElementById("restartBtn").onclick = restartGame;
    document.getElementById("nextLevelBtn").onclick = nextLevel;
    
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
    
    console.log(`✅ Игра запущена! Доступно слов для загадывания: ${BASE_WORDS_POOL.length}`);
}

document.addEventListener("DOMContentLoaded", initGame);