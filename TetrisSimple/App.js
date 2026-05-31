let vkInitialized = false;
let lastAdShowTime = 0; // Запоминаем время последнего показа рекламы

function initVKSDK() {
    if (typeof vkBridge !== 'undefined') {
        vkBridge.send('VKWebAppInit')
            .then(() => {
                console.log('VK Games SDK успешно инициализирован.');
                vkInitialized = true;
                
                // ЗАПРАШИВАЕМ ДОСТУП, ЧТОБЫ ВК РАЗРЕШИЛ ЧИТАТЬ ИЗ STORAGE
                vkBridge.send("VKWebAppGetUserInfo")
                    .then((userInfo) => {
                        console.log("Пользователь авторизован:", userInfo.first_name);
                        // Только ПОСЛЕ авторизации загружаем рекорд
                        loadVKHighScore();
                    })
                    .catch((err) => {
                        console.warn("Пользователь отклонил авторизацию, пробуем загрузить так:", err);
                        loadVKHighScore();
                    });

                showVKFullscreenAd();
            })
            .catch(err => {
                console.error('Ошибка при инициализации VK Bridge:', err);
                updateRecordText('Рекорд: 0');
            });
    } else {
        console.warn('VK Bridge не найден. Возможно, игра запущена локально.');
        updateRecordText('Рекорд: 0');
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

// Функция сохранения рекорда (Вызывается из tetris.js при endGame)
function saveVKScore(scoreValue) {
    if (!vkInitialized) {
        console.warn('SDK еще не загрузился. Рекорд не сохранен.');
        return;
    }
    if (scoreValue <= 0) return;

    // Сначала проверяем сохраненный ранее рекорд в облаке (VK Storage)
    vkBridge.send('VKWebAppStorageGet', { keys: ['tetris_high_score'] })
        .then((data) => {
            let previousHighScore = 0;
            if (data.keys && data.keys[0] && data.keys[0].value) {
                previousHighScore = parseInt(data.keys[0].value, 10) || 0;
            }

            // Если новый счет больше предыдущего рекорда — перезаписываем его
            if (scoreValue > previousHighScore) {
                vkBridge.send('VKWebAppStorageSet', {
                    key: 'tetris_high_score',
                    value: String(scoreValue)
                })
                .then(() => {
                    console.log(`Новый рекорд в ${scoreValue} очков успешно сохранен в VK Storage!`);
                    updateRecordText(`Рекорд: ${scoreValue}`);
                })
                .catch(err => console.error('Ошибка сохранения в VK Storage:', err));
            }
        })
        .catch(err => console.error('Ошибка получения данных из VK Storage:', err));
}

// Функция загрузки рекорда с серверов ВКонтакте
function loadVKHighScore() {
    if (!vkInitialized) {
        updateRecordText('Рекорд: 0');
        return;
    }
    
    vkBridge.send('VKWebAppStorageGet', { keys: ['tetris_high_score'] })
        .then((data) => {
            if (data.keys && data.keys[0] && data.keys[0].value) {
                const highScore = data.keys[0].value;
                updateRecordText(`Рекорд: ${highScore}`);
            } else {
                updateRecordText('Рекорд: 0');
            }
        })
        .catch(err => {
            console.log('Рекорд в облаке VK не найден (возможно, первая игра):', err);
            updateRecordText('Рекорд: 0');
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

// Функция вызова и открытия встроенной нативной таблицы лидеров ВК
function showVKLeaderboard(currentScore = 0) {
    // Включаем паузу в игре при открытии таблицы
    if (typeof pauseGame === 'function' && window.isGameStarted && !window.isGameOver) {
        pauseGame();
    }

    if (!vkInitialized) {
        console.warn("Лидерборд недоступен локально");
        return;
    }

    // ВК сам откроет красивое модальное окно поверх фрейма игры
    vkBridge.send('VKWebAppShowLeaderBoardBox', {
        user_result: parseInt(currentScore, 10) || 0 // Передаем текущие очки игрока для сравнения
    })
    .then((data) => {
        if (data.success) {
            console.log('Таблица лидеров успешно закрыта пользователем');
        }
    })
    .catch((error) => {
        console.error('Ошибка открытия таблицы лидеров ВК:', error);
    });
}
