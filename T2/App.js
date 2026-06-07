let vkInitialized = false;
let lastAdShowTime = 0; 
const APP_ID = 8167395;  
let vkUserToken = null;
let vkUserId = null;
const ServToken = '134027b6134027b6134027b6d5133cb85511340134027b671c0d867038ad81abbc5140d';

function initVKSDK() {    if (typeof vkBridge !== 'undefined') {        vkBridge.send('VKWebAppInit')
            .then(() => {                console.log('VK SDK инициализирован');                vkInitialized = true;                
                // Пытаемся получить данные пользователя
                return vkBridge.send("VKWebAppGetUserInfo");            })
            .then((userInfo) => {                vkUserId = userInfo.id;                console.log('Пользователь:', userInfo.first_name);                
                // Пытаемся получить токен (но не ждём его)
                vkBridge.send('VKWebAppGetAuthToken', { app_id: APP_ID, scope: '' })
                    .then(authData => {                        vkUserToken = authData.access_token;
                        console.log('✅ Токен получен, рекорды будут сохраняться');       loadVKHighScore(); // Загружаем рекорд только если есть токен
                    })
                    .catch(err => {      console.warn('⚠️ Токен не получен (игрок не авторизован или отказал)', err);
                        // ИГРА НЕ ЗАВИСНЕТ - просто показываем "Рекорд: 0"
                        updateRecordText('Рекорд: 0 (Гость)');
                    });                
                showVKFullscreenAd(); // Реклама работает и без токена
            })
            .catch((err) => {                console.warn('Пользователь не авторизован:', err);    updateRecordText('Рекорд: 0 (Гость)');
                vkInitialized = false; // Помечаем, что ВК-функции недоступны
            });
    } else {        console.warn('VK Bridge не найден');        updateRecordText('Рекорд: 0');
    }
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

function saveVKScore(scoreValue) {
    // Проверяем все условия для сохранения
    if (!vkInitialized) {        console.log('VK не инициализирован, рекорд не сохраняется');        return;    }
        if (!vkUserId) {        console.log('ID пользователя не получен, рекорд не сохраняется');        return;    }    
    if (!vkUserToken) {        console.log('Нет токена доступа (игрок не авторизован), рекорд не сохраняется');
            // swal({ text: "Войдите в ВК, чтобы сохранить рекорд!", icon: "info", timer: 2000 });
        return;    }    
    if (scoreValue <= 0) return;    
    // Здесь уже спокойно сохраняем рекорд
    vkBridge.send('VKWebAppCallAPIMethod', {        method: 'apps.getScore',        params: {            user_id: vkUserId,            v: '5.131',
            access_token: vkUserToken        }    })
    .then(data => {        let currentScore = parseInt(data.response) || 0;        if (scoreValue > currentScore) {
            // Сохраняем новый рекорд
            return vkBridge.send('VKWebAppCallAPIMethod', {                method: 'secure.addAppEvent',                params: {
                    user_id: vkUserId,         activity_id: 2,     value: scoreValue,      v: '5.131',       access_token: ServToken
                }            });        }    })
    .then(() => {        console.log('Рекорд сохранён:', scoreValue);        updateRecordText(`Рекорд: ${scoreValue}`);    })
    .catch(err => {        console.error('Ошибка сохранения рекорда:', err);
        // ИГРА ПРОДОЛЖАЕТ РАБОТАТЬ, просто рекорд не сохранился
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
            user_id: vkUserId,
            v: '5.131',
            access_token: vkUserToken
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

// Запускаем инициализацию ВК 
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
