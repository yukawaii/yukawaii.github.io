// ============================================================
//  DIALOGUE CONTROLLER
// ============================================================
const DialogueController = {
    index: 0,
    keys: ['dlg_0', 'dlg_1', 'dlg_2', 'dlg_3'],
    isActive: false,
    onComplete: null,

    /** Запустить диалог, после завершения вызвать onComplete */
    start(onComplete) {
        this.index = 0;
        this.isActive = true;
        this.onComplete = onComplete || null;
        this.showDialogue();
        SceneManager.show('dialogue');
    },

    /** Показать текущую реплику */
    showDialogue() {
        const textEl = document.getElementById('dialogue-text');
        if (!textEl) return;
        if (this.index >= this.keys.length) {
            this.isActive = false;
            if (this.onComplete) this.onComplete();
            return;
        }
        const key = this.keys[this.index];
        textEl.dataset.dlgKey = key;
        textEl.textContent = getText(key, '...');
        // небольшая анимация появления
        textEl.style.opacity = '0';
        setTimeout(() => { textEl.style.opacity = '1'; }, 50);
    },

    /** Перейти к следующей реплике */
    next() {
        if (!this.isActive) return;
        this.index++;
        this.showDialogue();
    },

    /** Пропустить диалог */
    skip() {
        this.index = this.keys.length;
        this.isActive = false;
        if (this.onComplete) this.onComplete();
    }
};