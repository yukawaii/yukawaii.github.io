// ============================================================
//  STORAGE  (прогресс игрока)  —   с разделением и сжатием
// ============================================================
// Глобальная переменная для текущего boardId (устанавливается в App)
window._currentBoardId = null;

const Storage = (function() {
    // ---- 📦 Ключи для хранения (каждый – отдельная запись в VK Storage) ----
    const KEYS = {
        META: 'cafe_meta',       // мелкие данные (счёт, уровень, флаги)
        BOARD: 'cafe_board',      // состояние доски (сжато)
        INVENTORY: 'cafe_inventory',  // инвентарь (сжато)
        COLLECTION: 'cafe_collection', // коллекции (сжато)
        INTERIORS: 'cafe_interiors',  // интерьеры (сжато)
        ORDERS: 'cafe_orders',     // заказы (сжато)
        QUESTS: 'cafe_quests',     // квесты (сжато)
        SETTINGS: 'cafe_settings',    // настройки (без сжатия)
        DIALOGUES: 'cafe_dialogues',
        // ПРЕФИКСЫ для динамических ключей
        BOARD_PREFIX: 'cafe_board_',
        ORDERS_PREFIX: 'cafe_orders_',
        // Для ивентов используется 'cafe_event_'+id
    };

// ---- 🗜️ Утилиты сжатия (pako) ----
function compress(data) {
    if (data === null || data === undefined) return null;
    try {
        const json = JSON.stringify(data);
        // Сжимаем в Uint8Array
        const compressed = pako.deflate(json);
        // Преобразуем Uint8Array в строку Base64 для безопасного хранения
        let binary = '';
        for (let i = 0; i < compressed.length; i++) {
            binary += String.fromCharCode(compressed[i]);
        }
        return btoa(binary);
    } catch (e) {
        console.warn('[Storage] ❌ Ошибка сжатия:', e);
        return null;
    }
}

function decompress(compressed) {
    if (!compressed) return null;
    if (typeof compressed !== 'string') {
        // Если пришло не строка – возможно, это уже распакованные данные
        return compressed;
    }
    try {
        // Декодируем Base64 в бинарную строку, затем в Uint8Array
        const binary = atob(compressed);
        const uint8 = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            uint8[i] = binary.charCodeAt(i);
        }
        // Распаковываем
        const json = pako.inflate(uint8, { to: 'string' });
        return JSON.parse(json);
    } catch (e) {
        console.warn('[Storage] ❌ Ошибка распаковки:', e);
        return null;
    }
}

    // ---- 🔧 Вспомогательные методы для работы с хранилищем ----
    function getItem(key, def) {
        const data = Platform.loadData(key);
        return data !== null ? data : def;
    }

    function setItem(key, value) {
        Platform.saveData(key, value);
    }

    // ---- 📋 Загрузка / сохранение метаданных (без сжатия) ----
function loadMeta() {
    const payload = getItem(KEYS.META, null);
    if (!payload) return null;
    return payload.data || null;  // извлекаем вложенные данные
}

 function saveMeta(meta) {
    setItem(KEYS.META, meta);  // meta – объект, Platform.saveData добавит _timestamp
}

function saveCompressed(key, data) {
    if (data === null || data === undefined) {
        setItem(key, null);
        return;
    }
    const compressed = compress(data);
    setItem(key, compressed);
}

function loadCompressed(key) {
    const raw = getItem(key, null);
    if (!raw) return null;
    return decompress(raw.data);
}

 // ---- НОВЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С boardId ----

    /**
     * Сохранить доску для конкретного boardId
     */
    function saveBoardForId(boardId, boardData) {
        if (!boardId) {
            console.warn('[Storage] saveBoardForId: boardId не указан');
            return;
        }
        const key = KEYS.BOARD_PREFIX + boardId;
        saveCompressed(key, boardData);
    }

    /**
     * Загрузить доску для конкретного boardId
     */
    function loadBoardForId(boardId) {
        if (!boardId) return null;
        const key = KEYS.BOARD_PREFIX + boardId;
        return loadCompressed(key);
    }

    /**
     * Проверить, есть ли сохранение доски для boardId
     */
    function hasBoardForId(boardId) {
        if (!boardId) return false;
        const key = KEYS.BOARD_PREFIX + boardId;
        const raw = getItem(key, null);
        return raw !== null;
    }

    /**
     * Сохранить заказы для конкретного boardId
     */
    function saveOrdersForId(boardId, ordersData) {
        if (!boardId) {
            console.warn('[Storage] saveOrdersForId: boardId не указан');
            return;
        }
        const key = KEYS.ORDERS_PREFIX + boardId;
        saveCompressed(key, ordersData);
    }

    /**
     * Загрузить заказы для конкретного boardId
     */
    function loadOrdersForId(boardId) {
        if (!boardId) return null;
        const key = KEYS.ORDERS_PREFIX + boardId;
        return loadCompressed(key);
    }

    /**
     * Удалить все данные для boardId (доска + заказы)
     */
    function clearBoardData(boardId) {
        if (!boardId) return;
        const boardKey = KEYS.BOARD_PREFIX + boardId;
        const ordersKey = KEYS.ORDERS_PREFIX + boardId;
        setItem(boardKey, null);
        setItem(ordersKey, null);
    }

    // ---- 🌐 Публичные методы ----
    return {
        /**
         * Получить весь прогресс в виде единого объекта
         * (собираем данные из всех ключей)
         */
        getProgress() {
            const defaults = {
                score: 0,
                level: 1,
                highestScore: 0,
                totalCombines: 0,
                dialogueIndex: 0,
                exp: 0,
                ordersUnlocked: false,
                interiorStates: {},
                               boardState: null,
                collection: { discovered: {}, stickerRemoved: {} },
                sceneStarted: {},
                lastGiftTime: 0,
                eventItemsMap: {}
            };

            // Загружаем метаданные
            const meta = loadMeta() || {};

            // Загружаем большие блоки (распаковываем)
          
            const inventory  = loadCompressed(KEYS.INVENTORY);
            const collection = loadCompressed(KEYS.COLLECTION);
            const interiors  = loadCompressed(KEYS.INTERIORS);
            const orders     = loadCompressed(KEYS.ORDERS);
            const quests     = loadCompressed(KEYS.QUESTS);

            // Собираем итоговый объект
            const progress = { ...defaults, ...meta };
     
            if (inventory  !== null) progress.inventory       = inventory;
            if (collection !== null) progress.collection      = collection;
            if (interiors  !== null) progress.interiorStates  = interiors;
            if (orders     !== null) progress.ordersState     = orders;
            if (quests     !== null) progress.questState      = quests;

            // Для совместимости: если в collection есть eventItemsMap – выносим в корень
            if (collection && collection.eventItemsMap !== undefined) {
                progress.eventItemsMap = collection.eventItemsMap;
            }

            if (!progress.sceneStarted) progress.sceneStarted = {};

            return progress;
        },

        /**
         * Сохранить весь прогресс (разбиваем по ключам, большие поля сжимаем)
         */
saveProgress(progress) {
    if (!progress) progress = {};

    // ---- Делаем глубокую копию, чтобы не мутировать исходный объект ----
    const safe = structuredClone(progress);

    // ---- 1️⃣ Метаданные (без сжатия) ----
    const meta = {
        score: safe.score || 0,
        level: safe.level || 1,
        highestScore: safe.highestScore || 0,
        totalCombines: safe.totalCombines || 0,
        dialogueIndex: safe.dialogueIndex || 0,
        exp: safe.exp || 0,
        ordersUnlocked: safe.ordersUnlocked || false,
        lastGiftTime: safe.lastGiftTime || 0,
        sceneStarted: safe.sceneStarted || {}
    };
    saveMeta(meta);

    // ---- 2️⃣ Большие данные (сжатие) ----

    // Коллекция: берём из safe.collection, но если есть eventItemsMap в корне – добавляем
    const collection = safe.collection || {};
    if (safe.eventItemsMap !== undefined) {
        collection.eventItemsMap = safe.eventItemsMap;
    }
    saveCompressed(KEYS.COLLECTION, collection);

    saveCompressed(KEYS.INTERIORS,  safe.interiorStates || null);
    saveCompressed(KEYS.ORDERS,     safe.ordersState    || null);
    saveCompressed(KEYS.QUESTS,     safe.questState     || null);

    // ---- 3️⃣ Вспомогательный timestamp для отладки ----
    setItem('cafe_last_save', String(Date.now()));
},

        // ---- 🏆 Отдельные методы для удобства (используют мета-ключ) ----
        getHighestScore() {
            const meta = loadMeta() || {};
            return meta.highestScore || 0;
        },

        updateHighest(score) {
            const meta = loadMeta() || {};
            if (score > (meta.highestScore || 0)) {
                meta.highestScore = score;
                saveMeta(meta);
            }
        },

        getOrdersUnlocked() {
            const meta = loadMeta() || {};
            return meta.ordersUnlocked === true;
        },

        setOrdersUnlocked(value) {
            const meta = loadMeta() || {};
            meta.ordersUnlocked = !!value;
            saveMeta(meta);
        },

        getOrdersState() {
            return loadCompressed(KEYS.ORDERS);
        },

        saveOrdersState(state) {
            saveCompressed(KEYS.ORDERS, state);
        },

        clearOrdersState() {
            setItem(KEYS.ORDERS, null);
        },

    getSettings() {
    const payload = getItem(KEYS.SETTINGS, null);
    if (payload && payload.data) {
        return payload.data;
    }
    return { soundEnabled: true, musicEnabled: true };
},

        saveSettings(settings) {
            const current = this.getSettings();
            Object.assign(current, settings);
            setItem(KEYS.SETTINGS, JSON.stringify(current));
        },  

        clearBoard() {
            setItem(KEYS.BOARD, null);
        },

        isSceneStarted(sceneId) {
            const meta = loadMeta() || {};
            return !!meta.sceneStarted?.[sceneId];
        },

        markSceneStarted(sceneId) {
            const meta = loadMeta() || {};
            if (!meta.sceneStarted) meta.sceneStarted = {};
            meta.sceneStarted[sceneId] = true;
            saveMeta(meta);
        },

        clearSceneStarted() {
            const meta = loadMeta() || {};
            meta.sceneStarted = {};
            saveMeta(meta);
        },

        // ---- 🎪 Методы для ивентов (оставляем отдельные ключи, можно тоже сжимать при желании) ----
getEventState(eventId) {
    const key = 'cafe_event_' + eventId;
    const raw = getItem(key, null);
    if (!raw) return null;
    // raw — объект { data: сжатая_строка, _timestamp: число }
    return decompress(raw.data);
},

saveEventState(eventId, state) {
    const key = 'cafe_event_' + eventId;
    const compressed = compress(state);
    if (compressed !== null) {
        setItem(key, compressed);
    } else {
        // если сжатие не удалось (почти невозможно), сохраняем пустой объект
        setItem(key, compress({}));
    }
},

clearEventState(eventId) {
    const key = 'cafe_event_' + eventId;
    setItem(key, null);
},

        // ---- 🧰 Публичные методы для метаданных (счёт, уровень, опыт и т.п.) ----
getMeta() {
    return loadMeta() || {};
},

saveMeta(meta) {
    saveMeta(meta);
},

updateMeta(partial) {
    const meta = loadMeta() || {};
    Object.assign(meta, partial);
    saveMeta(meta);
},

// Счёт
getScore() {
    const meta = loadMeta() || {};
    return meta.score || 0;
},
setScore(value) {
    const meta = loadMeta() || {};
    meta.score = Math.max(0, value);
    saveMeta(meta);
},
addScore(amount) {
    if (!amount) return;
    const meta = loadMeta() || {};
    meta.score = (meta.score || 0) + amount;
    saveMeta(meta);
},

// Уровень
getLevel() {
    const meta = loadMeta() || {};
    return meta.level || 1;
},
setLevel(value) {
    const meta = loadMeta() || {};
    meta.level = Math.max(1, value);
    saveMeta(meta);
},

// Опыт
getExp() {
    const meta = loadMeta() || {};
    return meta.exp || 0;
},
setExp(value) {
    const meta = loadMeta() || {};
    meta.exp = Math.max(0, value);
    saveMeta(meta);
},
addExp(amount) {
    if (!amount) return;
    const meta = loadMeta() || {};
    meta.exp = (meta.exp || 0) + amount;
    saveMeta(meta);
},

// Время последнего подарка
getLastGiftTime() {
    const meta = loadMeta() || {};
    return meta.lastGiftTime || 0;
},
setLastGiftTime(value) {
    const meta = loadMeta() || {};
    meta.lastGiftTime = value || 0;
    saveMeta(meta);
},

// Общее число объединений
getTotalCombines() {
    const meta = loadMeta() || {};
    return meta.totalCombines || 0;
},
setTotalCombines(value) {
    const meta = loadMeta() || {};
    meta.totalCombines = Math.max(0, value);
    saveMeta(meta);
},
addTotalCombines(amount = 1) {
    const meta = loadMeta() || {};
    meta.totalCombines = (meta.totalCombines || 0) + amount;
    saveMeta(meta);
},

// Индекс диалога
getDialogueIndex() {
    const meta = loadMeta() || {};
    return meta.dialogueIndex || 0;
},
setDialogueIndex(value) {
    const meta = loadMeta() || {};
    meta.dialogueIndex = Math.max(0, value);
    saveMeta(meta);
},

// ---- Диалоги (показанные) ----
getShownDialogues() {
    return loadCompressed(KEYS.DIALOGUES) || {};
},
saveShownDialogues(dialoguesShown) {
    saveCompressed(KEYS.DIALOGUES, dialoguesShown);
},
markDialogueShown(sceneId, dialogueId) {
    const shown = this.getShownDialogues();
    const key = sceneId + '_' + dialogueId;
    shown[key] = true;
    this.saveShownDialogues(shown);
},
isDialogueShown(sceneId, dialogueId) {
    const shown = this.getShownDialogues();
    const key = sceneId + '_' + dialogueId;
    return !!shown[key];
},
clearShownDialogues() {
    this.saveShownDialogues({});
},

        // ---- ДОСКА (с boardId) ----
        saveBoardForId,
        loadBoardForId,
        hasBoardForId,
        clearBoardData,

        // ---- ЗАКАЗЫ (с boardId) ----
        saveOrdersForId,
        loadOrdersForId,


// ---- 🧺 Инвентарь (по boardId) ----
 getInventory(boardId) {
    if (!boardId) return [];
    const key = 'cafe_inventory_' + boardId;
    return loadCompressed(key) || [];
},

 saveInventory(boardId, data) {
    if (!boardId) return;
    const key = 'cafe_inventory_' + boardId;
    saveCompressed(key, data);
},

 clearInventory(boardId) {
    if (!boardId) return;
    const key = 'cafe_inventory_' + boardId;
    setItem(key, null);
},


// ---- 📦 Коллекция ----
getCollection() {
    return loadCompressed(KEYS.COLLECTION) || { discovered: {}, stickerRemoved: {}, eventItemsMap: {} };
},
saveCollection(data) {
    saveCompressed(KEYS.COLLECTION, data);
},

// ---- 📦 Квесты ----
getQuestsState() {
    return loadCompressed(KEYS.QUESTS) || null;
},
saveQuestsState(state) {
    saveCompressed(KEYS.QUESTS, state);
},

// ---- 📦 Интерьеры ----
getInteriorsState() {
    return loadCompressed(KEYS.INTERIORS) || null;
},
saveInteriorsState(state) {
    saveCompressed(KEYS.INTERIORS, state);
},

// ---- Гонка (Race) ----
getRaceState() {
    const key = 'cafe_race_state';
    const raw = this.get(key);
    return raw ? raw.data : null;
},
saveRaceState(raceId, state) {
    const key = 'cafe_race_state';
    this.set(key, { raceId, state });
},
clearRaceState() {
    this.set('cafe_race_state', null);
},

// ---- Общий метод для произвольных ключей (для мелких данных) ----
get(key, def) {
    const raw = getItem(key, null);
    if (raw === null) return def;
    // Если это объект с полем data – возвращаем само значение
    if (typeof raw === 'object' && raw !== null && 'data' in raw) {
        return raw.data;
    }
    return raw;
},
set(key, value) {
    setItem(key, value);
},

       };
})();

// ---- Вспомогательный debounce для сохранения ----
Storage.debouncedSave = (function() {
    let timer = null;
    return function(saveFn, delay = 30000) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            saveFn();
            timer = null;
        }, delay);
    };
})();

window.Storage = Storage;