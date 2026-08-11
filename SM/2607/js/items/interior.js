// ============================================================
//  INTERIOR MANAGER  – добавление интерьеров в общий контейнер с фоном
// ============================================================

const InteriorManager = {
    _currentSceneId: 0,
    _interiors: [],  

    init() {
      //  console.log('[InteriorManager] init вызван');
        // Ничего не создаём, используем существующие .bg-wrapper
    },

getActiveContainer() {
    // Используем BackgroundManager, если доступен
    if (typeof BackgroundManager !== 'undefined' && BackgroundManager.getActiveContainer) {
        return BackgroundManager.getActiveContainer();
    }
    // fallback (на случай, если BackgroundManager не инициализирован)
    const activeScene = document.querySelector('.scene.active');
    if (!activeScene) {
        console.warn('[InteriorManager] Нет активной сцены');
        return null;
    }
    const container = activeScene.querySelector('.bg-wrapper, .placeholder-board');
    if (!container) {
        console.warn('[InteriorManager] Нет .bg-wrapper в активной сцене');
        return null;
    }
    return container;
},
// Добавляем метод получения данных по id
getInteriorData(interiorId) {
    if (typeof INTERIORS_DATA === 'undefined') {
        console.warn('[InteriorManager] INTERIORS_DATA не определён');
        return null;
    }
    return INTERIORS_DATA[interiorId] || null;
},

// interior.js
preloadInteriorImagesForScene(sceneId) {
    return new Promise((resolve) => {
        const config = getSceneConfig(sceneId);
        const progress = Storage.getProgress();
        const sceneState = (progress.interiorStates && progress.interiorStates[sceneId]) || {};

        const ids = new Set();

        // 1. Начальные интерьеры из конфига
        if (config && config.initialInteriors) {
            config.initialInteriors.forEach(id => {
                if (typeof id === 'string') ids.add(id);
                else if (typeof id === 'object' && id.interiorId) ids.add(id.interiorId);
            });
        }

        // 2. Интерьеры, добавленные ранее (сохранённые)
        Object.keys(sceneState).forEach(id => {
            if (sceneState[id] === true) ids.add(id);
        });

        if (ids.size === 0) {
            resolve();
            return;
        }

        let loaded = 0;
        const total = ids.size;

        ids.forEach(id => {
            const data = this.getInteriorData(id);
            if (data && data.imagePath) {
                const img = new Image();
                img.onload = () => {
                    loaded++;
                    if (loaded === total) resolve();
                };
                img.onerror = () => {
                    loaded++;
                    if (loaded === total) resolve();
                };
                img.src = data.imagePath;
            } else {
                loaded++;
                if (loaded === total) resolve();
            }
        });

        // Запасной таймаут (на случай, если какой-то onload не сработает)
        setTimeout(resolve, 5000);
    });
},


addInterior(interiorDataOrId) {
    let interiorData;
    let interiorId;

    if (typeof interiorDataOrId === 'string') {
        interiorId = interiorDataOrId;
        const data = this.getInteriorData(interiorId);
        if (!data) {
            console.warn('[InteriorManager] Интерьер не найден:', interiorId);
            return;
        }
        interiorData = { interiorId, ...data };
    } else if (typeof interiorDataOrId === 'object' && interiorDataOrId.interiorId) {
        interiorData = interiorDataOrId;
        interiorId = interiorData.interiorId;
    } else {
        console.warn('[InteriorManager] Неверный формат данных:', interiorDataOrId);
        return;
    }

    const container = this.getActiveContainer();
    if (!container) return;

    const existing = container.querySelector(`.interior-item[data-interior-id="${interiorId}"]`);
    if (existing) return;

    const img = document.createElement('img');
    img.className = 'interior-item';
    img.dataset.interiorId = interiorId;

    // --- ИСПОЛЬЗУЕМ АТЛАС ---
    const spriteName = `interiors/${interiorId}.png`;
    const dataUrl = SpriteAtlas.getSpriteDataURL('interiors', spriteName);
    if (dataUrl) {
        img.src = dataUrl;
    } else {
        // fallback на старый путь
        img.src = interiorData.imagePath;
    }

    img.dataset.offsetX = interiorData.offsetX || 0.5;
    img.dataset.offsetY = interiorData.offsetY || 0.5;
    img.dataset.width = interiorData.width || 0;
    img.dataset.height = interiorData.height || 0;

    let positioned = false;
    const positionInterior = () => {
        if (!positioned) {
            positioned = true;
            this._positionInterior(img);
        }
    };

    img.onload = positionInterior;
    img.onerror = () => console.warn('[InteriorManager] Ошибка загрузки:', img.src);
    if (img.complete && img.naturalWidth > 0) {
        positionInterior();
    }

    Object.assign(img.style, {
        position: 'absolute',
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserDrag: 'none',
        zIndex: '1',
    });

    let layer = container.querySelector('.bg-scroll-layer');
    if (!layer) layer = container;
    layer.appendChild(img);

    this._interiors.push({
        id: interiorId,
        element: img,
        data: interiorData
    });
},

// interior.js
removeInterior(interiorId, sceneId) {
    // Находим элемент интерьера по id
    const index = this._interiors.findIndex(item => item.id === interiorId);
    if (index === -1) {
        console.warn('[InteriorManager] Интерьер не найден:', interiorId);
        return false;
    }
    const item = this._interiors[index];
    item.element.remove(); // удаляем из DOM
    this._interiors.splice(index, 1); // удаляем из массива
    // Сохраняем состояние как удалённый (false)
    this.saveInterior(sceneId || this._currentSceneId, interiorId, false);
   // console.log('[InteriorManager] Интерьер удалён:', interiorId);
    return true;
},


    // Позиционирование интерьера относительно фонового изображения
_positionInterior(img) {
    const container =  this.getActiveContainer();
    if (!container) return;
    const layer = container.querySelector('.bg-scroll-layer');
    if (!layer) {
        img.style.left = '50%';
        img.style.top = '50%';
        img.style.transform = 'translate(-50%, -50%)';
        return;
    }
    const bgImg = layer.querySelector('img');
    if (!bgImg) {
        img.style.left = '50%';
        img.style.top = '50%';
        img.style.transform = 'translate(-50%, -50%)';
        return;
    }

    const doPosition = () => {
        const naturalW = bgImg.naturalWidth;
        const naturalH = bgImg.naturalHeight;
        if (!naturalW || !naturalH) {
            // центрируем, если не удалось получить размеры
            img.style.left = '50%';
            img.style.top = '50%';
            img.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const offsetX = parseFloat(img.dataset.offsetX) || 0.5;
        const offsetY = parseFloat(img.dataset.offsetY) || 0.5;
        const itemW = parseFloat(img.dataset.width) || 0;
        const itemH = parseFloat(img.dataset.height) || 0;

        const leftPct = offsetX * 100;
        const topPct = offsetY * 100;
        const widthPct = (itemW / naturalW) * 100;
        const heightPct = (itemH / naturalH) * 100;

      /* console.log('[InteriorManager] Позиционирование:', {
            naturalW, naturalH,
            offsetX, offsetY,
            itemW, itemH,
            leftPct, topPct, widthPct, heightPct
        });*/

        img.style.left = leftPct + '%';
        img.style.top = topPct + '%';
        img.style.width = (widthPct > 0) ? widthPct + '%' : 'auto';
        img.style.height = (heightPct > 0) ? heightPct + '%' : 'auto';
        img.style.transform = 'translate(-50%, -50%)';
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
    };

    // Если фон уже загружен – сразу позиционируем
    if (bgImg.naturalWidth > 0) {
        doPosition();
    } else {
        // Иначе ждём загрузки
        bgImg.onload = doPosition;
        // Если onload уже не сработает (например, изображение в кеше), вызываем через таймаут
        setTimeout(doPosition, 500);
    }
},

reloadInteriors(sceneId) {
    // Очищаем текущие интерьеры (удаляем из DOM)
    this.clearInteriors();
    // Загружаем заново из Storage для указанной сцены
    this.onSceneChange(sceneId || this._currentSceneId);
},
    // Перепозиционирование всех интерьеров (вызывается при ресайзе/ориентации)
    repositionInteriors() {
        this._interiors.forEach(item => {
            if (item.element) {
                this._positionInterior(item.element);
            }
        });
       // console.log('[InteriorManager] Интерьеры перепозиционированы');
    },
    clearInteriors() {
        this._interiors.forEach(item => item.element.remove());
        this._interiors = [];
        //console.log('[InteriorManager] Интерьеры очищены');
    },

 saveInterior(sceneId, interiorId, state = true) {
    const progress = Storage.getProgress();
    if (!progress.interiorStates) progress.interiorStates = {};
    if (!progress.interiorStates[sceneId]) progress.interiorStates[sceneId] = {};
    progress.interiorStates[sceneId][interiorId] = state;
    Storage.saveProgress(progress);
},

onSceneChange(sceneId) {
    this._currentSceneId = sceneId;
    const progress = Storage.getProgress();
    const sceneState = (progress.interiorStates && progress.interiorStates[sceneId]) || {};
    const activeContainer = this.getActiveContainer();

    // Вспомогательная функция для проверки и добавления
    const addIfNeeded = (id) => {
        const existing = document.querySelector(`.interior-item[data-interior-id="${id}"]`);
        if (existing) {
            // Если элемент не в активном контейнере – удаляем его
            if (!activeContainer.contains(existing)) {
                existing.remove();
                // Удаляем из _interiors
                const idx = this._interiors.findIndex(item => item.id === id);
                if (idx !== -1) this._interiors.splice(idx, 1);
            } else {
                return; // уже есть в нужном контейнере
            }
        }
        this.addInterior(id);
        this.saveInterior(sceneId, id, true);
    };

    // Восстановление из заданий
    QUEST_CYCLES.forEach(cycle => {
        cycle.quests.forEach(quest => {
            if (quest.interior && sceneState[quest.interior] === true) {
                addIfNeeded(quest.interior);
            }
        });
    });

    // Начальные интерьеры
    const config = getSceneConfig(sceneId);
    if (config && config.initialInteriors) {
        config.initialInteriors.forEach(initial => {
            const id = typeof initial === 'string' ? initial : initial.interiorId;
            if (!id) return;
            const isInState = (id in sceneState);
            if (!isInState || sceneState[id] === true) {
                addIfNeeded(id);
            }
        });
    }
},

addInteriorById(interiorData, sceneId) {
    // Можно вызвать из любого места, например, из магазина
    this.addInterior(interiorData);
     this.saveInterior(sceneId || this._currentSceneId, interiorData.interiorId, true);
},


};

window.InteriorManager = InteriorManager;