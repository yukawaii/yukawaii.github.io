// ===== РАСКРАСКА: ОСНОВНАЯ ЛОГИКА =====
// ===== ПАГИНАЦИЯ СВИТКОВ =====
const SCROLLS_PER_PAGE = 5; // сколько свитков на странице
let currentScrollPage = 1;

const CATEGORIES = {
    easy: { name: '🌟 Лёгкие', folder: 'easy', count: 30, hasSubcategories: false },
    cosmos: { name: '🌌 Космос', folder: 'cosmos', count: 50, hasSubcategories: false },
    animals: {
        name: '🐾 Животные',
        folder: 'animals',
        count: 100, // общее количество (сумма подкатегорий)
        hasSubcategories: true,
        subcategories: {
            easy: { name: 'Легче', folder: 'animals/easy', count: 50 },
            hard: { name: 'Сложнее', folder: 'animals/hard', count: 50 }
        }
    },
    people: {
        name: '👤 Люди',  // вместо 'Аниме'
        folder: 'people',
        count: 100,
        hasSubcategories: true,
        subcategories: {
            easy: { name: 'Легче', folder: 'people/easy', count: 50 },
            hard: { name: 'Сложнее', folder: 'people/hard', count: 50 }
        }
    },
    plants: {
        name: '🌿 Растения',
        folder: 'plants',
        count: 100,
        hasSubcategories: true,
        subcategories: {
            easy: { name: 'Легче', folder: 'plants/easy', count: 50 },
            hard: { name: 'Сложнее', folder: 'plants/hard', count: 50 }
        }
    },
    food: {
        name: '🍕 Еда',
        folder: 'food',
        count: 100,
        hasSubcategories: true,
        subcategories: {
            easy: { name: 'Легче', folder: 'food/easy', count: 50 },
            hard: { name: 'Сложнее', folder: 'food/hard', count: 50 }
        }
    },
    items: {
        name: '📦 Предметы',
        folder: 'items',
        count: 100,
        hasSubcategories: true,
        subcategories: {
            easy: { name: 'Легче', folder: 'items/easy', count: 50 },
            hard: { name: 'Сложнее', folder: 'items/hard', count: 50 }
        }
    },
    doodles: { name: '✏️ Дудлс', folder: 'doodles', count: 50, hasSubcategories: false },
    mandala: { name: '🌀 Мандала', folder: 'mandala', count: 50, hasSubcategories: false }
};

const COLORS = ['#ffffff', '#f0e6ff', '#c8b8ff', '#ffd6e8', '#b8d4ff', '#ffd700'];

let currentSubcategory = {}; // { categoryKey: 'easy' или 'hard' }





let appState = {
    totalPoints: 0,
    coloredImages: [],
    currentCategory: null,
    currentImage: null,
    unlockedAchievements: []
};

// ===== УРОВНИ И ПАГИНАЦИЯ =====
const LEVELS_PER_PAGE = 15;
const UNLOCK_COUNT = 5;

let currentCategory = null;
let currentPage = 0;
let pendingUnlockLevel = null;
let unlockedLevels = {};
let adLoadingTimer = null;  // ← ОБЪЯВЛЯЕМ ТОЛЬКО ЗДЕСЬ

// ===== СОЗДАНИЕ КОСМИЧЕСКОГО ФОНА =====
function createCosmicBackground() {
    const oldBg = document.getElementById('cosmic-bg');
    if (oldBg) oldBg.remove();

    const bg = document.createElement('div');
    bg.id = 'cosmic-bg';
    document.body.prepend(bg);

    // Определяем мобильное устройство по ширине экрана
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 10 : 30;
    const meteorCount = isMobile ? 1 : 3;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
        star.style.setProperty('--duration', (Math.random() * 4 + 2) + 's');
        star.style.animationDelay = (Math.random() * 4) + 's';
        star.style.opacity = Math.random() * 0.7 + 0.2;
        star.style.boxShadow = `0 0 ${Math.random() * 6 + 2}px ${star.style.background}`;
        bg.appendChild(star);
    }

    const meteorColors = ['#a855f7', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'];
    for (let i = 0; i < meteorCount; i++) {
        const meteor = document.createElement('div');
        meteor.className = 'meteor';
        const color = meteorColors[Math.floor(Math.random() * meteorColors.length)];
        meteor.style.left = (Math.random() * 70 + 10) + '%';
        meteor.style.top = (Math.random() * 40 + 5) + '%';
        meteor.style.animationDuration = (Math.random() * 6 + 4) + 's';
        meteor.style.animationDelay = (Math.random() * 3) + 's';
        meteor.style.background = color;
        meteor.style.boxShadow = `0 0 12px 4px ${color}40, 0 0 40px 8px ${color}20`;
        meteor.style.width = '4px';
        meteor.style.height = '4px';
        bg.appendChild(meteor);
    }

    applyThemeToBackground(document.documentElement.getAttribute('data-theme') || 'cosmic');
}

function applyThemeToBackground(theme) {
    const bg = document.getElementById('cosmic-bg');
    if (!bg) return;
    const themes = {
        cosmic: 'radial-gradient(ellipse at 20% 50%, rgba(80, 20, 160, 0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(30, 60, 200, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(200, 50, 150, 0.2) 0%, transparent 50%), #0a0a1a',
        pastel: 'radial-gradient(ellipse at 30% 40%, rgba(244, 114, 182, 0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(251, 191, 36, 0.15) 0%, transparent 50%), #faf0f5',
        blue: 'radial-gradient(ellipse at 30% 40%, rgba(59, 130, 246, 0.25) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), #0a1628'
    };
    bg.style.background = themes[theme] || themes.cosmic;
}

// ===== ТЕМЫ =====
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('coloringTheme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    applyThemeToBackground(theme);
}

function loadTheme() {
    const saved = localStorage.getItem('coloringTheme') || 'cosmic';
    setTheme(saved);
}

// ===== ЗАГРУЗКА/СОХРАНЕНИЕ =====
function saveState() {
    try {
        localStorage.setItem('coloringAppState', JSON.stringify({
            totalPoints: appState.totalPoints,
            coloredImages: appState.coloredImages,
            unlockedAchievements: appState.unlockedAchievements
        }));
        saveUnlockedState();
        saveBrushesState();
        // VK синхронизация
        if (typeof saveAppStateToVK === 'function') saveAppStateToVK();
    } catch(e) {}
}

function loadState() {
    try {
        const saved = localStorage.getItem('coloringAppState');
        if (saved) {
            const parsed = JSON.parse(saved);
            appState.totalPoints = parsed.totalPoints || 0;
            appState.coloredImages = parsed.coloredImages || [];
            appState.unlockedAchievements = parsed.unlockedAchievements || [];
        }
        // После загрузки из localStorage загружаем из VK (если доступен)
        if (typeof loadAppStateFromVK === 'function') {
            loadAppStateFromVK().then(() => {
                updateStats();
                if (currentCategory) renderLevels(currentCategory);
            });
        }
        updateStats();
    } catch(e) {}
}


function updateStats() {
    document.getElementById('totalPoints').textContent = appState.totalPoints;
    document.getElementById('coloredCount').textContent = appState.coloredImages.length;
}

function addPoints(points) {
    appState.totalPoints += points;
    updateStats();
    saveState();
    checkAchievements();
    // Синхронизация рекорда с VK
    if (typeof syncLeaderboard === 'function') {
        syncLeaderboard(appState.totalPoints);
    }
}

function markAsColored(category, index) {
    const cat = CATEGORIES[category];
    let subKey = null;
    if (cat.hasSubcategories) {
        subKey = currentSubcategory[category] || 'easy';
    }
    const key = subKey ? `${category}-${subKey}-${index}` : `${category}-${index}`;
    if (!appState.coloredImages.some(item => `${item.category}-${item.subcategory || ''}-${item.index}` === key)) {
        appState.coloredImages.push({ 
            category, 
            subcategory: subKey, 
            index 
        });
        saveState();
        updateStats();
        if (appState.currentCategory) renderLevels(appState.currentCategory);
    }
}

function isColored(category, index) {
    const cat = CATEGORIES[category];
    let subKey = null;
    if (cat.hasSubcategories) {
        subKey = currentSubcategory[category] || 'easy';
    }
    const key = subKey ? `${category}-${subKey}-${index}` : `${category}-${index}`;
    return appState.coloredImages.some(item => {
        const itemKey = item.subcategory ? `${item.category}-${item.subcategory}-${item.index}` : `${item.category}-${item.index}`;
        return itemKey === key;
    });
}

function isColored(category, index) {
    return appState.coloredImages.some(item => item.category === category && item.index === index);
}

// ===== УРОВНИ =====
function loadUnlockedState() {
    try {
        const saved = localStorage.getItem('coloringUnlockedLevels');
        if (saved) {
            unlockedLevels = JSON.parse(saved);
        }
    } catch(e) {}
}

function saveUnlockedState() {
    try {
        localStorage.setItem('coloringUnlockedLevels', JSON.stringify(unlockedLevels));
    } catch(e) {}
}

function isLevelUnlocked(category, levelIndex, subKey) {
    if (levelIndex < UNLOCK_COUNT) return true;
    const key = subKey ? `${category}-${subKey}-${levelIndex}` : `${category}-${levelIndex}`;
    return unlockedLevels[key] === true;
}

function unlockLevel(category, levelIndex, subKey) {
    const key = subKey ? `${category}-${subKey}-${levelIndex}` : `${category}-${levelIndex}`;
    unlockedLevels[key] = true;
    saveUnlockedState();
}

// ===== ОТКРЫТЬ КАТЕГОРИЮ =====
function openCategory(categoryKey) {
    currentCategory = categoryKey;
    currentPage = 0;
    document.getElementById('categoryTitle').textContent = CATEGORIES[categoryKey].name;
    renderLevels(categoryKey);
    document.getElementById('categoryModal').classList.add('show');
}

function closeCategory() {
    document.getElementById('categoryModal').classList.remove('show');
    currentCategory = null;
}

// ===== ОТРИСОВКА УРОВНЕЙ =====
function renderLevels(categoryKey) {
    const grid = document.getElementById('levelGrid');
    const category = CATEGORIES[categoryKey];
    
    // Определяем, какую подкатегорию показывать
    let currentCat = category;
    let subKey = null;
    if (category.hasSubcategories) {
        if (!currentSubcategory[categoryKey]) {
            currentSubcategory[categoryKey] = 'easy'; // по умолчанию 'easy'
        }
        subKey = currentSubcategory[categoryKey];
        currentCat = category.subcategories[subKey];
    }
    
    const totalLevels = currentCat.count;
    const totalPages = Math.ceil(totalLevels / LEVELS_PER_PAGE);
    
    document.getElementById('pageInfo').textContent = `${currentPage + 1} / ${totalPages}`;
    
    const prevBtn = document.querySelector('.btn-pagination:first-child');
    const nextBtn = document.querySelector('.btn-pagination:last-child');
    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
    
    const start = currentPage * LEVELS_PER_PAGE;
    const end = Math.min(start + LEVELS_PER_PAGE, totalLevels);
    
    grid.innerHTML = '';
    
    // ===== КНОПКИ ПЕРЕКЛЮЧЕНИЯ ПОДКАТЕГОРИЙ =====
    if (category.hasSubcategories) {
        const subHeader = document.createElement('div');
        subHeader.style.cssText = 'display:flex;justify-content:center;gap:12px;margin-bottom:12px;grid-column:1/-1;';
        
        const subKeys = Object.keys(category.subcategories);
        subKeys.forEach(key => {
            const btn = document.createElement('button');
            btn.textContent = category.subcategories[key].name;
            btn.className = 'btn-subcategory';
            btn.style.cssText = `
                padding: 6px 16px;
                border-radius: 20px;
                border: 2px solid ${currentSubcategory[categoryKey] === key ? '#a855f7' : 'rgba(255,255,255,0.15)'};
                background: ${currentSubcategory[categoryKey] === key ? 'rgba(168,85,247,0.25)' : 'transparent'};
                color: ${currentSubcategory[categoryKey] === key ? '#f0eaff' : 'var(--text-secondary)'};
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
                font-weight: ${currentSubcategory[categoryKey] === key ? '600' : '400'};
            `;
            btn.onclick = function() {
                currentSubcategory[categoryKey] = key;
                currentPage = 0;
                renderLevels(categoryKey);
            };
            subHeader.appendChild(btn);
        });
        grid.appendChild(subHeader);
    }
    // ===== КОНЕЦ =====
    
    let completed = 0;
    let total = 0;
    
    // Используем правильный путь для картинок
    const folderPath = currentCat.folder;
    
    for (let i = 0; i < totalLevels; i++) {
        const levelNum = i + 1;
        // Для подкатегорий используем составной ключ
        const storageKey = category.hasSubcategories ? `${categoryKey}-${subKey}-${levelNum}` : `${categoryKey}-${levelNum}`;
        const isUnlocked = isLevelUnlocked(categoryKey, i, subKey);
        const isCompleted = isColored(categoryKey, levelNum); // isColored теперь работает с подкатегориями
        
        if (isCompleted) completed++;
        total++;
        
        if (i >= start && i < end) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = levelNum;
            
            if (isCompleted) {
                btn.classList.add('completed');
            }
            
            if (!isUnlocked) {
                btn.classList.add('locked');
                btn.addEventListener('click', function() {
                    openUnlockModal(categoryKey, i, subKey);
                });
            } else {
                btn.addEventListener('click', function() {
                    // Передаём путь к картинке
                    const imgPath = `images/${folderPath}/${levelNum}.jpg`;
                    openColoring(categoryKey, levelNum, imgPath);
                    closeCategory();
                });
                if (isCompleted) {
                    btn.title = 'Уже раскрашено!';
                }
            }
            
            grid.appendChild(btn);
        }
    }
    
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('categoryProgress').textContent = percent;
    document.getElementById('categoryProgressFill').style.width = percent + '%';
}

// ===== ПАГИНАЦИЯ =====
function changePage(delta) {
    if (!currentCategory) return;
    const category = CATEGORIES[currentCategory];
    const totalPages = Math.ceil(category.count / LEVELS_PER_PAGE);
    const newPage = currentPage + delta;
    if (newPage < 0 || newPage >= totalPages) return;
    currentPage = newPage;
    renderLevels(currentCategory);
}

// ===== МОДАЛКА ОТКРЫТИЯ УРОВНЯ =====
function openUnlockModal(categoryKey, levelIndex, subKey) {
    pendingUnlockLevel = { category: categoryKey, index: levelIndex, subKey: subKey };
    document.getElementById('unlockModal').classList.add('show');
}

function closeUnlockModal() {
    document.getElementById('unlockModal').classList.remove('show');
    pendingUnlockLevel = null;
}

// ===== РЕКЛАМА =====
function preloadRewardAd() {
    const bridge = typeof vkBridge !== 'undefined' ? vkBridge : window.vkBridge;
    if (!bridge) {
        console.warn('⚠️ VK Bridge не доступен для предзагрузки рекламы');
        return;
    }
    
    bridge.send('VKWebAppCheckNativeAds', {
        ad_format: 'reward'
    })
    .then(function(data) {
        console.log('✅ Реклама предзагружена:', data);
    })
    .catch(function(error) {
        console.warn('⚠️ Ошибка предзагрузки рекламы:', error);
    });
}

function watchAdForUnlock() {
    if (!pendingUnlockLevel) return;
    
    closeUnlockModal();
    document.getElementById('adLoadingModal').classList.add('show');
    
    if (adLoadingTimer) clearTimeout(adLoadingTimer);
    adLoadingTimer = setTimeout(function() {
        document.getElementById('adLoadingModal').classList.remove('show');
        showAdError();
    }, 10000);
    
    const bridge = typeof vkBridge !== 'undefined' ? vkBridge : window.vkBridge;
    
    if (bridge) {
        bridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then(function(data) {
            if (adLoadingTimer) {
                clearTimeout(adLoadingTimer);
                adLoadingTimer = null;
            }
            
            if (data && data.result) {
                return bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
            } else {
                document.getElementById('adLoadingModal').classList.remove('show');
                showAdError();
                return Promise.reject('Ad not available');
            }
        })
        .then(function(adResult) {
            if (adLoadingTimer) {
                clearTimeout(adLoadingTimer);
                adLoadingTimer = null;
            }
            document.getElementById('adLoadingModal').classList.remove('show');
            if (adResult && adResult.result) {
                console.log('✅ Реклама просмотрена');
                unlockAndOpenLevel();
            } else {
                unlockAndOpenLevel();
            }
        })
        .catch(function(error) {
            if (adLoadingTimer) {
                clearTimeout(adLoadingTimer);
                adLoadingTimer = null;
            }
            console.warn('⚠️ Ошибка показа рекламы:', error);
            document.getElementById('adLoadingModal').classList.remove('show');
            showAdError();
        });
    } else {
        setTimeout(function() {
            if (adLoadingTimer) {
                clearTimeout(adLoadingTimer);
                adLoadingTimer = null;
            }
            document.getElementById('adLoadingModal').classList.remove('show');
            unlockAndOpenLevel();
        }, 1500);
    }
}

function unlockAndOpenLevel() {
    if (!pendingUnlockLevel) return;
    const { category, index, subKey } = pendingUnlockLevel;
    unlockLevel(category, index, subKey);
    pendingUnlockLevel = null;
    renderLevels(category);
    showToast('🎉Уровень открыт!');
}

function showAdError() {
    document.getElementById('adErrorModal').classList.add('show');
}

function closeAdErrorModal() {
    document.getElementById('adErrorModal').classList.remove('show');
    if (currentCategory) {
        renderLevels(currentCategory);
    }
}

// ===== ПРОСМОТР РЕКЛАМЫ ДЛЯ КИСТИ =====
function watchAdForBrushUnlock() {
    const brushId = window._pendingBrushUnlock;
    if (!brushId) return;
    
    closeUnlockModal();
    document.getElementById('adLoadingModal').classList.add('show');
    
    const bridge = typeof vkBridge !== 'undefined' ? vkBridge : window.vkBridge;
    
    if (bridge) {
        bridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then(function(data) {
            if (data && data.result) {
                return bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
            } else {
                document.getElementById('adLoadingModal').classList.remove('show');
                showAdError();
                return Promise.reject('Ad not available');
            }
        })
        .then(function(adResult) {
            document.getElementById('adLoadingModal').classList.remove('show');
            // Разблокируем кисть на 24 часа
            if (typeof unlockBrushFor24Hours === 'function') {
                unlockBrushFor24Hours(brushId);
            }
            window._pendingBrushUnlock = null;
            window._pendingBrushUnlockFromColoring = false;
            showToast(`✅ Кисть открыта на 24 часа!`);
        })
        .catch(function(error) {
            document.getElementById('adLoadingModal').classList.remove('show');
            showAdError();
        });
    } else {
        // Если VK нет - для тестирования
        setTimeout(function() {
            document.getElementById('adLoadingModal').classList.remove('show');
            if (typeof unlockBrushFor24Hours === 'function') {
                unlockBrushFor24Hours(brushId);
            }
            window._pendingBrushUnlock = null;
            window._pendingBrushUnlockFromColoring = false;
            showToast(`✅ Кисть открыта на 24 часа!`);
        }, 1500);
    }
}

// ===== РАСКРАСКА =====
function openColoring(categoryKey, index, imagePath) {
    appState.currentImage = { category: categoryKey, index };
    const wrapper = document.getElementById('coloringCanvasWrapper');
    wrapper.innerHTML = '';

    // Если путь не передан - определяем сами
    let path = imagePath;
    if (!path) {
        const category = CATEGORIES[categoryKey];
        let currentCat = category;
        if (category.hasSubcategories) {
            const subKey = currentSubcategory[categoryKey] || 'easy';
            currentCat = category.subcategories[subKey];
        }
        path = `images/${currentCat.folder}/${index}.jpg`;
    }

    // Запрещаем скролл на body при открытии раскраски
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';

    const coloringBook = document.createElement('jl-coloringbook');
    coloringBook.setAttribute('autoinit', '1');
    coloringBook.setAttribute('css', 'customizedTheme.css');
    coloringBook.setAttribute('maxbrushsize', '32');
    coloringBook.style.width = '100%';
    coloringBook.style.display = 'block';
    coloringBook.style.webkitTapHighlightColor = 'transparent';
    coloringBook.style.userSelect = 'none';
    
    coloringBook.innerHTML = `<img src="${path}" />`;

    wrapper.appendChild(coloringBook);

    document.getElementById('coloringPoints').textContent = '0';
    document.getElementById('progressPercent').textContent = '0';

    document.getElementById('coloringModal').classList.add('show');

    let pointsEarned = false;
    
    coloringBook.addEventListener('progressUpdate', function(e) {
        const percent = e.detail.percent;
        document.getElementById('progressPercent').textContent = percent;
        
        if (percent >= 80 && !pointsEarned) {
            pointsEarned = true;
            const points = 1;
            document.getElementById('coloringPoints').textContent = points;
            addPoints(points);
            markAsColored(categoryKey, index);
            showToast(`🎉 +${points} очко за раскраску!`);
        }
        
        if (percent >= 100) {
            showToast('✅ Картинка полностью раскрашена!');
        }
    });

    if (window._progressInterval) {
        clearInterval(window._progressInterval);
        window._progressInterval = null;
    }
    
    window._progressInterval = setInterval(async function() {
        try {
            if (coloringBook.getProgress) {
                const result = await coloringBook.getProgress();
                const percent = result.percent;
                document.getElementById('progressPercent').textContent = percent;
                
                if (percent >= 80 && !pointsEarned) {
                    pointsEarned = true;
                    const points = 1;
                    document.getElementById('coloringPoints').textContent = points;
                    addPoints(points);
                    markAsColored(categoryKey, index);
                    showToast(`🎉 +${points} очко за раскраску!`);
                }
                
                if (percent >= 100) {
                    showToast('✅ Картинка полностью раскрашена!');
                    if (window._progressInterval) {
                        clearInterval(window._progressInterval);
                        window._progressInterval = null;
                    }
                }
            }
        } catch(e) {}
    }, 2000);
}

function closeColoring() {
    document.getElementById('coloringModal').classList.remove('show');
    if (window._progressInterval) {
        clearInterval(window._progressInterval);
        window._progressInterval = null;
    }
    // Возвращаем скролл
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
}

function resetColoring() {
    if (confirm('Сбросить раскраску? Прогресс будет потерян.')) {
        if (window._progressInterval) {
            clearInterval(window._progressInterval);
            window._progressInterval = null;
        }
        document.getElementById('coloringCanvasWrapper').innerHTML = '';
        document.getElementById('coloringModal').classList.remove('show');
        setTimeout(function() {
            if (appState.currentImage) {
                openColoring(appState.currentImage.category, appState.currentImage.index);
            }
        }, 300);
    }
}

// ===== МОДАЛКИ =====
function openAchievements() {   
    achievementsCurrentPage = 0;  
    document.getElementById('achievementsModal').classList.add('show');
    renderAchievements();
}

function closeAchievements() {
    document.getElementById('achievementsModal').classList.remove('show');
}

function openCollections() {
    document.getElementById('collectionsModal').classList.add('show');
    renderCollections();
}

function closeCollections() {
    document.getElementById('collectionsModal').classList.remove('show');
}

// ===== TOAST =====
function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
}

// ===== ИНИЦИАЛИЗАЦИЯ КНОПОК ТЕМ =====
function initThemeButtons() {
    document.querySelectorAll('.theme-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const theme = this.dataset.theme;
            setTheme(theme);
        });
    });
}

// ===== МОДАЛКА "ДРУГИЕ ИГРЫ" =====
function openGamesModal() {
    const modal = document.getElementById('gamesModal');
    if (modal) modal.classList.add('show');
}

function closeGamesModal() {
    const modal = document.getElementById('gamesModal');
    if (modal) modal.classList.remove('show');
}

// Чтобы точно быть уверенным, можно продублировать через window:
window.openGamesModal = openGamesModal;
window.closeGamesModal = closeGamesModal;

// ===== ЗАПРЕТ КОНТЕКСТНОГО МЕНЮ И СВАЙПОВ =====
// Запрет контекстного меню на всей странице (глобально)
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация фона, тем, состояния
    createCosmicBackground();
    loadTheme();
    loadState();
    loadUnlockedState();
    loadBrushesState(); 
    initThemeButtons();
    console.log('🎨 Раскраска загружена!');
    
    // Запрет свайпов (pull-to-refresh)
    document.addEventListener('touchmove', function(e) {
        // Проверяем, не является ли элемент скроллируемым
        const target = e.target;
        const isScrollable = target.closest && target.closest('.modal-content, #achievementsList, #collectionsList, .level-grid');
        
        if (isScrollable) {
            // Разрешаем скролл внутри модалок
            const scrollable = isScrollable;
            const scrollTop = scrollable.scrollTop;
            const scrollHeight = scrollable.scrollHeight;
            const clientHeight = scrollable.clientHeight;
            
            // Если скролл в начале и тянем вниз, или в конце и тянем вверх - блокируем
            if ((scrollTop === 0 && e.touches[0].clientY > 0) || 
                (scrollTop + clientHeight >= scrollHeight && e.touches[0].clientY < 0)) {
                e.preventDefault();
                return false;
            }
            return true;
        }
        
        // Для всех остальных элементов запрещаем скролл
        e.preventDefault();
        return false;
    }, { passive: false });
    
    // Запрет двойного тапа для зума на мобильных
    document.addEventListener('touchend', function(e) {
        if (e.target.closest && e.target.closest('.level-grid, #coloringCanvasWrapper')) {
            return;
        }
        // Не блокируем двойной тап полностью, только если это не зум
    }, { passive: true });
    
    // Отключаем жест "назад" свайпом (для iOS)
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    
    // Для всех скроллируемых контейнеров добавляем overscroll-behavior: contain
    document.querySelectorAll('.modal-content, .level-grid, #achievementsList, #collectionsList').forEach(el => {
        el.style.overscrollBehavior = 'contain';
    });
    
    console.log('🚫 Контекстное меню и свайпы отключены');

    
});
document.addEventListener('DOMContentLoaded', function() {
    createCosmicBackground();
    loadTheme();
    loadState();
    loadUnlockedState();
    loadBrushesState();
    loadDailyBonusData(); // ← добавить
    initThemeButtons();
    console.log('🎨 Раскраска загружена!');
});

// ===== КИСТИ: КОНФИГУРАЦИЯ =====
const BRUSHES_CONFIG = {
    simple: { id: 'simple', name: 'Простая', icon: '🖊️', defaultUnlocked: true },
    solid: { id: 'solid', name: 'Твёрдая', icon: '✏️', defaultUnlocked: true },
    soft: { id: 'soft', name: 'Мягкая', icon: '🖌️', defaultUnlocked: true },
    sparkle: { id: 'sparkle', name: 'Блёстки', icon: '✨', defaultUnlocked: false },
    texture: { id: 'texture', name: 'Текстура', icon: '🌟', defaultUnlocked: false },
    dotted: { id: 'dotted', name: 'Пунктир', icon: '▪️', defaultUnlocked: false },
    outline: { id: 'outline', name: 'Обводка', icon: '🔲', defaultUnlocked: false },
    neon: { id: 'neon', name: 'Неон', icon: '💡', defaultUnlocked: false },
    rainbow: { id: 'rainbow', name: 'Радуга', icon: '🌈', defaultUnlocked: false }
};

// ===== СОСТОЯНИЕ КИСТЕЙ =====
let brushesState = {};

function loadBrushesState() {
    try {
        const saved = localStorage.getItem('coloringBrushesState');
        if (saved) {
            brushesState = JSON.parse(saved);
            // Проверяем, не истекло ли время
            const now = Date.now();
            for (const [id, data] of Object.entries(brushesState)) {
                // Если кисть по умолчанию всегда открыта
                if (BRUSHES_CONFIG[id] && BRUSHES_CONFIG[id].defaultUnlocked) {
                    brushesState[id] = {
                        unlocked: true,
                        expiresAt: null
                    };
                    continue;
                }
                // Проверяем срок действия для остальных
                if (data.unlocked && data.expiresAt && data.expiresAt < now) {
                    data.unlocked = false;
                    data.expiresAt = null;
                }
            }
        } else {
            // Инициализируем состояние
            for (const [id, config] of Object.entries(BRUSHES_CONFIG)) {
                brushesState[id] = {
                    unlocked: config.defaultUnlocked || false,
                    expiresAt: null
                };
            }
        }
        saveBrushesState();
    } catch(e) {
        console.warn('⚠️ Ошибка загрузки состояния кистей:', e);
    }
}

function saveBrushesState() {
    try {
        localStorage.setItem('coloringBrushesState', JSON.stringify(brushesState));
    } catch(e) {}
}

function isBrushUnlocked(brushId) {
    // Сначала проверяем, есть ли кисть в конфиге с defaultUnlocked
    if (BRUSHES_CONFIG[brushId] && BRUSHES_CONFIG[brushId].defaultUnlocked) {
        return true; // Всегда открыта
    }
    
    const state = brushesState[brushId];
    if (!state) return false;
    
    // Если unlocked и есть expiresAt - проверяем не истекло ли
    if (state.unlocked && state.expiresAt) {
        if (Date.now() > state.expiresAt) {
            state.unlocked = false;
            state.expiresAt = null;
            saveBrushesState();
            return false;
        }
        return true;
    }
    return state.unlocked || false;
}

function unlockBrushFor24Hours(brushId) {
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 часа в миллисекундах
    
    if (!brushesState[brushId]) {
        brushesState[brushId] = { unlocked: false, expiresAt: null };
    }
    
    brushesState[brushId].unlocked = true;
    brushesState[brushId].expiresAt = expiresAt;
    saveBrushesState();
    
    // Сохраняем в VK Storage для синхронизации
    saveBrushesToVK();
}

// ===== СИНХРОНИЗАЦИЯ С VK STORAGE =====
function saveAppStateToVK() {
    const bridge = getVKBridge ? getVKBridge() : null;
    if (!bridge) return;

    const data = {
        totalPoints: appState.totalPoints,
        coloredImages: appState.coloredImages,
        unlockedAchievements: appState.unlockedAchievements,
        unlockedLevels: unlockedLevels,
        brushesState: brushesState,
        scrollsProgress: getScrollsProgress ? getScrollsProgress() : {},
            dailyBonusData: dailyBonusData     
    };
    bridge.send('VKWebAppStorageSet', {
        key: 'coloringAppData',
        value: JSON.stringify(data)
    }).catch(e => console.warn('VK save error:', e));
}

function loadAppStateFromVK() {
    const bridge = getVKBridge ? getVKBridge() : null;
    if (!bridge) return Promise.resolve();

    return bridge.send('VKWebAppStorageGet', { keys: ['coloringAppData'] })
        .then(result => {
            if (result && result.keys && result.keys.length > 0) {
                const value = result.keys[0].value;
                if (value) {
                    try {
                        const data = JSON.parse(value);
                        // Обновляем appState
                        if (data.totalPoints !== undefined) appState.totalPoints = data.totalPoints;
                        if (data.coloredImages) appState.coloredImages = data.coloredImages;
                        if (data.unlockedAchievements) appState.unlockedAchievements = data.unlockedAchievements;
                        if (data.unlockedLevels) unlockedLevels = data.unlockedLevels;
                        if (data.brushesState) brushesState = data.brushesState;
                        if (data.scrollsProgress) {
                            localStorage.setItem('coloringScrollsProgress', JSON.stringify(data.scrollsProgress));
                        }
                        if (data.dailyBonusData) {
                            dailyBonusData = data.dailyBonusData;
                            localStorage.setItem('dailyBonusData', JSON.stringify(dailyBonusData));
                        }
                        // Обновляем UI
                        updateStats();
                        if (currentCategory) renderLevels(currentCategory);
                        return data;
                    } catch(e) {}
                }
            }
            return null;
        })
        .catch(e => {
            console.warn('VK load error:', e);
            return null;
        });
}
// ===== МОДАЛКА СВИТКОВ =====
function openScrollsModal() {
    currentScrollPage = 1;
    document.getElementById('scrollsModal').classList.add('show');
    renderScrolls();
}

function closeScrollsModal() {
    document.getElementById('scrollsModal').classList.remove('show');
}
// ===== МОДАЛКА ТЕКСТА СВИТКА =====
function openScrollTextModal(scrollId) {
    const modal = document.getElementById('scrollTextModal');
    const title = document.getElementById('scrollTextTitle');
    const content = document.getElementById('scrollTextContent');
    if (!modal || !title || !content) return;
    
    title.textContent = `📜 Свиток ${scrollId}`;
    content.textContent = getScrollText(scrollId);
    modal.classList.add('show');
}

function closeScrollTextModal() {
    document.getElementById('scrollTextModal').classList.remove('show');
}
function renderScrolls() {
    const container = document.getElementById('scrollsList');
    if (!container) return;
    container.innerHTML = '';
    
    const progress = getScrollsProgress();
    const total = getScrollsCount();
    const totalPages = Math.ceil(total / SCROLLS_PER_PAGE);
    
    const startIndex = (currentScrollPage - 1) * SCROLLS_PER_PAGE;
    const endIndex = Math.min(startIndex + SCROLLS_PER_PAGE, total);
    
    for (let i = startIndex + 1; i <= endIndex; i++) {
        const unlocked = progress[i] === true;
        const div = document.createElement('div');
        div.className = 'scroll-item';
        div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = `📜 Свиток ${i}`;
        textSpan.style.color = unlocked ? 'var(--text-primary)' : 'var(--text-secondary)';
        textSpan.style.fontSize = '15px';
        
        const statusSpan = document.createElement('span');
        if (unlocked) {
            statusSpan.textContent = '✅';
            statusSpan.style.fontSize = '20px';
        } else {
            statusSpan.innerHTML = '🔒 10⭐';
            statusSpan.style.cursor = 'pointer';
            statusSpan.style.fontSize = '16px';
            statusSpan.style.color = '#fbbf24';
            statusSpan.onclick = function(e) {
                e.stopPropagation();
                const result = buyScroll(i);
                if (result.success) {
                    renderScrolls();
                    updateStats();
                    showToast('✅ Свиток куплен!');
                } else {
                    showToast(result.message);
                }
            };
        }
        div.appendChild(textSpan);
        div.appendChild(statusSpan);
        div.onclick = function() {
            if (unlocked) {
                openScrollTextModal(i);
            }
        };
        container.appendChild(div);
    }
    
    // Обновляем информацию о странице
    const pageInfo = document.getElementById('scrollsPageInfo');
    if (pageInfo) {
        pageInfo.textContent = `${currentScrollPage} / ${totalPages}`;
    }
    
    // Обновляем состояние кнопок пагинации
    const prevBtn = document.getElementById('scrollsPrevPage');
    const nextBtn = document.getElementById('scrollsNextPage');
    if (prevBtn) prevBtn.disabled = currentScrollPage <= 1;
    if (nextBtn) nextBtn.disabled = currentScrollPage >= totalPages;
}

function prevScrollPage() {
    if (currentScrollPage > 1) {
        currentScrollPage--;
        renderScrolls();
    }
}

function nextScrollPage() {
    const total = getScrollsCount();
    const totalPages = Math.ceil(total / SCROLLS_PER_PAGE);
    if (currentScrollPage < totalPages) {
        currentScrollPage++;
        renderScrolls();
    }
}
// ===== ЕЖЕДНЕВНЫЙ БОНУС =====
let dailyBonusData = {
    lastClaimDate: null // строка 'YYYY-MM-DD'
};

function loadDailyBonusData() {
    try {
        const saved = localStorage.getItem('dailyBonusData');
        if (saved) {
            dailyBonusData = JSON.parse(saved);
        }
    } catch(e) {}
}

function saveDailyBonusData() {
    localStorage.setItem('dailyBonusData', JSON.stringify(dailyBonusData));
    // VK синхронизация будет через saveAppStateToVK
}

function getDailyBonusStatus() {
    const today = new Date().toISOString().slice(0,10);
    const canClaim = dailyBonusData.lastClaimDate !== today;
    return { canClaim, lastClaimDate: dailyBonusData.lastClaimDate };
}

function openDailyBonusModal() {
    const modal = document.getElementById('dailyBonusModal');
    const body = document.getElementById('dailyBonusBody');
    if (!modal || !body) return;
    
    const { canClaim } = getDailyBonusStatus();
    let html = '';
    if (canClaim) {
        html = `
            <p style="font-size:16px;color:var(--text-secondary);margin-bottom:20px;">Посмотрите рекламу, чтобы получить усиленный бонус, или возьмите обычный!</p>    
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                <button class="btn-neon" onclick="claimDailyBonus('normal')" style="min-width:100px;">⭐+5</button>
                <button class="btn-neon" onclick="claimDailyBonus('rewarded')" style="min-width:100px;background:linear-gradient(135deg,#f59e0b,#d97706);border-color:#f59e0b;">📺+10</button>
            </div>
        `;
    } else {
        html = `
            <p style="font-size:16px;color:var(--text-secondary);margin-bottom:20px;">✅ Бонус уже получен сегодня!</p>
            <p style="font-size:14px;color:var(--text-secondary);opacity:0.7;">Возвращайтесь завтра за новым бонусом.</p>
            <button class="btn-neon" onclick="closeDailyBonusModal()" style="margin-top:16px;">Закрыть</button>
        `;
    }
    body.innerHTML = html;
    modal.classList.add('show');
}

function closeDailyBonusModal() {
    document.getElementById('dailyBonusModal').classList.remove('show');
}

function claimDailyBonus(type) {
    const { canClaim } = getDailyBonusStatus();
    if (!canClaim) {
        showToast('⚠️ Бонус уже получен сегодня');
        closeDailyBonusModal();
        return;
    }
    
    if (type === 'normal') {
        appState.totalPoints += 5;
        updateStats();
        saveState();
        dailyBonusData.lastClaimDate = new Date().toISOString().slice(0,10);
        saveDailyBonusData();
        showToast('🎉 Получено +5 звёзд!');
        closeDailyBonusModal();
    } else if (type === 'rewarded') {
        // Запускаем рекламу
        window._pendingDailyBonus = true;
        watchAdForDailyBonus();
    }
}

function watchAdForDailyBonus() {
    const bridge = typeof vkBridge !== 'undefined' ? vkBridge : window.vkBridge;
    
    // Если нет VK Bridge – даём бонус без рекламы (для тестов)
    if (!bridge) {
        showToast('🎉 Получено +10 звёзд! (режим теста)');
        dailyBonusData.lastClaimDate = new Date().toISOString().slice(0,10);
        saveDailyBonusData();
        appState.totalPoints += 10;
        updateStats();
        saveState();
        closeDailyBonusModal();
        return;
    }
    
    // Показываем загрузку
    document.getElementById('adLoadingModal').classList.add('show');
    
    bridge.send('VKWebAppCheckNativeAds', { ad_format: 'reward' })
        .then(function(data) {
            if (data && data.result) {
                return bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
            } else {
                document.getElementById('adLoadingModal').classList.remove('show');
                showAdError();
                return Promise.reject('Ad not available');
            }
        })
        .then(function(adResult) {
            document.getElementById('adLoadingModal').classList.remove('show');
            // Если реклама показана или не показана – даём бонус
            showToast('🎉 Получено +10 звёзд!');
            dailyBonusData.lastClaimDate = new Date().toISOString().slice(0,10);
            saveDailyBonusData();
            appState.totalPoints += 10;
            updateStats();
            saveState();
            closeDailyBonusModal();
        })
        .catch(function(error) {
            document.getElementById('adLoadingModal').classList.remove('show');
            showAdError();
            // Даём бонус даже при ошибке (но можно не давать – решайте)
            // showToast('⚠️ Ошибка рекламы, попробуйте позже');
            console.warn('Ошибка рекламы:', error);
        });
}

window.prevScrollPage = prevScrollPage;
window.nextScrollPage = nextScrollPage;
window.renderScrolls = renderScrolls;
window.openDailyBonusModal = openDailyBonusModal;
window.closeDailyBonusModal = closeDailyBonusModal;
window.claimDailyBonus = claimDailyBonus;
window.watchAdForDailyBonus = watchAdForDailyBonus;