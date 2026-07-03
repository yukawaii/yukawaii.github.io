// ===== РАСКРАСКА: ОСНОВНАЯ ЛОГИКА =====

const CATEGORIES = {
    easy: { name: '🌟 Лёгкие', folder: 'easy', count: 30 }, // 30 картинок для начала
    cosmos: { name: '🌌 Космос', folder: 'cosmos', count: 50 },
    animals: { name: '🐾 Животные', folder: 'animals', count: 50 },
    anime: { name: '🎌 Аниме', folder: 'anime', count: 50 },
    plants: { name: '🌿 Растения', folder: 'plants', count: 50 },
    doodles: { name: '✏️ Дудлс', folder: 'doodles', count: 50 },
    mandala: { name: '🌀 Мандала', folder: 'mandala', count: 50 }
};

const COLORS = ['#ffffff', '#f0e6ff', '#c8b8ff', '#ffd6e8', '#b8d4ff', '#ffd700'];

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

    for (let i = 0; i < 80; i++) {
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
    for (let i = 0; i < 3; i++) {
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
function loadState() {
    try {
        const saved = localStorage.getItem('coloringAppState');
        if (saved) {
            const parsed = JSON.parse(saved);
            appState.totalPoints = parsed.totalPoints || 0;
            appState.coloredImages = parsed.coloredImages || [];
            appState.unlockedAchievements = parsed.unlockedAchievements || [];
        }
    } catch(e) {}
    updateStats();
}

function saveState() {
    try {
        localStorage.setItem('coloringAppState', JSON.stringify({
            totalPoints: appState.totalPoints,
            coloredImages: appState.coloredImages,
            unlockedAchievements: appState.unlockedAchievements
        }));
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
}

function markAsColored(category, index) {
    const key = `${category}-${index}`;
    if (!appState.coloredImages.some(item => `${item.category}-${item.index}` === key)) {
        appState.coloredImages.push({ category, index });
        saveState();
        updateStats();
        if (appState.currentCategory) renderLevels(appState.currentCategory);
    }
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

function isLevelUnlocked(category, levelIndex) {
    if (levelIndex < UNLOCK_COUNT) return true;
    const key = `${category}-${levelIndex}`;
    return unlockedLevels[key] === true;
}

function unlockLevel(category, levelIndex) {
    const key = `${category}-${levelIndex}`;
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
    const totalLevels = category.count;
    const totalPages = Math.ceil(totalLevels / LEVELS_PER_PAGE);
    
    document.getElementById('pageInfo').textContent = `${currentPage + 1} / ${totalPages}`;
    
    const prevBtn = document.querySelector('.btn-pagination:first-child');
    const nextBtn = document.querySelector('.btn-pagination:last-child');
    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
    
    const start = currentPage * LEVELS_PER_PAGE;
    const end = Math.min(start + LEVELS_PER_PAGE, totalLevels);
    
    grid.innerHTML = '';
    
    let completed = 0;
    let total = 0;
    
    for (let i = 0; i < totalLevels; i++) {
        const levelNum = i + 1;
        const isUnlocked = isLevelUnlocked(categoryKey, i);
        const isCompleted = isColored(categoryKey, levelNum);
        
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
                    openUnlockModal(categoryKey, i);
                });
            } else {
                btn.addEventListener('click', function() {
                    openColoring(categoryKey, levelNum);
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
function openUnlockModal(categoryKey, levelIndex) {
    pendingUnlockLevel = { category: categoryKey, index: levelIndex };
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
    const { category, index } = pendingUnlockLevel;
    unlockLevel(category, index);
    pendingUnlockLevel = null;
    
    renderLevels(category);
    showToast('🔓 Уровень открыт!');
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
function openColoring(categoryKey, index) {
    appState.currentImage = { category: categoryKey, index };
    const wrapper = document.getElementById('coloringCanvasWrapper');
    wrapper.innerHTML = '';

    const path = `images/${CATEGORIES[categoryKey].folder}/${index}.jpg`;

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

// ===== ЗАПРЕТ КОНТЕКСТНОГО МЕНЮ И СВАЙПОВ =====
document.addEventListener('DOMContentLoaded', function() {
    // ... существующий код ...
    
    // ===== ДОБАВЬТЕ ЭТОТ КОД =====
    // Запрет контекстного меню на всей странице
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // В DOMContentLoaded добавьте:
document.addEventListener('DOMContentLoaded', function() {
    createCosmicBackground();
    loadTheme();
    loadState();
    loadUnlockedState();
    loadBrushesState(); // ← ДОБАВЬТЕ
    initThemeButtons();
    console.log('🎨 Раскраска загружена!');
});
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
    } catch(e) {}
}

function saveBrushesState() {
    try {
        localStorage.setItem('coloringBrushesState', JSON.stringify(brushesState));
    } catch(e) {}
}

function isBrushUnlocked(brushId) {
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


// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', function() {
    createCosmicBackground();
    loadTheme();
    loadState();
    loadUnlockedState();
    initThemeButtons();
    console.log('🎨 Раскраска загружена!');
});