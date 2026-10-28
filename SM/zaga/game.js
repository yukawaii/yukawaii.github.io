// ============================================================
// game.js — логика игры «Собери отгадку»
// ============================================================
const GAME_STORAGE_PREFIX = (window.__PLATFORM && window.__PLATFORM.storagePrefix) || '';
// Глобальный логгер — чтобы видеть ошибки в VK DevTools
window.addEventListener('error', (e) => {
    console.warn('[uncaught]', e.message, e.filename + ':' + e.lineno);
});
window.addEventListener('unhandledrejection', (e) => {
    console.warn('[unhandled promise]', e.reason);
});
const gameState = {
    totalScore: 0,
      solvedRiddles: {},
    categoryUnlocks: {},
    soundEnabled: true,
    theme: 'light',
    currentCategory: null,
    currentRiddle: null,
    answer: [],
    pool: [],
    selection: [],
    pendingHintCallback: null,
    pendingUnlockCategory: null
};
let _autoSubmitTimer = null;
let _categoryCompleteTimer = null; 

const els = {};
const STORAGE_KEYS_LOCAL = {
    PROGRESS: GAME_STORAGE_PREFIX + 'riddles_progress_v1',
    THEME:    GAME_STORAGE_PREFIX + 'riddles_theme_v1',
    SOUND:    GAME_STORAGE_PREFIX + 'riddles_sound_v1'
};

// ====== АУДИО (правильная инициализация) ======
let audioContext = null;
// ====== ПАУЗА / ВОЗОБНОВЛЕНИЕ АУДИО ======
let isGamePaused = false;

function pauseGame() {
    if (isGamePaused) return;
    isGamePaused = true;
    clearTimeout(_autoSubmitTimer);         
    _autoSubmitTimer = null;
    if (audioContext && audioContext.state === 'running') {
        audioContext.suspend().catch(() => {});
    }
}
function resumeGame() {
    if (!isGamePaused) return;
    isGamePaused = false;
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
    // Восстанавливаем отложенный автосабмит, если поле было заполнено до паузы
    if (!_autoSubmitTimer && !gameState._justSolved && gameState.currentRiddle &&
        gameState.selection.length === gameState.answer.length && gameState.answer.length > 0) {
        _autoSubmitTimer = setTimeout(() => {
            _autoSubmitTimer = null;
            if (isGamePaused || document.hidden) return;
            if (gameState.selection.length === gameState.answer.length) onSubmit();
        }, 350);
    }
}

// ====== ОБРАБОТЧИКИ ФОКУСА / ВИДИМОСТИ ======
document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
    else resumeGame();
});

window.addEventListener('blur', pauseGame);
window.addEventListener('focus', resumeGame);

// При уходе со страницы — тоже пауза
window.addEventListener('pagehide', pauseGame);
window.addEventListener('beforeunload', pauseGame);

function initAudio() {
    if (audioContext) {
        if (audioContext.state === 'suspended' && !document.hidden) {
            audioContext.resume().catch(() => {});
        }
        return;
    }
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (document.hidden) {
            // Создали на скрытой вкладке — сразу в паузу
            audioContext.suspend().catch(() => {});
        } else if (audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }
    } catch (e) {
        console.warn('Audio not supported');
    }
}

function playSound(type) {
    if (!gameState.soundEnabled) return;
    if (isGamePaused || document.hidden) return;

    // Пересоздаём контекст, если его нет или браузер его закрыл
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = null;
        initAudio();
    }
    if (!audioContext) return;

    // Если контекст был подвешен — резюмируем и играем после
    if (audioContext.state === 'suspended') {
        audioContext.resume()
            .then(() => { try { playTone(type); } catch (e) {} })
            .catch(() => {});
        return;
    }

    try { playTone(type); } catch (e) {}
}

function playTone(type) {
    const now = audioContext.currentTime;

    // Победный звук — три ноты до-мажора (C5, E5, G5) маленькой арпеджио
    if (type === 'levelup' || type === 'success') {
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = now + i * 0.06;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
            osc.start(start);
            osc.stop(start + 0.45);
        });
        return;
    }

    // Простые звуки — один тон
    const freqMap = { click: 660, wrong: 220, hint: 780 };
    const freq = freqMap[type] || 660;
    const duration = 0.12;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = 0.12;
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.stop(now + duration + 0.05);
}

// ====== КОНФЕТТИ ======
function getConfettiCount() {
    const tier = (typeof getDeviceTier === 'function') ? getDeviceTier() : 'desktop';
    if (tier === 'weak')   return 4;
    if (tier === 'mobile') return 8;
    return 20;
}

function playConfetti(count) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!count || count <= 0) return;
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    document.body.appendChild(layer);

    const colors = ['#667eea','#764ba2','#10b981','#f59e0b','#ef4444','#4a9eff','#43a047'];
    for (let i = 0; i < count; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.background = colors[i % colors.length];
        c.style.left = (5 + Math.random() * 90) + '%';
        c.style.animationDelay = (Math.random() * 0.25) + 's';
        c.style.animationDuration = (1.4 + Math.random() * 1) + 's';
        c.style.setProperty('--rot', Math.floor(Math.random() * 720 - 360) + 'deg');
        c.style.setProperty('--drift', (Math.random() * 40 - 20) + 'px');
        layer.appendChild(c);
    }
    setTimeout(() => layer.remove(), 3200);
}

// Разблокировка аудио после первого касания
function unlockAudioOnce() {
    if (document.hidden) return;
    initAudio();
    if (audioContext) {
        document.removeEventListener('pointerdown', unlockAudioOnce);
    }
}
document.addEventListener('pointerdown', unlockAudioOnce);

// ====== INIT ======
document.addEventListener('DOMContentLoaded', initGame);

function initGame() {
    if (typeof CATEGORIES === 'undefined' || typeof RIDDLES === 'undefined') {
        document.body.innerHTML = `
            <div style="padding:40px;text-align:center;font-family:Inter,sans-serif;color:#fff;">
                <h2>⚠️ Ошибка загрузки</h2>
                <p>Не удалось загрузить базу загадок. Попробуйте зайти заново.</p>
                <button onclick="location.reload()" style="padding:12px 24px;border:none;border-radius:12px;background:#667eea;color:#fff;font-size:16px;cursor:pointer;">
                    🔄 Перезагрузить
                </button>
            </div>`;
        return;
    }
    try {
        cacheElements();
        loadProgress();
        loadProgress();
window.Achievements.init('riddles', gameState);
        loadTheme();
        loadSound();
        bindEvents();
        renderMenu();
        updateScoreDisplay();
        showScreen('menu');
        if (typeof window.startBannerRetry === 'function') window.startBannerRetry();
        setupWeakDevice();
        setTimeout(createParticles, 200);
    } catch (err) {
        console.error('initGame failed:', err);
    showToast('⚠️ Ошибка инициализации. Попробуйте перезагрузить');
    }
}

function cacheElements() {
const ids = [
    'menuScreen','gameScreen','categoriesGrid','totalScoreValue',
    'riddleText','categoryLabel','answerSlots','lettersPool',
    'submitBtn','backspaceBtn','hintFirstBtn','hintRemoveBtn',
    'backBtn','gameScoreValue','toast',
    'menuThemeBtn','menuSoundBtn','menuRulesBtn','soundBtn'
];
    ids.forEach(id => els[id] = document.getElementById(id));
}

function setupWeakDevice() {
    if (getDeviceTier() === 'weak') {
        document.documentElement.classList.add('weak-device');
    }
}

function bindEvents() {
    const b = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    b('menuThemeBtn', () => { playSound('click'); openModal('themeModal'); });
    b('menuSoundBtn', toggleSound);
    b('soundBtn', toggleSound);
b('menuRulesBtn', () => { playSound('click'); openModal('rulesModal'); });
b('gameRulesBtn', () => { playSound('click'); openModal('rulesModal'); });
    b('backBtn', () => { playSound('click'); backToMenu(); });
    b('submitBtn', onSubmit);
    b('backspaceBtn', onBackspace);
  b('shuffleBtn', onShuffle);
    b('hintFirstBtn', () => useHint('first'));
    b('hintRemoveBtn', () => useHint('remove'));
    b('rulesCloseBtn', () => closeModal('rulesModal'));
    b('rulesStartBtn', () => closeModal('rulesModal'));
    b('themeCloseBtn', () => closeModal('themeModal'));
    b('hintAdCancelBtn', closeHintAdModal);
    b('hintAdConfirmBtn', getHintsViaAd);
    b('unlockCancelBtn', closeUnlockModal);
    b('unlockConfirmBtn', unlockCategoryViaAd);
b('menuAchievementsBtn', () => { playSound('click'); window.Achievements.renderModal(); openModal('achievementsModal'); });
    document.querySelectorAll('.theme-item').forEach(item => {
        item.addEventListener('click', () => applyTheme(item.dataset.theme));
    });
 if (els.lettersPool) {
        els.lettersPool.addEventListener('click', (e) => {
            const btn = e.target.closest('.letter-pool-tile');
            if (!btn) return;
            const idx = parseInt(btn.dataset.idx, 10);
            if (!isNaN(idx)) onPoolTap(idx);
        });
    }

}

// ====== SCREENS ======
function showScreen(name) {
    if (els.menuScreen) els.menuScreen.classList.toggle('hidden', name !== 'menu');
    if (els.gameScreen) els.gameScreen.classList.toggle('hidden', name !== 'game');
}

// ====== МЕНЮ ======
function renderMenu() {
    const grid = els.categoriesGrid;
    if (!grid) return;
    grid.innerHTML = '';
    CATEGORIES.forEach(cat => {
        const solvedCount = getSolvedCountForCategory(cat.id);
        const total = (RIDDLES[cat.id] || []).length;
        const locked = cat.locked && !isCategoryUnlocked(cat.id);
        const complete = solvedCount === total && total > 0;
        const percent = total > 0 ? Math.round(solvedCount / total * 100) : 0;

        const card = document.createElement('button');
        card.className = 'category-card'
            + (locked ? ' category-card--locked' : '')
            + (complete ? ' category-card--complete' : '');
        card.innerHTML =
            '<span class="category-card__icon">' + (locked ? '🔒' : cat.icon) + '</span>' +
            '<div class="category-card__body">' +
                '<span class="category-card__name">' + cat.name + '</span>' +
                '<div class="category-card__bar">' +
                    '<div class="category-card__fill" style="width:' + percent + '%"></div>' +
                '</div>' +
            '</div>' +
            '<span class="category-card__progress">' + (complete ? '✅' : solvedCount + '/' + total) + '</span>';
        card.addEventListener('click', () => onCategoryClick(cat.id));
        grid.appendChild(card);
    });
    updateScoreDisplay();
    updateSoundButtons();
}

function onCategoryClick(categoryId) {
    playSound('click');
    const cat = CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return;
    if (cat.locked && !isCategoryUnlocked(categoryId)) {
        gameState.pendingUnlockCategory = categoryId;
        openModal('unlockCategoryModal');
        return;
    }
    startCategory(categoryId);
}

function isCategoryUnlocked(categoryId) {
    const until = gameState.categoryUnlocks[categoryId] || 0;
    return Date.now() < until;
}

function getSolvedCountForCategory(categoryId) {
    return (RIDDLES[categoryId] || []).filter(r => gameState.solvedRiddles[categoryId + '_' + r.id]).length;
}

// ====== СТАРТ КАТЕГОРИИ ======
function startCategory(categoryId) {
    gameState.currentCategory = categoryId;
    const riddles = RIDDLES[categoryId] || [];
    if (!riddles.length) {
    showToast('😕 Эта категория пока пуста');
        return;
    }
    const prefix = categoryId + '_';
    const unsolved = riddles.filter(r => !gameState.solvedRiddles[prefix + r.id]);
    const source = unsolved.length > 0 ? unsolved : riddles;
    loadRiddle(source[Math.floor(Math.random() * source.length)]);
    showScreen('game');
}

// ====== ЗАГРУЗКА ЗАГАДКИ ======
let _riddleGen = 0;
function loadRiddle(riddle) {
    // валидация — не даём битой загадке обрушить игру
if (!riddle || riddle.id == null || typeof riddle.answer !== 'string' || !riddle.answer.trim()) {
        console.warn('loadRiddle: некорректная загадка', riddle);
        showToast('⚠️ Загадка недоступна');
        backToMenu();
        return;
    }

    _riddleGen++;
    gameState._justSolved = false;
gameState._hintUsedThisRiddle = false;
    gameState.currentRiddle = riddle;

    // опционально: страховка от пробелов/дефисов в ответе
    const answerStr = riddle.answer.toUpperCase().replace(/Ё/g, 'Е').replace(/[\s\-]/g, '');
    const answerChars = answerStr.split('');

    const pool = answerChars.map((ch, i) => ({ id: 'a' + i, char: ch, isDecoy: false, removed: false, used: false }));
    const decoyPool = 'БВГДЖЗКЛМНПРСТФХЦЧШЩ';
    const usedInAnswer = new Set(answerChars);
    const TOTAL_TILES = 12;
    const decoysNeeded = Math.max(0, TOTAL_TILES - answerChars.length);
    const availableDecoy = decoyPool.split('').filter(ch => !usedInAnswer.has(ch));
    for (let i = availableDecoy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableDecoy[i], availableDecoy[j]] = [availableDecoy[j], availableDecoy[i]];
    }
    const decoysCount = Math.min(decoysNeeded, availableDecoy.length);
    for (let d = 0; d < decoysCount; d++) {
        pool.push({ id: 'd' + d, char: availableDecoy[d], isDecoy: true, removed: false, used: false });
    }

    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    gameState.answer = answerChars.map(ch => ({ char: ch, revealed: false }));
    gameState.pool = pool;
    gameState.selection = [];

    if (els.riddleText) els.riddleText.textContent = riddle.question;
    const cat = CATEGORIES.find(c => c.id === gameState.currentCategory);
    if (els.categoryLabel) els.categoryLabel.textContent = (cat ? cat.icon + ' ' + cat.name : '');

    renderAnswerSlots();
    renderPool();
    updateControls();
    updateSoundButtons();
}

// ====== РЕНДЕР ======
function renderAnswerSlots() {
    const container = els.answerSlots;
    if (!container) return;
    container.innerHTML = '';
    gameState.answer.forEach((slot, idx) => {
        const el = document.createElement('button');
        el.className = 'answer-slot';
        if (idx < gameState.selection.length) {
            el.textContent = gameState.pool[gameState.selection[idx]].char;
            el.classList.add(slot.revealed ? 'answer-slot--locked' : 'answer-slot--filled');
            if (!slot.revealed) {
el.addEventListener('click', () => {
    for (let i = idx; i < gameState.selection.length; i++) {
        if (gameState.answer[i] && gameState.answer[i].revealed) {
            showToast('Букву подсказки удалить нельзя');
            return;
        }
    }
    playSound('click');
    clearTimeout(_autoSubmitTimer);
    _autoSubmitTimer = null;
    while (gameState.selection.length > idx) {
        const pi = gameState.selection.pop();
        gameState.pool[pi].used = false;
    }
    renderAnswerSlots();
    renderPool();
    updateControls();
});
            }
        } else {
            el.classList.add('answer-slot--empty');
            el.textContent = '·';
        }
        container.appendChild(el);
    });
}

function renderPool() {
    const container = els.lettersPool;
    if (!container) return;
    let html = '';
    gameState.pool.forEach((item, idx) => {
        let cls = 'letter-pool-tile';
        if (item.removed) cls += ' letter-pool-tile--removed';
        else if (item.used) cls += ' letter-pool-tile--used';
        html += `<button class="${cls}" data-idx="${idx}" ${item.used || item.removed ? 'disabled' : ''}>${item.char}</button>`;
    });
    container.innerHTML = html;
}



function onPoolTap(poolIdx) {
    playSound('click');
    const item = gameState.pool[poolIdx];
    if (!item || item.used || item.removed) return;
    if (gameState.selection.length >= gameState.answer.length) return;
    item.used = true;
    gameState.selection.push(poolIdx);
    renderAnswerSlots();
    renderPool();
    updateControls();
    if (gameState.selection.length === gameState.answer.length) {
        clearTimeout(_autoSubmitTimer);
        _autoSubmitTimer = setTimeout(() => {
            _autoSubmitTimer = null;
            if (isGamePaused || document.hidden) return;     
            if (gameState.selection.length === gameState.answer.length) onSubmit();
        }, 350);
    }
}

function onShuffle() {
    if (window.Achievements) window.Achievements.updateStats({ type: 'shuffle' });
    playSound('click');
    // Собираем индексы свободных (неиспользованных и неудалённых) плиток
    const indexes = [];
    gameState.pool.forEach((p, i) => {
        if (!p.used && !p.removed) indexes.push(i);
    });
    // Перемешиваем значения между этими индексами
    const values = indexes.map(i => gameState.pool[i]);
    for (let i = values.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    indexes.forEach((pos, k) => { gameState.pool[pos] = values[k]; });
    renderPool();
}
function onBackspace() {
    if (!gameState.selection.length) {
        showToast('Нечего удалять');
        return;
    }
    const answerIdx = gameState.selection.length - 1;
    if (gameState.answer[answerIdx] && gameState.answer[answerIdx].revealed) {
        clearTimeout(_autoSubmitTimer);
        _autoSubmitTimer = null;
        showToast('Букву подсказки удалить нельзя');
        return;
    }
    clearTimeout(_autoSubmitTimer);
    _autoSubmitTimer = null;
    playSound('click');
    const pi = gameState.selection.pop();
    gameState.pool[pi].used = false;
    renderAnswerSlots();
    renderPool();
    updateControls();
}


function updateControls() {
    if (els.submitBtn) els.submitBtn.disabled = gameState.selection.length !== gameState.answer.length;
}

// ====== ПРОВЕРКА ======
function onSubmit() {
    if (!gameState.answer.length) return;
    if (!gameState.currentRiddle) return;
    if (gameState._justSolved) return;             
    if (gameState.selection.length !== gameState.answer.length) return;
    const attempt = gameState.selection.map(i => gameState.pool[i].char).join('');
    const correct = gameState.answer.map(a => a.char).join('');
    if (attempt === correct) {
        gameState._justSolved = true;
        onCorrect();
    } else {
        onWrong();
    }
}

function onCorrect() {
    clearTimeout(_autoSubmitTimer);
    _autoSubmitTimer = null;
    playSound('levelup');
   gameState.answer.forEach(a => a.revealed = true);
    renderAnswerSlots();
    const key = gameState.currentCategory + '_' + gameState.currentRiddle.id;
    const wasSolved = !!gameState.solvedRiddles[key];
    gameState.solvedRiddles[key] = true;
    gameState.totalScore += 1;
    updateScoreDisplay();
    saveProgress();
    if (typeof window.triggerSync === 'function') window.triggerSync();
    playConfetti(getConfettiCount());
    const riddles = RIDDLES[gameState.currentCategory] || [];
    const total = riddles.length;
    const solvedCount = riddles.filter(r => gameState.solvedRiddles[gameState.currentCategory + '_' + r.id]).length;
    const completedNow = !wasSolved && total > 0 && solvedCount === total;
    if (window.Achievements) {
    window.Achievements.updateStats({
        type: 'solved',
        perfect: !gameState._hintUsedThisRiddle,
        categoryComplete: completedNow ? gameState.currentCategory : null
    });
}
    if (completedNow) {
        showToast('🎉 Категория пройдена! +1 очко');
        const genCat = _riddleGen;
        clearTimeout(_categoryCompleteTimer);
        _categoryCompleteTimer = setTimeout(() => {
            _categoryCompleteTimer = null;
            if (genCat !== _riddleGen) return;
            if (!els.gameScreen || els.gameScreen.classList.contains('hidden')) return;
            playSound('levelup');
            playConfetti(getConfettiCount());
            showToast('🎉 Категория пройдена!');
        }, 400);
    } else { showToast('✅ Правильно! +1 очко'); }
    const gen = _riddleGen;
    setTimeout(() => {
        if (gen !== _riddleGen) return;
        if (!els.gameScreen || els.gameScreen.classList.contains('hidden')) return;
        nextRiddle();
    }, 900);
}

function onWrong() {
    if (window.Achievements) window.Achievements.updateStats({ type: 'wrong' });
    clearTimeout(_autoSubmitTimer);
    _autoSubmitTimer = null;
    playSound('wrong');
    if (els.answerSlots) {
        els.answerSlots.classList.add('shake');
        setTimeout(() => els.answerSlots.classList.remove('shake'), 400);
    }
    showToast('❌ Неправильно, попробуйте ещё');

    // Сбрасываем всё и СРАЗУ восстанавливаем подсказки на их места
    gameState.selection = [];
    gameState.pool.forEach(p => p.used = false);
    gameState.answer.forEach((slot, idx) => {
        if (!slot.revealed) return;
        const pi = gameState.pool.findIndex(p =>
            p.char === slot.char && !p.used && !p.removed && !p.isDecoy
        );
        if (pi !== -1) {
            gameState.pool[pi].used = true;
            gameState.selection.push(pi);
        } else {
            slot.revealed = false;    // страховка: если буквы уже нет — снимаем locked
        }
    });
    renderAnswerSlots();
    renderPool();
    updateControls();
}
function nextRiddle() {
    const riddles = RIDDLES[gameState.currentCategory] || [];
    if (!riddles.length) return;
    const prefix = gameState.currentCategory + '_';
    const currentId = gameState.currentRiddle ? gameState.currentRiddle.id : null;
    const unsolved = riddles.filter(r =>
        !gameState.solvedRiddles[prefix + r.id] && r.id !== currentId
    );
    if (unsolved.length) {
        loadRiddle(unsolved[Math.floor(Math.random() * unsolved.length)]);
        return;
    }
    const pool = riddles.length > 1
        ? riddles.filter(r => r.id !== currentId)
        : riddles;
    loadRiddle(pool[Math.floor(Math.random() * pool.length)]);
}

function backToMenu() {
    clearTimeout(_autoSubmitTimer);
    _autoSubmitTimer = null;
    clearTimeout(_categoryCompleteTimer);
    _categoryCompleteTimer = null;
    gameState.currentRiddle = null;
    gameState.currentCategory = null;
    gameState.selection = [];
    renderMenu();
    showScreen('menu');
    if (typeof window.startBannerRetry === 'function') window.startBannerRetry();
}

// ====== ПОДСКАЗКИ ======
function useHint(type) {
    playSound('click');
    clearTimeout(_autoSubmitTimer);
    _autoSubmitTimer = null;
    if (type === 'first') {
        const allRevealed = gameState.answer.every(a => a.revealed);
        if (allRevealed) { showToast('Все буквы уже открыты'); return; }
    } else if (type === 'remove') {
        const hasDecoy = gameState.pool.some(p => p.isDecoy && !p.removed && !p.used);
        if (!hasDecoy) { showToast('Лишних букв нет'); return; }
    }
    gameState.pendingHintCallback = type;
    openModal('hintAdModal');
}

function executeHint(type) {
    if (!gameState.currentRiddle) return;
    gameState._hintUsedThisRiddle = true;
    if (window.Achievements) window.Achievements.updateStats({ type: 'hint', hintType: type });
    if (type === 'first') hintFirstLetter();
    else if (type === 'remove') hintRemoveDecoy();
    if (gameState.selection.length === gameState.answer.length && !_autoSubmitTimer) {
        _autoSubmitTimer = setTimeout(() => {
            _autoSubmitTimer = null;
            if (isGamePaused || document.hidden) return;
            if (gameState.selection.length === gameState.answer.length) onSubmit();
        }, 350);
    }
}

function hintFirstLetter() {
    let idx = 0;
    while (idx < gameState.answer.length && gameState.answer[idx].revealed) idx++;
    if (idx >= gameState.answer.length) { showToast('Все буквы уже открыты'); return; }
    while (gameState.selection.length > idx) {
        const pi = gameState.selection.pop();
        gameState.pool[pi].used = false;
    }
    const char = gameState.answer[idx].char;
    const pi = gameState.pool.findIndex(p => p.char === char && !p.used && !p.removed && !p.isDecoy);
    if (pi === -1) { showToast('Буква не найдена'); return; }
    gameState.pool[pi].used = true;
    gameState.answer[idx].revealed = true;
    gameState.selection.push(pi);
    renderAnswerSlots(); renderPool(); updateControls();
    playSound('hint');

    if (gameState.selection.length === gameState.answer.length) {
        clearTimeout(_autoSubmitTimer);
        _autoSubmitTimer = setTimeout(() => {
            _autoSubmitTimer = null;
            if (isGamePaused || document.hidden) return;
            if (gameState.selection.length === gameState.answer.length) onSubmit();
        }, 350);
    }
}

function hintRemoveDecoy() {
    const di = gameState.pool.findIndex(p => p.isDecoy && !p.removed && !p.used);
    if (di === -1) { showToast('Лишних букв нет'); return; }
    gameState.pool[di].removed = true;
    renderPool();
    playSound('hint');
}

let _claimingAd = false;

function getHintsViaAd() {
    if (_claimingAd) {
        closeHintAdModal();
        showToast('⏳ Подождите — реклама уже загружается');
        return;
    }
    _claimingAd = true;

    const btn = document.getElementById('hintAdConfirmBtn');
    const btnText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '⌛ Загрузка…'; }

    if (typeof window.showRewardedAd !== 'function') {
        if (btn) { btn.disabled = false; btn.textContent = btnText; }
        _claimingAd = false;
        closeHintAdModal();                     
        showToast('❌Рекламы пока нет, попробуйте позже');
        return;
    }

    window.showRewardedAd()
        .then(success => {
            const type = gameState.pendingHintCallback;
            gameState.pendingHintCallback = null;
            closeModal('hintAdModal');

            if (success && type) {
                 if (window.Achievements) window.Achievements.updateStats({ type: 'ad' });
                executeHint(type);
                playSound('hint');
                showToast('💡 Подсказка применена');
            } else {
                showToast('❌Рекламы пока нет, попробуйте позже');
            }
        })
        .catch(() => {
            gameState.pendingHintCallback = null;
            closeModal('hintAdModal');
            showToast('❌Рекламы пока нет, попробуйте позже');
        })
          .finally(() => {
            if (btn) { btn.disabled = false; btn.textContent = btnText; }
            _claimingAd = false;
        });
}

function closeHintAdModal() {
    gameState.pendingHintCallback = null;
    closeModal('hintAdModal');
}

// ====== РАЗБЛОКИРОВКА КАТЕГОРИИ ======
function unlockCategoryViaAd() {
    if (_claimingAd) {
        showToast('⏳Реклама уже загружается');
        return;
    }
    _claimingAd = true;

    const btn = document.getElementById('unlockConfirmBtn');
    const btnText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '⌛ Загрузка…'; }

    if (typeof window.showRewardedAd !== 'function') {
        if (btn) { btn.disabled = false; btn.textContent = btnText; }
        _claimingAd = false;
        gameState.pendingUnlockCategory = null;
        closeModal('unlockCategoryModal');
        showToast('❌Рекламы пока нет, попробуйте позже');
        return;
    }

    window.showRewardedAd()
        .then(success => {
            const cat = gameState.pendingUnlockCategory;
            if (!cat) {
                closeModal('unlockCategoryModal');
                return;
            }
            if (success) {
                 if (window.Achievements) {
                        window.Achievements.updateStats({ type: 'ad' });
                        window.Achievements.updateStats({ type: 'unlock' });
                    }
                const until = Date.now() + 24 * 60 * 60 * 1000;
                gameState.categoryUnlocks[cat] = until;
                saveProgress();
                if (typeof window.triggerSync === 'function') window.triggerSync();
                showToast('🎉 Категория открыта на 24 часа!');
                gameState.pendingUnlockCategory = null;
                closeModal('unlockCategoryModal');
                renderMenu();
                startCategory(cat);
            } else {
                gameState.pendingUnlockCategory = null;
                closeModal('unlockCategoryModal');
                showToast('❌Реклама не найдена, попробуйте позже');
            }
        })
        .catch(() => {
            gameState.pendingUnlockCategory = null;
            closeModal('unlockCategoryModal');
            showToast('❌Реклама не найдена, попробуйте позже');
        })
        .finally(() => {
            if (btn) { btn.disabled = false; btn.textContent = btnText; }
            _claimingAd = false;
        });
}

function closeUnlockModal() {
    gameState.pendingUnlockCategory = null;
    closeModal('unlockCategoryModal');
}

// ====== МОДАЛКИ ======
function openModal(id) {
    clearTimeout(_autoSubmitTimer);         
    _autoSubmitTimer = null;
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
    // Восстанавливаем отложенный автосабмит после закрытия любой модалки
    if (!_autoSubmitTimer && !gameState._justSolved && gameState.currentRiddle &&
        gameState.selection.length === gameState.answer.length && gameState.answer.length > 0) {
        _autoSubmitTimer = setTimeout(() => {
            _autoSubmitTimer = null;
            if (isGamePaused || document.hidden) return;
            if (gameState.selection.length === gameState.answer.length) onSubmit();
        }, 350);
    }
}

// ====== ТОСТ ======
function showToast(msg) {
    const t = els.toast || document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

// ====== СЧЁТ / ПОДСКАЗКИ ======
// ====== ФОРМАТ ОЧКОВ ======
// 999       → "999"
// 1234      → "1.2k"
// 1999      → "1.9k"   (floor, чтобы не завышать)
// 10000     → "10k"
// 999999    → "999.9k"
// 1000000   → "1M"
// 1234567   → "1.2M"
// и т.д. до T (триллионы)
function formatScore(n) {
    const num = Math.max(0, Math.floor(Number(n) || 0));
    if (num < 1000) return String(num);

    const units = [
        { value: 1e12, suffix: 'T' },
        { value: 1e9,  suffix: 'B' },
        { value: 1e6,  suffix: 'M' },
        { value: 1e3,  suffix: 'k' }
    ];

    for (const u of units) {
        if (num >= u.value) {
            const v = Math.floor((num / u.value) * 10) / 10;
            return (Number.isInteger(v) ? String(v) : v.toFixed(1)) + u.suffix;
        }
    }
    return String(num);
}
function updateScoreDisplay() {
    const formatted = formatScore(gameState.totalScore);
    const full = String(gameState.totalScore);

    if (els.totalScoreValue) {
        els.totalScoreValue.textContent = formatted;
        els.totalScoreValue.title = full;
    }
    if (els.gameScoreValue) {
        els.gameScoreValue.textContent = formatted;
        els.gameScoreValue.title = full;
    }
}


// ====== ТЕМА ======
function applyTheme(theme, opts) {
    const silent = !!(opts && opts.silent);
    if (!silent) playSound('click');
    gameState.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEYS_LOCAL.THEME, theme); } catch (e) {}
    document.querySelectorAll('.theme-item').forEach(i => i.classList.toggle('active', i.dataset.theme === theme));
    closeModal('themeModal');
    updateParticles();
    if (!silent && typeof window.triggerSync === 'function') window.triggerSync();
    if (!silent && window.Achievements) {
    window.Achievements.updateStats({ type: 'theme', theme: theme });
}
}

function loadTheme() {
    let saved = 'light';
    try { saved = localStorage.getItem(STORAGE_KEYS_LOCAL.THEME) || 'light'; } catch (e) {}
    applyTheme(saved, { silent: true });
}

// ====== ЗВУК ======
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    try { localStorage.setItem(STORAGE_KEYS_LOCAL.SOUND, gameState.soundEnabled ? '1' : '0'); } catch (e) {}
    updateSoundButtons();
    if (gameState.soundEnabled) {
        initAudio();
        playSound('click');
        showToast('🔊 Звук включён');
    } else {
        showToast('🔇 Звук выключен');
    }
    if (window.Achievements) window.Achievements.updateStats({ type: 'sound' });
    if (typeof window.triggerSync === 'function') window.triggerSync();
}

function updateSoundButtons() {
    const icon = gameState.soundEnabled ? '🔊' : '🔇';
    const m = document.getElementById('menuSoundBtn');
    const g = document.getElementById('soundBtn');
    if (m) m.textContent = icon;
    if (g) g.textContent = icon;
}

function loadSound() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEYS_LOCAL.SOUND); } catch (e) {}
    gameState.soundEnabled = saved !== '0';
    updateSoundButtons();
}


function applySound(value) {
    gameState.soundEnabled = !(value === '0' || value === 0 || value === false);
    updateSoundButtons();
}
window.applySound = applySound;

// ====== ЧАСТИЦЫ (звёздочки на фоне) ======
let _deviceTier = null;
function getDeviceTier() {
    if (_deviceTier !== null) return _deviceTier;

    const ua = navigator.userAgent || '';
    const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const isNarrow   = window.innerWidth < 768;
    const isMobile   = isMobileUA || isNarrow;

    const cores = navigator.hardwareConcurrency || 0;
    const ram   = navigator.deviceMemory || 0; 

    const weakCPU = cores > 0 && cores <= 2;
    const lowRAM  = ram   > 0 && ram   <= 2;

    if (isMobile && (weakCPU || lowRAM)) _deviceTier = 'weak';
    else if (isMobile)                   _deviceTier = 'mobile';
    else                                 _deviceTier = 'desktop';

    return _deviceTier;
}

function createParticles() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tier = getDeviceTier();
    if (tier === 'weak') return;

    const container = document.getElementById('particlesContainer');
    if (!container) return;
    container.innerHTML = '';

    const count = tier === 'mobile' ? 8 : 28;

    const theme = gameState.theme || 'light';
    let pClass = 'particle-blue';
    if (theme === 'dark') pClass = 'particle-pink';
    else if (theme === 'green') pClass = 'particle-gold';
    else if (theme === 'blue') pClass = 'particle-blue';

    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle ' + pClass;
        const sizes = ['particle-sm', 'particle-md', 'particle-lg', 'particle-xl'];
        p.classList.add(sizes[Math.floor(Math.random() * sizes.length)]);
        p.classList.add('particle-delay-' + (Math.floor(Math.random() * 7) + 1));
        p.style.left = (Math.random() * 100) + '%';
        p.style.top  = (Math.random() * 100) + '%';
        p.style.animationDuration = (3 + Math.random() * 3) + 's';
        container.appendChild(p);
    }
}

function updateParticles() {
    const container = document.getElementById('particlesContainer');
    if (!container) return;
    const theme = gameState.theme || 'light';
    let pClass = 'particle-blue';
    if (theme === 'dark') pClass = 'particle-pink';
    else if (theme === 'green') pClass = 'particle-gold';

    container.querySelectorAll('.particle').forEach(p => {
        p.classList.remove('particle-blue', 'particle-pink', 'particle-gold');
        p.classList.add(pClass);
    });
}

// ====== СОХРАНЕНИЕ ======
let _saveTimer = null;

function saveProgress() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        _saveTimer = null;
        try {
            localStorage.setItem(STORAGE_KEYS_LOCAL.PROGRESS, JSON.stringify({
                totalScore: gameState.totalScore,
                solvedRiddles: gameState.solvedRiddles,
                categoryUnlocks: gameState.categoryUnlocks
            }));
        } catch (e) {
            if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
                console.warn('localStorage переполнен — прогресс сохранён только в VK Storage');
                // не показываем игроку: VK Storage продолжит синхронизацию,
                // а при следующей загрузке mergeProgressFromVK подтянет данные
            }
        }
    }, 300);
}

// При выходе со страницы — форсируем сохранение
window.addEventListener('pagehide', () => {
    if (_saveTimer) {
        clearTimeout(_saveTimer);
        _saveTimer = null;
        try {
            localStorage.setItem(STORAGE_KEYS_LOCAL.PROGRESS, JSON.stringify({
                totalScore: gameState.totalScore,
                solvedRiddles: gameState.solvedRiddles,
                categoryUnlocks: gameState.categoryUnlocks
            }));
        } catch (e) {}
    }
});

function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS_LOCAL.PROGRESS);
        if (!raw) return;
        const data = JSON.parse(raw);
        if ((data.totalScore || 0) > gameState.totalScore) gameState.totalScore = data.totalScore;
        if (data.solvedRiddles) {
            for (const k in data.solvedRiddles) {
                if (!gameState.solvedRiddles[k]) gameState.solvedRiddles[k] = true;
            }
        }
        if (data.categoryUnlocks) {
            for (const c in data.categoryUnlocks) {
                if ((data.categoryUnlocks[c] || 0) > (gameState.categoryUnlocks[c] || 0)) {
                    gameState.categoryUnlocks[c] = data.categoryUnlocks[c];
                }
            }
        }
    } catch (e) {}
}

// ====== VK SYNC (компактный формат) ======
// VK Storage:
//   <prefix>s           — общее число очков ("1234")
//   <prefix>c_<catId>   — hex-битовая маска решённых загадок (порядок = порядок в RIDDLES[catId])
//                         + необязательный суффикс ".<unlockUntil в base36>"
const PROGRESS_KEY_SCORE = GAME_STORAGE_PREFIX + 's';
const PROGRESS_KEY_CAT   = GAME_STORAGE_PREFIX + 'c_';

// ids[catId][i] — id загадки на позиции i (позиция = номер бита)
const _catIndex = (function () {
    const cache = {};
    try {
        if (typeof RIDDLES === 'undefined' || !RIDDLES) return cache;
        for (const catId in RIDDLES) {
            const list = Array.isArray(RIDDLES[catId]) ? RIDDLES[catId] : [];
            const ids = [];
            for (let i = 0; i < list.length; i++) {
                const r = list[i];
                ids[i] = (r && r.id != null) ? String(r.id) : null;
            }
            cache[catId] = ids;
        }
    } catch (e) {}
    return cache;
})();

function encodeCategoryMask(catId) {
    const ids = _catIndex[catId];
    if (!ids || !ids.length) return '';
    const prefix = catId + '_';
    let hex = '';
    for (let i = 0; i < ids.length; i += 4) {
        let nib = 0;
        for (let b = 0; b < 4; b++) {
            const id = ids[i + b];
            if (id != null && gameState.solvedRiddles[prefix + id]) nib |= (1 << b);
        }
        hex += nib.toString(16);
    }
    return hex.replace(/0+$/, '');   // хвостовые нули не храним
}

function decodeCategoryMask(catId, hex) {
    const ids = _catIndex[catId];
    if (!ids || !ids.length || typeof hex !== 'string' || !hex) return false;
    const prefix = catId + '_';
    let changed = false;
    const total = Math.min(ids.length, hex.length * 4);
    for (let i = 0; i < total; i++) {
        const v = parseInt(hex[i >> 2], 16);
        if (!v || !(v & (1 << (i & 3)))) continue;
        const id = ids[i];
        if (id == null) continue;
        const key = prefix + id;
        if (!gameState.solvedRiddles[key]) {
            gameState.solvedRiddles[key] = true;
            changed = true;
        }
    }
    return changed;
}

function encodeCategoryValue(catId) {
    const mask = encodeCategoryMask(catId);
    const until = gameState.categoryUnlocks[catId] || 0;
    if (until > Date.now()) return mask + '.' + until.toString(36);
    return mask;
}

function decodeCategoryValue(catId, value) {
    if (typeof value !== 'string' || !value) return false;
    const dot = value.indexOf('.');
    const mask = dot === -1 ? value : value.slice(0, dot);
    let changed = false;

    if (dot !== -1) {
        const until = parseInt(value.slice(dot + 1), 36);
        if (Number.isFinite(until) && until > Date.now() &&
            until > (gameState.categoryUnlocks[catId] || 0)) {
            gameState.categoryUnlocks[catId] = until;
            changed = true;
        }
    }
    if (decodeCategoryMask(catId, mask)) changed = true;
    return changed;
}

// { 's': '1234', 'c_animals': 'f3', ... } — готово к записи в VK Storage
window.getProgressStorageEntries = function () {
    const out = {};
    out[PROGRESS_KEY_SCORE] = String(Math.floor(Number(gameState.totalScore) || 0));
    for (const catId in _catIndex) {
        const v = encodeCategoryValue(catId);
        if (v) out[PROGRESS_KEY_CAT + catId] = v;
    }
    return out;
};

// Какие ключи вообще читать из VK Storage
window.getProgressStorageKeys = function () {
    const keys = [PROGRESS_KEY_SCORE];
    for (const catId in _catIndex) keys.push(PROGRESS_KEY_CAT + catId);
    return keys;
};

window.mergeVKProgress = function (entries) {
    if (!entries || typeof entries !== 'object') return;
    let changed = false;

    const scoreRaw = entries[PROGRESS_KEY_SCORE];
    if (scoreRaw != null && scoreRaw !== '') {
        const remote = Math.floor(Number(scoreRaw));
        if (Number.isFinite(remote) && remote > gameState.totalScore) {
            gameState.totalScore = remote;
            changed = true;
        }
    }

    for (const catId in _catIndex) {
        if (decodeCategoryValue(catId, entries[PROGRESS_KEY_CAT + catId])) changed = true;
    }

    if (changed) {
        saveProgress();
        if (typeof renderMenu === 'function') renderMenu();
        updateScoreDisplay();
    }
};

// ====== ДРУГИЕ ИГРЫ ======
const VK_GAMES = [ 
      { href: "https://vk.com/app54859110", emoji: "💭", name: "Пословицы" },
    { href: "https://vk.com/app54636699",  emoji: "🍎", name: "Найди слова" },
    { href: "https://vk.ru/app51399364",   emoji: "9️⃣", name: "Судоку для самых умных" },
    { href: "https://vk.com/app54620141",  emoji: "🧩", name: "ТЕТРА" },
    { href: "https://vk.com/app54659768",  emoji: "🕹️", name: "Тетра Дарк" },
    { href: "https://vk.com/app54678489",  emoji: "🎨", name: "Раскраска" },
    { href: "https://vk.com/app54634418",  emoji: "💭", name: "Словарекс" }
];
const OK_GAMES = [
     { href: "https://ok.ru/app/512005525666", emoji: "💭", name: "Пословицы" },
    { href: "https://ok.ru/app/512004943223", emoji: "🍎", name: "Найди слова" },
    { href: "https://ok.ru/app/512005390848", emoji: "9️⃣", name: "Судоку для самых умных" },
    { href: "https://ok.ru/app/512004963709", emoji: "🎨", name: "Раскраска" },
    { href: "https://ok.ru/app/512005107616", emoji: "🧩", name: "ТЕТРА" },
    { href: "https://ok.ru/app/512005458660", emoji: "🕹️", name: "Тетра Дарк" },
    { href: "https://ok.ru/app/512005443175", emoji: "💭", name: "Словарекс" }
];

function openOtherGamesModal() {
    const list = document.getElementById('otherGamesList');
    if (!list) return;
    const isOK = !!(window.__PLATFORM && window.__PLATFORM.isOK);
    const games = isOK ? OK_GAMES : VK_GAMES;
    list.innerHTML = games.map(function (game) {
        return '<a href="' + game.href + '" target="_blank" rel="noopener noreferrer" class="other-game-item">' +
            '<span class="other-game-item__emoji">' + game.emoji + '</span>' +
            '<span class="other-game-item__name">' + game.name + '</span>' +
            '<span class="other-game-item__arrow">→</span>' +
        '</a>';
    }).join('');
    const modal = document.getElementById('otherGamesModal');
    if (modal) modal.classList.add('show');
}

function closeOtherGamesModal() {
    const modal = document.getElementById('otherGamesModal');
    if (modal) modal.classList.remove('show');
}

(function initOtherGamesUI() {
    const openBtn   = document.getElementById('otherGamesBtn');
    const closeBtn  = document.getElementById('otherGamesModalClose');
    const okBtn     = document.getElementById('otherGamesModalBtn');
    const modal     = document.getElementById('otherGamesModal');

    if (openBtn)  openBtn.onclick  = openOtherGamesModal;
    if (closeBtn) closeBtn.onclick = closeOtherGamesModal;
    if (okBtn)    okBtn.onclick    = closeOtherGamesModal;
    if (modal) {
        modal.onclick = function (e) {
            if (e.target === modal) closeOtherGamesModal();
        };
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const m = document.getElementById('otherGamesModal');
            if (m && m.classList.contains('show')) closeOtherGamesModal();
        }
    });
})();

window.applyTheme = applyTheme;