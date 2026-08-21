// ============================================================
//  COLLECTION MANAGER  – модалка коллекции предметов
// ============================================================

const CollectionManager = {
    _game: null,
    _categories: {},
    _categoryList: [],
    _discovered: {},
    _stickerRemoved: {},
    _currentCategory: null,
    _modalInstance: null,
    _button: null,
    _eventItemsMap: {}, // { 'event_halloween_0': { typeIndex, eventId, maxLevel } }

_loadData() {
    const data = Storage.getCollection();
    this._discovered = data.discovered || {};
    this._stickerRemoved = data.stickerRemoved || {};
    this._eventItemsMap = data.eventItemsMap || {};
},
_saveData() {
    const data = {
        discovered: structuredClone(this._discovered),
        stickerRemoved: structuredClone(this._stickerRemoved),
        eventItemsMap: structuredClone(this._eventItemsMap)
    };
    Storage.saveCollection(data);
},

init(game) {
    this._game = game;
    this._loadData();
    this._buildCategories();
    this._createButton();
    this.updateButtonVisibility();
},

    // Проверка, открыт ли предмет (используется извне)
    isDiscovered(typeIndex, level, eventId = null) {
        let key;
        if (eventId) {
            key = `event_${eventId}_${typeIndex}_${level}`;
        } else {
            key = `${typeIndex}_${level}`;
        }
        return !!this._discovered[key];
    },

    // Регистрация ивентовых предметов
    registerEventItems(eventId, eventItemData, maxLevels) {
        for (let i = 0; i < eventItemData.length; i++) {
            const item = eventItemData[i];
            if (!item) continue;
            const key = `event_${eventId}_${i}`; // база без уровня
            this._eventItemsMap[key] = {
                typeIndex: i,
                eventId: eventId,
                displayName: item.displayName || { ru: item.name, en: item.name, tr: item.name },
                maxLevel: maxLevels[i] || 1,
            };
        }
           this._saveData();
        this._buildCategories();
    },

    // Вызывается при создании предмета (в игре или ивенте)
    onItemCreated(typeIndex, level, eventId = null) {
        let key;
        if (eventId) {
            key = `event_${eventId}_${typeIndex}_${level}`;
        } else {
            key = `${typeIndex}_${level}`;
        }
        if (!this._discovered[key]) {
            this._discovered[key] = true;
           this._saveData();
            this._buildCategories();
            if (this._modalInstance && this._currentCategory) {
                if (!this._categoryList.includes(this._currentCategory)) {
                    this._currentCategory = this._categoryList[0] || null;
                }
                this._refreshModal();
            }
            this.updateButtonVisibility();
        }
    },
_getCategoryDisplayName(categoryKey) {
    // Если это ивентовая категория
    if (categoryKey.startsWith('event_')) {
        const items = this._categories[categoryKey] || [];
        for (const item of items) {
            if (item.isEvent && item.eventBaseKey) {
                const eventData = this._eventItemsMap[item.eventBaseKey];
                if (eventData) {
                    const lang = currentLang || 'ru';
                    return eventData.displayName?.[lang] || eventData.displayName?.en || eventData.eventId || categoryKey;
                }
            }
        }
        // fallback – извлечь eventId из ключа
        const eventId = categoryKey.replace('event_', '');
        return getText(`event_${eventId}`, eventId);
    }
    // Обычная категория
    return getText(categoryKey, categoryKey);
},

_getEventItemImageDataUrl(eventId, typeIndex, level) {
    const spriteName = `events/${eventId}${level}.png`;
    const sprite = SpriteAtlas.getSprite('events', spriteName);
    if (!sprite) return '';
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = sprite.sw;
        canvas.height = sprite.sh;
        ctx.drawImage(sprite.image, sprite.sx, sprite.sy, sprite.sw, sprite.sh, 0, 0, sprite.sw, sprite.sh);
        return canvas.toDataURL('image/png');
    } catch (e) {
        return '';
    }
},

  _buildCategories() {
    this._categories = {};
    const itemData = window.ITEM_DATA || [];
    const maxLevels = window.getMaxLevelsForItems ? window.getMaxLevelsForItems() : [];

    // --- Обычные предметы (все уровни) ---
    for (const item of itemData) {
        if (!item) continue;
        const category = item.categoryKey || 'Прочее';
        if (!this._categories[category]) this._categories[category] = [];
        const maxLv = maxLevels[item.id] || 1;
        for (let level = 1; level <= maxLv; level++) {
            const key = `${item.id}_${level}`;
            // ★ УБИРАЕМ проверку this._discovered[key] – добавляем все уровни
            this._categories[category].push({
                typeIndex: item.id,
                level: level,
                fullKey: key,
                isEvent: false,
            });
        }
    }

    // --- Ивентовые предметы (все уровни) ---
    for (const [baseKey, data] of Object.entries(this._eventItemsMap)) {
        const categoryKey = `event_${data.eventId}`;
        const itemTypeIndex = data.typeIndex;
        for (let level = 1; level <= data.maxLevel; level++) {
            const fullKey = `${baseKey}_${level}`;
            // ★ УБИРАЕМ проверку – добавляем все уровни
            if (!this._categories[categoryKey]) this._categories[categoryKey] = [];
            this._categories[categoryKey].push({
                typeIndex: itemTypeIndex,
                level: level,
                fullKey: fullKey,
                isEvent: true,
                eventBaseKey: baseKey,
            });
        }
    }

    // Фильтруем категории, в которых есть хотя бы один предмет
    this._categoryList = Object.keys(this._categories)
        .filter(cat => this._categories[cat].length > 0)
        .sort();
},

_createButton() {
    const container = document.getElementById('right-panel-dialogue');
    if (!container) return;
    if (document.getElementById('collection-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'collection-btn';
    btn.className = 'tb-btn';
    
    // ★ Используем тот же подход, что и для других кнопок ★
    const colectUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/colect.png') || '';
    btn.innerHTML = `<img src="${colectUrl}" style="width:90%; height:90%; object-fit:contain;">`;
    
    btn.addEventListener('pointerdown', () => {
        this.openCollectionModal();
    });
    container.appendChild(btn);
    this._button = btn;
},

updateButtonVisibility() {
    if (!this._button) return;
    const level = this._game ? this._game.level : 1;
    // ★ Используем также Experience, если игра ещё не загружена ★
    const expLevel = (typeof Experience !== 'undefined') ? Experience.getLevel() : 1;
    const show = Math.max(level, expLevel) >= 2;
    this._button.style.display = show ? 'flex' : 'none';
},

    openCollectionModal(category = null) {
        if (!this._categoryList.length) {
            ModalManager.showCenterModal({
                title: getText('collection_title', 'Коллекция'),
                body: getText('collection_empty', 'Пока нет открытых предметов. Создавайте новые комбинации!'),
                buttons: [{ text: getText('ok', 'OK'), onClick: () => ModalManager.closeCenterModal() }]
            });
            return;
        }

        this._currentCategory = category || this._categoryList[0];
        if (!this._categoryList.includes(this._currentCategory)) {
            this._currentCategory = this._categoryList[0];
        }

       const categoryName = this._getCategoryDisplayName(this._currentCategory);
        const title = getText('collection_title_category', 'Collection: {category}', { category: categoryName });

        const content = this._renderModalContent(this._currentCategory);
        this._modalInstance = ModalManager.showCenterModal({
            title: title,
            bodyElement: content,   // вместо body: content
            buttons: [],
            onClose: () => {
                 // Очищаем обработчики drag-скролла
        if (this._modalInstance) {
            const modalBody = this._modalInstance.querySelector('.modal-body');
            if (modalBody) {
                this._disableDragScroll(modalBody);
            }
        }
                this._modalInstance = null;
                this._currentCategory = null;

            }
        });

        const modalBody = this._modalInstance?.querySelector('.modal-body');
     
        if (modalBody) {
            modalBody.addEventListener('pointerdown', (e) => {
                // 1. Обработка клика по ячейке (стикер)
                const target = e.target.closest('.collection-cell');
                if (target) {
                    const key = target.dataset.key;
                    if (key && this._stickerRemoved[key] === undefined) {
                        this._stickerRemoved[key] = true;
                       this._saveData();
  //console.log('[Collection] Sticker removed for key:', key);
                        const discovered = this._discovered[key];
                        let innerHtml;
                        if (discovered) {
                            // Определяем, ивентовый ли предмет
                            const isEvent = key.startsWith('event_');
                            // Парсим typeIndex и level (для ивентового ключа: event_<eventId>_<typeIndex>_<level>)
                            let typeIndex, level;
                           if (isEvent) {
    const parts = key.split('_');
    // формат: event_<eventId>_<typeIndex>_<level>
    const eventId = parts[1];
    typeIndex = parseInt(parts[2], 10);
    level = parseInt(parts[3], 10);
    const src = this._getEventItemImageDataUrl(eventId, typeIndex, level) || '';
    innerHtml = `<img src="${src}" alt="" style="width:90%; height:90%; object-fit:contain;">`;
                                   this._enableDragScroll(modalBody);

} else {
                                const parts = key.split('_');
                                typeIndex = parseInt(parts[0], 10);
                                level = parseInt(parts[1], 10);
                                const src = BoardCore.getItemImageDataUrl(this._game, typeIndex, level) || '';
                                innerHtml = `<img src="${src}" alt="" style="width:90%; height:90%; object-fit:contain;">`;
                            }
                        } else {
                            innerHtml = `<span style="font-size:clamp(1rem, 3vw, 2rem); color:#aaa;">?</span>`;
                        }
                        target.innerHTML = innerHtml;
                        target.classList.remove('pulse-attention');
                    }
                    return;
                }

                // 2. Обработка клика по кнопке категории
                const catBtn = e.target.closest('.category-btn');
                if (catBtn) {
                    const cat = catBtn.dataset.category;
                    if (cat && this._categoryList.includes(cat)) {
                        this._currentCategory = cat;
                        this._refreshModal();
                    }
                }
            });
        }
    },

    _refreshModal() {
        if (!this._modalInstance) return;
        const modalBody = this._modalInstance.querySelector('.modal-body');
       
        if (!modalBody) return;

        const titleEl = this._modalInstance.querySelector('.modal-title');
        if (titleEl) {
           const categoryName = this._getCategoryDisplayName(this._currentCategory);
            titleEl.textContent = getText('collection_title_category', 'Collection: {category}', { category: categoryName });
        }

        const newContent = this._renderModalContent(this._currentCategory);
        modalBody.innerHTML = newContent;
           // Включаем drag-скролл для новых элементов
    this._enableDragScroll(modalBody);
    },

  _renderModalContent(category) {
    const items = this._categories[category] || [];
    if (items.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'text-align:center; padding:1rem; font-size:clamp(0.6rem, 2vw, 1rem);';
        emptyDiv.textContent = 'Нет предметов в этой категории';
        return emptyDiv; // возвращаем DOM-элемент
    }

    // Группировка по typeIndex
    const groups = {};
    for (const item of items) {
        if (!groups[item.typeIndex]) groups[item.typeIndex] = [];
        groups[item.typeIndex].push(item);
    }

    const container = document.createElement('div');
    container.className = 'collection-items-container';
    container.style.cssText = 'display:flex; flex-direction:column; gap:0.5rem; flex:1; overflow-y:auto; padding:0.1rem 0; min-height:0;';

    const sortedTypes = Object.keys(groups).map(Number).sort((a,b) => a - b);
    let hasAnyGroup = false;

    for (const typeIndex of sortedTypes) {
        const groupItems = groups[typeIndex];
        const hasDiscovered = groupItems.some(item => !!this._discovered[item.fullKey]);
        if (!hasDiscovered) continue;

        hasAnyGroup = true;
        const total = groupItems.length;
        let discoveredCount = 0;
        for (const item of groupItems) {
            if (this._discovered[item.fullKey]) discoveredCount++;
        }

        // Имя предмета
        let itemName = `#${typeIndex}`;
        if (!groupItems[0].isEvent) {
            const itemData = window.ITEM_DATA.find(it => it.id === typeIndex);
            if (itemData) itemName = getItemName(typeIndex, groupItems[0].level);
        } else {
            const baseKey = groupItems[0].eventBaseKey;
            const eventData = this._eventItemsMap[baseKey];
            if (eventData && eventData.displayName) {
                const lang = currentLang || 'ru';
                itemName = eventData.displayName[lang] || eventData.displayName.en || `Ивент ${typeIndex}`;
            }
        }

        // Блок прогресса
        const progBlock = document.createElement('div');
        progBlock.className = 'item-progression';
        progBlock.style.cssText = 'background: rgba(255,240,230,0.4); border-radius:10px; padding:0.2rem 0.3rem; border:1px solid #d9c5a6; flex-shrink:0;';

        const header = document.createElement('div');
        header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:0.1rem;';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.style.cssText = 'font-weight:bold; font-size:clamp(0.7rem, 2.2vw, 1.1rem); color:#2a1f14;';
        nameSpan.textContent = itemName;
        header.appendChild(nameSpan);

        const progressSpan = document.createElement('span');
        progressSpan.className = 'item-progress';
        progressSpan.style.cssText = 'font-size:clamp(0.6rem, 1.8vw, 0.9rem); color:#5a4a3a;';
        progressSpan.textContent = `${discoveredCount}/${total}`;
        header.appendChild(progressSpan);
        progBlock.appendChild(header);

        // Уровни (горизонтальный скролл)
        const levelsContainer = document.createElement('div');
        levelsContainer.className = 'item-levels item-info-grid';
        levelsContainer.style.cssText = 'gap:0.1rem; justify-content:flex-start; flex-wrap:nowrap; overflow-x:auto; padding:0.05rem 0;';

        // Сортируем по уровню
        groupItems.sort((a, b) => a.level - b.level);

        for (let i = 0; i < groupItems.length; i++) {
            const entry = groupItems[i];
            const level = entry.level;
            const fullKey = entry.fullKey;
            const isEvent = entry.isEvent;

            const discovered = !!this._discovered[fullKey];
            const stickerRemoved = !!this._stickerRemoved[fullKey];

            const cell = document.createElement('div');
            cell.className = 'collection-cell item-info-cell';
            cell.dataset.key = fullKey;
            cell.style.cssText = 'cursor:pointer; flex-shrink:0; width: clamp(35px, 6vmin, 65px); height: clamp(35px, 6vmin, 65px);';

            if (stickerRemoved) {
                if (discovered) {
                    let src;
                    if (isEvent) {
                        const eventId = entry.eventBaseKey.split('_')[1];
                        src = this._getEventItemImageDataUrl(eventId, typeIndex, level) || '';
                    } else {
                        src = BoardCore.getItemImageDataUrl(this._game, typeIndex, level) || '';
                    }
                    const img = document.createElement('img');
                    img.src = src;
                    img.style.cssText = 'width:90%; height:90%; object-fit:contain;';
                    cell.appendChild(img);
                } else {
                    const span = document.createElement('span');
                    span.style.cssText = 'font-size:clamp(1rem, 3vw, 2rem); color:#aaa;';
                    span.textContent = '?';
                    cell.appendChild(span);
                }
            } else {
                const sticker = document.createElement('div');
                sticker.className = 'sticker pulse-attention';
                sticker.style.cssText = 'width:100%; height:100%; background: #f0e6d3; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:clamp(1.2rem, 2.8vw, 1.5rem); color:#b89a7a;';
                sticker.textContent = '⭐';
                cell.appendChild(sticker);
            }

            levelsContainer.appendChild(cell);

            // Стрелка между уровнями
            if (i < groupItems.length - 1) {
                const arrow = document.createElement('span');
                arrow.className = 'arrow';
                arrow.style.cssText = 'font-size:clamp(0.8rem, 2.5vw, 1.2rem); color:#2a1f14; flex-shrink:0; padding:0 0.03rem;';
                arrow.textContent = '→';
                levelsContainer.appendChild(arrow);
            }
        }

        progBlock.appendChild(levelsContainer);
        container.appendChild(progBlock);
    }

    if (!hasAnyGroup) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'text-align:center; padding:0.5rem; color:#5a4a3a; font-size:clamp(0.7rem, 2vw, 1rem); flex-shrink:0;';
        emptyMsg.textContent = 'Пока нет открытых предметов в этой категории';
        container.appendChild(emptyMsg);
    }

    // Блок категорий (кнопки-иконки)
    const catBar = document.createElement('div');
    catBar.className = 'category-bar';
    catBar.style.cssText = 'display:flex; gap: clamp(0.1rem, 0.4vw, 0.3rem); overflow-x:auto; padding: clamp(0.05rem, 0.2vh, 0.2rem) 0; margin-top: clamp(0.1rem, 0.3vh, 0.4rem); justify-content:flex-start; flex-wrap:nowrap; scrollbar-width:none; -webkit-overflow-scrolling:touch; border-top:1px solid rgba(42,31,20,0.1); padding-top: clamp(0.2rem, 0.5vh, 0.4rem); flex-shrink:0;';

    for (const cat of this._categoryList) {
        const isActive = cat === category;
        const first = this._categories[cat][0];
        let imgSrc = '';
        if (first) {
            if (first.isEvent) {
                const eventId = first.eventBaseKey.split('_')[1];
                imgSrc = this._getEventItemImageDataUrl(eventId, first.typeIndex, first.level) || '';
            } else {
                imgSrc = BoardCore.getItemImageDataUrl(this._game, first.typeIndex, first.level) || '';
            }
        }

        const btn = document.createElement('button');
        btn.className = `category-btn ${isActive ? 'active' : ''}`;
        btn.dataset.category = cat;
        btn.style.cssText = 'border: none; background: transparent; box-shadow: none; padding:0; cursor:pointer; width: clamp(15px, 3vmin, 48px); height: clamp(15px, 3vmin, 48px); display:flex; align-items:center; justify-content:center; opacity: ' + (isActive ? '1' : '0.4') + '; filter: ' + (isActive ? 'none' : 'grayscale(0.7)') + '; transition: opacity 0.2s, filter 0.2s;';
        if (imgSrc) {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.style.cssText = 'width:90%; height:90%; object-fit:contain;';
            btn.appendChild(img);
        } else {
            btn.textContent = cat.slice(0, 2);
        }
        catBar.appendChild(btn);
    }

    container.appendChild(catBar);
    return container; // возвращаем DOM-элемент
},

// Внутри CollectionManager (после _loadProgress или в любом месте)
_enableDragScroll(container) {
    if (!container) return;
    // На мобильных устройствах не добавляем обработчики мыши
   if (Device.isMobile) return;

    const scrollContainers = container.querySelectorAll('.item-levels');
    if (!scrollContainers.length) return;

    // Удаляем старые обработчики для всех элементов (на случай повторного вызова)
    scrollContainers.forEach(scroll => {
        const oldHandlers = this._dragHandlers?.get(scroll);
        if (oldHandlers) {
            scroll.removeEventListener('pointerdown', oldHandlers.onPointerDown);
            document.removeEventListener('pointermove', oldHandlers.onPointerMove);
            document.removeEventListener('pointerup', oldHandlers.onPointerUp);
            this._dragHandlers.delete(scroll);
        }
    });

    // Создаём WeakMap для хранения обработчиков, если ещё нет
    if (!this._dragHandlers) this._dragHandlers = new WeakMap();

    scrollContainers.forEach(scroll => {
        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;

      const onPointerDown = (e) => {
    isDragging = true;
    startX = e.pageX - scroll.offsetLeft;
    scrollLeft = scroll.scrollLeft;
    scroll.style.cursor = 'grabbing';
    e.preventDefault();
};

const onPointerMove = (e) => {
    if (!isDragging) return;
    const x = e.pageX - scroll.offsetLeft;
    const walk = (x - startX) * 1.5;
    scroll.scrollLeft = scrollLeft - walk;
    e.preventDefault();
};

const onPointerUp = () => {
    isDragging = false;
    scroll.style.cursor = 'grab';
};
        scroll.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);

       this._dragHandlers.set(scroll, { onPointerDown, onPointerMove, onPointerUp });
        scroll.style.cursor = 'grab';
    });
},
_disableDragScroll(container) {
    if (!container) return;
    const scrollContainers = container.querySelectorAll('.item-levels');
    if (!scrollContainers.length) return;
    if (!this._dragHandlers) return;

    scrollContainers.forEach(scroll => {
        const handlers = this._dragHandlers.get(scroll);
        if (handlers) {
           scroll.removeEventListener('pointerdown', handlers.onPointerDown);
            document.removeEventListener('pointermove', handlers.onPointerMove);
            document.removeEventListener('pointerup', handlers.onPointerUp);
            this._dragHandlers.delete(scroll);
            scroll.style.cursor = '';
        }
    });
},


};