// ============================================================
//  SCENE MANAGER  (переключение экранов)
// ============================================================
const SceneManager = {
    current: 'loading',
    scenes: {},
    _listeners: {},

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
                s.classList.remove('active', 'fade-in', 'fade-out');
               // s.style.display = 'none';
            }
        });
        this.show('loading');
    },

    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
    },

    _emit(event, data) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(fn => fn(data));
        }
    },

    
show(name) {
    const targetEl = this.scenes[name];
    if (!targetEl) return;

    Object.entries(this.scenes).forEach(([key, el]) => {
        if (el && key !== name) {
            el.classList.remove('active');
        }
    });

    targetEl.classList.add('active');
    this.current = name;
    this._emit('show', name);
},

    getCurrent() { return this.current; },
};