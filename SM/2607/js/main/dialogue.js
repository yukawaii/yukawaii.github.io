// ============================================================
//  DIALOGUE CONTROLLER – с анимацией и поддержкой отложенных диалогов
// ============================================================

const DialogueController = {
    index: 0,
    _steps: [],
    isActive: false,
    onComplete: null,
    _shownCharacters: new Set(),
    _pendingDialog: null,
    _currentDialog: null,

    // ---- Методы управления ----


    _flattenSteps(steps) {
        const result = [];
        for (const step of steps) {
            if (Array.isArray(step.textKey)) {
                for (const key of step.textKey) {
                    result.push({
                        chara: step.chara,
                        side: step.side,
                        textKey: key
                    });
                }
            } else {
                result.push({
                    chara: step.chara,
                    side: step.side,
                    textKey: step.textKey
                });
            }
        }
        return result;
    },

    // ---- Проверка триггеров (вызывается из игры) ----
checkTrigger(trigger, game, onComplete) {
    const config = getCurrentSceneConfig();
    if (!config.dialogues) {
        if (onComplete) onComplete();
        return;
    }

    const sceneId = typeof currentSceneId !== 'undefined' ? currentSceneId : 0;

    // Ищем диалог с нужным триггером, который ещё не был показан (проверяем Storage)
    const dialog = config.dialogues.find(d => {
        if (d.trigger !== trigger) return false;
        // Проверяем, не показан ли уже
        return !Storage.isDialogueShown(sceneId, d.id);
    });

    if (!dialog) {
        if (onComplete) onComplete();
        return;
    }

    // Проверяем условие (если есть)
    if (dialog.condition && !dialog.condition(game)) {
        if (onComplete) onComplete();
        return;
    }

    // Помечаем как показанный (сохраняем в Storage)
    Storage.markDialogueShown(sceneId, dialog.id);

    if (dialog.auto) {
        this.startDialog(dialog, () => {
            if (typeof App !== 'undefined') {
                App.onDialogueComplete();
            }
            if (onComplete) onComplete();
        });
    } else {
        this._pendingDialog = dialog;
        if (typeof App !== 'undefined') {
            App.setPendingDialog(true);
        }
        if (onComplete) onComplete();
    }
},

// ---- Управление правой панелью (плавно) ----
showPanel() {
    const panel = document.getElementById('right-panel-dialogue');
    if (panel) {
        // ★ Принудительно скрываем, чтобы анимация всегда срабатывала
        panel.classList.add('hidden');
        void panel.offsetWidth; // reflow
        panel.classList.remove('hidden');
        panel.style.display = 'flex';
        if (typeof ScrollablePanel !== 'undefined') {
            requestAnimationFrame(() => ScrollablePanel.refresh(panel));
        }
    }
    document.querySelectorAll('.subscene-toggle-wrapper').forEach(el => {
        el.classList.add('visible');
    });
},

hidePanel() {
    const panel = document.getElementById('right-panel-dialogue');
    if (panel) {
        panel.style.transition = 'none';          // отключаем анимацию
        panel.classList.add('hidden');
        void panel.offsetWidth;                   // принудительный reflow
        panel.style.transition = '';              // восстанавливаем из CSS
    }
    document.querySelectorAll('.subscene-toggle-wrapper').forEach(el => {
        el.classList.remove('visible');
        el.style.transition = 'none';
        void el.offsetWidth;
        el.style.transition = '';
    });
},

    // ---- Запуск диалога ----

   startDialog(dialog, onComplete) {
    if (!dialog || !dialog.steps || dialog.steps.length === 0) {
        if (onComplete) onComplete();
        return;
    }

    this._currentDialog = dialog;
    this._steps = this._flattenSteps(dialog.steps);
    this.index = 0;
    this.isActive = true;
    this.onComplete = onComplete || null;
    this._shownCharacters.clear();
// ★ Скрываем правую панель до показа сцены
    this.hidePanel();
    // ★ СНАЧАЛА устанавливаем фон, потом показываем сцену
    if (typeof BackgroundManager !== 'undefined') {
        BackgroundManager.setMode('dialogue');
    }
    SceneManager.show('dialogue');
    if (typeof App !== 'undefined') {
        App.currentSubscene = 'dialogue';
        App.updateSubsceneButton();
    }

    const container = document.querySelector('.dialogue-container');
    if (container) {
        container.style.display = 'flex';
        container.classList.remove('fade-out-scale', 'dialog-appear');
        void container.offsetWidth;
        container.classList.add('dialog-appear');
        const onEnd = () => {
            container.classList.remove('dialog-appear');
            container.removeEventListener('animationend', onEnd);
        };
        container.addEventListener('animationend', onEnd);
    }

    this.showDialogue();
},

    // ---- Отображение текущего шага ----

showDialogue() {
    const textEl = document.getElementById('dialogue-text');
    const charContainer = document.querySelector('.dialogue-character');
    const imgEl = charContainer?.querySelector('img');
    if (!textEl || !imgEl || !charContainer) return;

    if (this.index >= this._steps.length) {
        this.finish();
        return;
    }

    const step = this._steps[this.index];

    // --- Установка имени персонажа ---
    const speaker = document.querySelector('.dialogue-speaker');
    if (speaker && step.chara) {
        const charaId = step.chara.replace(/\.[^.]+$/, '');
        let nameKey;
        if (charaId.startsWith('gg')) {
            nameKey = 'character_gg';
        } else if (charaId.startsWith('k')) {
            const specificKey = 'character_' + charaId;
            if (locale[specificKey] !== undefined) {
                nameKey = specificKey;
            } else {
                nameKey = 'character_buyer';
            }
        } else {
            nameKey = 'character_' + charaId;
        }
        speaker.textContent = getText(nameKey, charaId);
    }

    textEl.textContent = getText(step.textKey, '...');
    textEl.style.opacity = '0';
    setTimeout(() => { textEl.style.opacity = '1'; }, 50);

    if (step.side) {
        charContainer.classList.remove('character-left', 'character-right');
        charContainer.classList.add(step.side === 'right' ? 'character-right' : 'character-left');
    }

    // --- Загрузка спрайта персонажа ---
    if (step.chara) {
        const charaId = step.chara.replace(/\.[^.]+$/, '');
        const spriteName = `chara/${charaId}.png`;
        const dataUrl = SpriteAtlas.getSpriteDataURL('chara', spriteName);
        if (dataUrl) {
            imgEl.src = dataUrl;
            imgEl.style.display = 'block';
            // Анимация появления только если этот персонаж ещё не показывался
            if (!this._shownCharacters.has(step.chara)) {
                this._shownCharacters.add(step.chara);
                imgEl.classList.remove('fade-in-scale');
                void imgEl.offsetWidth;
                imgEl.classList.add('fade-in-scale');
                const onEnd = () => {
                    imgEl.classList.remove('fade-in-scale');
                    imgEl.removeEventListener('animationend', onEnd);
                };
                imgEl.addEventListener('animationend', onEnd);
            }
        } else {
            // Спрайт не найден — скрываем изображение и очищаем src
            imgEl.style.display = 'none';
            imgEl.src = '';
        }
    } else {
        // Если персонаж не указан — тоже скрываем
        imgEl.style.display = 'none';
        imgEl.src = '';
    }
},

    // ---- Завершение диалога ----

    finish() {
        this.isActive = false;
        const container = document.querySelector('.dialogue-container');
        if (container) {
            container.classList.add('fade-out-scale');
            container.addEventListener('animationend', () => {
                container.style.display = 'none';
                this.showPanel();
                if (this.onComplete) {
                    const cb = this.onComplete;
                    this.onComplete = null;
                    cb();
                }
            }, { once: true });
        } else {
            this.showPanel();
            if (this.onComplete) {
                const cb = this.onComplete;
                this.onComplete = null;
                cb();
            }
        }
         // Показываем панель только если мы на диалоговой сцене
    if (typeof SceneManager !== 'undefined' && SceneManager.current === 'dialogue') {
        this.showPanel();
    }
        this._currentDialog = null;
        const continueBtn = document.getElementById('dialogue-continue-btn');
        if (continueBtn) continueBtn.style.display = 'block';
    },

    // ---- Пропуск диалога ----

    skip() {
        this.index = this._steps.length;
        this.isActive = false;
        const container = document.querySelector('.dialogue-container');
        if (container) container.style.display = 'none';
        this.showPanel();
        if (this.onComplete) {
            const cb = this.onComplete;
            this.onComplete = null;
            cb();
        }
         // Показываем панель только если мы на диалоговой сцене
    if (typeof SceneManager !== 'undefined' && SceneManager.current === 'dialogue') {
        this.showPanel();
    }
        this._currentDialog = null;
    },

    // ---- Переход к следующей реплике ----

    next() {
        if (!this.isActive) return;
        this.index++;
        if (this.index >= this._steps.length) {
            this.finish();
        } else {
            this.showDialogue();
        }
    },

    // ---- Получение отложенного диалога ----

    getPendingDialog() {
        const dialog = this._pendingDialog;
        this._pendingDialog = null;
        return dialog;
    },

    hasPendingDialog() {
        return !!this._pendingDialog;
    },

        getCurrentIndex() {
        return this.index;
    },

    
    // ---- Сброс состояния диалогов (для отладки) ----
resetAllDialogs() {
    // Сброс _shown для всех диалогов во всех сценах (устарело, но оставляем для обратной совместимости)
    for (const sceneId in SCENE_CONFIGS) {
        const config = SCENE_CONFIGS[sceneId];
        if (config && config.dialogues) {
            config.dialogues.forEach(d => d._shown = false);
        }
    }
    // Сброс текущей сцены на 0
    if (typeof setCurrentScene !== 'undefined') {
        setCurrentScene(0);
    }

    // Очищаем Storage
    if (typeof Storage !== 'undefined' && Storage.clearShownDialogues) {
        Storage.clearShownDialogues();
    }

    this._pendingDialog = null;
    this._shownCharacters.clear();
    if (this.isActive) this.skip();

    this.index = 0;
    this._steps = [];
    this._currentDialog = null;
    this.isActive = false;
    this.onComplete = null;

    // Очистка DOM (как было)
    const container = document.querySelector('.dialogue-container');
    if (container) {
        container.style.display = 'none';
        container.classList.remove('dialog-appear', 'fade-out-scale');
    }
    const textEl = document.getElementById('dialogue-text');
    if (textEl) textEl.textContent = '';
    const imgEl = document.querySelector('.dialogue-character img');
    if (imgEl) {
        imgEl.style.display = 'none';
        imgEl.src = '';
        imgEl.classList.remove('fade-in-scale');
    }
    const speaker = document.querySelector('.dialogue-speaker');
    if (speaker) speaker.textContent = '';
    const continueBtn = document.getElementById('dialogue-continue-btn');
    if (continueBtn) continueBtn.style.display = 'block';

    this.showPanel();
}


};