// ===== РАСКРАСКА: ДОСТИЖЕНИЯ И КОЛЛЕКЦИИ =====

const ACHIEVEMENTS = [
    { id: 'first_coloring', icon: '🎨', title: 'Первый шаг', desc: 'Раскрась первую картинку', check: () => appState.coloredImages.length >= 1 },
    { id: 'coloring_5', icon: '🖌️', title: 'Начинающий художник', desc: 'Раскрась 5 картинок', check: () => appState.coloredImages.length >= 5 },
    { id: 'coloring_10', icon: '🎨', title: 'Любитель искусства', desc: 'Раскрась 10 картинок', check: () => appState.coloredImages.length >= 10 },
    { id: 'coloring_25', icon: '🏆', title: 'Опытный мастер', desc: 'Раскрась 25 картинок', check: () => appState.coloredImages.length >= 25 },
    { id: 'coloring_50', icon: '👑', title: 'Король красок', desc: 'Раскрась 50 картинок', check: () => appState.coloredImages.length >= 50 },
    { id: 'coloring_100', icon: '💎', title: 'Легенда раскраски', desc: 'Раскрась 100 картинок', check: () => appState.coloredImages.length >= 100 },
    { id: 'points_10', icon: '⭐', title: 'Новичок', desc: 'Заработай 10 очков', check: () => appState.totalPoints >= 10 },
    { id: 'points_50', icon: '🌟', title: 'Талант', desc: 'Заработай 50 очков', check: () => appState.totalPoints >= 50 },
    { id: 'points_100', icon: '🔥', title: 'Мастер', desc: 'Заработай 100 очков', check: () => appState.totalPoints >= 100 },
    { id: 'points_500', icon: '⚡', title: 'Гуру', desc: 'Заработай 500 очков', check: () => appState.totalPoints >= 500 },
    { id: 'all_cosmos', icon: '🌌', title: 'Исследователь космоса', desc: 'Раскрась все картинки в категории "Космос"', check: () => appState.coloredImages.filter(i => i.category === 'cosmos').length >= 50 },
    { id: 'all_animals', icon: '🐾', title: 'Друг животных', desc: 'Раскрась все картинки в категории "Животные"', check: () => appState.coloredImages.filter(i => i.category === 'animals').length >= 50 },
    { id: 'all_anime', icon: '🎌', title: 'Аниме-фанат', desc: 'Раскрась все картинки в категории "Аниме"', check: () => appState.coloredImages.filter(i => i.category === 'anime').length >= 50 },
     // ===== ДОБАВЬТЕ ДОСТИЖЕНИЯ ДЛЯ "ЛЁГКИЕ" =====
    { id: 'easy_5', icon: '🌟', title: 'Лёгкий старт', desc: 'Раскрась 5 лёгких картинок', check: () => appState.coloredImages.filter(i => i.category === 'easy').length >= 5 },
    { id: 'easy_10', icon: '✨', title: 'Мастер простоты', desc: 'Раскрась 10 лёгких картинок', check: () => appState.coloredImages.filter(i => i.category === 'easy').length >= 10 },
    { id: 'easy_20', icon: '🏅', title: 'Просто и красиво', desc: 'Раскрась 20 лёгких картинок', check: () => appState.coloredImages.filter(i => i.category === 'easy').length >= 20 },
    { id: 'all_easy', icon: '💫', title: 'Коллекционер простоты', desc: 'Раскрась все лёгкие картинки', check: () => appState.coloredImages.filter(i => i.category === 'easy').length >= 30 },
    // ===== КОНЕЦ =====
    { id: 'all_categories', icon: '🌈', title: 'Мастер всех категорий', desc: 'Раскрась все картинки во всех категориях', check: () => appState.coloredImages.length >= 330 }, // 50*6 + 30 = 330
];

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

      const emojis = { cosmos: '🌌', animals: '🐾', anime: '🎌', plants: '🌿', doodles: '✏️', mandala: '🌀', easy: '🌟' };

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