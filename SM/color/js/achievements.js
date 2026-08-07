// ===== РАСКРАСКА: ДОСТИЖЕНИЯ И КОЛЛЕКЦИИ =====

const ACHIEVEMENTS = [
    { id: 'first_coloring', icon: '🎨', title: 'Первый шаг', desc: 'Раскрась первую картинку', check: () => appState.coloredImages.length >= 1 },
    { id: 'coloring_5', icon: '🖌️', title: 'Начинающий художник', desc: 'Раскрась 5 картинок', check: () => appState.coloredImages.length >= 5 },
    { id: 'coloring_10', icon: '🎨', title: 'Любитель искусства', desc: 'Раскрась 10 картинок', check: () => appState.coloredImages.length >= 10 },
    { id: 'coloring_25', icon: '🏆', title: 'Опытный мастер', desc: 'Раскрась 25 картинок', check: () => appState.coloredImages.length >= 25 },
    { id: 'coloring_50', icon: '👑', title: 'Король красок', desc: 'Раскрась 50 картинок', check: () => appState.coloredImages.length >= 50 },
    { id: 'coloring_100', icon: '💎', title: 'Легенда раскраски', desc: 'Раскрась 100 картинок', check: () => appState.coloredImages.length >= 100 },
    { id: 'points_10', icon: '⭐', title: 'Новичок', desc: 'Заработай 10 звёзд', check: () => appState.totalPoints >= 10 },
    { id: 'points_50', icon: '🌟', title: 'Талант', desc: 'Заработай 50 звёзд', check: () => appState.totalPoints >= 50 },
    { id: 'points_100', icon: '🔥', title: 'Мастер', desc: 'Заработай 100 звёзд', check: () => appState.totalPoints >= 100 },
    { id: 'points_500', icon: '⚡', title: 'Гуру', desc: 'Заработай 500 звёзд', check: () => appState.totalPoints >= 500 },
    
    // Категории без подкатегорий
    { id: 'all_cosmos', icon: '🌌', title: 'Исследователь космоса', desc: 'Раскрась все картинки в категории "Космос"', check: () => getColoredCount('cosmos') >= getCategoryTotal('cosmos') },
    { id: 'all_doodles', icon: '✏️', title: 'Мастер дудлов', desc: 'Раскрась все картинки в категории "Дудлс"', check: () => getColoredCount('doodles') >= getCategoryTotal('doodles') },
    { id: 'all_mandala', icon: '🌀', title: 'Король мандал', desc: 'Раскрась все картинки в категории "Мандала"', check: () => getColoredCount('mandala') >= getCategoryTotal('mandala') },
    
    // Лёгкие
    { id: 'easy_5', icon: '🌟', title: 'Лёгкий старт', desc: 'Раскрась 5 лёгких картинок', check: () => getColoredCount('easy') >= 5 },
    { id: 'easy_10', icon: '✨', title: 'Мастер простоты', desc: 'Раскрась 10 лёгких картинок', check: () => getColoredCount('easy') >= 10 },
    { id: 'easy_20', icon: '🏅', title: 'Просто и красиво', desc: 'Раскрась 20 лёгких картинок', check: () => getColoredCount('easy') >= 20 },
    { id: 'all_easy', icon: '💫', title: 'Коллекционер простоты', desc: 'Раскрась все лёгкие картинки', check: () => getColoredCount('easy') >= getCategoryTotal('easy') },
    
    // Животные (подкатегории)
    { id: 'animals_easy_10', icon: '🐾', title: 'Любитель животных', desc: 'Раскрась 10 лёгких животных', check: () => getColoredCount('animals', 'easy') >= 10 },
    { id: 'animals_easy_25', icon: '🐾', title: 'Друг животных', desc: 'Раскрась 25 лёгких животных', check: () => getColoredCount('animals', 'easy') >= 25 },
    { id: 'animals_easy_50', icon: '🐾', title: 'Защитник животных', desc: 'Раскрась всех лёгких животных', check: () => getColoredCount('animals', 'easy') >= getSubcategoryTotal('animals', 'easy') },
    { id: 'animals_hard_10', icon: '🐯', title: 'Исследователь животных', desc: 'Раскрась 10 сложных животных', check: () => getColoredCount('animals', 'hard') >= 10 },
    { id: 'animals_hard_25', icon: '🐯', title: 'Знаток животных', desc: 'Раскрась 25 сложных животных', check: () => getColoredCount('animals', 'hard') >= 25 },
    { id: 'animals_hard_50', icon: '🐯', title: 'Мастер животных', desc: 'Раскрась всех сложных животных', check: () => getColoredCount('animals', 'hard') >= getSubcategoryTotal('animals', 'hard') },
    { id: 'animals_all', icon: '🏆', title: 'Король животных', desc: 'Раскрась всех животных (легких и сложных)', check: () => getColoredCount('animals') >= getCategoryTotal('animals') },
    
    // Люди (подкатегории)
    { id: 'people_easy_10', icon: '👤', title: 'Любопытный', desc: 'Раскрась 10 лёгких людей', check: () => getColoredCount('people', 'easy') >= 10 },
    { id: 'people_easy_25', icon: '👤', title: 'Наблюдатель', desc: 'Раскрась 25 лёгких людей', check: () => getColoredCount('people', 'easy') >= 25 },
    { id: 'people_easy_50', icon: '👤', title: 'Знаток людей', desc: 'Раскрась всех лёгких людей', check: () => getColoredCount('people', 'easy') >= getSubcategoryTotal('people', 'easy') },
    { id: 'people_hard_10', icon: '👥', title: 'Исследователь', desc: 'Раскрась 10 сложных людей', check: () => getColoredCount('people', 'hard') >= 10 },
    { id: 'people_hard_25', icon: '👥', title: 'Психолог', desc: 'Раскрась 25 сложных людей', check: () => getColoredCount('people', 'hard') >= 25 },
    { id: 'people_hard_50', icon: '👥', title: 'Мастер людей', desc: 'Раскрась всех сложных людей', check: () => getColoredCount('people', 'hard') >= getSubcategoryTotal('people', 'hard') },
    { id: 'people_all', icon: '🏆', title: 'Король людей', desc: 'Раскрась всех людей (легких и сложных)', check: () => getColoredCount('people') >= getCategoryTotal('people') },
    
    // Растения (подкатегории)
    { id: 'plants_easy_10', icon: '🌿', title: 'Садовод-любитель', desc: 'Раскрась 10 лёгких растений', check: () => getColoredCount('plants', 'easy') >= 10 },
    { id: 'plants_easy_25', icon: '🌿', title: 'Садовод', desc: 'Раскрась 25 лёгких растений', check: () => getColoredCount('plants', 'easy') >= 25 },
    { id: 'plants_easy_50', icon: '🌿', title: 'Ботаник', desc: 'Раскрась все лёгкие растения', check: () => getColoredCount('plants', 'easy') >= getSubcategoryTotal('plants', 'easy') },
    { id: 'plants_hard_10', icon: '🌳', title: 'Исследователь растений', desc: 'Раскрась 10 сложных растений', check: () => getColoredCount('plants', 'hard') >= 10 },
    { id: 'plants_hard_25', icon: '🌳', title: 'Знаток растений', desc: 'Раскрась 25 сложных растений', check: () => getColoredCount('plants', 'hard') >= 25 },
    { id: 'plants_hard_50', icon: '🌳', title: 'Мастер растений', desc: 'Раскрась все сложные растения', check: () => getColoredCount('plants', 'hard') >= getSubcategoryTotal('plants', 'hard') },
    { id: 'plants_all', icon: '🏆', title: 'Король растений', desc: 'Раскрась все растения (лёгкие и сложные)', check: () => getColoredCount('plants') >= getCategoryTotal('plants') },
    
    // Еда (подкатегории)
    { id: 'food_easy_10', icon: '🍕', title: 'Гурман-любитель', desc: 'Раскрась 10 лёгких блюд', check: () => getColoredCount('food', 'easy') >= 10 },
    { id: 'food_easy_25', icon: '🍕', title: 'Гурман', desc: 'Раскрась 25 лёгких блюд', check: () => getColoredCount('food', 'easy') >= 25 },
    { id: 'food_easy_50', icon: '🍕', title: 'Шеф-повар', desc: 'Раскрась все лёгкие блюда', check: () => getColoredCount('food', 'easy') >= getSubcategoryTotal('food', 'easy') },
    { id: 'food_hard_10', icon: '🍣', title: 'Исследователь вкусов', desc: 'Раскрась 10 сложных блюд', check: () => getColoredCount('food', 'hard') >= 10 },
    { id: 'food_hard_25', icon: '🍣', title: 'Знаток кулинарии', desc: 'Раскрась 25 сложных блюд', check: () => getColoredCount('food', 'hard') >= 25 },
    { id: 'food_hard_50', icon: '🍣', title: 'Мастер-шеф', desc: 'Раскрась все сложные блюда', check: () => getColoredCount('food', 'hard') >= getSubcategoryTotal('food', 'hard') },
    { id: 'food_all', icon: '🏆', title: 'Король кухни', desc: 'Раскрась все блюда (лёгкие и сложные)', check: () => getColoredCount('food') >= getCategoryTotal('food') },
    
    // Предметы (подкатегории)
    { id: 'items_easy_10', icon: '📦', title: 'Коллекционер', desc: 'Раскрась 10 лёгких предметов', check: () => getColoredCount('items', 'easy') >= 10 },
    { id: 'items_easy_25', icon: '📦', title: 'Собиратель', desc: 'Раскрась 25 лёгких предметов', check: () => getColoredCount('items', 'easy') >= 25 },
    { id: 'items_easy_50', icon: '📦', title: 'Коллекционер предметов', desc: 'Раскрась все лёгкие предметы', check: () => getColoredCount('items', 'easy') >= getSubcategoryTotal('items', 'easy') },
    { id: 'items_hard_10', icon: '🔧', title: 'Исследователь предметов', desc: 'Раскрась 10 сложных предметов', check: () => getColoredCount('items', 'hard') >= 10 },
    { id: 'items_hard_25', icon: '🔧', title: 'Знаток предметов', desc: 'Раскрась 25 сложных предметов', check: () => getColoredCount('items', 'hard') >= 25 },
    { id: 'items_hard_50', icon: '🔧', title: 'Мастер предметов', desc: 'Раскрась все сложные предметы', check: () => getColoredCount('items', 'hard') >= getSubcategoryTotal('items', 'hard') },
    { id: 'items_all', icon: '🏆', title: 'Король предметов', desc: 'Раскрась все предметы (лёгкие и сложные)', check: () => getColoredCount('items') >= getCategoryTotal('items') },
    
    // Общее достижение
    { id: 'all_categories', icon: '🌈', title: 'Мастер всех категорий', desc: 'Раскрась все картинки во всех категориях', check: () => appState.coloredImages.length >= getTotalImages() }
];

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПОДСЧЁТА =====

// Получить общее количество картинок в категории (с учётом подкатегорий)
function getCategoryTotal(categoryKey) {
    const cat = CATEGORIES[categoryKey];
    if (!cat) return 0;
    if (cat.hasSubcategories) {
        let total = 0;
        for (const subKey in cat.subcategories) {
            total += cat.subcategories[subKey].count;
        }
        return total;
    }
    return cat.count || 0;
}

// Получить количество картинок в подкатегории (если есть)
function getSubcategoryTotal(categoryKey, subKey) {
    const cat = CATEGORIES[categoryKey];
    if (!cat || !cat.hasSubcategories || !cat.subcategories[subKey]) return 0;
    return cat.subcategories[subKey].count;
}

// Получить общее количество картинок во всех категориях
function getTotalImages() {
    let total = 0;
    for (const key in CATEGORIES) {
        total += getCategoryTotal(key);
    }
    return total;
}

// Получить количество раскрашенных картинок в категории (опционально подкатегория)
function getColoredCount(categoryKey, subKey) {
    let filtered = appState.coloredImages.filter(i => i.category === categoryKey);
    if (subKey) {
        filtered = filtered.filter(i => i.subcategory === subKey);
    }
    return filtered.length;
}
//=========================================================

function checkAchievements() {
    let newUnlocked = false;
    ACHIEVEMENTS.forEach(ach => {
        if (!appState.unlockedAchievements.includes(ach.id) && ach.check()) {
            appState.unlockedAchievements.push(ach.id);
            newUnlocked = true;
            showToast(`🏆 Достижение: ${ach.title}!`);
        }
    });
    if (newUnlocked) saveState();
}

// ===== ПАГИНАЦИЯ ДЛЯ ДОСТИЖЕНИЙ =====
const ACHIEVEMENTS_PER_PAGE = 8;
let achievementsCurrentPage = 0;

function renderAchievements() {
    const container = document.getElementById('achievementsList');
    container.innerHTML = '';
    
    const unlocked = appState.unlockedAchievements || [];
    const totalPages = Math.ceil(ACHIEVEMENTS.length / ACHIEVEMENTS_PER_PAGE);
    
    // Пагинация сверху
    const paginationTop = document.createElement('div');
    paginationTop.className = 'achievement-pagination';
    paginationTop.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0 4px 12px 4px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:12px;';
    paginationTop.innerHTML = `
        <button class="btn-pagination" onclick="changeAchievementsPage(-1)" ${achievementsCurrentPage === 0 ? 'disabled' : ''}>◀</button>
        <span style="color:var(--text-secondary);font-size:14px;">${achievementsCurrentPage + 1} / ${totalPages}</span>
        <button class="btn-pagination" onclick="changeAchievementsPage(1)" ${achievementsCurrentPage >= totalPages - 1 ? 'disabled' : ''}>▶</button>
    `;
    container.appendChild(paginationTop);
    
    // Список достижений на текущей странице
    const start = achievementsCurrentPage * ACHIEVEMENTS_PER_PAGE;
    const end = Math.min(start + ACHIEVEMENTS_PER_PAGE, ACHIEVEMENTS.length);
    let count = 0;
    
    for (let i = start; i < end; i++) {
        const ach = ACHIEVEMENTS[i];
        const unlockedStatus = unlocked.includes(ach.id);
        if (unlockedStatus) count++;
        
        const div = document.createElement('div');
        div.className = `achievement-item ${unlockedStatus ? 'unlocked' : 'locked'}`;
        div.innerHTML = `
            <div class="icon">${ach.icon}</div>
            <div class="info">
                <div class="title">${ach.title}</div>
                <div class="desc">${ach.desc}</div>
            </div>
            <div class="status">${unlockedStatus ? '✅' : '🔒'}</div>
        `;
        container.appendChild(div);
    }
    
    // Счётчик разблокированных на текущей странице
    const counter = document.createElement('div');
    counter.style.cssText = 'text-align:center;padding:12px;color:var(--text-secondary);border-top:1px solid rgba(255,255,255,0.06);margin-top:10px;font-size:14px;';
    const totalUnlocked = unlocked.length;
    counter.textContent = `Разблокировано: ${totalUnlocked} из ${ACHIEVEMENTS.length}`;
    container.appendChild(counter);
}

// ===== ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ ДОСТИЖЕНИЙ =====
function changeAchievementsPage(delta) {
    const totalPages = Math.ceil(ACHIEVEMENTS.length / ACHIEVEMENTS_PER_PAGE);
    const newPage = achievementsCurrentPage + delta;
    if (newPage < 0 || newPage >= totalPages) return;
    achievementsCurrentPage = newPage;
    renderAchievements();
}

function renderCollections() {
    const container = document.getElementById('collectionsList');
    container.innerHTML = '';
    let total = 0, colored = 0;

     const emojis = {
        cosmos: '🌌',
        animals: '🐾',
        people: '💁‍♀️',
        plants: '🌸',
        food: '🍰',
        items: '👜',
        doodles: '🧶',
        mandala: '🧘',
        easy: '🐣'
    };

    for (const key in CATEGORIES) {
        const cat = CATEGORIES[key];
        const c = appState.coloredImages.filter(i => i.category === key).length;
        const pct = Math.round((c / cat.count) * 100);
        total += cat.count;
        colored += c;

        const div = document.createElement('div');
        div.className = 'collection-item';
        div.innerHTML = `
            <div class="icon">${emojis[key] || '🖼️'}</div>
            <div class="info">
                <div class="title">${cat.name}</div>
                <div class="desc">${c} из ${cat.count} раскрашено</div>
            </div>
            <div class="progress">${pct}%</div>
        `;
        container.appendChild(div);
    }

    const totalPct = Math.round((colored / total) * 100);
    const totalDiv = document.createElement('div');
    totalDiv.style.cssText = 'padding:14px;background:rgba(255,255,255,0.05);border-radius:12px;text-align:center;margin-top:10px;border:1px solid rgba(255,255,255,0.06);';
    totalDiv.innerHTML = `
        <div style="font-weight:600;color:var(--text-primary);font-size:18px;">📊 Общий прогресс</div>
        <div style="color:var(--border-neon);font-size:24px;font-weight:700;">${totalPct}%</div>
        <div style="color:var(--text-secondary);font-size:14px;">${colored} из ${total} картинок</div>
    `;
    container.appendChild(totalDiv);
}