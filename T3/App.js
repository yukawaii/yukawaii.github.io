let vkInitialized = false;
let lastAdShowTime = 0; 
const APP_ID = 54659768;  
let vkUserToken = null;
let vkUserId = null;
let leaderboardLoading = false;
let leaderboardCheckInterval = null;
const ServToken = '36bb7f1c36bb7f1c36bb7f1c6335f975a4336bb36bb7f1c5cf8d7250dc913db99e9ea4d';

// ======================== VK STORAGE ========================
const VK_STORAGE_KEYS = {
    TOTAL_SCORE: 'tetris_total_score_v1',
    SCROLLS_PROGRESS: 'tetris_scrolls_v1',
    COLLECTIONS_PROGRESS: 'tetris_collections_v1',
    PLAYED_DIFFICULTIES: 'tetris_difficulties_v1',
    DAILY_BONUS: 'tetris_daily_bonus_v1',
    HIGHSCORE: 'tetris_highscore_v1'
};

function saveToVKStorage(key, value) {
    if (typeof vkBridge === 'undefined') return Promise.resolve();
    return vkBridge.send('VKWebAppStorageSet', {
        key: key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
    }).then(() => console.log(`✅ Сохранено в VK Storage: ${key}`))
    .catch(error => console.warn(`❌ Ошибка сохранения ${key}:`, error));
}

function loadFromVKStorage(key) {
    if (typeof vkBridge === 'undefined') return Promise.resolve(null);
    return vkBridge.send('VKWebAppStorageGet', { keys: [key] })
        .then(data => {
            if (data && data.keys && data.keys.length > 0) {
                const value = data.keys[0].value;
                try { return JSON.parse(value); } catch { return value; }
            }
            return null;
        })
        .catch(error => { console.warn(`❌ Ошибка загрузки ${key}:`, error); return null; });
}

function syncAllDataToVK() {
    console.log('🔄 Синхронизация данных с VK Storage...');
    const totalScore = parseInt(localStorage.getItem('totalScore') || '0');
    const scrollsProgress = JSON.parse(localStorage.getItem('scrollsProgress') || '{}');
    const collectionsProgress = JSON.parse(localStorage.getItem('collectionsProgress') || '{}');
    const playedDifficulties = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
    const dailyBonusDate = localStorage.getItem('dailyBonusDate') || null;
    const highscore = parseInt(localStorage.getItem('vkHighscore') || localStorage.getItem('localHighscore') || '0');
    return Promise.all([
        saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, totalScore),
        saveToVKStorage(VK_STORAGE_KEYS.SCROLLS_PROGRESS, scrollsProgress),
        saveToVKStorage(VK_STORAGE_KEYS.COLLECTIONS_PROGRESS, collectionsProgress),
        saveToVKStorage(VK_STORAGE_KEYS.PLAYED_DIFFICULTIES, playedDifficulties),
        saveToVKStorage(VK_STORAGE_KEYS.DAILY_BONUS, dailyBonusDate),
        saveToVKStorage(VK_STORAGE_KEYS.HIGHSCORE, highscore)
    ]).then(() => console.log('✅ Полная синхронизация завершена'))
    .catch(error => console.warn('⚠️ Ошибка синхронизации:', error));
}

function loadAllDataFromVK() {
    console.log('🔄 Загрузка данных из VK Storage...');
    return Promise.all([
        loadFromVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE),
        loadFromVKStorage(VK_STORAGE_KEYS.SCROLLS_PROGRESS),
        loadFromVKStorage(VK_STORAGE_KEYS.COLLECTIONS_PROGRESS),
        loadFromVKStorage(VK_STORAGE_KEYS.PLAYED_DIFFICULTIES),
        loadFromVKStorage(VK_STORAGE_KEYS.DAILY_BONUS),
        loadFromVKStorage(VK_STORAGE_KEYS.HIGHSCORE)
    ]).then(([totalScore, scrollsProgress, collectionsProgress, playedDifficulties, dailyBonusDate, highscore]) => {
        let loaded = false;
        if (totalScore !== null && totalScore !== undefined) {
            const merged = Math.max(parseInt(localStorage.getItem('totalScore') || '0'), parseInt(totalScore) || 0);
            if (merged > parseInt(localStorage.getItem('totalScore') || '0')) {
                localStorage.setItem('totalScore', merged);
                loaded = true;
                console.log(`✅ Общий счёт загружен из VK: ${merged}`);
            }
        }
        if (scrollsProgress && typeof scrollsProgress === 'object') {
            const current = JSON.parse(localStorage.getItem('scrollsProgress') || '{}');
            const merged = { ...current };
            let changed = false;
            for (const key in scrollsProgress) {
                if (scrollsProgress[key] && !merged[key]) { merged[key] = true; changed = true; }
            }
            if (changed) {
                localStorage.setItem('scrollsProgress', JSON.stringify(merged));
                loaded = true;
                console.log(`✅ Свитки объединены: ${Object.keys(merged).length}`);
            }
        }
        if (collectionsProgress && typeof collectionsProgress === 'object') {
            const current = JSON.parse(localStorage.getItem('collectionsProgress') || '{}');
            const merged = { ...current };
            let changed = false;
            for (const key in collectionsProgress) {
                if (collectionsProgress[key] && !merged[key]) { merged[key] = true; changed = true; }
            }
            if (changed) {
                localStorage.setItem('collectionsProgress', JSON.stringify(merged));
                loaded = true;
                console.log(`✅ Коллекции объединены: ${Object.keys(merged).length}`);
            }
        }
        if (playedDifficulties && Array.isArray(playedDifficulties)) {
            const current = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
            const merged = [...new Set([...current, ...playedDifficulties])];
            if (merged.length > current.length) {
                localStorage.setItem('playedDifficulties', JSON.stringify(merged));
                loaded = true;
                console.log(`✅ Сложности объединены: ${merged.join(', ')}`);
            }
        }
        if (dailyBonusDate && typeof dailyBonusDate === 'string') {
            const current = localStorage.getItem('dailyBonusDate');
            if (!current || dailyBonusDate > current) {
                localStorage.setItem('dailyBonusDate', dailyBonusDate);
                loaded = true;
                console.log(`✅ Дата бонуса загружена: ${dailyBonusDate}`);
            }
        }
        if (highscore !== null && highscore !== undefined) {
            const current = parseInt(localStorage.getItem('vkHighscore') || localStorage.getItem('localHighscore') || '0');
            const merged = Math.max(current, parseInt(highscore) || 0);
            if (merged > current) {
                localStorage.setItem('vkHighscore', merged);
                localStorage.setItem('localHighscore', merged);
                window.vkHighscore = merged;
                loaded = true;
                console.log(`✅ Рекорд загружен из VK: ${merged}`);
                if (typeof updateRecordText === 'function') updateRecordText(`Рекорд: ${merged}`);
            }
        }
        if (!loaded) console.log('ℹ️ В VK Storage нет новых данных');
        if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
        if (typeof updateCollectionsProgress === 'function') updateCollectionsProgress();
        if (typeof updateScrollsProgress === 'function') updateScrollsProgress();
        setTimeout(syncAllDataToVK, 1000);
        return loaded;
    }).catch(error => { console.warn('⚠️ Ошибка загрузки из VK:', error); return false; });
}

// ======================== ИНИЦИАЛИЗАЦИЯ VK ========================
function initVKSDK() {
    if (typeof vkBridge !== 'undefined') {
        window.vkBridge = vkBridge;
        vkBridge.send('VKWebAppInit')
            .then(() => {
                console.log('✅ VK SDK инициализирован');
                vkInitialized = true;
                return vkBridge.send('VKWebAppGetLaunchParams');
            })
            .then((launchParams) => {
                const userId = launchParams.vk_user_id || launchParams.vk_original_vk_id;
                if (userId) {
                    vkUserId = userId;
                    window.vkUserId = userId;
                    localStorage.setItem('vk_user_id', userId);
                    console.log('👤 ID пользователя (из launchParams):', userId);
                }
                // Пробуем получить токен
                return vkBridge.send('VKWebAppGetAuthToken', { app_id: APP_ID, scope: '' });
            })
            .then((authData) => {
                vkUserToken = authData.access_token;
                console.log('✅ Токен получен');
                // Загружаем данные из VK Storage
                return loadAllDataFromVK();
            })
            .then(() => {
                // Загружаем рекорд
                loadVKHighScore();
                // Обновляем интерфейс
                if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
                if (typeof updateCollectionsProgress === 'function') updateCollectionsProgress();
                if (typeof updateDailyBonusStatus === 'function') updateDailyBonusStatus();
                console.log('✅ Все данные загружены и интерфейс обновлён');
            })
            .catch((err) => {
                console.warn('⚠️ Ошибка инициализации VK:', err);
                vkInitialized = false;
                const savedId = localStorage.getItem('vk_user_id');
                if (savedId) {
                    vkUserId = savedId;
                    window.vkUserId = savedId;
                }
                updateRecordText('Рекорд: 0 (Гость)');
                // Пробуем загрузить локальный рекорд
                loadLocalHighScore();
            });
    } else {
        console.warn('VK Bridge не найден');
        updateRecordText('Рекорд: 0');
        loadLocalHighScore();
    }
}

// ======================== РЕКОРДЫ ========================
function saveVKScore(scoreValue) {
    console.log(`💾 saveVKScore: ${scoreValue}`);
    if (!vkInitialized || !vkUserId || !vkUserToken || scoreValue <= 0) {
        saveLocalScore(scoreValue);
        return;
    }
    // Сначала обновляем локально
    const currentLocal = parseInt(localStorage.getItem('localHighscore') || '0');
    if (scoreValue > currentLocal) {
        window.vkHighscore = scoreValue;
        localStorage.setItem('localHighscore', scoreValue);
        localStorage.setItem('vkHighscore', scoreValue);
        updateRecordText(`Рекорд: ${scoreValue}`);
        updateHighscoreDisplay();
    }
    // Сохраняем в VK
    vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'apps.getScore',
        params: { user_id: vkUserId, v: '5.131', access_token: vkUserToken }
    })
    .then(data => {
        let currentScore = parseInt(data.response) || 0;
        if (scoreValue > currentScore) {
            return vkBridge.send('VKWebAppCallAPIMethod', {
                method: 'secure.addAppEvent',
                params: { user_id: vkUserId, activity_id: 2, value: scoreValue, v: '5.131', access_token: ServToken }
            });
        }
        return null;
    })
    .then(() => {
        console.log(`✅ Рекорд ${scoreValue} сохранён в VK`);
        window.vkHighscore = scoreValue;
        localStorage.setItem('vkHighscore', scoreValue);
        localStorage.setItem('localHighscore', scoreValue);
        updateRecordText(`Рекорд: ${scoreValue}`);
        updateHighscoreDisplay();
        saveToVKStorage(VK_STORAGE_KEYS.HIGHSCORE, scoreValue);
    })
    .catch(err => {
        console.error('❌ Ошибка сохранения рекорда в VK:', err);
        saveLocalScore(scoreValue);
    });
}

function saveLocalScore(scoreValue) {
    const current = parseInt(localStorage.getItem('localHighscore') || '0');
    if (scoreValue > current) {
        localStorage.setItem('localHighscore', scoreValue);
        localStorage.setItem('vkHighscore', scoreValue);
        window.vkHighscore = scoreValue;
        updateRecordText(`Рекорд: ${scoreValue}`);
        updateHighscoreDisplay();
        saveToVKStorage(VK_STORAGE_KEYS.HIGHSCORE, scoreValue);
    }
}

function loadVKHighScore() {
    if (!vkInitialized || !vkUserId || !vkUserToken) {
        loadLocalHighScore();
        return;
    }
    vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'apps.getScore',
        request_id: 'loadScore_' + Date.now(),
        params: { user_id: vkUserId, v: '5.131', access_token: vkUserToken }
    })
    .then(data => {
        let highScore = parseInt(data.response) || 0;
        console.log(`🏆 Загружен рекорд из VK API: ${highScore}`);
        window.vkHighscore = highScore;
        localStorage.setItem('vkHighscore', highScore);
        localStorage.setItem('localHighscore', highScore);
        updateRecordText(`Рекорд: ${highScore}`);
        updateHighscoreDisplay();
        saveToVKStorage(VK_STORAGE_KEYS.HIGHSCORE, highScore);
    })
    .catch(err => {
        console.warn('⚠️ Ошибка загрузки рекорда из VK API:', err);
        loadFromVKStorage(VK_STORAGE_KEYS.HIGHSCORE)
            .then(score => {
                if (score !== null && score !== undefined) {
                    const s = parseInt(score) || 0;
                    window.vkHighscore = s;
                    localStorage.setItem('vkHighscore', s);
                    localStorage.setItem('localHighscore', s);
                    updateRecordText(`Рекорд: ${s}`);
                    updateHighscoreDisplay();
                } else {
                    loadLocalHighScore();
                }
            })
            .catch(() => loadLocalHighScore());
    });
}

function loadLocalHighScore() {
    const highScore = Math.max(parseInt(localStorage.getItem('vkHighscore') || '0'), parseInt(localStorage.getItem('localHighscore') || '0'));
    console.log(`🏆 Загружен локальный рекорд: ${highScore}`);
    window.vkHighscore = highScore;
    updateRecordText(`Рекорд: ${highScore}`);
    updateHighscoreDisplay();
}

function updateRecordText(text) {
    const topEl = document.getElementById('yandex-highscore-top');
    const sideEl = document.getElementById('yandex-highscore-side');
    if (topEl) topEl.innerText = text;
    if (sideEl) sideEl.innerText = text;
}

function updateHighscoreDisplay() {
    let current = 0;
    if (typeof window.vkHighscore !== 'undefined' && window.vkHighscore > 0) {
        current = window.vkHighscore;
    } else {
        current = Math.max(parseInt(localStorage.getItem('vkHighscore') || '0'), parseInt(localStorage.getItem('localHighscore') || '0'));
        window.vkHighscore = current;
    }
    const text = 'Рекорд: ' + current;
    const side = document.getElementById('yandex-highscore-side');
    const top = document.getElementById('yandex-highscore-top');
    if (side) side.innerHTML = text;
    if (top) top.innerHTML = text;
    console.log('🏆 Рекорд обновлён в интерфейсе:', current);
}

// ======================== ТАБЛИЦА ЛИДЕРОВ ========================
// ===== НОВАЯ ФУНКЦИЯ showVKLeaderboard =====
function showVKLeaderboard() {
    // Если уже идёт загрузка — игнорируем повторный клик
    if (leaderboardLoading) return;

    // Проверяем, доступен ли VK Bridge в принципе
    if (typeof vkBridge === 'undefined') {
        swal({
            title: "Таблица лидеров",
            text: "Функция доступна только в приложении ВКонтакте",
            icon: "info",
            button: "OK"
        });
        return;
    }

    // Блокируем повторные вызовы
    leaderboardLoading = true;

    // Показываем модалку загрузки (без кнопки, только крестик для отмены)
    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 100012; display: flex; justify-content: center; align-items: center;
        background: url('1.jpg') no-repeat center center fixed; background-size: cover;
    `;
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7); z-index: -1;
    `;
    modal.appendChild(overlay);
    modal.innerHTML += `
        <div style="background: rgba(20, 20, 30, 0.92); border: 2px solid rgba(52, 211, 153, 0.3);
                    width: 90%; max-width: 400px; border-radius: 30px; padding: 35px 30px;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.8); backdrop-filter: blur(20px);
                    text-align: center; position: relative; animation: modalPopIn 0.3s ease;">
            <button onclick="cancelLeaderboardLoading()" style="position: absolute; top: 15px; right: 20px;
                    background: none; border: none; color: #64748b; font-size: 28px; cursor: pointer;
                    font-family: 'Russo One', sans-serif;">✕</button>
            <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
            <h2 style="color: #34d399; font-size: 22px; text-transform: uppercase; letter-spacing: 2px;
                        margin-bottom: 10px; font-family: 'Russo One', sans-serif;">Загрузка...</h2>
            <p style="color: #94a3b8; font-size: 14px; font-family: 'Russo One', sans-serif; line-height: 1.6;">
                Подготовка таблицы лидеров
            </p>
            <div style="margin-top: 20px; width: 40px; height: 40px; margin-left: auto; margin-right: auto;">
                <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round"
                     stroke-linejoin="round" style="animation: spin 1s linear infinite; width: 100%; height: 100%;">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Функция, которая попытается открыть таблицу
    const tryOpen = () => {
        // Останавливаем интервал
        if (leaderboardCheckInterval) {
            clearInterval(leaderboardCheckInterval);
            leaderboardCheckInterval = null;
        }
        // Закрываем модалку загрузки
        closeCustomModal();
        // Разблокируем
        leaderboardLoading = false;

        // Если VK инициализирован — открываем
        if (vkInitialized && typeof vkBridge !== 'undefined') {
            // Берём рекорд (как в старом коде)
            let highScore = 0;
            if (typeof window.vkHighscore !== 'undefined' && window.vkHighscore > 0) {
                highScore = window.vkHighscore;
            } else {
                highScore = Math.max(parseInt(localStorage.getItem('vkHighscore') || '0'),
                                     parseInt(localStorage.getItem('localHighscore') || '0'));
                window.vkHighscore = highScore;
            }
            // Ставим игру на паузу, если нужно
            if (typeof pauseGame === 'function' && window.isGameStarted && !window.isGameOver) {
                pauseGame();
            }
            // Отправляем запрос
            vkBridge.send('VKWebAppShowLeaderBoardBox', {
                user_result: highScore,
                global: 1
            })
            .then(() => console.log('✅ Таблица лидеров открыта'))
            .catch((error) => {
                console.error('❌ Ошибка:', error);
                // Повторная попытка без user_result
                vkBridge.send('VKWebAppShowLeaderBoardBox', { global: 1 })
                    .then(() => console.log('✅ Открыто без user_result'))
                    .catch((err) => {
                        console.error('❌ Вторая попытка:', err);
                        swal({
                            title: "📊 Таблица лидеров",
                            text: "Временно недоступна. Попробуйте позже.",
                            icon: "info",
                            button: "OK"
                        });
                    });
            });
        } else {
            // Если всё равно не готово — показываем ошибку
            swal({
                title: "Таблица лидеров",
                text: "Не удалось загрузить таблицу. Проверьте интернет и попробуйте позже.",
                icon: "info",
                button: "OK"
            });
        }
    };

    // Если VK уже готов — открываем сразу
    if (vkInitialized && typeof vkBridge !== 'undefined') {
        tryOpen();
        return;
    }

    // Иначе начинаем проверку каждые 300 мс, максимум 10 секунд
    let attempts = 0;
    const maxAttempts = 33; // 10 сек / 300 мс
    leaderboardCheckInterval = setInterval(() => {
        attempts++;
        if (vkInitialized && typeof vkBridge !== 'undefined') {
            tryOpen();
            return;
        }
        if (attempts >= maxAttempts) {
            // Время вышло
            clearInterval(leaderboardCheckInterval);
            leaderboardCheckInterval = null;
            leaderboardLoading = false;
            closeCustomModal();
            swal({
                title: "Таблица лидеров",
                text: "Не удалось загрузить таблицу. Проверьте интернет и попробуйте позже.",
                icon: "info",
                button: "OK"
            });
        }
    }, 300);
}
// Функция для отмены загрузки по крестику
function cancelLeaderboardLoading() {
    if (leaderboardCheckInterval) {
        clearInterval(leaderboardCheckInterval);
        leaderboardCheckInterval = null;
    }
    leaderboardLoading = false;
    closeCustomModal();
}

// ======================== ПРИГЛАШЕНИЕ ДРУЗЕЙ ========================
function inviteFriends() {
    if (typeof vkBridge === 'undefined') {
        swal({
            title: "Пригласить друзей",
            text: "Функция доступна только в приложении ВКонтакте",
            icon: "info",
            button: "OK"
        });
        return;
    }
    vkBridge.send("VKWebAppShowInviteBox")
        .then((data) => {
            console.log("Приглашение отправлено:", data);
            if (data.result) {
                swal({
                    title: "Спасибо!",
                    text: "Приглашение отправлено друзьям",
                    icon: "success",
                    button: "OK",
                    timer: 1500
                });
            }
        })
        .catch((error) => {
            console.error("Ошибка при открытии окна приглашения:", error);
            vkBridge.send("VKWebAppShare", {
                link: window.location.href,
                title: "Тетрис Black — сыграем?",
                description: "Отличная игра в тетрис! Попробуй побить мой рекорд!"
            }).catch(e => console.error("Ошибка шаринга:", e));
        });
}

// ======================== ОБЩИЙ ПРОГРЕСС ========================
function saveTotalProgress() {
    if (typeof player === 'undefined' || !player) return;
    const current = player.score || 0;
    const total = parseInt(localStorage.getItem('totalScore') || '0') + current;
    localStorage.setItem('totalScore', total);
    window.totalScore = total;
    saveToVKStorage(VK_STORAGE_KEYS.TOTAL_SCORE, total);
    console.log(`📊 Общий прогресс: +${current} = ${total} очков`);
}

function savePlayedDifficulty() {
    if (!selectedDifficulty) return;
    const played = JSON.parse(localStorage.getItem('playedDifficulties') || '[]');
    if (!played.includes(selectedDifficulty)) {
        played.push(selectedDifficulty);
        localStorage.setItem('playedDifficulties', JSON.stringify(played));
        saveToVKStorage(VK_STORAGE_KEYS.PLAYED_DIFFICULTIES, played);
        console.log('✅ Сохранена сложность:', selectedDifficulty);
    }
}

// ======================== ЕЖЕДНЕВНЫЙ БОНУС ========================
function claimDailyBonusWithSync() {
    const today = new Date().toDateString();
    const last = localStorage.getItem('dailyBonusDate');
    if (last === today) return false;
    localStorage.setItem('dailyBonusDate', today);
    saveToVKStorage(VK_STORAGE_KEYS.DAILY_BONUS, today);
    console.log('🎁 Ежедневный бонус синхронизирован');
    return true;
}

// ======================== КОЛЛЕКЦИИ ========================
function claimCollectionItemWithSync(itemId) {
    const progress = JSON.parse(localStorage.getItem('collectionsProgress') || '{}');
    if (progress[itemId]) return false;
    progress[itemId] = true;
    localStorage.setItem('collectionsProgress', JSON.stringify(progress));
    saveToVKStorage(VK_STORAGE_KEYS.COLLECTIONS_PROGRESS, progress);
    console.log(`🖼️ Картинка ${itemId} открыта и синхронизирована`);
    return true;
}

// ======================== ЗАПУСК ========================
initVKSDK();

// Баннер
setTimeout(() => {
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send('VKWebAppShowBannerAd', { banner_location: 'bottom' })
            .then(data => { if (data.result) console.log('Баннер успешно отображается'); })
            .catch(error => console.error('Ошибка при показе баннера:', error));
    }
}, 3000);