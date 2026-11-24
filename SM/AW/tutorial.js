(function (w, d) {
    'use strict';
    const PREFIX = (w.__PLATFORM && w.__PLATFORM.storagePrefix) || '';
    const TUTORIAL_KEY = PREFIX + 'tutorial_passed_v1';
    const TUTORIAL_LEVEL_ID = 88888;
    const TUTORIAL_QUESTIONS = [
        {
            animalId: '7',
            img: 'mem/img/7.jpg',
            options: [
                { ru: 'Опоссум', en: 'Opossum', tr: 'Opossum' },
                { ru: 'Кенгуру', en: 'Kangaroo', tr: 'Kanguru' },
                { ru: 'Утконос', en: 'Platypus', tr: 'Ornitorenk' },
                { ru: 'Тушканчик', en: 'Jerboa', tr: 'Arap tavşanı' }
            ],
            answer: 1,
            description: {
                ru: 'Кенгуру восточный серый. Хвост служит опорой, когда кенгуру стоит, и помогает балансировать при прыжках.',
                en: 'Eastern grey kangaroo. The tail supports the animal while standing and helps it balance when jumping.',
                tr: 'Doğu gri kanguru. Kuyruk ayakta dururken destek olur ve zıplarken dengede yardımcı olur.'
            }
        },
        {
            animalId: '126',
            img: 'mem/img/126.jpg',
            options: [
                { ru: 'Капибара', en: 'Capybara', tr: 'Kapibara' },
                { ru: 'Панда', en: 'Panda', tr: 'Panda' },
                { ru: 'Росомаха', en: 'Wolverine', tr: 'Kutup porsuğu' },
                { ru: 'Ленивец', en: 'Sloth', tr: 'Tembel hayvan' }
            ],
            answer: 1,
            description: {
                ru: 'Панда большая. Китайское название — «медведь-кошка», хорошо лазает по деревьям.',
                en: 'Giant panda. Its Chinese name is "cat-bear"; it climbs trees well.',
                tr: 'Dev panda. Çince adı "kedi ayısı"dır; ağaçlara iyi tırmanır.'
            }
        }
    ];

    let isActive = false;
    let tutStep = -1;
    let pollTimer = null;
    let stepRetryTimer = null;
    let __posRetryTimer = null;
    let currentImageSrc = '';
    let overlay = null, highlight = null, tooltip = null, tutNextBtn = null, skipBtn = null;

    const TUTORIAL_CLOUD_KEY = 'tutorial_passed_v1';
    let __tutPassedCache = null;

    function hasPassed() {
        try { return localStorage.getItem(TUTORIAL_KEY) === '1'; } catch (e) { return false; }
    }

    async function hasPassedAsync() {
        if (__tutPassedCache !== null) return __tutPassedCache;
        if (hasPassed()) { __tutPassedCache = true; return true; }
        if (w.storageGet) {
            let timeoutId = null;
            try {
                const cloudPromise = w.storageGet(TUTORIAL_CLOUD_KEY);
                const timeoutPromise = new Promise(res => {
                    timeoutId = setTimeout(() => res(null), 4000);
                });
                const v = await Promise.race([cloudPromise, timeoutPromise]);
                if (v === true || v === '1' || v === 1) {
                    try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch (e) {}
                    __tutPassedCache = true;
                    return true;
                }
            } catch (e) {
            } finally {
                if (timeoutId) clearTimeout(timeoutId);
            }
        }
        return false;
    }

    function markPassed() {
        __tutPassedCache = true;
        try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch (e) {}
        if (w.storageSet) { try { w.storageSet(TUTORIAL_CLOUD_KEY, true).catch(function () {}); } catch (e) {} }
    }

    function reset() {
        __tutPassedCache = false;
        try { localStorage.removeItem(TUTORIAL_KEY); } catch (e) {}
        if (w.storageSet) { try { w.storageSet(TUTORIAL_CLOUD_KEY, false).catch(function () {}); } catch (e) {} }
    }

    function destroyOverlay() {
        if (!overlay) return;
        if (skipBtn) skipBtn.onclick = null;
        if (tutNextBtn) tutNextBtn.onclick = null;
        const welcomeBtn = d.getElementById('extrasTutWelcomeBtn');
        const finalBtn = d.getElementById('extrasTutFinalBtn');
        if (welcomeBtn) welcomeBtn.onclick = null;
        if (finalBtn) finalBtn.onclick = null;

        overlay.remove();
        overlay = null;
        highlight = null;
        tooltip = null;
        tutNextBtn = null;
        skipBtn = null;
    }

    function createOverlay() {
        if (overlay) return;
        overlay = d.createElement('div');
        overlay.className = 'extras-tut-overlay';
        overlay.innerHTML =
            '<div class="extras-tut-highlight" id="extrasTutHighlight"></div>' +
            '<div class="extras-tut-tooltip" id="extrasTutTooltip"></div>' +
            '<button class="extras-tut-next" id="extrasTutNext" style="display:none">Дальше</button>' +
            '<div class="extras-tut-modal" id="extrasTutWelcome">' +
                '<div class="extras-tut-card">' +
                    '<h2>👋 Добро пожаловать!</h2>' +
                    '<p>Сейчас мы научимся играть в викторину на двух простых вопросах. Это займёт минуту.</p>' +
                    '<button class="extras-btn extras-btn--primary" id="extrasTutWelcomeBtn">Начать</button>' +
                '</div>' +
            '</div>' +
            '<div class="extras-tut-modal" id="extrasTutFinal" style="display:none">' +
                '<div class="extras-tut-card">' +
                    '<h2>🎉 Отлично!</h2>' +
                    '<p>Ты разгадал оба вопроса. Теперь ты знаешь, как играть. Вперёд — за новыми открытиями и достижениями!</p>' +
                    '<button class="extras-btn extras-btn--primary" id="extrasTutFinalBtn">Продолжить</button>' +
                '</div>' +
            '</div>' +
            '<button class="extras-tut-skip" id="extrasTutSkip">Пропустить</button>';
        d.body.appendChild(overlay);
        highlight = d.getElementById('extrasTutHighlight');
        tooltip = d.getElementById('extrasTutTooltip');
        tutNextBtn = d.getElementById('extrasTutNext');
        skipBtn = d.getElementById('extrasTutSkip');

        skipBtn.onclick = function () { finish(true); };
        d.getElementById('extrasTutWelcomeBtn').onclick = function () {
            hideModal('extrasTutWelcome');
            tutStep = 1;
            runStep();
        };
        d.getElementById('extrasTutFinalBtn').onclick = function () { finish(true); };
        tutNextBtn.onclick = advanceTutorial;
    }

    function hideModal(id) {
        const el = d.getElementById(id);
        if (el) el.style.display = 'none';
    }

    function showModal(id) {
        const el = d.getElementById(id);
        if (el) el.style.display = 'flex';
    }

    function clearStepRetry() {
        if (stepRetryTimer) {
            clearTimeout(stepRetryTimer);
            stepRetryTimer = null;
        }
    }

    function scheduleStepRetry(delay) {
        clearStepRetry();
        stepRetryTimer = setTimeout(function () {
            stepRetryTimer = null;
            runStep();
        }, delay);
    }

    function hideVisuals() {
        clearStepRetry();
        if (__posRetryTimer) { clearTimeout(__posRetryTimer); __posRetryTimer = null; }
        if (highlight) highlight.style.display = 'none';
        if (tooltip) tooltip.style.display = 'none';
        if (tutNextBtn) tutNextBtn.style.display = 'none';
    }

    function positionAt(target, text) {
        if (__posRetryTimer) { clearTimeout(__posRetryTimer); __posRetryTimer = null; }
        if (!target || !highlight || !tooltip) return;
        const r = target.getBoundingClientRect();
        if (!r || r.width === 0 || r.height === 0) {
            const stepAtCall = tutStep;
            __posRetryTimer = setTimeout(function () {
                __posRetryTimer = null;
                if (isActive && tutStep === stepAtCall) positionAt(target, text);
            }, 200);
            return;
        }
        const pad = 6;
        highlight.style.display = 'block';
        highlight.style.left = (r.left - pad) + 'px';
        highlight.style.top = (r.top - pad) + 'px';
        highlight.style.width = (r.width + pad * 2) + 'px';
        highlight.style.height = (r.height + pad * 2) + 'px';
        tooltip.style.display = 'block';
        tooltip.textContent = text;
        tooltip.style.transform = '';
        const tr = tooltip.getBoundingClientRect();
        let left = r.left + r.width / 2 - tr.width / 2;
        let top = r.top - tr.height - 16;
        if (top < 10) top = r.bottom + 16;
        left = Math.max(10, Math.min(w.innerWidth - tr.width - 10, left));
        top = Math.max(10, Math.min(w.innerHeight - tr.height - 10, top));
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }

    function showTutorialNext() {
        if (!tutNextBtn || !tooltip) return;
        tutNextBtn.style.display = 'block';
        const tr = tooltip.getBoundingClientRect();
        const bw = 160, bh = 48;
        let left = tr.left + tr.width / 2 - bw / 2;
        let top = tr.bottom + 12;
        if (top + bh > w.innerHeight - 10) top = tr.top - bh - 12;
        left = Math.max(10, Math.min(w.innerWidth - bw - 10, left));
        top = Math.max(10, Math.min(w.innerHeight - bh - 10, top));
        tutNextBtn.style.left = left + 'px';
        tutNextBtn.style.top = top + 'px';
        tutNextBtn.style.bottom = 'auto';
        tutNextBtn.style.transform = 'none';
    }

    function injectTutorialQuiz() {
        if (!w.QUIZZES) w.QUIZZES = {};
        w.QUIZZES[TUTORIAL_LEVEL_ID] = {
            regionKey: 'tutorial',
            sub: { ru: '🎓 Обучение', en: 'Tutorial', tr: 'Öğretici' },
            questions: TUTORIAL_QUESTIONS.map(function (q) { return Object.assign({}, q); })
        };
    }

    function navigateToTutorial() {
        injectTutorialQuiz();
        if (w.Gating && typeof w.Gating.unlockLevel === 'function') {
            try { w.Gating.unlockLevel(TUTORIAL_LEVEL_ID); } catch (e) {}
        }
if (w.__SYNCED__ && Array.isArray(w.__SYNCED__.unlocked) && w.__SYNCED__.unlocked.indexOf(TUTORIAL_LEVEL_ID) === -1) {
w.__SYNCED__.unlocked.push(TUTORIAL_LEVEL_ID);
}
if (typeof w.pushRoute === 'function') {
  w.pushRoute({ name: 'quiz', levelId: TUTORIAL_LEVEL_ID });
} else {
  location.hash = '#/quiz/' + TUTORIAL_LEVEL_ID;
}

}
function isActiveScreen(id) {
const el = d.getElementById(id);
return !!(el && el.classList.contains('active'));
}
function pauseTimer() { try { if (w.__currentQuizPause) w.__currentQuizPause(); } catch (e) {} }
function resumeTimer() { try { if (w.__currentQuizResume) w.__currentQuizResume(); } catch (e) {} }
function runStep() {
if (!isActive) return;
clearStepRetry();
const step = tutStep;
if (step === 1) {
const btn = d.getElementById('start-btn');
if (!btn) { scheduleStepRetry(300); return; }
positionAt(btn, 'Нажми «Начать игру», чтобы перейти к вопросам.');
return;
}
if (step === 2) {
const im = d.getElementById('question-img');
if (!im || !im.src || im.hidden) { scheduleStepRetry(200); return; }
currentImageSrc = im.src;
pauseTimer();
positionAt(im, 'Посмотри на фото и попробуй вспомнить название животного.');
showTutorialNext();
return;
}
if (step === 3) {
const timer = d.getElementById('timer');
if (!timer) { advanceTutorial(); return; }
positionAt(timer, 'На ответ даётся 10 секунд. Следи за таймером.');
showTutorialNext();
return;
}
if (step === 4) {
const opts = d.getElementById('options');
if (!opts) { scheduleStepRetry(200); return; }
resumeTimer();
positionAt(opts, 'Выбери правильный вариант из четырёх.');
return;
}
if (step === 5) {
const desc = d.getElementById('description');
if (!desc || desc.hidden) { scheduleStepRetry(200); return; }
positionAt(desc, 'Прочитай интересный факт об этом животном.');
showTutorialNext();
return;
}
if (step === 6) {
const nextBtn = d.getElementById('next-btn');
if (!nextBtn || nextBtn.hidden) { scheduleStepRetry(200); return; }
positionAt(nextBtn, 'Нажми «Дальше», чтобы перейти ко второму вопросу.');
return;
}
if (step === 7) {
const im = d.getElementById('question-img');
if (!im || !im.src || im.hidden) { scheduleStepRetry(200); return; }
currentImageSrc = im.src;
pauseTimer();
positionAt(im, 'Снова посмотри на фото — как называется это животное?');
showTutorialNext();
return;
}
if (step === 8) {
const timer = d.getElementById('timer');
if (!timer) { advanceTutorial(); return; }
positionAt(timer, 'Не забывай про таймер — на ответ 10 секунд.');
showTutorialNext();
return;
}
if (step === 9) {
const opts = d.getElementById('options');
if (!opts) { scheduleStepRetry(200); return; }
resumeTimer();
positionAt(opts, 'Выбери ответ. После этого прочитаешь интересный факт.');
return;
}
if (step === 10) {
const desc = d.getElementById('description');
if (!desc || desc.hidden) { scheduleStepRetry(200); return; }
positionAt(desc, 'Прочитай факт и нажми «Дальше».');
showTutorialNext();
return;
}
if (step === 11) {
const nextBtn = d.getElementById('next-btn');
if (!nextBtn || nextBtn.hidden) { scheduleStepRetry(200); return; }
positionAt(nextBtn, 'Нажми «Результаты», чтобы увидеть свой результат.');
return;
}
if (step === 12) {
hideVisuals();
showModal('extrasTutFinal');
return;
}
}
function advanceTutorial() {
if (!isActive) return;
tutStep++;
hideVisuals();
runStep();
}
function onRouteLeave() {
if (!isActive) return;
const state = w.history && w.history.state && w.history.state.vkRoute;
const pageQuiz = d.getElementById('page-quiz');
const onTutorialRoute = state && state.name === 'quiz' && Number(state.levelId) === TUTORIAL_LEVEL_ID;
const onQuizPage = pageQuiz && pageQuiz.classList.contains('active');
if (!onTutorialRoute && !onQuizPage) {
abort();
}
}
function poll() {
if (!isActive) return;
// Страховка: если игрок ушёл со страницы викторины в обход кнопок туториала
const pageQuiz = d.getElementById('page-quiz');
if (pageQuiz && !pageQuiz.classList.contains('active')) {
abort();
return;
}
const quizActive = isActiveScreen('quiz-screen');
const resultActive = isActiveScreen('result-screen');
const desc = d.getElementById('description');
const descVisible = !!(desc && !desc.hidden && desc.textContent.trim().length > 0);
const img = d.getElementById('question-img');
if (tutStep === 1) {
if (quizActive) advanceTutorial();
return;
}
if (tutStep === 4 || tutStep === 9) {
if (descVisible) advanceTutorial();
return;
}
if (tutStep === 6) {
if (img && img.src && img.src !== currentImageSrc) {
currentImageSrc = img.src;
advanceTutorial();
}
return;
}
if (tutStep === 11) {
if (resultActive) advanceTutorial();
return;
}
}
function startPolling() {
if (pollTimer) return;
pollTimer = setInterval(poll, 200);
w.addEventListener('popstate', onRouteLeave);
w.addEventListener('pagehide', abort);
}
function stopPolling() {
if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
w.removeEventListener('popstate', onRouteLeave);
w.removeEventListener('pagehide', abort);
}

function cleanupSession() {
    isActive = false;
    tutStep = -1;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (stepRetryTimer) { clearTimeout(stepRetryTimer); stepRetryTimer = null; }
    if (__posRetryTimer) { clearTimeout(__posRetryTimer); __posRetryTimer = null; }
    stopPolling();
    hideVisuals();
    destroyOverlay();
    resumeTimer();
}
function abort() {
if (!isActive) return;
cleanupSession();
}
function start(force) {
if (isActive) return;
if (!force && hasPassed()) return;
isActive = true;
tutStep = -1;
currentImageSrc = '';
createOverlay();
overlay.style.display = 'block';
hideVisuals();
hideModal('extrasTutFinal');
showModal('extrasTutWelcome');
navigateToTutorial();
startPolling();
}
function finish(shouldNavigate) {
if (!isActive) return;
cleanupSession();
markPassed();
if (shouldNavigate !== false && typeof w.pushRoute === 'function') {
  w.pushRoute({ name: 'index' });
}

}
w.GameTutorial = {
start: start,
finish: finish,
abort: abort,
reset: reset,
hasPassed: hasPassed,
hasPassedAsync: hasPassedAsync,
TUTORIAL_LEVEL_ID: TUTORIAL_LEVEL_ID,
TUTORIAL_QUESTIONS: TUTORIAL_QUESTIONS
};
})(window, document);