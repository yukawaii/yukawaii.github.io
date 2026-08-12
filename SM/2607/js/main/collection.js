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

    init(game) {
        this._game = game;
        this._loadProgress();
        this._buildCategories();
        this._createButton();
        this.updateButtonVisibility();
    },

    _loadProgress() {
        const prog = Storage.getProgress();
        this._discovered = prog.collection?.discovered || {};
        this._stickerRemoved = prog.collection?.stickerRemoved || {};
    },

    _saveProgress() {
        const prog = Storage.getProgress();
        if (!prog.collection) prog.collection = {};
        prog.collection.discovered = this._discovered;
        prog.collection.stickerRemoved = this._stickerRemoved;
        Storage.saveProgress(prog);
    },

  isDiscovered(typeIndex, level) {
    const key = `${typeIndex}_${level}`;
    return !!this._discovered[key];
},


_buildCategories() {
    this._categories = {};
    const itemData = window.ITEM_DATA || [];
    const maxLevels = window.getMaxLevelsForItems ? window.getMaxLevelsForItems() : [];

    for (const item of itemData) {
        const category = item.categoryKey || 'Прочее';
        if (!this._categories[category]) this._categories[category] = [];

        const maxLv = maxLevels[item.id] || 1;
        for (let level = 1; level <= maxLv; level++) {
            this._categories[category].push({ typeIndex: item.id, level: level });
        }
    }

    // Сортируем внутри категорий
    for (const cat of Object.keys(this._categories)) {
        this._categories[cat].sort((a, b) => {
            if (a.typeIndex !== b.typeIndex) return a.typeIndex - b.typeIndex;
            return a.level - b.level;
        });
    }

    // Фильтруем категории, в которых есть хотя бы один открытый предмет
    this._categoryList = Object.keys(this._categories)
        .filter(cat => {
            const items = this._categories[cat];
            return items.some(({ typeIndex, level }) => {
                const key = `${typeIndex}_${level}`;
                return !!this._discovered[key];
            });
        })
        .sort();
},

    onItemCreated(typeIndex, level) {
        const key = `${typeIndex}_${level}`;
        if (!this._discovered[key]) {
            this._discovered[key] = true;
            this._saveProgress();
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

    _createButton() {
        const container = document.getElementById('right-panel-dialogue');
        if (!container) return;
        if (document.getElementById('collection-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'collection-btn';
        btn.className = 'tb-btn';
      const colectUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/colect.png') || '';
btn.innerHTML = `<img src="${colectUrl}" style="width:70%; height:70%; object-fit:contain;">`;
        btn.addEventListener('pointerdown', () => {
            this.openCollectionModal();
        });
        container.appendChild(btn);
        this._button = btn;
    },

    updateButtonVisibility() {
        if (!this._button) return;
        const level = this._game ? this._game.level : 1;
        const show = level >= 2;
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

        const categoryName = getText(this._currentCategory, this._currentCategory);
        const title = getText('collection_title_category', 'Collection: {category}', { category: categoryName });

        const content = this._renderModalContent(this._currentCategory);
        this._modalInstance = ModalManager.showCenterModal({
            title: title,
            body: content,
            buttons: [],
            onClose: () => {
                this._modalInstance = null;
                this._currentCategory = null;
            }
        });

        const modalBody = this._modalInstance?.querySelector('.modal-body');
        if (modalBody) {
           modalBody.addEventListener('click', (e) => {
    // 1. Обработка клика по ячейке (стикер)
    const target = e.target.closest('.collection-cell');
    if (target) {
        const key = target.dataset.key;
        if (key && this._stickerRemoved[key] === undefined) {
            // Отмечаем стикер как снятый
            this._stickerRemoved[key] = true;
            this._saveProgress();

            // Обновляем только эту ячейку
            const [typeIndex, level] = key.split('_').map(Number);
            const discovered = this._discovered[key];
            let innerHtml;
            if (discovered) {
                const src = this._game?.getItemImageDataUrl(typeIndex, level) || '';
                innerHtml = `<img src="${src}" alt="" style="width:90%; height:90%; object-fit:contain;">`;
            } else {
                innerHtml = `<span style="font-size:clamp(1rem, 3vw, 2rem); color:#aaa;">?</span>`;
            }
            target.innerHTML = innerHtml;
            target.classList.remove('pulse-attention'); // убираем анимацию
        }
        return; // не идём дальше
    }

    // 2. Обработка клика по кнопке категории (оставляем как было)
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

        // Обновляем заголовок
        const titleEl = this._modalInstance.querySelector('.modal-title');
        if (titleEl) {
            const categoryName = getText(this._currentCategory, this._currentCategory);
            titleEl.textContent = getText('collection_title_category', 'Collection: {category}', { category: categoryName });
        }

        const newContent = this._renderModalContent(this._currentCategory);
        modalBody.innerHTML = newContent;
    },

_renderModalContent(category) {
    const items = this._categories[category] || [];
    if (items.length === 0) {
        return `<div style="text-align:center; padding:1rem; font-size:clamp(0.6rem, 2vw, 1rem);">Нет предметов в этой категории</div>`;
    }

    const groups = {};
    for (const { typeIndex, level } of items) {
        if (!groups[typeIndex]) groups[typeIndex] = [];
        groups[typeIndex].push(level);
    }

    const categoryName = getText(category, category);
    let html = `
        <div class="collection-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem; flex-shrink:0;">
            <span class="collection-category-name" style="font-size:clamp(0.5rem, 2vw, 1.2rem); font-weight:bold; color:#2a1f14;">${categoryName}</span>
        </div>
        <div class="collection-items-container" style="
            display:flex;
            flex-direction:column;
            gap:0.5rem;
            flex:1;
            overflow-y:auto;
            padding:0.1rem 0;
            min-height:0;
        ">
    `;

    const sortedTypes = Object.keys(groups).map(Number).sort((a,b) => a - b);
    let hasAnyGroup = false;

    for (const typeIndex of sortedTypes) {
        const levels = groups[typeIndex].sort((a,b) => a - b);
        const hasDiscovered = levels.some(level => {
            const key = `${typeIndex}_${level}`;
            return !!this._discovered[key];
        });
        if (!hasDiscovered) continue;

        hasAnyGroup = true;
        const total = levels.length;
        let discoveredCount = 0;
        for (const level of levels) {
            const key = `${typeIndex}_${level}`;
            if (this._discovered[key]) discoveredCount++;
        }

        const itemData = window.ITEM_DATA.find(it => it.id === typeIndex);
        const itemName = itemData ? getItemName(typeIndex, levels[0]) : `Предмет ${typeIndex}`;

        html += `
            <div class="item-progression" style="background: rgba(255,240,230,0.4); border-radius:10px; padding:0.2rem 0.3rem; border:1px solid #d9c5a6; flex-shrink:0;">
                <div class="item-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.1rem;">
                    <span class="item-name" style="font-weight:bold; font-size:clamp(0.7rem, 2.2vw, 1.1rem); color:#2a1f14;">${itemName}</span>
                    <span class="item-progress" style="font-size:clamp(0.6rem, 1.8vw, 0.9rem); color:#5a4a3a;">${discoveredCount}/${total}</span>
                </div>
                <div class="item-levels item-info-grid" style="gap:0.1rem; justify-content:flex-start; flex-wrap:nowrap; overflow-x:auto; padding:0.05rem 0;">
        `;

        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            const key = `${typeIndex}_${level}`;
            const discovered = !!this._discovered[key];
            const stickerRemoved = !!this._stickerRemoved[key];

            let innerHtml = '';
            if (stickerRemoved) {
                if (discovered) {
                  const src = this._game?.getItemImageDataUrl(typeIndex, level) || '';
                    innerHtml = `<img src="${src}" alt="" style="width:90%; height:90%; object-fit:contain;">`;
                } else {
                    innerHtml = `<span style="font-size:clamp(1rem, 3vw, 2rem); color:#aaa;">?</span>`;
                }
} else {
    innerHtml = `<div class="sticker pulse-attention" style="width:100%; height:100%; background: #f0e6d3; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:clamp(1.2rem, 2.8vw, 1.5rem); color:#b89a7a;">⭐</div>`;

            }

            html += `
                <div class="collection-cell item-info-cell" data-key="${key}" style="cursor:pointer; flex-shrink:0; width: clamp(35px, 6vmin, 65px); height: clamp(35px, 6vmin, 65px);">
                    ${innerHtml}
                </div>
            `;

            if (i < levels.length - 1) {
                html += `
                    <span class="arrow" style="font-size:clamp(0.8rem, 2.5vw, 1.2rem); color:#2a1f14; flex-shrink:0; padding:0 0.03rem;">→</span>
                `;
            }
        }

        html += `
                </div>
            </div>
        `;
    }

    if (!hasAnyGroup) {
        html += `<div style="text-align:center; padding:0.5rem; color:#5a4a3a; font-size:clamp(0.7rem, 2vw, 1rem); flex-shrink:0;">Пока нет открытых предметов в этой категории</div>`;
    }

    // Закрываем контейнер предметов
    html += `</div>`;

    // Блок категорий – фиксируется внизу
    html += `
        <div class="category-bar" style="
            display:flex;
            gap: clamp(0.1rem, 0.4vw, 0.3rem);
            overflow-x: auto;
            padding: clamp(0.05rem, 0.2vh, 0.2rem) 0;
            margin-top: clamp(0.1rem, 0.3vh, 0.4rem);
            justify-content: flex-start;
            flex-wrap: nowrap;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            border-top: 1px solid rgba(42,31,20,0.1);
            padding-top: clamp(0.2rem, 0.5vh, 0.4rem);
            flex-shrink:0;
        ">
    `;

    for (const cat of this._categoryList) {
        const isActive = cat === category;
        const first = this._categories[cat][0];
        const imgSrc = first ? this._game?.getItemImageDataUrl(first.typeIndex, first.level) : '';
        html += `
            <button class="category-btn ${isActive ? 'active' : ''}" data-category="${cat}" style="
                border: none;
                background: transparent;
                box-shadow: none;
                padding: 0;
                cursor: pointer;
                width: clamp(15px, 3vmin, 48px);
                height: clamp(15px, 3vmin, 48px);
                display: flex;
                align-items: center;
                justify-content: center;
                        opacity: ${isActive ? 1 : 0.4};
                filter: ${isActive ? 'none' : 'grayscale(0.7)'};
                transition: opacity 0.2s, filter 0.2s;
            ">
                ${imgSrc ? `<img src="${imgSrc}" style="width:80%; height:80%; object-fit:contain;">` : cat.slice(0,2)}
            </button>
        `;
    }

    html += `</div>`;

    return html;
},


};