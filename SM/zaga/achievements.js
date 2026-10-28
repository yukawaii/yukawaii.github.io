// ============================================================
// achievements.js — достижения (Загадки + Пословицы)
// ============================================================
window.Achievements = (function () {
    'use strict';

    // ---------- Данные достижений ----------
    function makeList(solvedWord) {
        return [
            { id: 's1',   icon: '🎯', name: 'Первый шаг',       desc: 'Решить 1 раз',           target: 1,    progress: (s, solved) => solved,        check: (s, solved) => solved >= 1 },
            { id: 's5',   icon: '🎯', name: '5 ' + solvedWord,   desc: 'Решить 5 ' + solvedWord,                    target: 5,    progress: (s, solved) => solved,        check: (s, solved) => solved >= 5 },
            { id: 's10',  icon: '🎯', name: '10 ' + solvedWord,  desc: 'Решить 10 ' + solvedWord,                   target: 10,   progress: (s, solved) => solved,        check: (s, solved) => solved >= 10 },
            { id: 's25',  icon: '🎯', name: '25 ' + solvedWord,  desc: 'Решить 25 ' + solvedWord,                   target: 25,   progress: (s, solved) => solved,        check: (s, solved) => solved >= 25 },
            { id: 's50',  icon: '🎯', name: '50 ' + solvedWord,  desc: 'Решить 50 ' + solvedWord,                   target: 50,   progress: (s, solved) => solved,        check: (s, solved) => solved >= 50 },
            { id: 's100', icon: '🎯', name: '100 ' + solvedWord, desc: 'Решить 100 ' + solvedWord,                  target: 100,  progress: (s, solved) => solved,        check: (s, solved) => solved >= 100 },
            { id: 's200', icon: '🎯', name: '200 ' + solvedWord, desc: 'Решить 200 ' + solvedWord,                  target: 200,  progress: (s, solved) => solved,        check: (s, solved) => solved >= 200 },

            { id: 'cat1', icon: '🌟', name: 'Первая категория',  desc: 'Пройти одну категорию',                    target: 1,    progress: (s) => Object.keys(s.catsComplete).length, check: (s) => Object.keys(s.catsComplete).length >= 1 },
            { id: 'cat2', icon: '🌟', name: '2 категории',       desc: 'Пройти 2 категории',                        target: 2,    progress: (s) => Object.keys(s.catsComplete).length, check: (s) => Object.keys(s.catsComplete).length >= 2 },
            { id: 'cat3', icon: '🌟', name: '3 категории',       desc: 'Пройти 3 категории',                        target: 3,    progress: (s) => Object.keys(s.catsComplete).length, check: (s) => Object.keys(s.catsComplete).length >= 3 },
            { id: 'catAll', icon: '👑', name: 'Все категории',   desc: 'Пройти все категории',                      target: 4,    progress: (s) => Object.keys(s.catsComplete).length, check: (s) => Object.keys(s.catsComplete).length >= 4 },

            { id: 'h1',  icon: '💡', name: 'Первая подсказка',  desc: 'Воспользоваться подсказкой',                target: 1,  progress: (s) => s.hints, check: (s) => s.hints >= 1 },
            { id: 'h10', icon: '💡', name: '10 подсказок',      desc: 'Воспользоваться подсказкой 10 раз',          target: 10, progress: (s) => s.hints, check: (s) => s.hints >= 10 },
            { id: 'h25', icon: '💡', name: '25 подсказок',      desc: 'Воспользоваться подсказкой 25 раз',          target: 25, progress: (s) => s.hints, check: (s) => s.hints >= 25 },
            { id: 'h50', icon: '💡', name: '50 подсказок',      desc: 'Воспользоваться подсказкой 50 раз',          target: 50, progress: (s) => s.hints, check: (s) => s.hints >= 50 },

            { id: 'a1',  icon: '📺', name: 'Первая реклама',    desc: 'Посмотреть рекламу до конца',               target: 1,  progress: (s) => s.ads, check: (s) => s.ads >= 1 },
            { id: 'a10', icon: '📺', name: '10 реклам',         desc: 'Посмотреть 10 реклам',                       target: 10, progress: (s) => s.ads, check: (s) => s.ads >= 10 },
            { id: 'a25', icon: '📺', name: '25 реклам',         desc: 'Посмотреть 25 реклам',                       target: 25, progress: (s) => s.ads, check: (s) => s.ads >= 25 },
            { id: 'a50', icon: '📺', name: '50 реклам',         desc: 'Посмотреть 50 реклам',                       target: 50, progress: (s) => s.ads, check: (s) => s.ads >= 50 },

            { id: 'u1', icon: '🔓', name: 'Открыть категорию',    desc: 'Разблокировать категорию за рекламу',        target: 1, progress: (s) => s.unlocks, check: (s) => s.unlocks >= 1 },
            { id: 'u2', icon: '🔓', name: 'Открыть 2 категории',  desc: 'Разблокировать 2 категории за рекламу',      target: 2, progress: (s) => s.unlocks, check: (s) => s.unlocks >= 2 },

            { id: 't2', icon: '🎨', name: '2 темы',   desc: 'Попробовать 2 темы оформления',    target: 2, progress: (s) => Object.keys(s.themes).length, check: (s) => Object.keys(s.themes).length >= 2 },
            { id: 't4', icon: '🎨', name: 'Все темы', desc: 'Попробовать все темы оформления', target: 4, progress: (s) => Object.keys(s.themes).length, check: (s) => Object.keys(s.themes).length >= 4 },

            { id: 'snd1',  icon: '🔊', name: 'Звук',  desc: 'Переключить звук',          target: 1,  progress: (s) => s.sounds, check: (s) => s.sounds >= 1 },
            { id: 'snd10', icon: '🔇', name: '10 переключений звука', desc: 'Переключить звук 10 раз', target: 10, progress: (s) => s.sounds, check: (s) => s.sounds >= 10 },

            { id: 'p1',  icon: '⚡', name: 'Идеально',    desc: 'Решить без подсказок', target: 1,  progress: (s) => s.perfect, check: (s) => s.perfect >= 1 },
            { id: 'p5',  icon: '⚡', name: '5 идеально',  desc: 'Решить 5 ' + solvedWord + ' без подсказок',  target: 5,  progress: (s) => s.perfect, check: (s) => s.perfect >= 5 },
            { id: 'p25', icon: '⚡', name: '25 идеально', desc: 'Решить 25 ' + solvedWord + ' без подсказок', target: 25, progress: (s) => s.perfect, check: (s) => s.perfect >= 25 },

            { id: 'sh10', icon: '🔄', name: '10 перемешиваний', desc: 'Перемешать 10 раз', target: 10, progress: (s) => s.shuffles, check: (s) => s.shuffles >= 10 },
            { id: 'w10',  icon: '❌', name: '10 ошибок',         desc: 'Ошибиться 10 раз',  target: 10, progress: (s) => s.wrongs,   check: (s) => s.wrongs >= 10 },
            { id: 's500', icon: '💯', name: '500 решённых',      desc: 'Решить 500 ' + solvedWord, target: 500, progress: (s, solved) => solved, check: (s, solved) => solved >= 500 }
        ];
    }

    const CONFIGS = {
        riddles:  { storageKey: 'riddles_achievements_v1',  vkKey: 'ra', list: makeList('загадок') },
        proverbs: { storageKey: 'proverbs_achievements_v1', vkKey: 'pa', list: makeList('пословиц') }
    };

    // ---------- State ----------
    let config = null;
    let state = null;
    let gameStateRef = null;

    function defaultStats() {
        return { hints: 0, ads: 0, unlocks: 0, themes: {}, sounds: 0, wrongs: 0, perfect: 0, catsComplete: {}, shuffles: 0 };
    }

    function load() {
        try {
            const raw = localStorage.getItem(config.storageKey);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && typeof data === 'object') {
                    return {
                        unlocked: Array.isArray(data.unlocked) ? data.unlocked : [],
                        stats: Object.assign(defaultStats(), data.stats || {})
                    };
                }
            }
        } catch (e) {}
        return { unlocked: [], stats: defaultStats() };
    }

    function save() {
        try { localStorage.setItem(config.storageKey, JSON.stringify(state)); } catch (e) {}
    }

    function getSolvedCount() {
        return gameStateRef ? (Math.floor(Number(gameStateRef.totalScore) || 0)) : 0;
    }

    function syncFromGameState() {
        if (!gameStateRef) return;
        // Тема
        if (gameStateRef.theme) state.stats.themes[gameStateRef.theme] = true;
        // Полностью пройденные категории
        try {
            if (typeof RIDDLES !== 'undefined' && gameStateRef.solvedRiddles) {
                for (const catId in RIDDLES) {
                    const list = RIDDLES[catId] || [];
                    if (!list.length) continue;
                    const prefix = catId + '_';
                    const allSolved = list.every(r => gameStateRef.solvedRiddles[prefix + r.id]);
                    if (allSolved) state.stats.catsComplete[catId] = true;
                }
            }
        } catch (e) {}
    }

    function checkAll(silent) {
        const newlyUnlocked = [];
        const solved = getSolvedCount();
        config.list.forEach(ach => {
            if (state.unlocked.indexOf(ach.id) !== -1) return;
            let ok = false;
            try { ok = ach.check(state.stats, solved); } catch (e) {}
            if (ok) {
                state.unlocked.push(ach.id);
                newlyUnlocked.push(ach);
            }
        });
        if (!silent && newlyUnlocked.length) notifyUnlocks(newlyUnlocked);
        return newlyUnlocked;
    }

    function updateStats(event) {
        if (!state || !event) return [];
        const s = state.stats;
        switch (event.type) {
            case 'hint':   s.hints++; break;
            case 'ad':     s.ads++; break;
            case 'unlock': s.unlocks++; break;
            case 'theme':  if (event.theme) s.themes[event.theme] = true; break;
            case 'sound':  s.sounds++; break;
            case 'wrong':  s.wrongs++; break;
            case 'shuffle': s.shuffles++; break;
        }
        if (event.perfect) s.perfect++;
        if (event.categoryComplete) s.catsComplete[event.categoryComplete] = true;

        const newly = checkAll(false);
        save();
        return newly;
    }

    function notifyUnlocks(list) {
        list.forEach((ach, i) => setTimeout(() => showPopup(ach), i * 1200));
    }

    function showPopup(ach) {
        const el = document.createElement('div');
        el.className = 'ach-popup';
        el.innerHTML = '<span class="ach-popup__icon">' + ach.icon + '</span>' +
            '<div><div class="ach-popup__label">Достижение!</div>' +
            '<div class="ach-popup__name">' + ach.name + '</div></div>';
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 400);
        }, 3000);
    }

    function renderModal() {
        const list = document.getElementById('achievementsList');
        if (!list) return;

        const solved = getSolvedCount();
        const unlockedCount = state.unlocked.length;
        const totalCount = config.list.length;

        const header = document.getElementById('achievementsHeader');
        if (header) header.textContent = 'Получено: ' + unlockedCount + ' из ' + totalCount;

        list.innerHTML = config.list.map(ach => {
            const unlocked = state.unlocked.indexOf(ach.id) !== -1;
            let progressHtml = '';
            if (unlocked) {
                progressHtml = '<div class="achievement-card__progress">✓ Получено</div>';
            } else if (ach.progress) {
                let cur = 0;
                try { cur = ach.progress(state.stats, solved); } catch (e) {}
                if (ach.target && cur < ach.target) {
                    progressHtml = '<div class="achievement-card__progress">' + cur + ' / ' + ach.target + '</div>';
                }
            }
            return '<div class="achievement-card ' + (unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked') + '">' +
                '<div class="achievement-card__icon">' + ach.icon + '</div>' +
                '<div class="achievement-card__body">' +
                    '<div class="achievement-card__name">' + ach.name + '</div>' +
                    '<div class="achievement-card__desc">' + ach.desc + '</div>' +
                    progressHtml +
                '</div>' +
                '<div class="achievement-card__check">✓</div>' +
            '</div>';
        }).join('');
    }

    // ---------- API ----------
    function init(type, gameState) {
        if (!CONFIGS[type]) return;
        config = CONFIGS[type];
        gameStateRef = gameState || null;
        state = load();
        syncFromGameState();
        checkAll(true);   // тихо, без попапов, для старых данных
        save();

        // кнопки модалки
        const openBtn  = document.getElementById('menuAchievementsBtn');
        const closeBtn = document.getElementById('achievementsModalClose');
        const okBtn    = document.getElementById('achievementsModalBtn');
        const modal    = document.getElementById('achievementsModal');
        if (openBtn) openBtn.onclick = function () {
            renderModal();
            if (modal) modal.classList.add('show');
        };
        if (closeBtn) closeBtn.onclick = function () { if (modal) modal.classList.remove('show'); };
        if (okBtn)    okBtn.onclick    = function () { if (modal) modal.classList.remove('show'); };
        if (modal) modal.onclick = function (e) { if (e.target === modal) modal.classList.remove('show'); };
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
                modal.classList.remove('show');
            }
        });
    }

    return {
        init: init,
        updateStats: updateStats,
        renderModal: renderModal,
        getUnlocked: function () { return state ? state.unlocked.slice() : []; }
    };
})();