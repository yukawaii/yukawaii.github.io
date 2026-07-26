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
        return this.get('progress', {
            score: 0,
            level: 1,
            highestScore: 0,
            totalCombines: 0,
            dialogueIndex: 0
        });
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
    }
};