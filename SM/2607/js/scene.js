// ============================================================
//  SCENE MANAGER  (переключение экранов)
// ============================================================
const SceneManager = {
    current: 'loading',
    scenes: {},

    init() {
        this.scenes = {
            loading: document.getElementById('scene-loading'),
            menu: document.getElementById('scene-menu'),
            dialogue: document.getElementById('scene-dialogue'),
            game: document.getElementById('scene-game'),
        };
        // Скрыть все, показать loading
        Object.values(this.scenes).forEach(s => {
            if (s) {
                s.classList.remove('active', 'visible');
                s.style.display = 'none';
            }
        });
        this.show('loading');
    },

    /** Показать сцену по имени */
    show(name) {
        Object.entries(this.scenes).forEach(([key, el]) => {
            if (!el) return;
            if (key === name) {
                el.style.display = 'flex';
                el.classList.add('active');
                el.classList.remove('visible');
            } else {
                el.classList.remove('active');
                el.classList.add('visible');
                setTimeout(() => {
                    if (!el.classList.contains('active')) {
                        el.style.display = 'none';
                    }
                }, 400);
            }
        });
        this.current = name;
    },

    getCurrent() { return this.current; }
};