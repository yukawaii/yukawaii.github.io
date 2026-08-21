// ============================================================
//  BACKGROUND MANAGER – управление фоновым изображением
//  (интерактивный в диалоге, размытый в игре, отдельный фон для меню)
// ============================================================

const BackgroundManager = {
    currentSceneId: 0,
    translateX: 0,
    isDragging: false,
    startX: 0,
    startTranslate: 0,

    _imgDialogue: null,
    _imgGame: null,
    _imgPortrait: null,
    _imgMenu: null,
    _containerDialogue: null,
    _containerGame: null,
    _containerPortrait: null,
    _containerMenu: null,
    _currentMode: 'menu',
     _lastOrientation: null, 
     _imageCache: new Map(),
     _dragRAF: null,
      

    MENU_IMAGE: 'images/back/menu.jpg',

init() {
     this._imgWidth = 0;
    this._containerWidth = 0;
    // ---- Инициализация контейнеров и изображений ----
    this._containerDialogue = document.getElementById('dialogue-bg-wrapper');
    this._containerGame = document.getElementById('game-bg-wrapper');
    this._containerPortrait = document.querySelector('.placeholder-board');
    this._containerMenu = document.getElementById('menu-bg-wrapper');

    // Диалоговый фон (альбомный)
    this._imgDialogue = document.getElementById('dialogue-bg-img');
    if (!this._imgDialogue && this._containerDialogue) {
        this._imgDialogue = document.createElement('img');
        this._imgDialogue.id = 'dialogue-bg-img';
        this._containerDialogue.appendChild(this._imgDialogue);
    }

    // Игровой фон
    this._imgGame = document.getElementById('game-bg-img');
    if (!this._imgGame && this._containerGame) {
        this._imgGame = document.createElement('img');
        this._imgGame.id = 'game-bg-img';
        this._containerGame.appendChild(this._imgGame);
    }

    // Портретный фон для диалога (внутри .placeholder-board)
    if (this._containerPortrait) {
        this._imgPortrait = this._containerPortrait.querySelector('img.bg-portrait-img');
        if (!this._imgPortrait) {
            this._imgPortrait = document.createElement('img');
            this._imgPortrait.className = 'bg-portrait-img';
            this._containerPortrait.appendChild(this._imgPortrait);
        }
    }

    // Фон меню
    if (this._containerMenu) {
        this._imgMenu = this._containerMenu.querySelector('img');
        if (!this._imgMenu) {
            this._imgMenu = document.createElement('img');
            this._imgMenu.id = 'menu-bg-img';
            this._containerMenu.appendChild(this._imgMenu);
        }
        if (this._imgMenu && !this._imgMenu.src) {
            this._imgMenu.src = this.MENU_IMAGE;
        }
    } else {
        // Если контейнер меню отсутствует – создаём его (как в оригинале)
        const menuScene = document.getElementById('scene-menu');
        if (menuScene) {
            const wrapper = document.createElement('div');
            wrapper.id = 'menu-bg-wrapper';
            wrapper.className = 'bg-wrapper';
            Object.assign(wrapper.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                zIndex: '0',
                pointerEvents: 'none'
            });
            const img = document.createElement('img');
            img.id = 'menu-bg-img';
            img.src = this.MENU_IMAGE;
            img.style.cssText = 'height:100%; width:auto; display:block; transform:translateX(0);';
            wrapper.appendChild(img);
            menuScene.prepend(wrapper);
            this._containerMenu = wrapper;
            this._imgMenu = img;
        }
    }

    // ---- СОЗДАНИЕ СЛОЁВ ДЛЯ ВСЕХ КОНТЕЙНЕРОВ (кроме меню) ----
    this._createScrollLayer(this._containerDialogue, this._imgDialogue);
    this._createScrollLayer(this._containerGame, this._imgGame);
    if (this._containerPortrait) {
        this._createScrollLayer(this._containerPortrait, this._imgPortrait);
    }
    // Для меню слой не создаём – там просто картинка без перетаскивания

    // ---- Подписка на события ресайза ----
    window.addEventListener('resize', () => {
        this._handleOrientationChange();
        this._updateDimensions();
        this._applyTranslate();
    });
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            this._handleOrientationChange();
            this._updateDimensions();
            this._applyTranslate();
        }, 300);
    });

    // ---- Перетаскивание ----
    this._bindDragEvents();

    // ---- Начальный режим ----
    this.setMode('menu');
    this._lastOrientation = window.innerHeight > window.innerWidth;

    // ---- После создания слоёв применяем начальное смещение ----
    this._updateDimensions();
    this._applyTranslate();
},

/**
 * Создаёт прокручиваемый слой внутри контейнера
 * @param {HTMLElement} container - контейнер (bg-wrapper или placeholder-board)
 * @param {HTMLImageElement} img - фоновое изображение
 * @returns {HTMLElement} созданный слой
 */
_createScrollLayer(container, img) {
    if (!container || !img) return null;
    // Если слой уже есть – не создаём заново
    let layer = container.querySelector('.bg-scroll-layer');
    if (layer) {
        // Если слой уже существует, но img не внутри него – перемещаем
        if (img.parentNode !== layer) {
            layer.appendChild(img);
        }
        return layer;
    }
    // Создаём слой
    layer = document.createElement('div');
    layer.className = 'bg-scroll-layer';
    // Стили слоя: занимает всю высоту контейнера, ширина автоматическая,
    // позиционируется абсолютно, чтобы не нарушать поток
    Object.assign(layer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        height: '100%',
        width: 'auto',        // ширина подстроится под изображение
        pointerEvents: 'none', // клики проходят сквозь (но перетаскивание включается отдельно)
        willChange: 'transform',
        transform: 'translateX(0)',
        zIndex: '1',
    });
    // Перемещаем изображение внутрь слояset
    layer.appendChild(img);
        img.style.height = '100%';
    img.style.width = 'auto';
    img.style.display = 'block';
    // Убираем у изображения лишние трансформации (теперь будет двигаться слой)
    img.style.transform = 'none';
    container.appendChild(layer);
    return layer;
},


    // ---- Обработка смены ориентации ----
_handleOrientationChange() {
   const isPortrait = Device.isPortrait;
    if (this._lastOrientation === null || this._lastOrientation !== isPortrait) {
        this._lastOrientation = isPortrait;
        if (this._currentMode !== 'menu') {
            this.setMode(this._currentMode);
            if (typeof InteriorManager !== 'undefined' && InteriorManager.reloadInteriors) {
                InteriorManager.reloadInteriors(this.currentSceneId);
            }
        }
    } else {
        // Даже если ориентация не изменилась, но контейнер мог поменяться из‑за других причин – пересоздаём интерьеры
        if (this._currentMode !== 'menu') {
            InteriorManager?.reloadInteriors?.(this.currentSceneId);
        }
    }
},


preloadBackgroundImage(sceneId) {
    const src = `images/back/${sceneId}.jpg`;
    return this._loadImageCached(src).then(() => {});
},

    // Обновление при смене сцены (игровой или диалоговой)
update(sceneId) {
    this.currentSceneId = sceneId;
    if (this._currentMode !== 'menu') {
        this._loadImage();
    }
    if (typeof InteriorManager !== 'undefined') {
        InteriorManager.onSceneChange(sceneId);
    }
},

    // Переключение режима: 'menu', 'dialogue', 'game'
setMode(mode) {
    this._currentMode = mode;
    const isDialogue = (mode === 'dialogue');

    // Обновляем размытие для диалога/игры
    [this._containerDialogue, this._containerGame, this._containerPortrait].forEach(cont => {
        if (cont) {
           if (!Device.isLowPerformance) {
                        cont.classList.toggle('blurred', !isDialogue);
                    } else {
                        cont.classList.remove('blurred'); // не размываем на слабых устройствах
                    }
        }
    });

    // Скрываем все контейнеры
    [this._containerDialogue, this._containerGame, this._containerPortrait, this._containerMenu].forEach(cont => {
        if (cont) cont.style.display = 'none';
    });

    // Показываем нужный контейнер
    if (mode === 'menu') {
        if (this._containerMenu) {
            this._containerMenu.style.display = 'block';
            this._scheduleUpdate();
        }
    } else if (isDialogue) {
        const portrait = window.innerHeight > window.innerWidth;
        const container = portrait ? this._containerPortrait : this._containerDialogue;
        if (container) {
            container.style.display = 'block';
            
            this._loadImage();
            this._scheduleUpdate();   // <-- обновляем размеры и трансформацию

        }
    } else { // game
        if (this._containerGame) {
            this._containerGame.style.display = 'block';
            this._loadImage();
            this._scheduleUpdate();
        }
    }

    this._enableDrag(isDialogue);
    },



    /**
 * Загружает изображение с кешированием.
 * @param {string} src - URL изображения
 * @returns {Promise<HTMLImageElement>}
 */
_loadImageCached(src) {
    if (this._imageCache.has(src)) {
        return this._imageCache.get(src);
    }
    const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
    });
    this._imageCache.set(src, promise);
    return promise;
},

    // Загрузка изображения для текущего режима (не для меню – у него src уже задан)
_loadImage() {
    if (this._currentMode === 'menu') return;
    const src = `images/back/${this.currentSceneId}.jpg`;
    const container = this.getActiveContainer();
    if (!container) return;
    const img = container.querySelector('img');
    if (!img) return;

    this._loadImageCached(src)
        .then((loadedImg) => {
            img.src = loadedImg.src; // переиспользуем уже загруженный объект
            this._scheduleUpdate();
        })
        .catch(() => { /* fallback */ });
},

    // Отложенное обновление размеров (вызывается после загрузки или ресайза)
        _scheduleUpdate() {
            const doUpdate = () => {
                this._updateDimensions();
                this._applyTranslate();
               };
            doUpdate();
            requestAnimationFrame(() => { doUpdate();  });
            setTimeout(() => { doUpdate(); }, 50);
        },

    // Возвращает активный контейнер (в зависимости от режима)
    getActiveContainer() {
        const mode = this._currentMode;
        if (mode === 'menu') {
            return this._containerMenu;
        } else if (mode === 'game') {
            return this._containerGame;
        } else if (mode === 'dialogue') {
            return window.innerHeight > window.innerWidth ? this._containerPortrait : this._containerDialogue;
        }
        return null;
    },

    // Включение/отключение перетаскивания (только для диалога)
    _enableDrag(enabled) {
        const container = this.getActiveContainer();
        if (container) {
            container.classList.toggle('drag-enabled', enabled);
        }
    },

    // Обновление размеров и ограничений
    _updateDimensions() {
        const container = this.getActiveContainer();
        if (!container) return;
        const img = container.querySelector('img');
        if (!img) return;

        const containerWidth = container.clientWidth || window.innerWidth;
        const imgWidth = img.clientWidth || img.naturalWidth || containerWidth;
 // ★ Добавить проверку
    if (containerWidth <= 0 || imgWidth <= 0) return;

        if (containerWidth > 0 && imgWidth > 0) {
            this._imgWidth = imgWidth;
            this._containerWidth = containerWidth;
        }
        this._clampTranslate();
        /*  if (typeof InteriorManager !== 'undefined' && InteriorManager.repositionInteriors) {
        InteriorManager.repositionInteriors();    }*/
    },

    // Ограничение сдвига
  _clampTranslate() {
    const maxTranslate = Math.max(0, this._imgWidth - this._containerWidth);
    if (maxTranslate <= 0) {
        // Картинка уже помещается по ширине – центрируем
        this.translateX = (this._containerWidth - this._imgWidth) / 2;
    } else {
        // Картинка шире – ограничиваем сдвиг
        if (this.translateX > 0) this.translateX = 0;
        if (this.translateX < -maxTranslate) this.translateX = -maxTranslate;
    }
},

    // Применение сдвига ко всем изображениям
_applyTranslate() {
    const container = this.getActiveContainer();
    if (!container) return;
    // Ищем слой внутри контейнера
    const layer = container.querySelector('.bg-scroll-layer');
    if (layer) {
        layer.style.transform = `translateX(${this.translateX}px)`;
    } else {
        // fallback для меню (или других контейнеров без слоя)
        const img = container.querySelector('img');
        if (img) {
            img.style.transform = `translateX(${this.translateX}px)`;
        }
    }
},

    // ---------- Перетаскивание (только для диалога) ----------
  _bindDragEvents() {
    document.addEventListener('pointerdown', (e) => this._startDrag(e));
    document.addEventListener('pointermove', (e) => this._onDrag(e));
    document.addEventListener('pointerup', (e) => this._endDrag(e));
},

 _startDrag(e) {
    if (this._currentMode !== 'dialogue') return;
    const container = this.getActiveContainer();
    if (!container) return;
    if (!container.contains(e.target)) return;
    if (e.target.closest('.dialogue-container')) return;

    const img = container.querySelector('img');
    if (!img) return;

    this.startX = e.clientX;
    this.startTranslate = this.translateX;
    this.isDragging = true;
    e.preventDefault();
},

_onDrag(e) {
    if (!this.isDragging) return;
    const delta = e.clientX - this.startX;
    let newTranslate = this.startTranslate + delta;
    this.translateX = newTranslate;
    this._clampTranslate();
    
    // Используем requestAnimationFrame для применения трансформации не чаще одного раза за кадр
    if (!this._dragRAF) {
        this._dragRAF = requestAnimationFrame(() => {
            this._applyTranslate();
            this._dragRAF = null;
        });
    }
    e.preventDefault();
},

_endDrag(e) {
    if (this.isDragging) {
        this.isDragging = false;
    }
},
};