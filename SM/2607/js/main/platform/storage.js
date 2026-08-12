// ============================================================
//  STORAGE  (прогресс игрока)
// ============================================================
const Storage = {
    get(key, def) {
        const data = Platform.loadData(key);
        return data !== null ? data : def;
    },
    set(key, value) {
        Platform.saveData(key, value);
    },

    /** Получить весь прогресс */
    getProgress() {
        const saved = this.get('progress', null);
        const defaults = {
            score: 0,
            level: 1,
            highestScore: 0,
            totalCombines: 0,
            dialogueIndex: 0,
            exp: 0,
            ordersUnlocked: false,
            interiorStates: {},
            inventory: [],
            boardState: null,
            collection: { discovered: {}, stickerRemoved: {} },
            sceneStarted: {},
            lastGiftTime: 0,   // ← новое поле
        };
        if (!saved) return { ...defaults };
        // Объединяем сохранённые данные с дефолтами (новые поля добавляются)
        return { ...defaults, ...saved };
    },

    /** Сохранить прогресс */
    saveProgress(progress) {
        this.set('progress', progress);
    },

    /** Получить рекордный счёт */
    getHighestScore() {
        const p = this.getProgress();
        return p.highestScore || 0;
    },

    /** Обновить рекорд, если текущий счёт больше */
    updateHighest(score) {
        const p = this.getProgress();
        if (score > (p.highestScore || 0)) {
            p.highestScore = score;
            this.saveProgress(p);
        }
    },

    getOrdersUnlocked() {
        const data = this.getProgress();
        return data.ordersUnlocked === true;
    },

    setOrdersUnlocked(value) {
        const data = this.getProgress();
        data.ordersUnlocked = !!value;
        this.saveProgress(data);
    },
    // Добавьте в объект Storage:

/** Получить сохранённое состояние заказов или null */
getOrdersState() {
    const progress = this.getProgress();
    return progress.ordersState || null;
},

/** Сохранить состояние заказов */
saveOrdersState(state) {
    const progress = this.getProgress();
    progress.ordersState = state;
    this.saveProgress(progress);
},

/** Очистить сохранённое состояние заказов (при сбросе сцены) */
clearOrdersState() {
    const progress = this.getProgress();
    delete progress.ordersState;
    this.saveProgress(progress);
},

    getSettings() {
        return this.get('settings', { soundEnabled: true, musicEnabled: true });
    },

    saveSettings(settings) {
        const current = this.getSettings();
        Object.assign(current, settings);
        this.set('settings', current);
    },

    saveBoard(boardData) {
        const progress = this.getProgress();
        progress.boardState = boardData;
        this.saveProgress(progress);
    },

    loadBoard() {
        const progress = this.getProgress();
        return progress.boardState || null;
    },

    clearBoard() {
        const progress = this.getProgress();
        delete progress.boardState;
        this.saveProgress(progress);
    },

    isSceneStarted(sceneId) {
        const progress = this.getProgress();
        return !!progress.sceneStarted?.[sceneId];
    },

    markSceneStarted(sceneId) {
        const progress = this.getProgress();
        if (!progress.sceneStarted) progress.sceneStarted = {};
        progress.sceneStarted[sceneId] = true;
        this.saveProgress(progress);
    },

    clearSceneStarted() {
        const progress = this.getProgress();
        progress.sceneStarted = {};
        this.saveProgress(progress);
    },

    getEventState(eventId) {
    const progress = this.getProgress();
    return progress.eventStates ? progress.eventStates[eventId] : null;
},
saveEventState(eventId, state) {
    const progress = this.getProgress();
    if (!progress.eventStates) progress.eventStates = {};
    progress.eventStates[eventId] = state;
    this.saveProgress(progress);
},
clearEventState(eventId) {
    const progress = this.getProgress();
    if (progress.eventStates) {
        delete progress.eventStates[eventId];
        this.saveProgress(progress);
    }
}
};