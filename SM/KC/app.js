(function () {
'use strict';
const PREFIX = (window.__PLATFORM && window.__PLATFORM.storagePrefix) || '';
const IS_OK  = !!(window.__PLATFORM && window.__PLATFORM.isOK);
const ALWAYS_FREE_CATS = ['animals'];
const CAT_UNLOCK_DURATION = 24 * 60 * 60 * 1000;
const VALID_THEMES = ['peach', 'blue', 'emerald', 'sunset', 'violet', 'night'];
let _pendingCatUnlock = null;
let vkInitialized = false;
let vkUserId = 0;
function safe(fn, label) {
    return function (...args) {
        try {
            const r = fn.apply(this, args);
            if (r && typeof r.catch === 'function') {
                r.catch(e => console.error('❌ Async в ' + (label || 'op') + ':', e));
            }
            return r;
        } catch (e) {
            console.error('❌ Синхронная ошибка в ' + (label || 'op') + ':', e);
            try { toast('Что-то пошло не так. Попробуйте ещё раз'); } catch (_) {}
        }
    };
}

function bindTap(el, handler) {
    if (!el || typeof handler !== 'function') return;
    if (el.__tapBound) {
        el.__tapHandler = handler;
        return;
    }
    el.__tapBound = true;
    el.__tapHandler = handler;
    let lastTouchTime = 0;
    let startX = 0, startY = 0;
    let moved = false;
    const MOVE_THRESHOLD   = 10;    
    const DOUBLE_GUARD_MS  = 450;   
    el.addEventListener('touchstart', function (e) {
        if (e.touches.length > 1) { moved = true; return; } 
        const t = e.touches[0];
        if (!t) return;
        startX = t.clientX;
        startY = t.clientY;
        moved = false;
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
        if (moved) return;
        const t = e.touches[0];
        if (!t) return;
        if (Math.abs(t.clientX - startX) > MOVE_THRESHOLD ||
            Math.abs(t.clientY - startY) > MOVE_THRESHOLD) {
            moved = true;
        }
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
        if (moved) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        lastTouchTime = Date.now();
        if (e.cancelable) {
            try { e.preventDefault(); } catch (_) {}
        }
        const h = el.__tapHandler;
        if (typeof h === 'function') h.call(el, e);
    }, { passive: false });  
    el.addEventListener('click', function (e) {
        if (Date.now() - lastTouchTime < DOUBLE_GUARD_MS) return;
        const h = el.__tapHandler;
        if (typeof h === 'function') h.call(el, e);
    });
}

const K = {
    SCORE:         PREFIX + 'cw_score_v1',
    SOLVED_THEMES: PREFIX + 'cw_themes_v1',
    THEME:         PREFIX + 'cw_theme_v1',
    SOUND:         PREFIX + 'cw_sound_v1',
    ACH:           PREFIX + 'cw_ach_v1',
    DAILY:         PREFIX + 'cw_daily_v1',
    CAT_UNLOCKS:   PREFIX + 'cw_cat_unlocks_v1',
    STREAK:        PREFIX + 'cw_streak_v1',
    LAST_PUZZLE:   PREFIX + 'cw_last_puzzle_v1'
};
const VK_KEYS = {
    SCORE:         PREFIX + 'cw_score_v2',
    SOLVED_THEMES: PREFIX + 'cw_themes_v2',
    THEME:         PREFIX + 'cw_theme_v2',
    SOUND:         PREFIX + 'cw_sound_v2',
    ACH:           PREFIX + 'cw_ach_v2',
    DAILY:         PREFIX + 'cw_daily_v2',
    CAT_UNLOCKS:   PREFIX + 'cw_cat_unlocks_v2',
    STREAK:        PREFIX + 'cw_streak_v2',
    LAST_PUZZLE:   PREFIX + 'cw_last_puzzle_v2'
};

// ====== СОСТОЯНИЕ ======
const state = {
    score: 0,
    solvedThemes: {},
    catUnlocks: {},     
theme: 'peach',
    sound: true,
    ach: {},
    daily: null,
    currentPuzzle: null,
    currentPuzzleMeta: null,
    userGrid: null,
    cells: [],
    selected: null,
    timer: null,
    startTime: 0,
    solvedFlag: false,
      hintsUsed: 0,
    puzzleToken: 0,
       noMistakeStreak: 0,
    mistakesThisPuzzle: 0,
    lastSavedPuzzle: null
};


let _dataLoaded = false;
// ====== ДОСТИЖЕНИЯ ======
const ACHIEVEMENTS = [
    { id:'first',    icon:'🎬', name:'Первое решение', desc:'Решить первый кроссворд' },
    { id:'ten',      icon:'🎯', name:'Десятка',        desc:'Решить 10 кроссвордов' },
    { id:'fifty',    icon:'🏅', name:'Полтинник',      desc:'Решить 50 кроссвордов' },
    { id:'hundred',  icon:'🏆', name:'Сотка',          desc:'Решить 100 кроссвордов' },
    { id:'daily1',   icon:'☀️', name:'День сурка',     desc:'Решить кроссворд дня' },
    { id:'speed',    icon:'⚡', name:'Скорость',       desc:'Решить кроссворд за 60 сек' },
    { id:'flash',    icon:'💥', name:'Молния',         desc:'Решить кроссворд за 30 сек' },
    { id:'nohint',   icon:'🧠', name:'Без подсказок',  desc:'Решить кроссворд без подсказок' },
    { id:'hint5',    icon:'💡', name:'Всезнайка',      desc:'Использовать 5 подсказок' },
    { id:'alltheme', icon:'🌈', name:'Путешественник', desc:'Решить кроссворд каждой темы' },
    { id:'night',    icon:'🌙', name:'Полуночник',     desc:'Решить кроссворд ночью' },
    { id:'streak3',  icon:'🔥', name:'Три подряд',     desc:'Решить 3 кроссворда без ошибок' }
];

// ====== УТИЛИТЫ ======
const $ = id => document.getElementById(id);
const qsa = sel => document.querySelectorAll(sel);

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ====== ЗВУК ======
let audioCtx = null;
function initAudio() {
    if (audioCtx) {
        if (audioCtx.state === 'suspended') {
            try { audioCtx.resume(); } catch(e) {}
        }
        return;
    }
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { console.warn('Audio недоступен'); }
}

function playTone(freq, dur = 0.15, type = 'sine', vol = 0.15) {
    if (!state.sound || !audioCtx) return;
    try {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type;
        o.frequency.value = freq;
        o.connect(g); g.connect(audioCtx.destination);
        g.gain.value = vol;
        g.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + dur);
        o.start(); o.stop(audioCtx.currentTime + dur);
    } catch(e) {}
}
const sound = {
    click:   () => playTone(880, 0.05, 'sine', 0.08),
    letter:  () => playTone(1200, 0.05, 'sine', 0.06),
    correct: () => { playTone(660,0.1); setTimeout(()=>playTone(880,0.1),100); setTimeout(()=>playTone(1320,0.15),200); },
    wrong:   () => playTone(200, 0.15, 'sawtooth', 0.08),
    win:     () => { [523,659,784,1046].forEach((f,i)=>setTimeout(()=>playTone(f,0.2,'sine',0.15),i*120)); },
    hint:    () => playTone(1046, 0.12, 'sine', 0.1)
};

// ====== КОНФЕТТИ ======
let confettiCanvas, confettiCtx, confettiRAF = 0;
function initConfetti() {
    confettiCanvas = $('confetti');
    if (!confettiCanvas) return;
    confettiCtx = confettiCanvas.getContext('2d');
    resizeConfetti();
    window.addEventListener('resize', resizeConfetti);
}
function resizeConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
function launchConfetti(count) {
    if (!confettiCtx) return;
    const colors = ['#ffd166','#ff6b6b','#4ecdc4','#a855f7','#f97316','#06d6a0','#f72585'];
    const parts = [];
    for (let i = 0; i < count; i++) {
        parts.push({
            x: Math.random() * confettiCanvas.width,
            y: -20 - Math.random() * 100,
            vx: (Math.random() - 0.5) * 4,
            vy: 2 + Math.random() * 4,
            size: 6 + Math.random() * 8,
            color: colors[(Math.random() * colors.length) | 0],
            rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.3
        });
    }
    let frame = 0;
    cancelAnimationFrame(confettiRAF);
    function tick() {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        for (const p of parts) {
            p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.rot += p.rotV;
            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate(p.rot);
            confettiCtx.fillStyle = p.color;
            confettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            confettiCtx.restore();
        }
        frame++;
        if (frame < 220) confettiRAF = requestAnimationFrame(tick);
        else confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    tick();
}

// ====== ХРАНИЛИЩЕ ======
function lsGet(key, def) {
    try {
        const v = localStorage.getItem(key);
        return v === null ? def : JSON.parse(v);
    } catch(e) { return def; }
}
function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
}

// ====== СЖАТИЕ VK STORAGE (pako) ======
const VK_PACK_PREFIX = 'pako:';

function packForVK(value) {
    let json = typeof value === 'string' ? value : JSON.stringify(value);
    if (json == null) json = '';
    if (json === '') return '';
    if (!window.pako || typeof window.pako.deflate !== 'function') return json;

    try {
        const bytes = window.pako.deflate(json);
        let bin = '';
        const CHUNK = 0x8000;
        for (let i = 0; i < bytes.length; i += CHUNK) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
        }
        const packed = VK_PACK_PREFIX + btoa(bin);
        // Если сжатие не уменьшило — сохраняем как есть (для мелких значений)
        return packed.length < json.length ? packed : json;
    } catch (e) {
        console.warn('⚠️ pako deflate failed:', e);
        return json;
    }
}

function unpackFromVK(raw) {
    if (raw == null || raw === '') return null;
    if (typeof raw !== 'string') return raw;

    if (raw.indexOf(VK_PACK_PREFIX) === 0) {
        if (!window.pako || typeof window.pako.inflate !== 'function') {
            console.warn('⚠️ pako не загружен — значение потеряно');
            return null;
        }
        try {
            const bin = atob(raw.slice(VK_PACK_PREFIX.length));
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const json = window.pako.inflate(bytes, { to: 'string' });
            try { return JSON.parse(json); } catch (_) { return json; }
        } catch (e) {
            console.warn('⚠️ pako inflate failed:', e);
            return null;
        }
    }
    // Мелкие значения без сжатия — обычный JSON/строка
    try { return JSON.parse(raw); } catch (_) { return raw; }
}

// Кэш последних УСПЕШНО отправленных значений.
// Если значение не изменилось — в VK Storage не пишем.
const __vkLastSaved = {};

function vkSaveIfChanged(key, value) {
    if (typeof vkBridge === 'undefined') return;
    let serialized;
    try { serialized = JSON.stringify(value); } catch (e) { serialized = String(value); }
    if (__vkLastSaved[key] === serialized) return;  
    __vkLastSaved[key] = serialized;
    vkSave(key, value).then(ok => {
        if (!ok && __vkLastSaved[key] === serialized) {
            delete __vkLastSaved[key];
        }
    });
}

function vkSave(key, value, timeoutMs = 3000) {
    if (typeof vkBridge === 'undefined') return Promise.resolve(false);
    let packed;
    try { packed = packForVK(value); } catch (e) { packed = ''; }

    let timer = null;
    const timeoutPromise = new Promise(r => { timer = setTimeout(() => r(false), timeoutMs); });
    const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };

    let p;
    try {
        p = vkBridge.send('VKWebAppStorageSet', { key, value: packed })
            .then(() => true)
            .catch(() => false);
    } catch (e) {
        clearTimer();
        return Promise.resolve(false);
    }
    p.then(clearTimer, clearTimer);
    return Promise.race([p, timeoutPromise]);
}

function vkLoad(key, timeoutMs = 3000) {
    if (typeof vkBridge === 'undefined') return Promise.resolve(null);
    let timer = null;
    const timeoutPromise = new Promise(r => { timer = setTimeout(() => r(null), timeoutMs); });
    const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };

    let p;
    try {
        p = vkBridge.send('VKWebAppStorageGet', { keys: [key] })
            .then(data => {
                if (data && data.keys && data.keys.length) {
                    const v = data.keys[0].value;
                    if (v === '' || v === undefined || v === null) return null;
                    return unpackFromVK(v);
                }
                return null;
            })
            .catch(() => null);
    } catch (e) {
        clearTimer();
        return Promise.resolve(null);
    }
    p.then(clearTimer, clearTimer);
    return Promise.race([p, timeoutPromise]);
}

let __lastVKSync = 0;
const VK_SYNC_MIN_INTERVAL = 8000;
let saveTimer = null;
function saveAll(immediate = false) {
    if (!_dataLoaded) return;
    const doSave = () => {
        try {
            lsSet(K.SCORE,         state.score);
            lsSet(K.SOLVED_THEMES, state.solvedThemes);
            lsSet(K.THEME,         state.theme);
            lsSet(K.SOUND,         state.sound);
            lsSet(K.ACH,           state.ach);
            lsSet(K.DAILY,         state.daily);
            lsSet(K.CAT_UNLOCKS,   state.catUnlocks);
            lsSet(K.STREAK,        state.noMistakeStreak);
        } catch(e) {}

        if (state.currentPuzzle && !state.solvedFlag) {
            const snapshot = captureLastPuzzleSnapshot();
            if (snapshot) {
                state.lastSavedPuzzle = snapshot;
                try { lsSet(K.LAST_PUZZLE, snapshot); } catch(e) {}
            } else if (state.lastSavedPuzzle) {
                            state.lastSavedPuzzle = null;
                try { localStorage.removeItem(K.LAST_PUZZLE); } catch(e) {}
                if (typeof vkBridge !== 'undefined') {
                    __vkLastSaved[VK_KEYS.LAST_PUZZLE] = null;
                    vkSave(VK_KEYS.LAST_PUZZLE, '');
                }
            }
        }

        if (typeof vkBridge === 'undefined') return;
        const now = Date.now();
        if (!immediate && (now - __lastVKSync) < VK_SYNC_MIN_INTERVAL) return;
        __lastVKSync = now;

try {
    vkSaveIfChanged(VK_KEYS.SCORE,         state.score);
    vkSaveIfChanged(VK_KEYS.SOLVED_THEMES, state.solvedThemes);
    vkSaveIfChanged(VK_KEYS.THEME,         state.theme);
    vkSaveIfChanged(VK_KEYS.SOUND,         state.sound);
    vkSaveIfChanged(VK_KEYS.ACH,           state.ach);
    vkSaveIfChanged(VK_KEYS.DAILY,         state.daily);
    vkSaveIfChanged(VK_KEYS.CAT_UNLOCKS,   state.catUnlocks);
    vkSaveIfChanged(VK_KEYS.STREAK,        state.noMistakeStreak);
    if (state.lastSavedPuzzle) {
        vkSaveIfChanged(VK_KEYS.LAST_PUZZLE, state.lastSavedPuzzle);
    }
} catch(e) {}
    };
    if (immediate) {
        if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
        doSave();
        return;
    }
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
        saveTimer = null;
        doSave();
    }, 1500);
}
async function loadAll() {
    state.score        = lsGet(K.SCORE,  0) || 0;
    state.solvedThemes = lsGet(K.SOLVED_THEMES, {}) || {};
    state.catUnlocks   = lsGet(K.CAT_UNLOCKS, {}) || {};
state.theme        = lsGet(K.THEME,  'peach') || 'peach';
    state.sound        = lsGet(K.SOUND,  true);
    state.ach          = lsGet(K.ACH,    {}) || {};
    state.daily        = lsGet(K.DAILY,  null);
    state.noMistakeStreak = lsGet(K.STREAK, 0) || 0;
    state.lastSavedPuzzle = lsGet(K.LAST_PUZZLE, null);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        console.log('ℹ️ Нет сети — работаем только с локальными данными');
        return;
    }
try {
    const __now = Date.now();
    const __keys = Object.keys(state.catUnlocks);
    for (let __i = 0; __i < __keys.length; __i++) {
        const __k = __keys[__i];
        if (!state.catUnlocks[__k] || state.catUnlocks[__k] < __now) {
            delete state.catUnlocks[__k];
        }
    }
} catch (_) {}
    if (window.__VK_BRIDGE_READY) {
        try { await window.__VK_BRIDGE_READY; } catch (e) {}
    }

    if (typeof vkBridge === 'undefined') {
        console.log('ℹ️ VK Bridge недоступен — работаем на локальных данных');
        return;
    }

    try {
        const results = await Promise.all([
            vkLoad(VK_KEYS.SCORE),
            vkLoad(VK_KEYS.SOLVED_THEMES),
            vkLoad(VK_KEYS.THEME),
            vkLoad(VK_KEYS.SOUND),
            vkLoad(VK_KEYS.ACH),
            vkLoad(VK_KEYS.DAILY),
            vkLoad(VK_KEYS.CAT_UNLOCKS),
            vkLoad(VK_KEYS.STREAK),
            vkLoad(VK_KEYS.LAST_PUZZLE)
        ]);
        const [vkScore, vkThemes, vkTheme, vkSound, vkAch, vkDaily, vkCatUnlocks, vkStreak, vkLastPuzzle] = results;

if (typeof vkScore === 'number' && isFinite(vkScore) && vkScore >= 0 && vkScore > state.score) {
    state.score = vkScore;
}

        if (vkCatUnlocks && typeof vkCatUnlocks === 'object') {
            const merged = { ...state.catUnlocks };
            for (const k in vkCatUnlocks) {
                const t = +vkCatUnlocks[k] || 0;
                if (!merged[k] || t > merged[k]) merged[k] = t;
            }
            state.catUnlocks = merged;
        }
try {
    const __now2 = Date.now();
    const __keys2 = Object.keys(state.catUnlocks);
    for (let __i2 = 0; __i2 < __keys2.length; __i2++) {
        const __k2 = __keys2[__i2];
        if (!state.catUnlocks[__k2] || state.catUnlocks[__k2] < __now2) {
            delete state.catUnlocks[__k2];
        }
    }
} catch (_) {}
        if (vkThemes && typeof vkThemes === 'object') {
            state.solvedThemes = { ...vkThemes, ...state.solvedThemes };
        }
if (typeof vkTheme === 'string' && VALID_THEMES.indexOf(vkTheme) !== -1) state.theme = vkTheme;
        if (typeof vkSound === 'boolean') state.sound = vkSound;
        if (vkAch && typeof vkAch === 'object') state.ach = { ...vkAch, ...state.ach };
        if (typeof vkStreak === 'number' && vkStreak > state.noMistakeStreak) {
            state.noMistakeStreak = vkStreak;
        }
        if (vkDaily && typeof vkDaily === 'object' && vkDaily.date) {
            const local = state.daily;
            if (!local || !local.date || local.date < vkDaily.date) {
                state.daily = vkDaily;
            } else if (local.date === vkDaily.date) {
                if (vkDaily.timeSec && (!local.timeSec || vkDaily.timeSec < local.timeSec)) {
                    state.daily = vkDaily;
                }
            }
        }

        if (vkLastPuzzle && typeof vkLastPuzzle === 'object' && vkLastPuzzle.savedAt) {
            const local = state.lastSavedPuzzle;
            if (!local || !local.savedAt || vkLastPuzzle.savedAt > local.savedAt) {
                state.lastSavedPuzzle = vkLastPuzzle;
            }
        }
        if (state.lastSavedPuzzle) {
            lsSet(K.LAST_PUZZLE, state.lastSavedPuzzle);
        }

        lsSet(K.SCORE,         state.score);
        lsSet(K.SOLVED_THEMES, state.solvedThemes);
        lsSet(K.THEME,         state.theme);
        lsSet(K.SOUND,         state.sound);
        lsSet(K.ACH,           state.ach);
        lsSet(K.DAILY,         state.daily);
        lsSet(K.CAT_UNLOCKS,   state.catUnlocks);
               lsSet(K.STREAK,        state.noMistakeStreak);
               if (typeof state.score !== 'number' || !isFinite(state.score) || state.score < 0) {
    state.score = 0;
}
state.score = Math.floor(state.score);

if (state.lastSavedPuzzle && !isSavedPuzzleValid(state.lastSavedPuzzle)) {
    state.lastSavedPuzzle = null;
    try { localStorage.removeItem(K.LAST_PUZZLE); } catch (e) {}
    try {
        if (typeof vkBridge !== 'undefined') vkSave(VK_KEYS.LAST_PUZZLE, '');
    } catch (_) {}
}
    } catch (e) {
        console.warn('⚠️ Ошибка загрузки VK Storage:', e);
    }
}

function applyTheme(t) {
    if (VALID_THEMES.indexOf(t) === -1) t = 'peach';
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    qsa('.theme-item[data-theme]').forEach(el => el.classList.toggle('active', el.dataset.theme === t));
    lsSet(K.THEME, t);
    saveAll();
}
function toggleSound() {
    state.sound = !state.sound;
    const b1 = $('soundBtn'); if (b1) b1.textContent = state.sound ? '🔊' : '🔇';
    const b2 = $('soundBtnMenu'); if (b2) b2.textContent = state.sound ? '🔊' : '🔇';
    lsSet(K.SOUND, state.sound);
    saveAll();
    if (state.sound) { initAudio(); sound.click(); }
}

// ====== ПСЕВДОСЛУЧАЙНЫЙ ГЕНЕРАТОР (детерминированный seed) ======
function makeRandom(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

function buildLinearPuzzle(words, maxWords) {
    const placed = [];
    const limit = Math.min(maxWords, words.length);
    for (let i = 0; i < limit; i++) {
        const w = words[i];
        placed.push({
            answer: w.answer,
            clue: w.clue,
            row: i,
            col: 0,
            dir: 'h'
        });
    }
    return placed;
}

function generateCrossword(wordList, opts) {
    opts = opts || {};
    const minWords = opts.minWords || 5;
    const maxWords = opts.maxWords || 20;
    const maxAttempts = opts.maxAttempts || 40;
    const rng = (opts.seed !== undefined) ? makeRandom(opts.seed) : Math.random;

    const raw = [];
    const seen = new Set();
    for (const w of wordList) {
        if (!w || !w.a || !w.q) continue;
        const ans = String(w.a).toUpperCase().replace(/Ё/g, 'Е');
        if (!/^[А-Я]+$/.test(ans)) continue;
        if (ans.length < 3 || ans.length > 12) continue;
        if (seen.has(ans)) continue;
        seen.add(ans);
        raw.push({ answer: ans, clue: w.q });
    }
    if (raw.length < 2) return null;

    const effectiveMin = Math.min(minWords, raw.length);
    const deterministic = !!opts.deterministic;
    const startedAt = Date.now();
    const softLimitMs = deterministic
        ? Infinity
        : (typeof opts.softLimitMs === 'number' ? opts.softLimitMs : 3500);
    const hardDeadline = deterministic
        ? Infinity
        : (typeof opts.hardDeadline === 'number' ? opts.hardDeadline : (startedAt + 9000));

    let best = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (!deterministic) {
            const now = Date.now();
            if (now > hardDeadline) break;
            if (best && (now - startedAt) > softLimitMs) break;
        }

        const words = raw.slice();
        for (let i = words.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            const t = words[i]; words[i] = words[j]; words[j] = t;
        }
        words.sort((a, b) => b.answer.length - a.answer.length);

        const built = tryBuildPuzzle(words, effectiveMin, maxWords, rng);
        if (built) {
            if (!best || built.placed.length > best.placed.length) {
                best = built;
            }
            if (built.placed.length === Math.min(words.length, maxWords)) break;
        }
    }

    if (!best) {
        const shuffled = raw.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            const t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
        }
        return normalizePuzzle(buildLinearPuzzle(shuffled, maxWords));
    }
    return normalizePuzzle(best.placed);
}

function tryBuildPuzzle(words, minWords, maxWords, rng) {
    const grid = new Map();
    const placed = [];
    const get = (r, c) => grid.get(r + ',' + c);

    let bMinR = 0, bMaxR = 0, bMinC = 0, bMaxC = 0;

    function canPlace(answer, r, c, dir) {
        const dr = dir === 'v' ? 1 : 0;
        const dc = dir === 'h' ? 1 : 0;
        if (get(r - dr, c - dc) !== undefined) return false;
        if (get(r + answer.length * dr, c + answer.length * dc) !== undefined) return false;
        let crossings = 0;
        for (let i = 0; i < answer.length; i++) {
            const cr = r + i * dr, cc = c + i * dc;
            const cur = get(cr, cc);
            if (cur !== undefined) {
                if (cur !== answer[i]) return false;
                crossings++;
            } else {
                if (dir === 'h') {
                    if (get(cr - 1, cc) !== undefined) return false;
                    if (get(cr + 1, cc) !== undefined) return false;
                } else {
                    if (get(cr, cc - 1) !== undefined) return false;
                    if (get(cr, cc + 1) !== undefined) return false;
                }
            }
        }
        return crossings > 0;
    }

    function place(answer, r, c, dir) {
        const dr = dir === 'v' ? 1 : 0;
        const dc = dir === 'h' ? 1 : 0;
        for (let i = 0; i < answer.length; i++) {
            grid.set((r + i * dr) + ',' + (c + i * dc), answer[i]);
        }
    }

    function extendBounds(r, c, dir, len) {
        const dr = dir === 'v' ? 1 : 0;
        const dc = dir === 'h' ? 1 : 0;
        const endR = r + (len - 1) * dr;
        const endC = c + (len - 1) * dc;
        const wMinR = r < endR ? r : endR;
        const wMaxR = r > endR ? r : endR;
        const wMinC = c < endC ? c : endC;
        const wMaxC = c > endC ? c : endC;
        if (wMinR < bMinR) bMinR = wMinR;
        if (wMaxR > bMaxR) bMaxR = wMaxR;
        if (wMinC < bMinC) bMinC = wMinC;
        if (wMaxC > bMaxC) bMaxC = wMaxC;
    }

    function placementScore(r, c, dir, len) {
        const dr = dir === 'v' ? 1 : 0;
        const dc = dir === 'h' ? 1 : 0;
        const endR = r + (len - 1) * dr;
        const endC = c + (len - 1) * dc;
        const wMinR = r < endR ? r : endR;
        const wMaxR = r > endR ? r : endR;
        const wMinC = c < endC ? c : endC;
        const wMaxC = c > endC ? c : endC;
        const minR = bMinR < wMinR ? bMinR : wMinR;
        const maxR = bMaxR > wMaxR ? bMaxR : wMaxR;
        const minC = bMinC < wMinC ? bMinC : wMinC;
        const maxC = bMaxC > wMaxC ? bMaxC : wMaxC;
        const width = maxC - minC + 1;
        const height = maxR - minR + 1;
        const aspect = (width > height ? width : height) / (width < height ? width : height);
        return -(width * height) - aspect * 20;
    }

    const first = words[0];
    place(first.answer, 0, 0, 'h');
    placed.push({ ...first, row: 0, col: 0, dir: 'h' });
    bMinR = 0; bMaxR = 0; bMinC = 0; bMaxC = first.answer.length - 1;

    const remaining = words.slice(1);
    let safety = 0;

    while (remaining.length && safety++ < 300) {
        if (placed.length >= maxWords) break;
        let placedThisRound = 0;

        for (let wi = 0; wi < remaining.length; wi++) {
            if (placed.length >= maxWords) break;

            const w = remaining[wi];
            const placements = [];

            for (const p of placed) {
                for (let pi = 0; pi < p.answer.length; pi++) {
                    for (let ii = 0; ii < w.answer.length; ii++) {
                        if (p.answer[pi] !== w.answer[ii]) continue;
                        let nr, nc, nd;
                        if (p.dir === 'h') {
                            nd = 'v'; nr = p.row - ii; nc = p.col + pi;
                        } else {
                            nd = 'h'; nr = p.row + pi; nc = p.col - ii;
                        }
                        if (canPlace(w.answer, nr, nc, nd)) {
                            placements.push({
                                row: nr, col: nc, dir: nd,
                                score: placementScore(nr, nc, nd, w.answer.length)
                            });
                        }
                    }
                }
            }

            if (placements.length) {
                placements.sort((a, b) => b.score - a.score);
                const topN = placements.length < 3 ? placements.length : 3;
                const chosen = placements[Math.floor(rng() * topN)];
                place(w.answer, chosen.row, chosen.col, chosen.dir);
                extendBounds(chosen.row, chosen.col, chosen.dir, w.answer.length);
                placed.push({ ...w, row: chosen.row, col: chosen.col, dir: chosen.dir });
                remaining.splice(wi, 1);
                wi--;
                placedThisRound++;
            }
        }

        if (!placedThisRound) break;
    }

    if (placed.length < minWords) return null;
    return { placed };
}


// ====== НОРМАЛИЗАЦИЯ И НУМЕРАЦИЯ ======
function normalizePuzzle(placed) {
    let minR = Infinity, minC = Infinity, maxR = -Infinity, maxC = -Infinity;
    for (const p of placed) {
        const dr = p.dir === 'v' ? 1 : 0;
        const dc = p.dir === 'h' ? 1 : 0;
        const endR = p.row + (p.answer.length - 1) * dr;
        const endC = p.col + (p.answer.length - 1) * dc;
        if (p.row < minR) minR = p.row;
        if (endR > maxR) maxR = endR;
        if (p.col < minC) minC = p.col;
        if (endC > maxC) maxC = endC;
    }
    const rows = maxR - minR + 1;
    const cols = maxC - minC + 1;
    const result = Array.from({ length: rows }, () => Array(cols).fill(null));

    const shifted = placed.map(p => ({
        ...p,
        row: p.row - minR,
        col: p.col - minC
    }));

    for (const p of shifted) {
        const dr = p.dir === 'v' ? 1 : 0;
        const dc = p.dir === 'h' ? 1 : 0;
        for (let i = 0; i < p.answer.length; i++) {
            result[p.row + i * dr][p.col + i * dc] = p.answer[i];
        }
    }

    const starts = shifted.slice().sort((a, b) => a.row - b.row || a.col - b.col);
    const numMap = new Map();
    let num = 1;
    for (const p of starts) {
        const key = p.row + ',' + p.col;
        if (!numMap.has(key)) numMap.set(key, num++);
        p.number = numMap.get(key);
    }

    return { grid: result, words: shifted, rows, cols };
}

function buildAnswerIndex() {
    if (window.__ANSWER_INDEX) return window.__ANSWER_INDEX;
    const idx = {};
    const db = window.CROSSWORD_DB || {};
    for (const cat in db) {
        const catObj = db[cat];
        if (!catObj || typeof catObj !== 'object') continue;
        for (const key in catObj) {
            if (key === 'name' || key === 'icon') continue;
            const list = catObj[key];
            if (!Array.isArray(list)) continue;
            for (const w of list) {
                if (!w || !w.a) continue;
                const norm = String(w.a).toUpperCase().replace(/Ё/g, 'Е');
                if (!idx[norm]) idx[norm] = w.q || '';
            }
        }
    }
    window.__ANSWER_INDEX = idx;
    return idx;
}

function pickPuzzle(mode, opts) {
    opts = opts || {};
    const db = window.CROSSWORD_DB;
    if (!db) return null;
    const categories = Object.keys(db);
    if (!categories.length) return null;

    const maxMs = (typeof opts.maxMs === 'number' && opts.maxMs > 0) ? opts.maxMs : 15000;
    const pickDeadline = Date.now() + maxMs;

    if (mode === 'daily') {
        const dateSeed = hashStr(todayStr());

        const pool = [];
        for (const cat of categories) {
            const catObj = db[cat];
            for (const diff of ['easy', 'hard']) {
                const list = catObj[diff];
                if (!list || !list.length) continue;
                const idxs = new Set();
                let s = (dateSeed ^ (cat.length * 31) ^ (diff === 'hard' ? 777 : 0)) >>> 0;
                const need = Math.min(2, list.length);
                let guard = 0;
                while (idxs.size < need && guard++ < 50) {
                    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
                    idxs.add(s % list.length);
                }
                for (const i of idxs) pool.push(list[i]);
            }
        }

        if (pool.length >= 3) {
            let puzzle = null;
            for (const mw of [10, 8, 6, 5, 4, 3]) {
                puzzle = generateCrossword(pool, {
                    minWords: mw,
                    maxWords: 20,
                    maxAttempts: 60,
                    seed: dateSeed,
                    deterministic: true
                });
                if (puzzle) break;
            }
            if (!puzzle) {
                puzzle = generateCrossword(pool, {
                    minWords: 3,
                    maxWords: 20,
                    maxAttempts: 400,
                    seed: dateSeed,
                    deterministic: true
                });
            }
            if (puzzle) {
                return {
                    id: 'daily_' + todayStr(),
                    puzzle: puzzle,
                    theme: 'Кроссворд дня',
                    icon: '☀️',
                    isDaily: true,
                    mode: 'daily',
                    seed: dateSeed
                };
            }
        }
        console.warn('⚠️ Не удалось собрать кроссворд дня, используем обычный');
    }

    const seed = (typeof opts.seed === 'number')
        ? (opts.seed >>> 0)
        : ((Math.random() * 0xFFFFFFFF) >>> 0);
    const rng = makeRandom(seed);

    let cat = opts.category;
    let diff = opts.difficulty || 'easy';
    if (!cat) {
        let pool = categories;
        if (mode !== 'random') {
            const unlocked = categories.filter(c => isCategoryUnlocked(c));
            pool = unlocked.length ? unlocked : (categories.includes('animals') ? ['animals'] : categories);
        }
        cat = pool[Math.floor(rng() * pool.length)];
    }
    if (!db[cat]) cat = categories[0];
    if (!db[cat][diff]) diff = 'easy';

    let list = db[cat][diff];
    if (!list || list.length < 3) {
        const alt = categories.find(c => db[c] && db[c].easy && db[c].easy.length >= 3);
        if (!alt) return null;
        cat = alt;
        diff = 'easy';
        list = db[cat].easy;
    }
    const maxWords = diff === 'hard' ? 20 : 15;
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    const shuffled = arr.slice(0, 30);
    if (mode === 'category' && !opts.category) {
        const allPool = [];
        for (const c of categories) {
            for (const d of ['easy', 'hard']) {
                const lst = db[c] && db[c][d];
                if (!lst || !lst.length) continue;
                for (let k = 0; k < lst.length; k++) allPool.push(lst[k]);
            }
        }
        if (allPool.length) {
            const existing = new Set();
            for (let i = 0; i < shuffled.length; i++) {
                const w = shuffled[i];
                if (w && w.a) existing.add(String(w.a).toUpperCase().replace(/Ё/g, 'Е'));
            }
            let added = 0;
            let guard = 0;
            while (added < 3 && guard++ < 60) {
                const w = allPool[Math.floor(rng() * allPool.length)];
                if (!w || !w.a || !w.q) continue;
                const norm = String(w.a).toUpperCase().replace(/Ё/g, 'Е');
                if (!/^[А-Я]+$/.test(norm)) continue;
                if (norm.length < 3 || norm.length > 12) continue;
                if (existing.has(norm)) continue;
                existing.add(norm);
                shuffled.push(w);
                added++;
            }
        }
    }

    let puzzle = null;
    for (const mw of [10, 8, 6, 5, 4, 3]) {
        if (mw > maxWords) continue;
        if (Date.now() > pickDeadline) break;
        puzzle = generateCrossword(shuffled, {
            minWords: mw,
            maxWords: maxWords,
            maxAttempts: 40,
            seed: seed,
            hardDeadline: pickDeadline
        });
        if (puzzle) break;
    }
    if (!puzzle) {
        puzzle = generateCrossword(shuffled, {
            minWords: 3,
            maxWords: maxWords,
            maxAttempts: 400,
            seed: seed,
            hardDeadline: Date.now() + 30000,
            softLimitMs: 30000
        });
    }
    if (!puzzle) return null;

    return {
        id: `puzzle_${cat}_${diff}_${seed}`,
        puzzle: puzzle,
        theme: db[cat].name,
        icon: db[cat].icon,
        category: cat,
        difficulty: diff,
        mode: 'category',
        seed: seed
    };
}

function captureLastPuzzleSnapshot() {
    if (!state.currentPuzzle || !state.currentPuzzleMeta) return null;
    if (state.solvedFlag) return null;
    if (!state.userGrid || Object.keys(state.userGrid).length === 0) return null;
    const meta = state.currentPuzzleMeta;
    const p = state.currentPuzzle;
    const parts = [];
    for (let i = 0; i < p.words.length; i++) {
        const w = p.words[i];
        parts.push(
            w.answer + ',' + w.row + ',' + w.col + ',' + w.dir + ',' + (w.number || 0)
        );
    }
    const snapshot = {
        savedAt: Date.now(),
        date: todayStr(),
        mode: meta.mode || (meta.isDaily ? 'daily' : 'category'),
        seed: (typeof meta.seed === 'number') ? meta.seed : 0,
        category: meta.category || null,
        difficulty: meta.difficulty || null,
        theme: meta.theme || 'Кроссворд',
        icon: meta.icon || '🧩',
        isDaily: !!meta.isDaily,
        rows: p.rows,
        cols: p.cols,
        words: parts.join(';'),
        userGrid: state.userGrid ? Object.assign({}, state.userGrid) : {},
        elapsedSec: Math.max(0, Math.floor((Date.now() - state.startTime) / 1000)),
        hintsUsed: state.hintsUsed || 0,
        mistakesThisPuzzle: state.mistakesThisPuzzle || 0
    };
    // VK Storage имеет лимит 4096 байт на ключ. Проверяем РЕАЛЬНЫЙ размер упакованного значения после каждой обрезки и урезаем поля пошагово.
    try {
        const LIMIT = 3800;
        const pack = () => packForVK(snapshot);
        let packed = pack();
         packed.length > LIMIT && (delete snapshot.mistakesThisPuzzle, packed = pack());
        packed.length > LIMIT && (delete snapshot.hintsUsed,          packed = pack());
        packed.length > LIMIT && (delete snapshot.elapsedSec,         packed = pack());
        if (packed.length > LIMIT) {
            console.warn('⚠️ Снапшот превышает лимит VK даже после урезания');
            return null;
        }
    } catch (e) {
        console.warn('captureLastPuzzleSnapshot pack error:', e);
    }

    return snapshot;
}

function puzzleFromSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return null;
    if (!snapshot.rows || !snapshot.cols) return null;
    if (typeof snapshot.words !== 'string' || !snapshot.words) return null;

    const rows = snapshot.rows | 0;
    const cols = snapshot.cols | 0;
    if (rows <= 0 || cols <= 0 || rows > 100 || cols > 100) return null;

    const idx = buildAnswerIndex();

    const grid = [];
    for (let r = 0; r < rows; r++) {
        const row = new Array(cols);
        for (let c = 0; c < cols; c++) row[c] = null;
        grid.push(row);
    }

    const words = [];
    const rawWords = snapshot.words.split(';');

    for (let i = 0; i < rawWords.length; i++) {
        const raw = rawWords[i];
        if (!raw) continue;
        const parts = raw.split(',');
        if (parts.length < 4) continue;

        const answer = parts[0];
        const row = parseInt(parts[1], 10);
        const col = parseInt(parts[2], 10);
        const dir = parts[3];
        const number = parts[4] ? parseInt(parts[4], 10) : 0;

        if (!answer || (dir !== 'h' && dir !== 'v')) continue;
        if (isNaN(row) || isNaN(col)) continue;
        if (row < 0 || col < 0 || row >= rows || col >= cols) continue;

        const dr = dir === 'v' ? 1 : 0;
        const dc = dir === 'h' ? 1 : 0;
        const endR = row + (answer.length - 1) * dr;
        const endC = col + (answer.length - 1) * dc;
        if (endR < 0 || endR >= rows || endC < 0 || endC >= cols) continue;

        for (let j = 0; j < answer.length; j++) {
            grid[row + j * dr][col + j * dc] = answer[j];
        }

        words.push({
            answer: answer,
            clue: idx[answer] || '—',   
            row: row,
            col: col,
            dir: dir,
            number: number
        });
    }

    if (!words.length) return null;
    return { grid: grid, words: words, rows: rows, cols: cols };
}

function clearLastPuzzle() {
    state.lastSavedPuzzle = null;
    try { localStorage.removeItem(K.LAST_PUZZLE); } catch(e) {}
    if (typeof vkBridge !== 'undefined') {
        __vkLastSaved[VK_KEYS.LAST_PUZZLE] = null;  
        vkSave(VK_KEYS.LAST_PUZZLE, '');
    }
}

function isSavedPuzzleValid(saved) {
    if (!saved || typeof saved !== 'object') return false;
    if (!saved.savedAt) return false;
    if (!saved.userGrid || typeof saved.userGrid !== 'object') return false;
    if (Object.keys(saved.userGrid).length === 0) return false;
    if (saved.mode === 'daily' || saved.isDaily) {
        return saved.date === todayStr();
    }
    return true;
}

function continueLastPuzzle() {
    if (state._startingGame) return;
    const saved = state.lastSavedPuzzle;
    if (!isSavedPuzzleValid(saved)) {
        toast('Сохранённый кроссворд недоступен', true);
        clearLastPuzzle();
        updateMenuStats();
        return;
    }
    if (saved.mode === 'category' && saved.category && !isCategoryUnlocked(saved.category)) {
        toast('Категория больше не открыта', true);
        clearLastPuzzle();
        updateMenuStats();
        return;
    }

    state._startingGame = true;

    try {
        let meta = null;
        const restored = puzzleFromSnapshot(saved);
        if (restored) {
            meta = {
                id: 'restored_' + (saved.savedAt || Date.now()),
                puzzle: restored,
                theme: saved.theme || 'Кроссворд',
                icon: saved.icon || '🧩',
                category: saved.category || null,
                difficulty: saved.difficulty || null,
                isDaily: !!saved.isDaily,
                mode: saved.mode || (saved.isDaily ? 'daily' : 'category'),
                seed: (typeof saved.seed === 'number') ? saved.seed : 0
            };
        } else {
            if (!window.CROSSWORD_DB) {
                toast('База кроссвордов не загрузилась', true);
                state._startingGame = false;
                return;
            }
            const mode = saved.mode === 'daily' ? 'daily' : 'category';
            const opts = {};
            if (typeof saved.seed === 'number') opts.seed = saved.seed;
            if (saved.category) opts.category = saved.category;
            if (saved.difficulty) opts.difficulty = saved.difficulty;
            try {
                meta = pickPuzzle(mode, Object.assign({}, opts, { maxMs: 12000 }));
            } catch (e) {
                console.error('pickPuzzle restore error:', e);
            }
            if (!meta || !meta.puzzle || !meta.puzzle.words || !meta.puzzle.words.length) {
                toast('Не удалось восстановить кроссворд', true);
                clearLastPuzzle();
                updateMenuStats();
                state._startingGame = false;
                return;
            }
        }

        if (state.timer) { clearInterval(state.timer); state.timer = null; }
        state.currentPuzzle = meta.puzzle;
        state.currentPuzzleMeta = meta;
        state.userGrid = (saved.userGrid && typeof saved.userGrid === 'object')
            ? Object.assign({}, saved.userGrid)
            : {};
        state.cells = [];
        state._highlightedCells = [];
        state._lastClueKey = null;
        state.selected = null;
        state.solvedFlag = false;
        state.hintsUsed = saved.hintsUsed || 0;
        state.mistakesThisPuzzle = saved.mistakesThisPuzzle || 0;
        state.startTime = Date.now() - (saved.elapsedSec || 0) * 1000;
        state.puzzleToken++;

        const titleEl = $('gameTitle');
        if (titleEl) titleEl.textContent = (meta.icon ? meta.icon + ' ' : '') + (meta.theme || 'Кроссворд');

        renderGrid(meta.puzzle);
        renderKeyboard();

        for (const key in state.userGrid) {
            const parts = key.split(',');
            const r = parseInt(parts[0], 10);
            const c = parseInt(parts[1], 10);
            const rowArr = state.cells[r];
            const cell = rowArr && rowArr[c];
            if (!cell) {
                delete state.userGrid[key];
                continue;
            }
            const letterEl = cell.querySelector('.cell-letter');
            if (letterEl) letterEl.textContent = state.userGrid[key];
        }

        for (const w of meta.puzzle.words) {
            checkWord(w, true, true);
        }
           try { checkSolved(); } catch (e) { console.warn('checkSolved on restore:', e); }

        showScreen('game');

        state.timer = setInterval(function () {
            const s = Math.floor((Date.now() - state.startTime) / 1000);
            const el = $('timerVal');
            if (el) el.textContent = fmtTime(s);
        }, 1000);
        const tv = $('timerVal');
        if (tv) tv.textContent = fmtTime(saved.elapsedSec || 0);

        highlightSelection();
        const cp = $('cluePanel');
        if (cp) cp.innerHTML = '<span class="clue-placeholder">Нажмите на клетку, чтобы увидеть вопрос</span>';
        const gw = $('gridWrapper');
        if (gw) { gw.scrollLeft = 0; gw.scrollTop = 0; }
        requestAnimationFrame(fitGridToWrapper);
        toast('▶️ Продолжаем кроссворд');
    } catch (e) {
        console.error('continueLastPuzzle error:', e);
        toast('Ошибка восстановления кроссворда', true);
    } finally {
        state._startingGame = false;
    }
}

function renderGrid(puzzle) {
    const wrap = $('grid');
    if (!wrap) return;
    wrap.innerHTML = '';
    const { grid, rows, cols, words } = puzzle;
    wrap.style.setProperty('--cols', String(cols));
    wrap.style.setProperty('--rows', String(rows));
    const numberMap = new Map();
    for (const w of words) numberMap.set(w.row + ',' + w.col, w.number);
    const cells = [];
    const frag = document.createDocumentFragment();
    for (let r = 0; r < rows; r++) {
        cells[r] = [];
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            const filled = grid[r][c];
            if (filled) {
                cell.className = 'cell';
                const num = numberMap.get(r + ',' + c);
                if (num) {
                    const n = document.createElement('span');
                    n.className = 'cell-num';
                    n.textContent = num;
                    cell.appendChild(n);
                }
                const letter = document.createElement('span');
                letter.className = 'cell-letter';
                cell.appendChild(letter);
                cell.dataset.row = r;
                cell.dataset.col = c;
            } else {
                cell.className = 'cell cell-empty';
            }
            frag.appendChild(cell);
            cells[r][c] = cell;
        }
    }
    wrap.appendChild(frag);
    state.cells = cells;
    state._highlightedCells = [];
    requestAnimationFrame(fitGridToWrapper);
}

function renderKeyboard() {
    const kb = $('keyboard');
    if (!kb) return;
    if (kb.dataset.rendered === '1') return;
    try {
        kb.innerHTML = '';
        const rows = [
            ['Й','Ц','У','К','Е','Н','Г','Ш','Щ','З','Х','Ъ'],
            ['Ф','Ы','В','А','П','Р','О','Л','Д','Ж','Э'],
            ['⌫','Я','Ч','С','М','И','Т','Ь','Б','Ю','Ё']
        ];
        for (const row of rows) {
            const r = document.createElement('div');
            r.className = 'kb-row';
            for (const letter of row) {
                const b = document.createElement('button');
                b.className = 'kb-key' + (letter === '⌫' ? ' kb-key-w' : '');
                b.textContent = letter;
                b.dataset.letter = letter;
                r.appendChild(b);
            }
            kb.appendChild(r);
        }
        kb.dataset.rendered = '1';
    } catch (err) {
        console.error('renderKeyboard error:', err);
    }
}

// ====== ВВОД ======
function onCellClick(r, c) {
    if (state.solvedFlag) return;
    if (!state.currentPuzzle) return;
    const { grid } = state.currentPuzzle;
    if (!grid[r] || !grid[r][c]) return;

    const words = state.currentPuzzle.words;
    let dir = state.selected && state.selected.dir === 'h' ? 'h' : 'v';
    if (state.selected && state.selected.row === r && state.selected.col === c) {
        dir = dir === 'h' ? 'v' : 'h';
    }
    const has = (d) => words.some(w => {
        if (w.dir !== d) return false;
        const dr = w.dir === 'v' ? 1 : 0;
        const dc = w.dir === 'h' ? 1 : 0;
        for (let i = 0; i < w.answer.length; i++) {
            if (w.row + i * dr === r && w.col + i * dc === c) return true;
        }
        return false;
    });
    if (!has(dir)) dir = dir === 'h' ? 'v' : 'h';
    state.selected = { row: r, col: c, dir };
    highlightSelection();
    sound.click();
    showCluePanel();
}

function findWord(r, c, dir) {
    const words = state.currentPuzzle.words;
    for (const w of words) {
        if (w.dir !== dir) continue;
        const dr = w.dir === 'v' ? 1 : 0;
        const dc = w.dir === 'h' ? 1 : 0;
        for (let i = 0; i < w.answer.length; i++) {
            if (w.row + i*dr === r && w.col + i*dc === c) return { word: w, offset: i };
        }
    }
    return null;
}

function highlightSelection() {
    if (state._highlightedCells && state._highlightedCells.length) {
        for (const cell of state._highlightedCells) {
            if (cell) cell.classList.remove('selected', 'in-word');
        }
    }
    state._highlightedCells = [];
    if (!state.selected || !state.currentPuzzle) return;
    const { row, col, dir } = state.selected;
    const found = findWord(row, col, dir);
    if (!found) return;
    const w = found.word;
    const dr = w.dir === 'v' ? 1 : 0;
    const dc = w.dir === 'h' ? 1 : 0;
    const list = [];
    for (let i = 0; i < w.answer.length; i++) {
        const rr = w.row + i * dr;
        const cc = w.col + i * dc;
        const rowArr = state.cells[rr];
        const cell = rowArr && rowArr[cc];
        if (cell) {
            cell.classList.add('in-word');
            list.push(cell);
        }
    }
    const selRow = state.cells[row];
    const sel = selRow && selRow[col];
    if (sel) {
        sel.classList.add('selected');
        if (list.indexOf(sel) === -1) list.push(sel);
    }
    state._highlightedCells = list;
        if (sel) {
        const wrapper = $('gridWrapper');
        if (wrapper) {
            const wrapRect = wrapper.getBoundingClientRect();
            const cellRect = sel.getBoundingClientRect();
            const pad = 24;
            if (cellRect.top < wrapRect.top + pad) {
                wrapper.scrollTop -= (wrapRect.top + pad - cellRect.top);
            } else if (cellRect.bottom > wrapRect.bottom - pad) {
                wrapper.scrollTop += (cellRect.bottom - (wrapRect.bottom - pad));
            }
            if (cellRect.left < wrapRect.left + pad) {
                wrapper.scrollLeft -= (wrapRect.left + pad - cellRect.left);
            } else if (cellRect.right > wrapRect.right - pad) {
                wrapper.scrollLeft += (cellRect.right - (wrapRect.right - pad));
            }
        }
    }
}

function showCluePanel() {
    if (!state.selected || !state.currentPuzzle) return;
    const { row, col, dir } = state.selected;
    const found = findWord(row, col, dir);
    if (!found) return;
    const w = found.word;
    const clueKey = w.number + '_' + w.dir;
    if (state._lastClueKey === clueKey) return;
    state._lastClueKey = clueKey;
    const panel = $('cluePanel');
    if (!panel) return;
    panel.innerHTML =
        '<span class="clue-mark">' +
            '<span class="clue-num">' + w.number + '</span>' +
            '<span class="clue-dir">' + (w.dir === 'h' ? '→' : '↓') + '</span>' +
        '</span>' +
        '<span class="clue-text">' + escapeHtml(w.clue) + '</span>';
}

function onLetter(letter) {
    if (state.solvedFlag) return;
    if (!state.selected || !state.currentPuzzle) return;
    if (letter === 'Ё') letter = 'Е';
    const { row, col, dir } = state.selected;
    const found = findWord(row, col, dir);
    if (!found) return;
    const w = found.word;
    const dr = w.dir === 'v' ? 1 : 0;
    const dc = w.dir === 'h' ? 1 : 0;
    const rr = w.row + found.offset * dr;
    const cc = w.col + found.offset * dc;
    const rowArr = state.cells[rr];
    const cell = rowArr && rowArr[cc];
    if (!cell) return;
    const letterEl = cell.querySelector('.cell-letter');
    if (!letterEl) return;
    const key = rr + ',' + cc;
    const alreadyCorrect = state.userGrid && state.userGrid[key] === w.answer[found.offset];
    if (alreadyCorrect) {
        moveToNext(rr, cc, dr, dc, w);
        return;
    }
    if (!state.userGrid) state.userGrid = {};
    state.userGrid[key] = letter;
    letterEl.textContent = letter;
    cell.classList.remove('correct', 'wrong');
    sound.letter();
    checkWord(w);
    moveToNext(rr, cc, dr, dc, w);
    saveAll();
}

function moveToNext(r, c, dr, dc, w) {
    if (state.solvedFlag) return;
    if (!state.cells) return;
    const nr = r + dr;
    const nc = c + dc;
    const idxInWord = (nr - w.row) * dr + (nc - w.col) * dc;
    const insideWord = idxInWord >= 0 && idxInWord < w.answer.length;
    const nrRow = state.cells[nr];
    const nCell = nrRow && nrRow[nc];

    if (insideWord && nCell && !nCell.classList.contains('cell-empty')) {
        state.selected = { row: nr, col: nc, dir: state.selected.dir };
    } else {
        let first = null;
        for (let i = 0; i < w.answer.length; i++) {
            const rr = w.row + i * dr;
            const cc = w.col + i * dc;
            const key = rr + ',' + cc;
            if (!state.userGrid || !state.userGrid[key]) {
                first = { row: rr, col: cc };
                break;
            }
        }
        if (first) state.selected = { row: first.row, col: first.col, dir: state.selected.dir };
    }
    highlightSelection();
    showCluePanel();
}

function onBackspace() {
    if (state.solvedFlag) return;
    if (!state.selected || !state.currentPuzzle) return;
    const { row, col, dir } = state.selected;
    const found = findWord(row, col, dir);
    if (!found) return;
    const w = found.word;
    const dr = w.dir === 'v' ? 1 : 0;
    const dc = w.dir === 'h' ? 1 : 0;
    const key = row + ',' + col;
    let target = { row, col };
    if (!state.userGrid || !state.userGrid[key]) {
        const prevR = row - dr;
        const prevC = col - dc;
        const prevRow = state.cells[prevR];
        const prevCell = prevRow && prevRow[prevC];
        if (prevCell && !prevCell.classList.contains('cell-empty')) {
            target = { row: prevR, col: prevC };
        }
    }
    const targetRow = state.cells[target.row];
    const cell = targetRow && targetRow[target.col];
    if (!cell) return;
    const letterEl = cell.querySelector('.cell-letter');
    if (letterEl) letterEl.textContent = '';
    if (state.userGrid) delete state.userGrid[target.row + ',' + target.col];
    state.selected = { row: target.row, col: target.col, dir: state.selected.dir };
    checkWord(w);
    try {
        const perpDir = w.dir === 'h' ? 'v' : 'h';
        const perp = findWord(target.row, target.col, perpDir);
        if (perp && perp.word !== w) checkWord(perp.word);
    } catch (e) {}

    highlightSelection();
    showCluePanel();
    sound.click();
    saveAll();
}

function checkWord(w, silent, skipSolvedCheck) {
    if (!w || !state.cells) return;
    const dr = w.dir === 'v' ? 1 : 0;
    const dc = w.dir === 'h' ? 1 : 0;
    let filled = 0, correct = 0;
    for (let i = 0; i < w.answer.length; i++) {
        const rr = w.row + i * dr, cc = w.col + i * dc;
        const key = rr + ',' + cc;
        const val = state.userGrid ? state.userGrid[key] : null;
        const rowArr = state.cells[rr];
        const cell = rowArr && rowArr[cc];
        if (!cell) continue;
        cell.classList.remove('correct', 'wrong');
        if (val) {
            filled++;
            if (val === w.answer[i]) correct++;
        }
    }
    if (filled !== w.answer.length) return;
    if (correct === w.answer.length) {
        for (let i = 0; i < w.answer.length; i++) {
            const rr = w.row + i * dr, cc = w.col + i * dc;
            const rowArr = state.cells[rr];
            const cell = rowArr && rowArr[cc];
            if (cell) cell.classList.add('correct');
        }
        if (!silent) sound.correct();
        if (!skipSolvedCheck) checkSolved();
        return;
    }
if (!silent) {
    state.mistakesThisPuzzle = 1; 
    sound.wrong();
}
    for (let i = 0; i < w.answer.length; i++) {
        const rr = w.row + i * dr, cc = w.col + i * dc;
        const key = rr + ',' + cc;
        const rowArr = state.cells[rr];
        const cell = rowArr && rowArr[cc];
        const val = state.userGrid ? state.userGrid[key] : null;
        if (cell && val && val !== w.answer[i]) cell.classList.add('wrong');
    }
}

function checkSolved() {
    if (!state.currentPuzzle) return;
    const words = state.currentPuzzle.words;
    for (const w of words) {
        const dr = w.dir === 'v' ? 1 : 0;
        const dc = w.dir === 'h' ? 1 : 0;
        for (let i = 0; i < w.answer.length; i++) {
            const rr = w.row + i * dr, cc = w.col + i * dc;
            const key = rr + ',' + cc;
            const val = state.userGrid ? state.userGrid[key] : null;
            if (val !== w.answer[i]) return;
        }
    }
    onPuzzleSolved();
}

function onPuzzleSolved() {
    if (state.solvedFlag) return;
    if (!state.currentPuzzle) return;
    state.solvedFlag = true;

    let elapsed = 0;
    try {
        clearLastPuzzle();
        if (state.timer) { clearInterval(state.timer); state.timer = null; }
        elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const isDaily = state.currentPuzzleMeta && state.currentPuzzleMeta.isDaily;

        const isWeak = document.documentElement.classList.contains('weak-device');
        const isMobile = window.innerWidth < 768;
        let confettiCount = 25;
        if (isWeak) confettiCount = 4;
        else if (isMobile) confettiCount = 12;
        launchConfetti(confettiCount);

        sound.win();

        if (!isDaily) {
            state.score += 1;
            const cat = state.currentPuzzleMeta && state.currentPuzzleMeta.category;
            if (cat) state.solvedThemes[cat] = true;
        } else {
            const today = todayStr();
            if (!(state.daily && state.daily.date === today)) {
                state.daily = { date: today, timeSec: elapsed };
                state.score += 1;
            }
        }
        if (state.mistakesThisPuzzle === 0) {
            state.noMistakeStreak = (state.noMistakeStreak || 0) + 1;
        } else {
            state.noMistakeStreak = 0;
        }
        try { checkAchievementsOnSolve(elapsed, isDaily); } catch (e) { console.warn('ach error:', e); }
        try { saveAll(true); } catch (e) { console.warn('save error:', e); }
        try { updateMenuStats(); } catch (e) {}
       // try { safe(syncLeaderboard, 'syncLeaderboard')(); } catch (e) {}
    } catch (e) {
        console.error('onPuzzleSolved error:', e);
    }

    const token = state.puzzleToken;
    setTimeout(() => {
        if (token !== state.puzzleToken) return;
        if (!state.solvedFlag) return;
        const gs = $('gameScreen');
        if (!gs || gs.style.display === 'none') return;
        try { showWinModal(elapsed); } catch (e) { console.warn('win modal error:', e); }
    }, 600);
}

function showWinModal(elapsed) {
    const isDaily = state.currentPuzzleMeta && state.currentPuzzleMeta.isDaily;
    const wt = $('winTitle'), wtime = $('winTime'), wscore = $('winScore'), wm = $('winModal');
    if (!wt || !wtime || !wscore || !wm) return;

    wt.textContent = isDaily ? '☀️ Кроссворд дня решён!' : '🎉 Отлично!';
    wtime.innerHTML = `⏱️ Время: <b>${fmtTime(elapsed)}</b>`;
    wscore.innerHTML = isDaily
        ? `☀️ Результат дня!`
        : `⭐ +1 к прогрессу (всего решено: <b>${state.score}</b>)`;

    wm.classList.add('show');
}

function useHint() {
    if (!state.currentPuzzle) { toast('Откройте кроссворд'); return; }
    if (state.solvedFlag) { toast('Кроссворд уже решён'); return; }
    if (!state.selected) { toast('Выберите слово'); return; }
    const btn = $('hintAdConfirm');
    if (btn) { btn.disabled = false; btn.textContent = '🎁 Открыть букву'; }
    openModal('hintAdModal');
}
function closeHintAd() { closeModal('hintAdModal'); }
function applyHint() {
    if (!state.currentPuzzle || state.solvedFlag) {
        closeModal('hintAdModal');
        return;
    }
    const btn = $('hintAdConfirm');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Загрузка рекламы…'; }

    const token = state.puzzleToken;
    showRewardedAd().then(ok => {
        if (btn) { btn.disabled = false; btn.textContent = '🎁 Открыть букву'; }
        const modal = $('hintAdModal');
        if (modal && modal.classList.contains('show')) closeModal('hintAdModal');
        if (token !== state.puzzleToken) return;
        if (!state.currentPuzzle || state.solvedFlag) return;
        if (!ok) {
            toast('Реклама недоступна. Попробуйте позже', true);
            return;
        }
        const revealed = revealLetter();
        if (revealed) toast('💡 Буква открыта!');
    });
}

function revealLetter() {
    if (!state.selected) return false;
    const { row, col, dir } = state.selected;
    const found = findWord(row, col, dir);
    if (!found) return false;
    const w = found.word;
    const dr = w.dir === 'v' ? 1 : 0;
    const dc = w.dir === 'h' ? 1 : 0;

    let target = null;
    for (let i = 0; i < w.answer.length; i++) {
        const rr = w.row + i * dr, cc = w.col + i * dc;
        const key = rr + ',' + cc;
        const val = state.userGrid ? state.userGrid[key] : null;
        if (val !== w.answer[i]) { target = { row: rr, col: cc, letter: w.answer[i] }; break; }
    }
    if (!target) { toast('Слово уже собрано'); return false; }

    if (!state.userGrid) state.userGrid = {};
    state.userGrid[target.row + ',' + target.col] = target.letter;
    const cell = state.cells[target.row] && state.cells[target.row][target.col];
    if (cell) {
        const letterEl = cell.querySelector('.cell-letter');
        if (letterEl) letterEl.textContent = target.letter;
        cell.classList.remove('wrong');
    }
    state.hintsUsed = (state.hintsUsed || 0) + 1;
    if (state.hintsUsed >= 5) { try { unlockAch('hint5'); } catch (e) { console.warn('ach hint5:', e); }
    }
    sound.hint();
    checkWord(w);
    saveAll();
    return true;
}

// ====== ТОСТ ======
let toastTimer = null;
function toast(msg, isErr = false) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = isErr ? 'var(--danger, #ef4444)' : 'var(--toast-bg, #1f2937)';
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}


function updateMenuStats() {
    const s = $('menuScore');
    if (s) s.textContent = state.score;

    const continueBtn = $('continueBtn');
    if (continueBtn) {
        const saved = state.lastSavedPuzzle;
        if (isSavedPuzzleValid(saved)) {
            continueBtn.style.display = 'flex';
            const icon = saved.icon || '🧩';
            const theme = saved.theme || 'Кроссворд';
            continueBtn.textContent = '▶️ Продолжить: ' + theme;
        } else {
            continueBtn.style.display = 'none';
        }
    }

    const badge = $('dailyBadge');
    if (!badge) return;
    const today = todayStr();
    if (state.daily && state.daily.date === today) {
        badge.classList.add('daily-badge--done');
        badge.innerHTML = `
            <div class="daily-badge__icon">🏆</div>
            <div class="daily-badge__info">
                <div class="daily-badge__title">Кроссворд дня пройден!</div>
                <div class="daily-badge__time">Время: ${fmtTime(state.daily.timeSec || 0)}</div>
            </div>
        `;
    } else {
        badge.classList.remove('daily-badge--done');
        badge.innerHTML = `
            <div class="daily-badge__icon">☀️</div>
            <div class="daily-badge__info">
                <div class="daily-badge__title">Кроссворд дня</div>
                <div class="daily-badge__sub">Ещё не пройден — реши и покажи рекорд!</div>
            </div>
        `;
    }
}
// ====== ПОКАЗ ЭКРАНОВ ======
function isWideLayout() {
    return window.matchMedia(
        '(min-width: 900px), (orientation: landscape)'
    ).matches;
}

function showScreen(name) {
    const m = $('menuScreen'), g = $('gameScreen');
    if (m) m.style.display = name === 'menu' ? 'flex' : 'none';
    if (g) {
        if (name === 'game') {
            g.style.display = isWideLayout() ? 'grid' : 'flex';
        } else {
            g.style.display = 'none';
        }
    }
}

function fitGridToWrapper() {
    try {
        const wrapper = $('gridWrapper');
        const grid = $('grid');
        if (!wrapper || !grid) return;
        const cols = parseInt(grid.style.getPropertyValue('--cols'), 10);
        const rows = parseInt(grid.style.getPropertyValue('--rows'), 10);
        if (!cols || !rows) return;
        if (!isWideLayout()) {
            grid.style.removeProperty('--cell-size');
            return;
        }
        const padding = 24;
        const gap = 2;
        const wrapW = wrapper.clientWidth - padding;
        const wrapH = wrapper.clientHeight - padding;
        if (wrapW <= 0 || wrapH <= 0) return;
        const byW = (wrapW - (cols - 1) * gap) / cols;
        const byH = (wrapH - (rows - 1) * gap) / rows;
        const size = Math.max(20, Math.min(48, Math.floor(Math.min(byW, byH))));
        grid.style.setProperty('--cell-size', size + 'px');
    } catch (e) {
        console.warn('fitGridToWrapper error:', e);
    }
}

let __resizeTimer = null;
window.addEventListener('resize', function () {
    if (__resizeTimer) clearTimeout(__resizeTimer);
    __resizeTimer = setTimeout(function () {
        const g = $('gameScreen');
        if (!g || g.style.display === 'none') return;
        g.style.display = isWideLayout() ? 'grid' : 'flex';
        fitGridToWrapper();
    }, 150);
});
window.addEventListener('orientationchange', () => {
    setTimeout(fitGridToWrapper, 150);
});

function startGame(mode, opts) {
    if (state._startingGame) return;
    state._startingGame = true;
    opts = opts || {};
    if (!window.CROSSWORD_DB) {
        state._startingGame = false;
        toast('База кроссвордов не загрузилась', true);
        return;
    }
    if (mode === 'category' && opts.category && !isCategoryUnlocked(opts.category)) {
        state._startingGame = false;
        openCatUnlockModal(opts.category);
        return;
    }
    toast('🧩 Собираем кроссворд…');
    const genToastTimer = setInterval(() => toast('🧩 Собираем кроссворд…'), 2000);
    let finished = false;
    function finish(meta) {
        if (finished) return;              
        finished = true;
        clearInterval(genToastTimer);
        try {
            if (!meta || !meta.puzzle || !meta.puzzle.words || !meta.puzzle.words.length) {
                toast('Не удалось собрать кроссворд, попробуйте ещё раз', true);
                return;
            }
            if (state.timer) { clearInterval(state.timer); state.timer = null; }
            state.currentPuzzle = meta.puzzle;
            state.currentPuzzleMeta = meta;
            state.userGrid = {};
            state.cells = [];
            state._highlightedCells = [];
            state._lastClueKey = null;
            state.selected = null;
            state.solvedFlag = false;
            state.hintsUsed = 0;
            state.mistakesThisPuzzle = 0;
            state.startTime = Date.now();
            state.puzzleToken++;
            const titleEl = $('gameTitle');
            if (titleEl) titleEl.textContent = (meta.icon ? meta.icon + ' ' : '') + (meta.theme || 'Кроссворд');
            renderGrid(meta.puzzle);
            renderKeyboard();
            showScreen('game');
            state.timer = setInterval(function () {
                const s = Math.floor((Date.now() - state.startTime) / 1000);
                const el = $('timerVal');
                if (el) el.textContent = fmtTime(s);
            }, 1000);
            const tv = $('timerVal');
            if (tv) tv.textContent = '00:00';
            highlightSelection();
            const cp = $('cluePanel');
            if (cp) cp.innerHTML = '<span class="clue-placeholder">Нажмите на клетку, чтобы увидеть вопрос</span>';
            const gw = $('gridWrapper');
            if (gw) { gw.scrollLeft = 0; gw.scrollTop = 0; }
            requestAnimationFrame(fitGridToWrapper);
            saveAll(true);
        } catch (e) {
            console.error('startGame finish error:', e);
            toast('Ошибка запуска кроссворда', true);
        } finally {
            state._startingGame = false;
        }
    }
    setTimeout(() => { if (finished) return;
        console.warn('⚠️ startGame: finish не был вызван за 20с — сброс');
        finished = true;
        clearInterval(genToastTimer);
        state._startingGame = false;
        toast('Не удалось запустить игру. Попробуйте ещё раз', true);
    }, 20000);
    setTimeout(function () { let meta = null;
        try { meta = pickPuzzle(mode, Object.assign({}, opts, { maxMs: 3500 }));
        } catch (e) { console.error('pickPuzzle phase1:', e); }
        if (meta) { finish(meta); return; }
        setTimeout(function () { let meta2 = null;
            try { meta2 = pickPuzzle(mode, Object.assign({}, opts, { maxMs: 12000 }));
            } catch (e) { console.error('pickPuzzle phase2:', e); }
            finish(meta2);
        }, 30);
    }, 0);
}

function exitToMenu() {
    _pendingCatUnlock = null;
    state.puzzleToken++;
    saveAll(true);
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.currentPuzzle = null;
    state.currentPuzzleMeta = null;
    state.userGrid = null;
    state.cells = [];
    state._highlightedCells = [];
    state._lastClueKey = null;
    state.selected = null;
    state.solvedFlag = false;
    showScreen('menu');
    updateMenuStats();
    setTimeout(() => safe(checkAndShowBanner, 'bannerOnMenu')(), 500);
  //  safe(syncLeaderboard, 'syncLeaderboard')();
}

let _achQueue = [];
let _achShowing = false;

function unlockAch(id) {
    if (state.ach[id]) return;
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    state.ach[id] = true;
    saveAll();
    _achQueue.push(a);
    if (!_achShowing) _showNextAch();
}

function _showNextAch() {
    if (!_achQueue.length) { _achShowing = false; return; }
    const el = $('achGetModal');
    if (!el) { _achShowing = false; return; }
    _achShowing = true;
    const a = _achQueue.shift();
    sound.win();
    const iconEl = $('achGetIcon');
    const nameEl = $('achGetName');
    const descEl = $('achGetDesc');
    if (iconEl) iconEl.textContent = a.icon;
    if (nameEl) nameEl.textContent = a.name;
    if (descEl) descEl.textContent = a.desc;
    openModal('achGetModal');
}

function checkAchievementsOnSolve(elapsed, isDaily) {
    if (state.score >= 1)   unlockAch('first');
    if (state.score >= 10)  unlockAch('ten');
    if (state.score >= 50)  unlockAch('fifty');
    if (state.score >= 100) unlockAch('hundred');
    if (isDaily) unlockAch('daily1');
    if (elapsed <= 60) unlockAch('speed');
    if (elapsed <= 30) unlockAch('flash');
    if (state.hintsUsed === 0) unlockAch('nohint');
    if (state.hintsUsed >= 5) unlockAch('hint5');
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) unlockAch('night');
    if (state.noMistakeStreak >= 3) unlockAch('streak3');

    // Путешественник: пройдена хотя бы одна тема каждого вида
    const cats = Object.keys(window.CROSSWORD_DB || {});
    const solvedCount = Object.keys(state.solvedThemes).length;
    if (cats.length && solvedCount >= cats.length) unlockAch('alltheme');
}

// ====== ДРУГИЕ ИГРЫ ======
const VK_GAMES = [
    { href: 'https://vk.com/app54634418', emoji: '💭', name: 'Словарекс' },
    { href: 'https://vk.com/app54636699', emoji: '🍎', name: 'Найди слова' },
    { href: 'https://vk.ru/app51399364',  emoji: '🎯', name: 'Судоку для самых умных' },
    { href: 'https://vk.com/app54620141', emoji: '🧩', name: 'ТЕТРА' },
    { href: 'https://vk.ru/tetrisc',      emoji: '🕹️', name: 'Весёлый тетрис' },
    { href: 'https://vk.com/app54678489', emoji: '🎨', name: 'Раскраска' }
];

const OK_GAMES = [
    { href: 'https://ok.ru/app/512005107616', emoji: '🧩', name: 'ТЕТРА' },
    { href: 'https://ok.ru/app/512005390848', emoji: '🎯', name: 'Судоку для самых умных' },
    { href: 'https://ok.ru/app/512005443175', emoji: '💭', name: 'Словарекс' }
];

function renderOtherGamesList() {
    const list = $('otherGamesList');
    if (!list) return;
    const games = IS_OK ? OK_GAMES : VK_GAMES;
    let html = '';
    for (const g of games) {
        html +=
            '<a href="' + g.href + '" target="_blank" rel="noopener noreferrer" class="other-game-item">' +
                '<span class="other-game-item__emoji">' + g.emoji + '</span>' +
                '<span class="other-game-item__name">' + escapeHtml(g.name) + '</span>' +
                '<span class="other-game-item__arrow">→</span>' +
            '</a>';
    }
    list.innerHTML = html;
}

function openOtherGamesModal() {
    renderOtherGamesList();
    openModal('otherGamesModal');
}

function renderAchievementsList() {
    const grid = $('achGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
        const got = !!state.ach[a.id];
        const el = document.createElement('div');
        el.className = 'ach-item' + (got ? ' ach-item--got' : '');
        el.innerHTML = `
            <div class="ach-item__icon">${got ? a.icon : '🔒'}</div>
            <div class="ach-item__name">${a.name}</div>
            <div class="ach-item__desc">${a.desc}</div>
        `;
        grid.appendChild(el);
    }
}

function vkInit() {
    if (typeof vkBridge === 'undefined') return;
    if (vkInitialized) return;
    try {
        if (!vkUserId && window.__PLATFORM && window.__PLATFORM.userId) {
            vkUserId = window.__PLATFORM.userId;
        }

        let settled = false;
        const settle = (flag) => {
            if (settled) return;
            settled = true;
            vkInitialized = true;
            if (flag) {
                safe(preloadRewardedAd, 'preloadRewardedAd')();
              // safe(syncLeaderboard, 'syncAfterInit')();
            }
        };

        setTimeout(() => settle(false), 5000);

        vkBridge.send('VKWebAppInit', {})
            .then(() => {
                console.log('✅ VK Bridge инициализирован');
                settle(true);
            })
            .catch(() => settle(false));
        if (window.getVKUserId) { window.getVKUserId().then(id => {
                if (id) { vkUserId = id; console.log('👤 vkUserId установлен:', vkUserId);  }
            }).catch(() => {});
        }
vkBridge.subscribe(e => { try { const t = e.detail.type;
 if (t === 'VKWebAppViewHide') saveOnHide();
if (t === 'VKWebAppViewRestore') { scheduleBannerCheck();}
    } catch (_) {}}); } catch (e) {}
}

// ====== РЕКЛАМА: БАННЕР (VK + OK — одинаково) ======
let __bannerAttempts = 0;
const __BANNER_MAX_ATTEMPTS = 5;              
const __BANNER_RETRY_DELAY = 10 * 1000;       
const __BANNER_LONG_DELAY  = 5 * 60 * 1000;  
let __bannerBusy = false;
let __bannerRetryTimer = null;

function cancelBannerRetry() {__bannerRetryTimer&&(clearTimeout(__bannerRetryTimer),__bannerRetryTimer=null);}

function scheduleBannerRetry() {
    if (__bannerRetryTimer) return;
    let delay;
    if (__bannerAttempts >= __BANNER_MAX_ATTEMPTS) {
        __bannerAttempts = 0;
        delay = __BANNER_LONG_DELAY;
        console.log('📺 Баннер: 5 попыток исчерпано, ждём 5 минут');
    } else {
        __bannerAttempts++;
        delay = __BANNER_RETRY_DELAY;
        console.log('📺 Баннер: повторная попытка', __bannerAttempts, 'из', __BANNER_MAX_ATTEMPTS);
    }
    __bannerRetryTimer = setTimeout(() => {
        __bannerRetryTimer = null;
        if (__bannerBusy) return;
        __bannerBusy = true;
        _showBannerInternal();
    }, delay);
}

function _showBannerInternal() {
    let done = false;
    const finish = (ok) => { if (done) return; done = true; __bannerBusy = false;
        if (ok) {document.body.classList.add('has-vk-banner');
            cancelBannerRetry();  __bannerAttempts = 0;
        } else {scheduleBannerRetry(); }
    };
    setTimeout(() => finish(false), 10000);
    try { vkBridge.send('VKWebAppShowBannerAd', { banner_location: 'bottom' })
            .then(data => {
                const ok = data && (data.result === true || data.result === 1);
                finish(ok);
            })
            .catch(() => finish(false));
    } catch (e) { finish(false);}
}

// --- Дебаунс для visibilitychange / VK-событий ---
let __lastHiddenSave = 0;
function saveOnHide() {
    const now = Date.now();
    if (now - __lastHiddenSave < 500) return;   
    __lastHiddenSave = now;
    saveAll(true);
}
let __bannerCheckScheduled = false;
function scheduleBannerCheck() {
    if (__bannerCheckScheduled) return;
    __bannerCheckScheduled = true;
    setTimeout(() => {
        __bannerCheckScheduled = false;
        safe(checkAndShowBanner, 'banner')();
    }, 500);
}

function checkAndShowBanner() {
    if (typeof vkBridge === 'undefined') return;
    if (__bannerBusy || __bannerRetryTimer) return;
    __bannerBusy = true;
    let done = false;
    const finish = (hasBanner) => {
        if (done) return;
        done = true;
        if (hasBanner) {
            document.body.classList.add('has-vk-banner');
            __bannerBusy = false;
            __bannerAttempts = 0;
        } else { _showBannerInternal(); }
    };
    setTimeout(() => finish(false), 8000);
    try {  vkBridge.send('VKWebAppCheckBannerAd', {})
            .then(data => finish(!!(data && data.result)))
            .catch(() => finish(false));
    } catch (e) {
        finish(false);
    }
}

// ====== РЕКЛАМА: ЗА ВОЗНАГРАЖДЕНИЕ (VK + OK — одинаково) ======
function preloadRewardedAd() {
    if (typeof vkBridge === 'undefined') return;
    if (!vkInitialized) return;
    let done = false;
    const finish = () => { done = true; };
    setTimeout(finish, 8000);
    try {
        vkBridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
            .then(data => {
                if (done) return;
                done = true;
            })
            .catch(() => { done = true; });
    } catch (e) {}
}

function showRewardedAd() {
    if (typeof vkBridge === 'undefined') return Promise.resolve(false);
    return new Promise(resolve => {
        let done = false;
        const finish = v => { if (!done) { done = true; resolve(v); } };
        setTimeout(() => finish(false), 60000);
        try {
            vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
                .then(data => {
                    const ok = !!(data && (data.result === true || data.result === 1 || data.success === true));
                    if (ok) {
                        setTimeout(safe(preloadRewardedAd, 'preloadRewardedAd'), 500);
                    }
                    finish(ok);
                })
                .catch(() => finish(false));
        } catch (e) {
            finish(false);
        }
    });
}

// ====== VK-СПЕЦИФИЧНЫЕ ДЕЙСТВИЯ ======
function vkShowLeaderboard() {
    if (IS_OK) return;
    if (typeof vkBridge === 'undefined') { toast('Таблица лидеров доступна в ВК'); return; }
    try {
        vkBridge.send('VKWebAppShowLeaderBoardBox', { user_result: state.score })
            .catch(() => toast('Не удалось открыть таблицу'));
    } catch (e) {
        toast('Не удалось открыть таблицу');
    }
}
function vkInvite() {
    if (IS_OK) return;
    if (typeof vkBridge === 'undefined') {
        if (navigator.share) {
            navigator.share({ title: 'Кроссворды', text: 'Играй в кроссворды!', url: location.href }).catch(() => {});
        }
        return;
    }
    try { vkBridge.send('VKWebAppShowInviteBox', {}).catch(() => {}); } catch (e) {}
}

function vkShare() {
    const shareLink = IS_OK
        ? 'https://ok.ru/app/512005642105'
        : 'https://vk.com/app54817252';

    if (typeof vkBridge === 'undefined') {
        if (navigator.share) {
            navigator.share({
                title: 'Кроссворды',
                text: 'Играй в кроссворды!',
                url: shareLink
            }).catch(() => {});
        }
        return;
    }
    try {
        vkBridge.send('VKWebAppShare', { link: shareLink })
            .catch(() => { toast('Не удалось поделиться', true); });
    } catch (e) {}
}
/*
function syncLeaderboard() {
    if (IS_OK) return Promise.resolve();
    if (typeof vkBridge === 'undefined') return Promise.resolve();
    if (!state.score || state.score <= 0) return Promise.resolve();
    if (!vkInitialized) {
        console.log('⏩ VK Bridge ещё не инициализирован, синхронизация отложена');
        return Promise.resolve();
    }

    if (!vkUserId && window.__PLATFORM && window.__PLATFORM.userId) {
        vkUserId = window.__PLATFORM.userId;
    }

    if (!vkUserId && window.getVKUserId) {
        return window.getVKUserId().then(id => {
            if (!id) return;
            vkUserId = id;
            return _doSyncLeaderboard();
        }).catch(() => {});
    }
    if (!vkUserId) {
        console.log('⏩ Нет vkUserId, синхронизация пропущена');
        return Promise.resolve();
    }
    return _doSyncLeaderboard();
}

function _doSyncLeaderboard() {
    const now = Date.now();
    let lastSent = 0, lastSentTs = 0, lastAttempt = 0;
    try {
        lastSent    = parseInt(localStorage.getItem(PREFIX + 'cw_lastSentScore') || '0', 10);
        lastSentTs  = parseInt(localStorage.getItem(PREFIX + 'cw_lastSentTimestamp') || '0', 10);
        lastAttempt = parseInt(localStorage.getItem(PREFIX + 'cw_lastLeaderboardAttempt') || '0', 10);
    } catch (e) {}

    const oneHour = 60 * 60 * 1000;

    let shouldSend = state.score > lastSent;
    if (!shouldSend && lastSentTs && (now - lastSentTs) > oneHour) {
        shouldSend = true;
    }
    if (!shouldSend) return Promise.resolve();

    const cooldown = 30 * 1000;
    if (lastAttempt && (now - lastAttempt) < cooldown) return Promise.resolve();

    try { localStorage.setItem(PREFIX + 'cw_lastLeaderboardAttempt', String(now)); } catch (e) {}

    return new Promise(resolve => {
        let done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };
        setTimeout(finish, 8000);
        try {
            vkBridge.send('VKWebAppCallAPIMethod', {
                method: 'secure.addAppEvent',
                params: {
                    client_secret: LB_CONFIG.clientSecret,
                    user_id: vkUserId,
                    activity_id: LB_CONFIG.activityId,
                    value: state.score,
                    v: LB_CONFIG.apiVersion,
                    access_token: LB_CONFIG.accessToken
                }
            })
            .then(() => {
                try {
                    localStorage.setItem(PREFIX + 'cw_lastSentScore', String(state.score));
                    localStorage.setItem(PREFIX + 'cw_lastSentTimestamp', String(now));
                    localStorage.removeItem(PREFIX + 'cw_lastLeaderboardAttempt');
                } catch (e) {}
                finish();
            })
            .catch(() => finish());
        } catch (e) {
            finish();
        }
    });
}
*/
// ====== МОДАЛКИ ======
let __modalZ = 100;
function openModal(id) {
    const m = $(id);
    if (!m) return;
    __modalZ++;
    m.style.zIndex = String(__modalZ);
    m.classList.add('show');
}

function closeModal(id) {
    const m = $(id);
    if (!m) return;
    m.classList.remove('show');
    m.style.zIndex = '';
    if (__modalZ > 500) __modalZ = 100;
}

// ====== ЗАКРЫТЫЕ КАТЕГОРИИ ======
function isCategoryUnlocked(catKey) {
    if (!catKey) return true; // нет категории — не блокируем
    if (ALWAYS_FREE_CATS.indexOf(catKey) !== -1) return true;
    const until = state.catUnlocks[catKey] || 0;
    return until > Date.now();
}

function openCatUnlockModal(catKey) {
    _pendingCatUnlock = catKey;
    const db = window.CROSSWORD_DB || {};
    const cat = db[catKey];
    const name = (cat && cat.name) || catKey;
    const icon = (cat && cat.icon) || '📚';

    const titleEl = $('catUnlockTitle');
    const textEl = $('catUnlockText');
    if (titleEl) titleEl.textContent = `${icon} ${name}`;
    if (textEl) textEl.innerHTML =
        `Категория «${escapeHtml(name)}» откроется на <b>24 часа</b> за просмотр рекламы.`;
    const btn = $('catUnlockConfirm');
    if (btn) { btn.disabled = false; btn.textContent = '📺 Открыть на 24 часа'; }
    openModal('catUnlockModal');
}

function confirmCatUnlock() {
    const catKey = _pendingCatUnlock;
    if (!catKey) { closeModal('catUnlockModal'); return; }
    const btn = $('catUnlockConfirm');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Загрузка рекламы…'; }
    showRewardedAd().then(ok => {
        if (btn) { btn.disabled = false; btn.textContent = '📺 Открыть на 24 часа'; }
        if (ok) {
            state.catUnlocks[catKey] = Date.now() + CAT_UNLOCK_DURATION;
            saveAll(true);
            sound.win();
            toast('🎉 Категория открыта на 24 часа!');
            renderCategoriesModal();
        } else {
            toast('Реклама недоступна. Попробуйте позже', true);
        }
        if (_pendingCatUnlock === catKey) _pendingCatUnlock = null;
        const modal = $('catUnlockModal');
        if (modal && modal.classList.contains('show')) closeModal('catUnlockModal');
    });
}

// ====== КАТЕГОРИИ ======
function renderCategoriesModal() {
    const grid = $('catGrid');
    if (!grid) return;
    const db = window.CROSSWORD_DB;
    if (!db || !Object.keys(db).length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--text-muted);">Категории не загружены. Проверьте соединение и перезапустите игру.</div>';
        return;
    }
    grid.innerHTML = '';
    for (const key of Object.keys(db)) {
        const c = db[key];
        const unlocked = isCategoryUnlocked(key);
        const el = document.createElement('button');
        el.className = 'cat-item' + (unlocked ? '' : ' cat-item--locked');
        el.innerHTML = `
            <span class="cat-item__icon">${c.icon || '📚'}</span>
            <span class="cat-item__name">${c.name}</span>
            ${unlocked ? '' : '<span class="cat-item__lock">🔒</span>'}
        `;
     bindTap(el, () => {
            if (!unlocked) {
                openCatUnlockModal(key);
                return;
            }
            const dt = $('diffTitle');
            if (dt) dt.textContent = (c.icon || '📚') + ' ' + c.name;
            qsa('#diffModal [data-diff]').forEach(d => d.dataset.cat = key);
            openModal('diffModal');
   });
        grid.appendChild(el);
    }
}

// ====== ФИЗИЧЕСКАЯ КЛАВИАТУРА ======
function moveSel(dr, dc) {
    if (!state.selected) return;
    const r = state.selected.row + dr, c = state.selected.col + dc;
    if (!state.cells[r] || !state.cells[r][c]) return;
    if (state.cells[r][c].classList.contains('cell-empty')) return;
    let dir = state.selected.dir;
    if (!findWord(r, c, dir)) {
        const alt = dir === 'h' ? 'v' : 'h';
        if (findWord(r, c, alt)) dir = alt;
        else return;
    }
    state.selected.row = r;
    state.selected.col = c;
    state.selected.dir = dir;
    highlightSelection();
    showCluePanel();
}

function setupKeyboardInput() {
    document.addEventListener('keydown', (e) => {
         if (e.key === 'Escape') {
            if (_pendingCatUnlock) _pendingCatUnlock = null;
            qsa('.modal-overlay.show').forEach(m => {
                if (m.id === 'achGetModal') {
                    const btn = $('achGetClose');
                    if (btn) btn.click();
                    else closeModal('achGetModal');
                } else {
                    closeModal(m.id);
                }
            });
            return;
        }
        const gs = $('gameScreen');
        if (!gs || gs.style.display === 'none') return;
        if (!state.selected) return;
        if (state.solvedFlag) return;
        const k = (e.key || '').toUpperCase();
        if (/^[А-ЯЁ]$/.test(k)) { e.preventDefault(); onLetter(k === 'Ё' ? 'Е' : k); }
        else if (e.key === 'Backspace') { e.preventDefault(); onBackspace(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); state.selected.dir = 'h'; moveSel(0, 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); state.selected.dir = 'h'; moveSel(0, -1); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); state.selected.dir = 'v'; moveSel(1, 0); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); state.selected.dir = 'v'; moveSel(-1, 0); }
    });
}

// ====== ЗАГРУЗОЧНЫЙ ОВЕРЛЕЙ ======
function setLoadingText(txt) {
    const el = $('loadingText');
    if (el) el.textContent = txt;
}
function hideLoadingOverlay() {
    const el = $('loadingOverlay');
    if (!el) return;
    if (el.classList.contains('loading-overlay--hidden')) return;
    el.classList.add('loading-overlay--hidden');
    setTimeout(() => { el.style.display = 'none'; }, 500);
}

function setupUI() {
    let audioUnlocked = false;
    const unlockAudio = () => {
        if (audioUnlocked) return;
        audioUnlocked = true;
        initAudio();
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    initConfetti();
    renderKeyboard();
       const gridEl = $('grid');
    if (gridEl) {
        bindTap(gridEl, safe(function (e) {
            const el = e.target && e.target.closest ? e.target.closest('.cell') : null;
            if (!el || el.classList.contains('cell-empty')) return;
            const r = parseInt(el.dataset.row, 10);
            const c = parseInt(el.dataset.col, 10);
            if (isNaN(r) || isNaN(c)) return;
            onCellClick(r, c);
        }, 'gridTap'));
    }
    const kbEl = $('keyboard');
    if (kbEl) {
        bindTap(kbEl, safe(function (e) {
            const btn = e.target && e.target.closest ? e.target.closest('.kb-key') : null;
            if (!btn) return;
            const letter = btn.dataset.letter;
            if (letter === '⌫') onBackspace();
            else onLetter(letter);
        }, 'kbTap'));
    }
    const achBtn = $('achGetClose');
    if (achBtn) {
        bindTap(achBtn, safe(function () {
            closeModal('achGetModal');
            setTimeout(_showNextAch, 350);
        }, 'achGetClose'));
    }
    const setClick = (id, fn) => {
        const el = $(id);
        if (el) bindTap(el, safe(fn, id));
    };

    setClick('continueBtn', continueLastPuzzle);
    setClick('playRandomBtn', () => startGame('random'));
    setClick('dailyBtn', () => {
        const today = todayStr();
        if (state.daily && state.daily.date === today) {
            openModal('dailyInfoModal');
            const it = $('dailyInfoText');
            if (it) it.innerHTML = `Вы уже прошли кроссворд дня!<br>Время: <b>${fmtTime(state.daily.timeSec || 0)}</b><br><br>Возвращайтесь завтра за новым! ☀️`;
            return;
        }
        startGame('daily');
    });
    setClick('dailyBadge', () => {
        const btn = $('dailyBtn');
        if (btn) btn.click();
    });
    setClick('categoriesBtn', () => { renderCategoriesModal(); openModal('catModal'); });
    setClick('difficultyBtn', () => {
        qsa('#diffModal [data-diff]').forEach(d => d.dataset.cat = '');
        openModal('diffModal');
    });
    setClick('achBtn', () => { renderAchievementsList(); openModal('achModal'); });
    setClick('themeBtn', () => openModal('themeModal'));
    setClick('soundBtnMenu', toggleSound);
    setClick('soundBtn', toggleSound);
    setClick('otherGamesBtn', openOtherGamesModal);
    setClick('backBtn', () => {
        if (state.solvedFlag) { exitToMenu(); return; }
        openModal('exitModal');
    });
    setClick('hintBtn', useHint);
    setClick('hintAdConfirm', applyHint);
    setClick('hintAdCancel', closeHintAd);
    setClick('winClose', () => { closeModal('winModal'); exitToMenu(); });
    setClick('winShareBtn', vkShare);
    setClick('exitConfirm', () => { closeModal('exitModal'); exitToMenu(); });
    setClick('exitCancel', () => closeModal('exitModal'));
    setClick('achClose', () => closeModal('achModal'));
    setClick('catClose', () => closeModal('catModal'));
    setClick('diffClose', () => closeModal('diffModal'));
    setClick('themeClose', () => closeModal('themeModal'));
    setClick('dailyInfoClose', () => closeModal('dailyInfoModal'));
    setClick('otherGamesClose', () => closeModal('otherGamesModal'));
    setClick('catUnlockConfirm', confirmCatUnlock);
    setClick('catUnlockCancel', () => { _pendingCatUnlock = null; closeModal('catUnlockModal'); });
    setClick('catUnlockClose',  () => { _pendingCatUnlock = null; closeModal('catUnlockModal'); });

    qsa('#diffModal [data-diff]').forEach(el => {
        bindTap(el, safe(() => {
            const cat = el.dataset.cat || '';
            const diff = el.dataset.diff;
            if (cat && !isCategoryUnlocked(cat)) {
                openCatUnlockModal(cat);
                return;
            }
            closeModal('diffModal');
            closeModal('catModal');
            if (cat) startGame('category', { category: cat, difficulty: diff });
            else     startGame('category', { difficulty: diff });
        }, 'diffPick'));
    });

    qsa('.theme-item[data-theme]').forEach(el => {
        bindTap(el, safe(() => { applyTheme(el.dataset.theme); sound.click(); }, 'themePick'));
    });

    qsa('.modal-overlay').forEach(m => {
        if (m.id === 'achGetModal') return;
        bindTap(m, (e) => {
            if (e.target !== m) return;
            if (m.id === 'winModal') {
                closeModal('winModal');
                exitToMenu();
                return;
            }
            if (m.id === 'catUnlockModal') {
                _pendingCatUnlock = null;
            }
            closeModal(m.id);
        });
    });

    setupKeyboardInput();
    window.addEventListener('beforeunload', () => saveAll(true));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveOnHide();
        } else {
           // safe(syncLeaderboard, 'syncLeaderboard')();
            scheduleBannerCheck();
        }
    });
}

// ====== ИНИЦИАЛИЗАЦИЯ ======
function detectWeakDevice() {
    try {
        if (document.documentElement.classList.contains('weak-device')) return;
        const ua = navigator.userAgent || '';
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
        const isIOS = /iPhone|iPad|iPod/i.test(ua);
        const hasDeviceMemory = typeof navigator.deviceMemory === 'number';
        const weakCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
        const lowRAM  = hasDeviceMemory && navigator.deviceMemory <= 4;
        let weak = false;
        if (isMobile) {
            if (weakCPU || lowRAM) weak = true;
            else if (isIOS && !hasDeviceMemory && weakCPU) weak = true;
            else if (/Android [4-7]\./i.test(ua)) weak = true;
        }
        if (weak) document.documentElement.classList.add('weak-device');
    } catch (_) {}
}

async function boot() {
    let hardFallback = null;
    try {
        detectWeakDevice();
        try {
            setupUI();
        } catch (uiErr) {
            console.error('setupUI error:', uiErr);
        }

        const bridgeReady = window.__VK_BRIDGE_READY || Promise.resolve(typeof vkBridge !== 'undefined');
bridgeReady.then(function () {
    if (typeof vkBridge === 'undefined') return;
    vkInit();
    setTimeout(function () { safe(checkAndShowBanner, 'bannerInit')(); }, 800);
}).catch(function () {});

        setLoadingText('Загрузка прогресса…');

        hardFallback = setTimeout(function () {
            console.warn('⏰ Резервный таймаут загрузки — принудительно показываем меню');
            try {
                updateMenuStats();
                showScreen('menu');
                hideLoadingOverlay();
            } catch (_) {}
        }, 10000);

        let timedOut = false;
        const syncTimeout = new Promise(function (resolve) {
            setTimeout(function () { timedOut = true; resolve('timeout'); }, 15000);
        });

        const syncTask = Promise.resolve()
            .then(function () { return loadAll(); })
            .then(function () { return 'ok'; })
            .catch(function (err) { console.warn('⚠️ Sync error:', err); return 'error'; });

        syncTask.then(function () {
            if (!timedOut) return;
            try {
  applyTheme(state.theme || 'peach');
                updateMenuStats();
            } catch (_) {}
        });

        const result = await Promise.race([syncTask, syncTimeout]);
        console.log('🔄 Синхронизация:', result, timedOut ? '(таймаут)' : '');

        _dataLoaded = true;

applyTheme(state.theme || 'peach');

        updateMenuStats();
        if (!state.sound) {
            const b1 = $('soundBtn');     if (b1) b1.textContent = '🔇';
            const b2 = $('soundBtnMenu'); if (b2) b2.textContent = '🔇';
        }

        showScreen('menu');

        setTimeout(function () { hideLoadingOverlay(); }, 250);
        if (hardFallback) clearTimeout(hardFallback);
    } catch (e) {
        console.error('boot error:', e);
        if (hardFallback) clearTimeout(hardFallback);
        try { updateMenuStats(); } catch (_) {}
        try { showScreen('menu'); } catch (_) {}
        try { hideLoadingOverlay(); } catch (_) {}
    }
}
// ====== СТАРТ ======
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}

})();