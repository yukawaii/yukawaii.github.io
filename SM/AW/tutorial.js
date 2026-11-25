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
    let enteredQuizPage = false;
    let originPage = 'map';
    let originStartMenu = false;

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

      const TUT_I18N = {
        ru: {
            next: 'Дальше',
            welcomeTitle: '👋 Добро пожаловать!',
            welcomeText: 'Сейчас мы научимся играть в викторину на двух простых вопросах. Это займёт минуту.',
            start: 'Начать',
            finalTitle: '🎉 Отлично!',
            finalText: 'Ты разгадал оба вопроса. Теперь ты знаешь, как играть. Вперёд — за новыми открытиями и достижениями!',
            continue: 'Продолжить',
            skip: 'Пропустить',
            s1: 'Нажми «Начать игру», чтобы перейти к вопросам.',
            s2: 'Посмотри на фото и попробуй вспомнить название животного.',
            s3: 'На ответ даётся 10 секунд. Следи за таймером.',
            s4: 'Выбери правильный вариант из четырёх.',
            s5: 'Прочитай интересный факт об этом животном.',
            s6: 'Нажми «Дальше», чтобы перейти ко второму вопросу.',
            s7: 'Снова посмотри на фото — как называется это животное?',
            s8: 'Не забывай про таймер — на ответ 10 секунд.',
            s9: 'Выбери ответ. После этого прочитаешь интересный факт.',
            s10: 'Прочитай факт и нажми «Дальше».',
            s11: 'Нажми «Результаты», чтобы увидеть свой результат.'
        },
        en: {
            next: 'Next',
            welcomeTitle: '👋 Welcome!',
            welcomeText: 'Let’s learn how to play the quiz with two simple questions. It will take a minute.',
            start: 'Start',
            finalTitle: '🎉 Great job!',
            finalText: 'You solved both questions. Now you know how to play. Go ahead for new discoveries and achievements!',
            continue: 'Continue',
            skip: 'Skip',
            s1: 'Tap "Start Game" to move on to the questions.',
            s2: 'Look at the photo and try to recall the animal’s name.',
            s3: 'You have 10 seconds to answer. Watch the timer.',
            s4: 'Choose the correct option out of four.',
            s5: 'Read an interesting fact about this animal.',
            s6: 'Tap "Next" to go to the second question.',
            s7: 'Look at the photo again — what is this animal called?',
            s8: 'Don’t forget the timer — 10 seconds per answer.',
            s9: 'Choose an answer. Then you’ll read an interesting fact.',
            s10: 'Read the fact and tap "Next".',
            s11: 'Tap "Results" to see your score.'
        },
        tr: {
            next: 'İleri',
            welcomeTitle: '👋 Hoş geldin!',
            welcomeText: 'İki basit soruyla testi nasıl oynayacağını öğrenelim. Bir dakika sürecek.',
            start: 'Başla',
            finalTitle: '🎉 Harika!',
            finalText: 'İki soruyu da çözdün. Artık nasıl oynanacağını biliyorsun. Yeni keşifler ve başarımlar için ileri!',
            continue: 'Devam et',
            skip: 'Atla',
            s1: 'Sorulara geçmek için "Oyuna Başla"ya dokun.',
            s2: 'Fotoğrafa bak ve hayvanın adını hatırlamaya çalış.',
            s3: 'Cevaplamak için 10 saniyen var. Zamanlayıcıyı takip et.',
            s4: 'Dört seçenekten doğru olanı seç.',
            s5: 'Bu hayvan hakkında ilginç bilgiyi oku.',
            s6: 'İkinci soruya geçmek için "İleri"ye dokun.',
            s7: 'Fotoğrafa tekrar bak — bu hayvanın adı nedir?',
            s8: 'Zamanlayıcıyı unutma — cevap için 10 saniye.',
            s9: 'Bir cevap seç. Ardından ilginç bir bilgi okuyacaksın.',
            s10: 'Bilgiyi oku ve "İleri"ye dokun.',
            s11: 'Sonucunu görmek için "Sonuçlar"a dokun.'
        }
    };
    function tt(key) {
        const lang = (w.LANG && TUT_I18N[w.LANG]) ? w.LANG : 'ru';
        return TUT_I18N[lang][key] || TUT_I18N.ru[key] || key;
    }

    function createOverlay() {
        if (overlay) return;
        overlay = d.createElement('div');
        overlay.className = 'extras-tut-overlay';
        overlay.innerHTML =
            '<div class="extras-tut-highlight" id="extrasTutHighlight"></div>' +
            '<div class="extras-tut-tooltip" id="extrasTutTooltip"></div>' +
            '<button class="extras-tut-next" id="extrasTutNext" style="display:none">' + tt('next') + '</button>' +
            '<div class="extras-tut-modal" id="extrasTutWelcome">' +
                '<div class="extras-tut-card">' +
                    '<h2>' + tt('welcomeTitle') + '</h2>' +
                    '<p>' + tt('welcomeText') + '</p>' +
                    '<button class="extras-btn extras-btn--primary" id="extrasTutWelcomeBtn">' + tt('start') + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="extras-tut-modal" id="extrasTutFinal" style="display:none">' +
                '<div class="extras-tut-card">' +
                    '<h2>' + tt('finalTitle') + '</h2>' +
                    '<p>' + tt('finalText') + '</p>' +
                    '<button class="extras-btn extras-btn--primary" id="extrasTutFinalBtn">' + tt('continue') + '</button>' +
                '</div>' +
            '</div>' +
            '<button class="extras-tut-skip" id="extrasTutSkip">' + tt('skip') + '</button>';
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
  w.pushRoute({
    name: 'quiz',
    levelId: TUTORIAL_LEVEL_ID,
    fromPage: originPage,
    fromStartMenu: originStartMenu
  });
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
positionAt(btn, tt('s1'));
return;
}
if (step === 2) {
const im = d.getElementById('question-img');
if (!im || !im.src || im.hidden) { scheduleStepRetry(200); return; }
currentImageSrc = im.src;
pauseTimer();
positionAt(im, tt('s2'));
showTutorialNext();
return;
}
if (step === 3) {
const timer = d.getElementById('timer');
if (!timer) { advanceTutorial(); return; }
positionAt(timer, tt('s3'));
showTutorialNext();
return;
}
if (step === 4) {
const opts = d.getElementById('options');
if (!opts) { scheduleStepRetry(200); return; }
resumeTimer();
positionAt(opts, tt('s4'));
return;
}
if (step === 5) {
const desc = d.getElementById('description');
if (!desc || desc.hidden) { scheduleStepRetry(200); return; }
positionAt(desc, tt('s5'));
showTutorialNext();
return;
}
if (step === 6) {
const nextBtn = d.getElementById('next-btn');
if (!nextBtn || nextBtn.hidden) { scheduleStepRetry(200); return; }
positionAt(nextBtn, tt('s6'));
return;
}
if (step === 7) {
const im = d.getElementById('question-img');
if (!im || !im.src || im.hidden) { scheduleStepRetry(200); return; }
currentImageSrc = im.src;
pauseTimer();
positionAt(im, tt('s7'));
showTutorialNext();
return;
}
if (step === 8) {
const timer = d.getElementById('timer');
if (!timer) { advanceTutorial(); return; }
positionAt(timer, tt('s8'));
showTutorialNext();
return;
}
if (step === 9) {
const opts = d.getElementById('options');
if (!opts) { scheduleStepRetry(200); return; }
resumeTimer();
positionAt(opts, tt('s9'));
return;
}
if (step === 10) {
const desc = d.getElementById('description');
if (!desc || desc.hidden) { scheduleStepRetry(200); return; }
positionAt(desc, tt('s10'));
showTutorialNext();
return;
}
if (step === 11) {
const nextBtn = d.getElementById('next-btn');
if (!nextBtn || nextBtn.hidden) { scheduleStepRetry(200); return; }
positionAt(nextBtn, tt('s11'));
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
const pageQuiz = d.getElementById('page-quiz');
if (pageQuiz) {
  if (pageQuiz.classList.contains('active')) {
    enteredQuizPage = true;
  } else if (enteredQuizPage) {
    abort();
    return;
  }
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
const nextBtn = d.getElementById('next-btn');
const nextVisible = !!(nextBtn && !nextBtn.hidden);
if (descVisible) {
  advanceTutorial();
} else if (nextVisible) {
  tutStep += 2;
  hideVisuals();
  runStep();
}
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
    enteredQuizPage = false;
    d.body.classList.remove('tutorial-active');
    d.querySelectorAll('#quiz-screen .topbar .icon-btn, #quiz-start-home-btn').forEach(function (btn) {
      btn.disabled = false;
    });
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
const startScr = d.getElementById('startScreen');
originStartMenu = !force || Boolean(startScr && !startScr.classList.contains('hidden'));
const activePageEl = d.querySelector('.page.active');
const activeId = activePageEl ? activePageEl.id.replace(/^page-/, '') : '';
originPage = (activeId && activeId !== 'quiz') ? activeId : 'map';

isActive = true;
tutStep = -1;
currentImageSrc = '';
d.body.classList.add('tutorial-active');
d.querySelectorAll('#quiz-screen .topbar .icon-btn, #quiz-start-home-btn').forEach(function (btn) {
  btn.disabled = true;
});
if (startScr) {
  startScr.classList.remove('start-exit');
  startScr.classList.add('hidden');
  startScr.querySelectorAll('.start-deco').forEach(function (el) { el.remove(); });
}

['extrasHelpModal', 'ach-modal'].forEach(function (mid) {
  const m = d.getElementById(mid);
  if (m) m.classList.remove('show');
});
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
const targetPage = originPage || 'map';
const showStart = originStartMenu;
cleanupSession();
markPassed();
if (shouldNavigate !== false) {
  if (typeof w.pushRoute === 'function') {
    w.pushRoute({ name: targetPage, startMenuOpen: showStart });
  } else if (showStart && w.StartMenu && typeof w.StartMenu.show === 'function') {
    w.StartMenu.show();
  }
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