let vkInitialized = false;
let lastAdShowTime = 0; 
const APP_ID = 8167395;  
const CLIENT_SECRET = "3DQmHqRiS5BKhCVxYG6J"; 

function initVKSDK() {
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send('VKWebAppInit')
            .then(() => {                console.log('VK Games SDK успешно инициализирован.');
                vkInitialized = true;                
                // ЗАПРАШИВАЕМ ДОСТУП, ЧТОБЫ ВК РАЗРЕШИЛ ЧИТАТЬ ИЗ STORAGE
            vkBridge.send("VKWebAppGetUserInfo")
    .then((userInfo) => {        console.log("Пользователь авторизован:", userInfo.first_name);
        window.vkUserId = userInfo.id;  // ← СОХРАНЯЕМ ID
        loadVKHighScore();
    })
                    .catch((err) => {
                        console.warn("Пользователь отклонил авторизацию, пробуем загрузить так:", err);
                        loadVKHighScore();
                    });

                showVKFullscreenAd();
            })
            .catch(err => {                console.error('Ошибка при инициализации VK Bridge:', err);
                updateRecordText('Рекорд: 0');
            });
    } else {        console.warn('VK Bridge не найден. Возможно, игра запущена локально.');
        updateRecordText('Рекорд: 0');
    }
}

// --- 1. Функция получения ТОКЕНА ПОЛЬЗОВАТЕЛЯ ---
function getUserAccessToken() {
    // Запрашиваем доступ к приложению (никаких extra прав)
    return vkBridge.send('VKWebAppGetAuthToken', {
        app_id: APP_ID,
        scope: ''  // Для рекордов права не нужны, но метод нужен для идентификации
    })
    .then(data => {
        // В data.access_token лежит токен текущего игрока
        console.log('Токен игрока получен');
        return data.access_token;
    })
    .catch(err => {
        console.error('Ошибка получения токена', err);
        return null;
    });
}

// Функция межстраничной рекламы (Вызывается между уровнями / при перезапуске)
function showVKFullscreenAd() {
    if (!vkInitialized) return;

    const currentTime = Date.now();
    // 120000 миллисекунд = 2 минуты. Если прошло меньше времени — рекламу не показываем
    if (currentTime - lastAdShowTime < 120000) {
        console.log('Реклама вызывалась недавно. Пауза сработает без баннера.');
        return; 
    }

    vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
        .then((data) => {
            if (data.result) {
                console.log('Рекламный баннер ВК успешно закрылся.');
                lastAdShowTime = Date.now(); // Сбрасываем таймер
            }
        })
        .catch((error) => {
            console.error('Ошибка при показе полноэкранной рекламы ВК:', error);
        });
}

// --- 2. Переписываем saveVKScore (теперь с токеном игрока) ---
function saveVKScore(scoreValue) {
    if (!vkInitialized || scoreValue <= 0) return;

    // Сначала получаем актуальный токен игрока
    getUserAccessToken().then(userToken => {
        if (!userToken) {
            console.warn('Не удалось получить токен игрока');
            return;
        }

        // 1. Получаем текущий рекорд через apps.getScore
        vkBridge.send('VKWebAppCallAPIMethod', {
            method: 'apps.getScore',
            request_id: 'getScore_' + Date.now(),
            params: {
                user_id: window.vkUserId,
                v: '5.131',
                access_token: userToken  // ← ТОЛЬКО ТОКЕН ИГРОКА!
            }
        })
        .then((data) => {
            let currentVKScore = parseInt(data.response) || 0;
            
            if (scoreValue > currentVKScore) {
                // 2. Сохраняем новый рекорд (тоже с токеном игрока)
                vkBridge.send('VKWebAppCallAPIMethod', {
                    method: 'secure.addAppEvent',
                    request_id: 'addScore_' + Date.now(),
                    params: {
                        user_id: window.vkUserId,
                        activity_id: 2,
                        value: scoreValue,
                        v: '5.131',
                        access_token: userToken  // ← ТОЛЬКО ТОКЕН ИГРОКА!
                    }
                })
                .then(() => {
                    console.log(`✅ Новый рекорд сохранён для ${window.vkUserId}: ${scoreValue}`);
                    updateRecordText(`Рекорд: ${scoreValue}`);
                    window.vkHighscore = scoreValue;
                })
                .catch(err => console.error('Ошибка сохранения:', err));
            }
        })
        .catch(err => console.error('Ошибка получения рекорда:', err));
    });
}

// Функция загрузки рекорда с серверов ВКонтакте
function loadVKHighScore() {
    if (!vkInitialized) {
        updateRecordText('Рекорд: 0');
        if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
        return;
    }    
    // Получаем рекорд через API, а не через Storage
    vkBridge.send('VKWebAppCallAPIMethod', {
        method: 'apps.getScore',
        request_id: 'loadScore_' + Date.now(),
        params: {
            user_id: window.vkUserId,
            v: '5.131',
            access_token: ACCESS_TOKEN
        }
    })
    .then((data) => {
        let highScore = parseInt(data.response) || 0;
        updateRecordText(`Рекорд: ${highScore}`);
        window.vkHighscore = highScore;
        localStorage.setItem('highscore', highScore);
        if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
        console.log('🏆 Загружен рекорд из VK API:', highScore);
    })
    .catch(err => {
        console.error('Ошибка загрузки рекорда:', err);
        updateRecordText('Рекорд: 0');
        window.vkHighscore = 0;
        if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
    });
}
// Вспомогательная функция вывода текста на экран (переименована для чистоты)
function updateRecordText(text) {
    const topEl = document.getElementById('yandex-highscore-top');
    const sideEl = document.getElementById('yandex-highscore-side');
    if (topEl) topEl.innerText = text;
    if (sideEl) sideEl.innerText = text;
}

// Запускаем инициализацию ВК вместо Яндекса
initVKSDK();

function showVKLeaderboard(currentScore = 0) {
    console.log('📊 Открываем таблицу лидеров, текущий счёт:', currentScore);    
    if (typeof pauseGame === 'function' && window.isGameStarted && !window.isGameOver) {
        pauseGame();
    }    
    if (!vkInitialized) {
        console.warn("⚠️ VK Bridge не инициализирован");
        swal({
            title: "Таблица лидеров",
            text: "Недоступно. Попробуйте позже.",
            icon: "info",
            button: "OK"
        });
        return;
    }    
    // Пытаемся открыть таблицу лидеров
    vkBridge.send('VKWebAppShowLeaderBoardBox', {
        user_result: parseInt(currentScore, 10) || 0
    })
    .then((data) => {
        if (data && data.success) {
            console.log('✅ Таблица лидеров успешно открыта');
        }
    })
    .catch((error) => {
        console.error('❌ Ошибка открытия таблицы лидеров:', error);
        
        // Только при реальной ошибке показываем скромное сообщение
        swal({
            title: "📊 Таблица лидеров",
            text: "Временно недоступна. Попробуйте обновить страницу.",
            icon: "info",
            button: "OK"
        });
    });
}

// После инициализации VK, принудительно обновляем рекорд
setTimeout(function() {
    if (typeof updateHighscoreDisplay === 'function') {
        updateHighscoreDisplay();
        console.log('🔥 Принудительное обновление рекорда после задержки');
    }
}, 1000);

setTimeout(function() {
    if (typeof updateHighscoreDisplay === 'function') {
        updateHighscoreDisplay();
        console.log('🔥 Вторая принудительная попытка обновления рекорда');
    }
}, 3000);
// Функция приглашения друзей через VK
function inviteFriends() {
    if (typeof vkBridge === 'undefined') {
        console.warn('VK Bridge не найден');
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
            // Запасной вариант — открываем стандартное окно шеринга
            vkBridge.send("VKWebAppShare", {
                link: window.location.href,
                title: "Тетрис Black — сыграем?",
                description: "Отличная игра в тетрис! Попробуй побить мой рекорд!"
            }).catch(e => console.error("Ошибка шаринга:", e));
        });
}
function updateHighscoreDisplay() {
    let currentHighscore = 0;
    
    // БЕРЁМ ТОЛЬКО ИЗ VK STORAGE (через window.vkHighscore)
    if (typeof window.vkHighscore !== 'undefined' && window.vkHighscore > 0) {
        currentHighscore = window.vkHighscore;
    } else {
        // Если VK не ответил — показываем 0, не используем localStorage
        currentHighscore = 0;
    }
    
    const sideElement = document.getElementById('yandex-highscore-side');
    const topElement = document.getElementById('yandex-highscore-top');
    
    if (sideElement) sideElement.innerHTML = 'Рекорд: ' + currentHighscore;
    if (topElement) topElement.innerHTML = 'Рекорд: ' + currentHighscore;
    
    console.log('🏆 Зелёный рекорд обновлён из VK Storage:', currentHighscore);
}