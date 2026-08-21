//  ORDER MANAGER  — управление заказами (динамические аватары, многопредметные заказы)
// ============================================================

const OrderManager = {
    game: null,
    orders: [],
    minActive: 3,
    maxActive: 5,
    orderIdCounter: 0,
    initialized: false,
    _renderedIds: new Set(),
    avatarFileNames: [],
    ordersCreatedInScene: 0,   // счётчик заказов, созданных в текущей сцене
       _boardId: null, 

    loadAvatars(callback) {
        if (this.avatarFileNames.length > 0) {
            callback && callback();
            return;        }
        // Предполагаем, что у нас есть k1..k10
        for (let i = 1; i <= 10; i++) {
            this.avatarFileNames.push(`k${i}.png`);
        }
        callback && callback();
    },
    // --- Инициализация ---
 init(game) {
    this.game = game;
    this.orders = [];
    this.orderIdCounter = 0;
    this.initialized = true;
    this._renderedIds.clear();
    this.ordersCreatedInScene = 0;
      // ★★★ ПОЛУЧАЕМ boardId ИЗ ИГРЫ ★★★
        this._boardId = game._boardId || null;

    const config = getCurrentSceneConfig();
    this.minActive = config.orders?.minActive ?? 3;
    this.maxActive = config.orders?.maxActive ?? 5;

  this.loadAvatars(() => {
            // ★★★ ЗАГРУЖАЕМ ЗАКАЗЫ ДЛЯ ЭТОГО boardId ★★★
            let savedState = null;
            if (this._boardId !== null) {
                savedState = Storage.loadOrdersForId(this._boardId);
            }

            if (savedState && savedState.orders && savedState.orders.length > 0) {
                this.orders = savedState.orders;
                this.orderIdCounter = savedState.orderIdCounter || 0;
                this.ordersCreatedInScene = savedState.ordersCreatedInScene || 0;
                console.log(`[OrderManager] Заказы загружены для boardId: ${this._boardId}`);
            } else if (Storage.getOrdersUnlocked()) {
                // Если заказы разблокированы, но нет сохранения – генерируем новые
                console.log(`[OrderManager] Нет сохранения заказов для boardId: ${this._boardId}, генерируем новые`);
                const target = this.minActive + Math.floor(Math.random() * (this.maxActive - this.minActive + 1));
                this.generateOrders(target);
            } else {
                // Заказы не разблокированы – пустой массив
                console.log(`[OrderManager] Заказы не разблокированы`);
            }

            this.renderOrders();
            this.saveState();
        });
    },

    // --- Вспомогательная функция: спавнящиеся уровни для типа ---
    getSpawnableLevels(typeIndex) {
        const item = ITEM_DATA[typeIndex];
        if (!item) return [];
        const levels = new Set();
        // spawnLevels
        if (Array.isArray(item.spawnLevels)) {
            item.spawnLevels.forEach(lv => levels.add(lv));
        }
        // spawnRules (ключи – уровни)
        if (item.spawnRules && typeof item.spawnRules === 'object') {
            Object.keys(item.spawnRules).forEach(key => {
                const lv = parseInt(key, 10);
                if (!isNaN(lv)) levels.add(lv);
            });
        }
        return Array.from(levels);
    },

 // ---- Генерация ОДНОГО предмета для заказа ----
    generateOrderItem(allowedTypeIndices, isEarly, isFirstThirty) {
        if (!allowedTypeIndices || allowedTypeIndices.length === 0) return null;

        // Случайный тип из разрешённых
        const typeIdx = allowedTypeIndices[Math.floor(Math.random() * allowedTypeIndices.length)];
        const maxLevelForType = this.game.maxLevels[typeIdx] || 1;
        const spawnableLevels = this.getSpawnableLevels(typeIdx);

        // ---- Определяем допустимый диапазон уровней ----
        let minLv, maxLv;
        if (isEarly) {
            // первые 10 заказов – только уровни 2–3
            minLv = 2;
            maxLv = Math.min(3, maxLevelForType);
        } else {
            // все остальные – от 3 до максимального уровня типа
            minLv = 3;
            maxLv = maxLevelForType;
        }

        if (minLv > maxLv) return null;

        // Фильтруем уровни: если заказ < 30, запрещаем спавнящиеся уровни
        let candidateLevels = [];
        for (let lv = minLv; lv <= maxLv; lv++) {
            if (isFirstThirty && spawnableLevels.includes(lv)) {
                continue; // запрещён
            }
            candidateLevels.push(lv);
        }
        if (candidateLevels.length === 0) return null;

        const level = candidateLevels[Math.floor(Math.random() * candidateLevels.length)];
        return { typeIndex: typeIdx, level, done: false };
    },

    // ---- Генерация одного ЗАКАЗА (с несколькими предметами) ----
    generateSingleOrder() {
        const config = getCurrentSceneConfig();
        const ordersCfg = config.orders;
         //  console.log('[OrderManager] generateSingleOrder, ordersCfg =', ordersCfg);
        if (!ordersCfg || !ordersCfg.allowedTypes) {
           //  console.warn('[OrderManager] Нет ordersCfg или allowedTypes');
             return null;
        }

        // ---- 1. Все возможные типы из конфига (теперь это массив чисел) ----
        let allTypeIndices = ordersCfg.allowedTypes.slice();
       //  console.log('[OrderManager] allTypeIndices =', allTypeIndices);
        if (allTypeIndices.length === 0) return null;

        // ---- 2. Ограничение типов для первых 30 заказов (только availableTypes) ----
        const isFirstThirty = this.ordersCreatedInScene < 30;
        let allowedTypeIndices = allTypeIndices;
        if (isFirstThirty && Array.isArray(config.availableTypes) && config.availableTypes.length > 0) {
            allowedTypeIndices = allTypeIndices.filter(t => config.availableTypes.includes(t));
            if (allowedTypeIndices.length === 0) allowedTypeIndices = allTypeIndices;
        }

        // ---- 3. Дополнительная фильтрация для первых 10 заказов (наличие уровня 2) ----
        const isEarly = this.ordersCreatedInScene < 10;
        if (isEarly) {
            allowedTypeIndices = allowedTypeIndices.filter(typeIdx => {
                const maxLv = this.game.maxLevels[typeIdx] || 0;
                return maxLv >= 2; // нужен хотя бы уровень 2
            });
            if (allowedTypeIndices.length === 0) {
                // fallback – берём все типы, которые есть в availableTypes
                allowedTypeIndices = isFirstThirty && Array.isArray(config.availableTypes)
                    ? allTypeIndices.filter(t => config.availableTypes.includes(t))
                    : allTypeIndices;
                if (allowedTypeIndices.length === 0) allowedTypeIndices = allTypeIndices;
            }
        } else {
            // Для заказов после 10 – нужны типы с уровнем >= 3
            allowedTypeIndices = allowedTypeIndices.filter(typeIdx => {
                const maxLv = this.game.maxLevels[typeIdx] || 0;
                return maxLv >= 3;
            });
            if (allowedTypeIndices.length === 0) {
                // если нет типов с уровнем 3+, берём все (но это маловероятно)
                allowedTypeIndices = allTypeIndices;
            }
        }

        // ---- 4. Определяем количество предметов в заказе ----
        let itemCount = 1;
        if (!isEarly) {
            // после 10 заказов – от 1 до 3
            itemCount = 1 + Math.floor(Math.random() * 3); // 1,2,3
        }

        // ---- 5. Генерируем предметы (уникальные типы) ----
        const items = [];
        const usedTypes = new Set();
        let attempts = 0;
        const maxAttempts = 20;

        while (items.length < itemCount && attempts < maxAttempts) {
            attempts++;
            let available = allowedTypeIndices.filter(t => !usedTypes.has(t));
            if (available.length === 0) break;

            const item = this.generateOrderItem(available, isEarly, isFirstThirty);
            if (item) {
                items.push(item);
                usedTypes.add(item.typeIndex);
            }
        }

        if (items.length === 0) return null;

        // ---- 6. Вычисляем звёзды (сумма звёзд каждого предмета) ----
        let totalStars = 0;
        for (const it of items) {
            totalStars += this.calculateStars(it.level);
        }

        // Увеличиваем счётчик созданных заказов (один раз за заказ)
        this.ordersCreatedInScene++;
                const order = {
                    id: this.orderIdCounter++,
                    items: items,
                    stars: totalStars,
                    totalItems: items.length,
                };

             //   console.log('[OrderManager] Создан заказ:', order);
                return order;
    },


    // --- Генерация нескольких заказов ---
   generateOrders(count) {
   // console.log('[OrderManager] generateOrders, count =', count);
    for (let i = 0; i < count; i++) {
        const order = this.generateSingleOrder();
        if (order) {
            this.orders.push(order);
          //  console.log('[OrderManager] Добавлен заказ #', order.id);
        } else {
          //  console.warn('[OrderManager] Заказ не сгенерирован (null)');
        }
    }
   // console.log('[OrderManager] Итого заказов в массиве:', this.orders.length);
},

    // --- Расчёт звёзд для одного предмета (без изменений) ---
    calculateStars(level) {
        if (level <= 3) return 1;
        if (level <= 7) return 2;
        return 3;
    },

    // --- Создание DOM-элемента заказа  ---
createOrderElement(order) {

    const el = document.createElement('div');
    el.className = 'order-item';
    el.dataset.orderId = order.id;

    
    // ★ ОТКЛЮЧАЕМ ПЕРЕХОДЫ НА МОБИЛЬНЫХ
    if (this.game.isMobile) {
        el.style.transition = 'none';
    }

    // --- Аватар ---
    const avatar = document.createElement('div');
    avatar.className = 'order-avatar';
    let avatarFile = 'k1.png';
    if (this.avatarFileNames.length > 0) {
        avatarFile = this.avatarFileNames[Math.floor(Math.random() * this.avatarFileNames.length)];
    }
    const img = document.createElement('img');
    const avatarName = avatarFile.replace(/\.[^.]+$/, ''); // без расширения
    const spriteName = `chara/pokupateli/${avatarName}.png`;
    const dataUrl = SpriteAtlas.getSpriteDataURL('chara', spriteName);
    if (dataUrl) {
        img.src = dataUrl;
    } else {
        img.src = `images/chara/pokupateli/${avatarFile}`;
    }
    img.alt = 'Покупатель'; 
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'top';
    avatar.appendChild(img);

    // ★ Анимация аватара ТОЛЬКО для ПК (не на мобильных)
    if (!Device.isMobile) {
        const animNames = [
            'sway-horizontal', 'sway-horizontal-strong', 'sway-horizontal-weak',
            'sway-vertical', 'sway-vertical-strong', 'sway-vertical-weak'
        ];
        const randomAnim = animNames[Math.floor(Math.random() * animNames.length)];
        const duration = 2 + Math.random() * 3;
        const delay = Math.random() * 2;
        avatar.style.animationName = randomAnim;
        avatar.style.animationDuration = duration + 's';
        avatar.style.animationDelay = delay + 's';
        avatar.style.animationIterationCount = 'infinite';
        avatar.style.animationTimingFunction = 'ease-in-out';
        avatar.style.transformOrigin = 'bottom center';
        avatar.style.animationFillMode = 'backwards';
    }
    // На мобильных анимация не задаётся – аватар статичен

    el.appendChild(avatar);

    // --- Цена (звёзды) ---
    const price = document.createElement('div');
    price.className = 'order-price';
price.innerHTML = `<img src="${App.pointsUrl}" style="width:1.2em;height:1.2em;vertical-align:middle;"> ${order.stars}`;
    el.appendChild(price);

    // --- Единый tray для всех предметов (в ряд) ---
    const tray = document.createElement('div');
    tray.className = 'order-tray';
    tray.style.display = 'flex';
    tray.style.flexDirection = 'row';
    tray.style.alignItems = 'center';
    tray.style.justifyContent = 'center';
    tray.style.gap = '4px';
    tray.style.padding = '4px';
    tray.style.border = '2px solid #888';
    tray.style.borderRadius = '8px';
    tray.style.backgroundColor = '#f0f0f0';
    tray.style.minHeight = '40px';
    tray.style.minWidth = '40px';
    tray.style.position = 'relative';

   // ★ Тени и будет-чейндж – только для ПК
    if (!Device.isMobile) {
              tray.style.willChange = 'transform';         // для плавной анимации появления
        // Фоновые полоски (уже было)
        tray.style.backgroundImage = 'repeating-linear-gradient(45deg, rgba(40,30,20,0.05) 0px, rgba(40,30,20,0.05) 4px, transparent 4px, transparent 8px)';
    } else {
        // На мобильных – убираем тени и will-change (экономия)
        tray.style.boxShadow = 'none';
        tray.style.willChange = 'auto';
        // Можно также уменьшить border-width, если нужно
        tray.style.borderWidth = '1px';
    }

    // Для каждого предмета создаём слот с иконкой и галочкой (если выполнено)
    order.items.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'order-item-slot';
        slot.dataset.itemIndex = index;
        slot.style.position = 'relative';
        slot.style.width = '32px';
        slot.style.height = '32px';
        slot.style.flexShrink = '0';

        const icon = document.createElement('img');
        icon.className = 'order-item-img';
  const iconSrc = BoardCore.getItemImageDataUrl(this.game, item.typeIndex, item.level);
icon.src = iconSrc;
        icon.alt = getItemName(item.typeIndex, item.level);
        icon.style.width = '100%';
        icon.style.height = '100%';
        icon.style.objectFit = 'contain';
        slot.appendChild(icon);

        // Если предмет уже выполнен – добавляем галочку
        if (item.done) {
            slot.classList.add('order-item-done');
            const check = document.createElement('div');
            check.className = 'order-item-check';
            check.textContent = '✓';
            check.style.position = 'absolute';
            check.style.top = '-4px';
            check.style.right = '-4px';
            check.style.color = 'green';
            check.style.fontSize = '16px';
            check.style.fontWeight = 'bold';
            check.style.textShadow = '0 0 4px white';
            slot.appendChild(check);
        }

        tray.appendChild(slot);
    });

    el.appendChild(tray);

    // --- Дополнительный блок (extra) ---
    const extra = document.createElement('div');
    extra.className = 'order-extra';
    el.appendChild(extra);

    return el;
},

    // --- Обновление существующего элемента заказа (при изменении статуса предметов) ---
 updateOrderElement(el, order) {
    el.dataset.orderId = order.id;

    // Обновляем цену
    const price = el.querySelector('.order-price');
    if (price) {
price.innerHTML = `<img src="${App.pointsUrl}" style="width:1.2em;height:1.2em;vertical-align:middle;"> ${order.stars}`;
    }

    // Находим tray и слоты
    const tray = el.querySelector('.order-tray');
    if (!tray) return;

    // Получаем все слоты (должно быть столько же, сколько предметов)
    const slots = tray.querySelectorAll('.order-item-slot');
    order.items.forEach((item, index) => {
        const slot = slots[index];
        if (!slot) return;

        // Обновляем иконку (на случай изменения уровня/типа)
        const img = slot.querySelector('.order-item-img');
        if (img) {
        img.src = BoardCore.getItemImageDataUrl(this.game, item.typeIndex, item.level);
            img.alt = getItemName(item.typeIndex, item.level);
        }

        // Обновляем состояние выполненности
        slot.classList.toggle('order-item-done', item.done);

        // Удаляем старую галочку, если есть
        const oldCheck = slot.querySelector('.order-item-check');
        if (oldCheck) oldCheck.remove();

        // Если выполнено – добавляем новую галочку
        if (item.done) {
            const check = document.createElement('div');
            check.className = 'order-item-check';
            check.textContent = '✓';
            check.style.position = 'absolute';
            check.style.top = '-4px';
            check.style.right = '-4px';
            check.style.color = 'green';
            check.style.fontSize = '16px';
            check.style.fontWeight = 'bold';
            check.style.textShadow = '0 0 4px white';
            slot.appendChild(check);
        }
    });
},

    // --- Отрисовка всех заказов ---
    renderOrders() {
        const container = document.getElementById('order-area');
   // console.log('[OrderManager] renderOrders, container найден?', !!container);
    if (!container) return;

    //console.log('[OrderManager] ordersUnlocked =', Storage.getOrdersUnlocked());
   // console.log('[OrderManager] orders.length =', this.orders.length);

        container.style.display = 'flex';
        container.innerHTML = '';

        if (!Storage.getOrdersUnlocked()) {
            return;
        }

        if (this.orders.length === 0) {
            return;
        }

this.orders.forEach(order => {
    const el = this.createOrderElement(order);
    container.appendChild(el);

    if (!Device.isMobile) {
        requestAnimationFrame(() => {
            el.classList.add('order-appearing');
            const onEnd = () => {
                el.classList.remove('order-appearing');
                el.removeEventListener('animationend', onEnd);
            };
            el.addEventListener('animationend', onEnd);
        });
    } else {
        // На мобильных – сразу показываем без анимации
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
    }
    this._renderedIds.add(order.id);
});
    },

    // --- Проверка дропа (теперь ищем невыполненный предмет) ---
    checkDrop(item, clientX, clientY) {
        if (!this.initialized) return false;

        const elem = document.elementFromPoint(clientX, clientY);
        if (!elem) return false;

        const orderEl = elem.closest('.order-item');
        if (!orderEl) return false;

        const orderId = parseInt(orderEl.dataset.orderId);
        if (isNaN(orderId)) return false;

        const orderIndex = this.orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return false;

        const order = this.orders[orderIndex];

        // Ищем невыполненный предмет с совпадающими type и level
        const itemIndex = order.items.findIndex(it => !it.done && it.typeIndex === item.typeIndex && it.level === item.level);
        if (itemIndex === -1) return false;

        // Отмечаем как выполненный
        order.items[itemIndex].done = true;

        // Обновляем UI для этого заказа
        this.updateOrderElement(orderEl, order);

        // Проверяем, все ли предметы выполнены
        const allDone = order.items.every(it => it.done);
        if (allDone) {
            this.completeOrder(orderIndex, orderEl);
        } else {
            // Можно проиграть звук частичного выполнения
            AudioManager.play('drop');
        }
        return true;
    },

    // --- Завершение заказа (все предметы собраны) ---
    completeOrder(index, orderEl) {
        const order = this.orders[index];
        if (!order) return;

       const points = order.stars;
this.game.score += points;
Storage.addScore(points);
            // гонка
            if (typeof RaceManager !== 'undefined' && RaceManager.onScoreAdded) {
                RaceManager.onScoreAdded(points);
            }

        QuestManager.checkAll();
        this.game.updateUI();
        AudioManager.play('merge');

        orderEl.classList.add('order-completed');
        this._renderedIds.delete(order.id);

    setTimeout(() => {
    this.orders.splice(index, 1);
    orderEl.remove();

    const currentCount = this.orders.length;
    const container = document.getElementById('order-area');
    if (!container) return;

    // Если заказов стало меньше минимального – добавляем
    if (currentCount < this.minActive) {
        // Случайное целевое количество от minActive до maxActive
        const target = this.minActive + Math.floor(Math.random() * (this.maxActive - this.minActive + 1));
        const toAdd = target - currentCount;
 for (let i = 0; i < toAdd; i++) {
    const newOrder = this.generateSingleOrder();
    if (newOrder) {
        this.orders.push(newOrder);
        this._renderedIds.add(newOrder.id);
        const el = this.createOrderElement(newOrder);
        container.appendChild(el);

        if (!Device.isMobile) {
            requestAnimationFrame(() => {
                el.classList.add('order-appearing');
                const onEnd = () => {
                    el.classList.remove('order-appearing');
                    el.removeEventListener('animationend', onEnd);
                };
                el.addEventListener('animationend', onEnd);
            });
        } else {
            el.style.opacity = '1';
            el.style.transform = 'scale(1)';
        }
    }
}
    }
    // Если заказов >= minActive – ничего не делаем (не удаляем, не добавляем)

    // Сохраняем состояние
    this.saveState();

    if (this.orders.length === 0) {
        container.innerHTML = '';
    } else {
        container.style.display = 'flex';
    }

}, 500);
    },
    // ---- СОХРАНЕНИЕ СОСТОЯНИЯ ----
    saveState() {
        // ★★★ СОХРАНЯЕМ ЗАКАЗЫ ДЛЯ ЭТОГО boardId ★★★
        if (this._boardId === null) {
            // Заказы не сохраняются (как и доска)
            return;
        }
        const state = {
            orders: structuredClone(this.orders),
            orderIdCounter: this.orderIdCounter,
            ordersCreatedInScene: this.ordersCreatedInScene,
        };
        Storage.saveOrdersForId(this._boardId, state);
    },

    // --- Получение состояния для сохранения ---
    getState() {
        return {
            orders: this.orders,
            orderIdCounter: this.orderIdCounter,
            ordersCreatedInScene: this.ordersCreatedInScene,
        };
    },

    // --- Сброс ---
    reset() {
        this.orders = [];
        this.orderIdCounter = 0;
        this._renderedIds.clear();
        this.initialized = false;
        this.avatarFileNames = [];
        this.ordersCreatedInScene = 0;
         // Очищаем сохранённое состояние заказов
    Storage.clearOrdersState();

        const container = document.getElementById('order-area');
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    }
};