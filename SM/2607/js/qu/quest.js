// ============================================================
//  QUEST MANAGER  – механика квестов (с поддержкой интерьеров)
//  Доработки: несколько кнопок, точное позиционирование, скрытие при диалоге
// ============================================================

const QuestManager = {
    _game: null,
    _questProgress: {},
    _triggerUnlocked: {},
    _availableQuests: [],
    _currentSceneId: 0,

    init(game) {
        this._game = game;
        this.loadProgress();
        this.checkAll();
        // Инициализация InteriorManager
        if (typeof InteriorManager !== 'undefined') {
            InteriorManager.init();
        }
    },

    loadProgress() {
        const progress = Storage.getProgress();
        this._questProgress = progress.questProgress || {};
        this._triggerUnlocked = progress.triggerUnlocked || {};
        QUEST_CYCLES.forEach(cycle => {
            if (!this._questProgress[cycle.id]) {
                this._questProgress[cycle.id] = {
                    lastCompletedIndex: -1,
                    unlocked: cycle.startUnlocked || false
                };
            }
        });
        this.saveProgress();
    },

    saveProgress() {
        const progress = Storage.getProgress();
        progress.questProgress = this._questProgress;
        progress.triggerUnlocked = this._triggerUnlocked;
        Storage.saveProgress(progress);
    },

    checkAll() {
        this.checkUnlockCycles();
        this.updateAvailableQuests();
        this.updateUI();
    },

    checkUnlockCycles() {
        let changed = false;
        QUEST_CYCLES.forEach(cycle => {
            const prog = this._questProgress[cycle.id];
            if (!prog.unlocked && cycle.unlockCondition) {
                if (this._checkCondition(cycle.unlockCondition)) {
                    prog.unlocked = true;
                    changed = true;
                }
            }
        });
        if (changed) this.saveProgress();
    },

    _checkCondition(condition) {
        if (!condition) return true;
        switch (condition.type) {
            case 'level': return this._game.level >= condition.value;
            case 'score': return this._game.score >= condition.value;
            case 'trigger': return false;
            default: return false;
        }
    },

    handleTrigger(triggerName) {
        let changed = false;
        QUEST_CYCLES.forEach(cycle => {
            const prog = this._questProgress[cycle.id];
            if (!prog.unlocked && cycle.unlockCondition &&
                cycle.unlockCondition.type === 'trigger' &&
                cycle.unlockCondition.name === triggerName) {
                prog.unlocked = true;
                changed = true;
            }
            cycle.quests.forEach((quest, index) => {
                if (quest.condition && quest.condition.type === 'trigger' && quest.condition.name === triggerName) {
                    const key = cycle.id + '_' + index;
                    this._triggerUnlocked[key] = true;
                    if (!prog.unlocked) prog.unlocked = true;
                    changed = true;
                }
            });
        });
        if (changed) {
            this.saveProgress();
        }
        this.checkAll();
    },

    updateAvailableQuests() {
        this._availableQuests = [];
        QUEST_CYCLES.forEach(cycle => {
            const prog = this._questProgress[cycle.id];
            if (!prog.unlocked) return;
            const nextIndex = prog.lastCompletedIndex + 1;
            if (nextIndex < cycle.quests.length) {
                const quest = cycle.quests[nextIndex];
                let available = true;
                if (quest.condition && quest.condition.type === 'trigger') {
                    const key = cycle.id + '_' + nextIndex;
                    available = !!this._triggerUnlocked[key];
                } else if (quest.condition) {
                    available = this._checkCondition(quest.condition);
                }
                if (available) {
                    this._availableQuests.push({
                        cycleId: cycle.id,
                        questIndex: nextIndex,
                        quest: quest
                    });
                }
            }
        });
        this._availableQuests.sort((a, b) => a.cycleId - b.cycleId || a.questIndex - b.questIndex);
    },

    getAvailableQuest() {
        return this._availableQuests.length ? this._availableQuests[0] : null;
    },

    // ---- ОТОБРАЖЕНИЕ КНОПОК (до 3 штук) ----

    _renderAvailableQuests() {
        // Удаляем все старые кнопки интерьеров
        document.querySelectorAll('.interior-btn').forEach(btn => btn.remove());

        // Проверяем, можно ли показывать кнопки:
        // 1) Активна диалоговая сцена
        // 2) Диалог НЕ идёт (DialogueController.isActive === false)
        const isDialogueScene = (SceneManager.current === 'dialogue');
        const isDialogActive = (typeof DialogueController !== 'undefined' && DialogueController.isActive === true);

        if (!isDialogueScene || isDialogActive) {
            return; // кнопки не показываем
        }

        // Берём первые 3 доступных квеста
        const maxButtons = 3;
        const questsToShow = this._availableQuests.slice(0, maxButtons);

        if (questsToShow.length === 0) return;

        const scene = document.querySelector('.scene.active');
        if (!scene) return;

        questsToShow.forEach(({ cycleId, questIndex, quest }) => {
            const btn = this._createInteriorButtonElement(quest, cycleId, questIndex);
            scene.appendChild(btn);
        });
    },

    _createInteriorButtonElement(quest, cycleId, questIndex) {
        const btn = document.createElement('button');
        btn.className = 'interior-btn fade-in-scale'; // добавляем анимацию появления
    const stroikaUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/stroika.png') || '';
const pointsUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/points.png') || '';
btn.innerHTML = `<img src="${stroikaUrl}" alt=""><div class="interior-cost"><img src="${pointsUrl}" style="width:1.5em;height:1.5em;vertical-align:middle;"> ${quest.cost}</div>`;
        btn.dataset.cycleId = cycleId;
        btn.dataset.questIndex = questIndex;
        btn.dataset.interiorId = quest.interior?.id || '';
        btn.dataset.action = quest.interior?.action || 'add';

        // ---- Позиционирование ----
        let left, top;
        const pos = quest.interior?.position;
        if (pos && typeof pos === 'object' && pos.left !== undefined && pos.top !== undefined) {
            // точные проценты
            left = pos.left;
            top = pos.top;
        } else {
            // совместимость со старыми строками
            const position = (typeof pos === 'string') ? pos : 'center';
            switch (position) {
                case 'left':  left = '5%'; top = '50%'; break;
                case 'right': left = '90%'; top = '50%'; break;
                case 'top':   left = '50%'; top = '10%'; break;
                case 'bottom':left = '50%'; top = '85%'; break;
                default:      left = '50%'; top = '50%'; break;
            }
        }
        btn.style.left = left;
        btn.style.top = top;
        btn.style.transform = 'translate(-50%, -50%)';

        // ---- Обработчик клика ----
        btn.addEventListener('click', () => {
            this._showQuestConfirmModal(quest, btn);
        });

        return btn;
    },

    // ---- МОДАЛКА ПОДТВЕРЖДЕНИЯ (клик по кнопке интерьера) ----

    _showQuestConfirmModal(quest, btn) {
        const title = getText('quest_title', 'Задание');
        const bodyHtml = this._buildQuestModalContent(quest);
    const pointsUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/points.png') || '';
        const cost = quest.cost;
        const currentScore = this._game.score;
        const disabled = currentScore < cost ? 'disabled' : '';

        ModalManager.showCenterModal({
            title: title,
            body: bodyHtml,
            buttons: [{         
text: `<img src="${pointsUrl}" style="width:1.5em;height:1.5em;vertical-align:middle;"> ${cost} / <img src="${pointsUrl}" style="width:1.5em;height:1.5em;vertical-align:middle;"> ${currentScore}`,
                class: `quest-accept-btn ${disabled}`,
                onClick: () => {
                    if (this._game.score >= cost) {
                        this._game.score -= cost;
                        // --- СОХРАНЕНИЕ ---
                            const prog = Storage.getProgress();
                            prog.score = this._game.score;
                            Storage.saveProgress(prog);
                            // ---
                        const cycleId = parseInt(btn.dataset.cycleId) || 0;
                        const questIndex = parseInt(btn.dataset.questIndex) || 0;
                        const cycleProg = this._questProgress[cycleId];   // ← новое имя
                        if (cycleProg) {
                            cycleProg.lastCompletedIndex = questIndex;
                            const key = cycleId + '_' + questIndex;
                            delete this._triggerUnlocked[key];
                            this.saveProgress();
                        }
                        this._game.updateUI();
                        ModalManager.closeCenterModal();
                        this._startInteriorAnimation(quest, btn);
                    }
                }
            }],
            onClose: () => { /* можно обновить UI */ }
        });
    },

    // ---- АНИМАЦИЯ ВЫПОЛНЕНИЯ ЗАДАНИЯ (остаётся без изменений, но в конце вызываем _renderAvailableQuests) ----

    _startInteriorAnimation(quest, btn) {
        // 1. Переключаемся в режим диалога, если не там
        if (typeof App !== 'undefined' && App.currentSubscene !== 'dialogue') {
            App.toggleSubscene();
            setTimeout(() => this._continueInteriorAnimation(quest, btn), 300);
        } else {
            this._continueInteriorAnimation(quest, btn);
        }
    },

    _continueInteriorAnimation(quest, btn) {
        // 1. Исчезновение кнопки
        btn.classList.add('fade-out-scale');
        setTimeout(() => btn.remove(), 500);

        const scene = document.querySelector('.scene.active');
        if (!scene) return;

        // 2. Облако (пена) – три части
        const cloudContainer = document.createElement('div');
        cloudContainer.className = 'cloud-bubble';
        cloudContainer.style.left = btn.style.left;
        cloudContainer.style.top = btn.style.top;
        cloudContainer.style.transform = 'translate(-50%, -50%) scale(0)';
        cloudContainer.style.transition = 'transform 0.6s ease-out';

        for (let i = 0; i < 3; i++) {
            const part = document.createElement('div');
            part.className = 'cloud-part';
            cloudContainer.appendChild(part);
        }

        // Пузыри
        const isMobile = window.innerWidth < 768;
        const bubbleCount = isMobile ? 3 + Math.floor(Math.random() * 4) : 12 + Math.floor(Math.random() * 4);
        for (let i = 0; i < bubbleCount; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            const size = isMobile ? 6 + Math.random() * 16 : 8 + Math.random() * 27;
            bubble.style.width = size + 'px';
            bubble.style.height = size + 'px';
            bubble.style.left = Math.random() * 100 + '%';
            bubble.style.top = Math.random() * 100 + '%';
            bubble.style.animationDelay = (Math.random() * 2) + 's';
            bubble.style.animationDuration = (2 + Math.random() * 2) + 's';
            cloudContainer.appendChild(bubble);
        }

        scene.appendChild(cloudContainer);
        requestAnimationFrame(() => {
            cloudContainer.style.transform = 'translate(-50%, -50%) scale(2.5)';
        });

        // 3. Губка
const sponge = document.createElement('img');
const gubkaUrl = Game.getItemImageDataUrl(10, 1) || ''; // typeIndex 10 – губка, уровень 1
sponge.src = gubkaUrl;
        sponge.className = 'sponge-animation';
        sponge.style.left = btn.style.left;
        sponge.style.top = btn.style.top;
        sponge.style.transform = 'translate(-50%, -50%) scale(0)';
        sponge.style.transition = 'transform 0.6s ease-out';
        scene.appendChild(sponge);
        requestAnimationFrame(() => {
            sponge.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        // 4. Звук пузырей
        let bubbleSoundCount = 0;
        const maxBubbleSounds = 6;
        const bubbleInterval = setInterval(() => {
            if (bubbleSoundCount >= maxBubbleSounds || !document.querySelector('.cloud-bubble')) {
                clearInterval(bubbleInterval);
                return;
            }
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playBubbleSequence();
            }
            bubbleSoundCount++;
        }, 1200);

        // 5. Основное действие с интерьером – через 1.5 секунды
        setTimeout(() => {
           // console.log('[QuestManager] Выполняем действие с интерьером (середина анимации)');
            const interiorId = btn.dataset.interiorId;
            const action = btn.dataset.action || 'add';

            if (typeof InteriorManager === 'undefined') {
                console.warn('[QuestManager] InteriorManager не определён!');
                return;
            }

            if (action === 'remove') {
                InteriorManager.removeInterior(interiorId, InteriorManager._currentSceneId);
            } else {
                InteriorManager.addInterior(interiorId);
                InteriorManager.saveInterior(InteriorManager._currentSceneId, interiorId, true);
                const newItem = document.querySelector(`.interior-item[data-interior-id="${interiorId}"]`);
                if (newItem) {
                    newItem.classList.add('interior-fade-in');
                    setTimeout(() => {
                        newItem.classList.remove('interior-fade-in');
                    }, 600);
                }
            }
        }, 1500);

        // 6. Убираем облако и губку через 3 секунды
        setTimeout(() => {
           // console.log('[QuestManager] Убираем облако и губку');
            cloudContainer.classList.add('fade-out-scale');
            sponge.classList.add('fade-out-scale');

            setTimeout(() => {
                cloudContainer.remove();
                sponge.remove();

                // 7. Награды и обновление UI
                this._addRewardsToInventory(quest);
            
                if (quest.rewards.exp > 0) {
                    Experience.addExp(quest.rewards.exp);
                }
                this.checkAll();
                this.updateUI();          // вызовет _renderAvailableQuests()
                // 8. Звёздный салют
                this._spawnCelebrationStars();

                // 9. Если есть диалог после анимации – показываем
                if (quest.dialogueId) {
                    const config = getCurrentSceneConfig();
                    if (config && config.dialogues) {
                        const dialog = config.dialogues.find(d => d.id === quest.dialogueId);
                        if (dialog) {
                            DialogueController.startDialog(dialog, () => this.updateUI());
                            DialogueController.hideToggleButtonInstant();
                        }
                    }
                }
            }, 500);
        }, 3000);
    },

    // ---- ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ (без изменений) ----

    _buildQuestModalContent(quest) {
        let bodyHtml = `<div class="quest-scroll">${getText(quest.nameKey, 'Задание')}</div>`;
        bodyHtml += `<div class="quest-rewards-label">~ ${getText('quest_rewards', 'Награды')} ~</div>`;
        bodyHtml += `<div class="item-info-grid">`;
        quest.rewards.items.forEach(item => {
            bodyHtml += this._renderRewardItem(item.typeIndex, item.level, item.count);
        });
        if (quest.rewards.exp > 0) {
            bodyHtml += this._renderExpCell(quest.rewards.exp);
        }
        bodyHtml += `</div>`;
        return bodyHtml;
    },

_renderRewardItem(typeIndex, level, count) {
    const src = this._game.getItemImageDataUrl(typeIndex, level) || '';
    const label = count > 1 ? count : '';
    return `<div class="item-info-cell"><img src="${src}" class="item-info-img" alt="">${label ? `<span class="item-info-badge">${label}</span>` : ''}</div>`;
},

 _renderExpCell(exp) {
    const expUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/exp.png') || '';
    return `<div class="item-info-cell"><img src="${expUrl}" class="item-info-img" alt="exp"><span class="item-info-badge">${exp}</span></div>`;
},

    _addRewardsToInventory(quest) {
        if (!quest.rewards || !quest.rewards.items) return;
        const prog = Storage.getProgress();
        if (!prog.inventory) prog.inventory = [];
        for (const item of quest.rewards.items) {
            prog.inventory.push({ typeIndex: item.typeIndex, level: item.level });
        }
        Storage.saveProgress(prog);
        if (typeof Game !== 'undefined' && Game.updateInventoryButton) {
            Game.updateInventoryButton();
        }
    },

    // ---- UI ----

    updateUI() {
        this._renderAvailableQuests();
    },

    // ---- Смена сцены ----

    onSceneChange(sceneId) {
        this._currentSceneId = sceneId;
        this.updateUI();
        this.renderQuestProgress();
    },

    // ---- Прогресс заданий (без изменений) ----

    getQuestsForScene(sceneId) {
        const config = getSceneConfig(sceneId);
        const cycleIds = config.questCycleIds || [];
        const quests = [];
        QUEST_CYCLES.forEach(cycle => {
            if (cycleIds.includes(cycle.id)) {
                cycle.quests.forEach((q, index) => {
                    quests.push({ cycleId: cycle.id, questIndex: index, quest: q });
                });
            }
        });
        return quests;
    },

    renderQuestProgress() {
        const sceneId = this._currentSceneId;
        const quests = this.getQuestsForScene(sceneId);
        const total = quests.length;
        if (total === 0) {
            document.querySelectorAll('.quest-progress-wrapper').forEach(el => el.style.display = 'none');
            return;
        }
        document.querySelectorAll('.quest-progress-wrapper').forEach(el => el.style.display = 'flex');

        let completedCount = 0;
        let segmentsHtml = '';
        for (let i = 0; i < total; i++) {
            const { cycleId, questIndex } = quests[i];
            const prog = this._questProgress[cycleId];
            const done = prog && prog.lastCompletedIndex >= questIndex;
            const completedClass = done ? 'completed' : '';
            segmentsHtml += `<div class="quest-progress-segment ${completedClass}"></div>`;
            if (done) completedCount++;
        }
        const html = `<div class="quest-progress-wrapper">${segmentsHtml}</div>`;

        const desktop = document.getElementById('quest-progress-desktop');
        const mobile = document.getElementById('quest-progress-mobile');
        if (desktop) desktop.innerHTML = html;
        if (mobile) mobile.innerHTML = html;

        if (completedCount === total && total > 0) {
            this.onAllQuestsComplete(sceneId);
        }
    },

    onAllQuestsComplete(sceneId) {
        const config = getSceneConfig(sceneId);
        const dialogueId = config.completionDialogueId;
        if (dialogueId) {
            const dialog = config.dialogues?.find(d => d.id === dialogueId);
            if (dialog) {
                DialogueController.startDialog(dialog, () => {
                    console.log('[QuestManager] Все задания выполнены! Переключаем сцену на', config.nextSceneId);
                });
            }
        }
    },

    // ---- Звёздный салют (без изменений) ----

    _spawnCelebrationStars() {
        const scene = document.querySelector('.scene.active');
        if (!scene) return;

        if (typeof AudioManager !== 'undefined') {
            AudioManager.playStars();
        }

        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 20;
        `;
        scene.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const rect = scene.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        const isMobile = window.innerWidth < 768;
        const minDimension = Math.min(canvas.width, canvas.height);
        const maxDistancePercent = isMobile ? 0.35 : 0.45;
        const maxDistance = minDimension * maxDistancePercent;
        const minDist = minDimension * 0.1;

        const count = isMobile ? 7 + Math.floor(Math.random() * 3) : 25 + Math.floor(Math.random() * 15);

        const stars = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = minDist + Math.random() * (maxDistance - minDist);
            const size = isMobile ? 3 + Math.random() * 6 : 6 + Math.random() * 12;
            const speed = 0.02 + Math.random() * (isMobile ? 0.02 : 0.025);
            stars.push({
                x: cx,
                y: cy,
                endX: cx + Math.cos(angle) * distance,
                endY: cy + Math.sin(angle) * distance,
                size: size,
                progress: 0,
                speed: speed,
                alpha: 1,
            });
        }

        let animationId = null;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let allDone = true;

            for (const s of stars) {
                s.progress += s.speed;
                if (s.progress >= 1) {
                    s.progress = 1;
                    s.alpha -= 0.02;
                    if (s.alpha < 0) s.alpha = 0;
                }
                if (s.alpha <= 0) continue;
                allDone = false;

                const x = s.x + (s.endX - s.x) * s.progress;
                const y = s.y + (s.endY - s.y) * s.progress;
                const size = s.size * (0.8 + 0.2 * (1 - s.progress));

                ctx.save();
                ctx.globalAlpha = s.alpha;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 20;
                ctx.fillStyle = '#ffffff';

                const outerRadius = size;
                const innerRadius = size * 0.4;
                ctx.beginPath();
                for (let j = 0; j < 8; j++) {
                    const radius = j % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (j / 8) * Math.PI * 2 - Math.PI / 2;
                    const px = x + Math.cos(angle) * radius;
                    const py = y + Math.sin(angle) * radius;
                    if (j === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            if (allDone) {
                cancelAnimationFrame(animationId);
                canvas.remove();
                return;
            }
            animationId = requestAnimationFrame(animate);
        };
        animate();
    },

showQuestInfoModal(quest) {
   // console.log('showQuestInfoModal вызван с квестом:', quest);
    const title = getText('quest_title', 'Задание');
    const bodyHtml = this._buildQuestModalContent(quest);
   // console.log('bodyHtml:', bodyHtml);
    ModalManager.showCenterModal({
        title: title,
        body: bodyHtml,
        buttons: [{
            text: getText('quest_execute', 'Выполнить'),
            onClick: () => {
                ModalManager.closeCenterModal();
                if (typeof App !== 'undefined') {
                    App.currentSubscene = 'dialogue';
                    SceneManager.show('dialogue');
                    App.updateSubsceneButton();
                    QuestManager.updateUI();
                }
            }
        }]
    });
},

    // ---- Сброс (без изменений) ----

    reset() {
        this._questProgress = {};
        this._triggerUnlocked = {};
        this._availableQuests = [];
        QUEST_CYCLES.forEach(cycle => {
            this._questProgress[cycle.id] = {
                lastCompletedIndex: -1,
                unlocked: cycle.startUnlocked || false
            };
        });
        this.saveProgress();
        this.checkAll();
        this.updateUI();

        if (typeof InteriorManager !== 'undefined') {
            InteriorManager.clearInteriors();
            const progress = Storage.getProgress();
            progress.interiorStates = {};
            Storage.saveProgress(progress);
        }
    }
};

window.QuestManager = QuestManager;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuestManager;
}