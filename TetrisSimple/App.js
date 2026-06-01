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

function saveVKScore(scoreValue) {
    console.log('🔥 saveVKScore вызвана со счётом:', scoreValue);
    
    if (!vkInitialized) {
        console.warn('⚠️ VK не инициализирован, сохраняю только в localStorage');
        localStorage.setItem('tetris_high_score_backup', scoreValue);
        return;
    }
    
    if (scoreValue <= 0) return;
    
    // ПРЕОБРАЗУЕМ В СТРОКУ — ЭТО ВАЖНО!
    const scoreAsString = String(scoreValue);
    
    // Проверяем текущий рекорд
    vkBridge.send('VKWebAppStorageGet', { keys: ['tetris_high_score'] })
        .then((data) => {
            let previousHighScore = 0;
            if (data.keys && data.keys[0] && data.keys[0].value) {
                previousHighScore = parseInt(data.keys[0].value, 10) || 0;
            }
            
            console.log('📊 Текущий рекорд в VK:', previousHighScore);
            console.log('🎯 Новый счёт:', scoreValue);
            
            if (scoreValue > previousHighScore) {
                // СОХРАНЯЕМ КАК СТРОКУ!
                vkBridge.send('VKWebAppStorageSet', {
                    key: 'tetris_high_score',
                    value: scoreAsString  // <--- СТРОКА, А НЕ ЧИСЛО
                })
                .then(() => {
                    console.log(`✅ НОВЫЙ РЕКОРД СОХРАНЁН: ${scoreValue}`);
                    updateRecordText(`Рекорд: ${scoreValue}`);
                    window.vkHighscore = scoreValue;
                    if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
                })
                .catch(err => {
                    console.error('❌ Ошибка сохранения в VK Storage:', err);
                    // ЗАПАСНОЙ ВАРИАНТ — сохраняем в localStorage
                    localStorage.setItem('tetris_high_score_backup', scoreValue);
                });
            } else {
                console.log('Рекорд не побит');
            }
        })
        .catch(err => {
            console.error('❌ Ошибка получения данных из VK Storage:', err);
            // Пробуем сохранить вслепую
            vkBridge.send('VKWebAppStorageSet', {
                key: 'tetris_high_score',
                value: scoreAsString
            }).catch(e => console.error('И тут ошибка:', e));
        });
}


// Функция загрузки рекорда с серверов ВКонтакте
// Загружаем рекорд из VK, а если не получилось — из localStorage
function loadVKHighScore() {
    if (!vkInitialized) {
        updateRecordText('Рекорд: 0');
        // ДОБАВИТЬ — обновляем отображение в игре
        if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
        return;
    }
    
    vkBridge.send('VKWebAppStorageGet', { keys: ['tetris_high_score'] })
        .then((data) => {
            if (data.keys && data.keys[0] && data.keys[0].value) {
                const highScore = data.keys[0].value;
                updateRecordText(`Рекорд: ${highScore}`);
                window.vkHighscore = parseInt(highScore, 10) || 0;
                
                // ===== ЭТО ГЛАВНОЕ =====
                if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
                // =======================
            } else {
                updateRecordText('Рекорд: 0');
                window.vkHighscore = 0;
                if (typeof updateHighscoreDisplay === 'function') updateHighscoreDisplay();
            }
        })
        .catch(err => {
            console.log('Ошибка получения рекорда:', err);
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

// Функция вызова таблицы лидеров (работает на ПК и мобилках)
function showVKLeaderboard(currentScore = 0) {
    console.log('📊 Открываем таблицу лидеров, текущий счёт:', currentScore);
    
    if (typeof pauseGame === 'function' && window.isGameStarted && !window.isGameOver) {
        pauseGame();
    }
    
    if (!vkInitialized) {
        console.warn("⚠️ VK Bridge не инициализирован");
        swal({
            title: "Таблица лидеров",
            text: "Не удалось загрузить. Попробуйте позже.",
            icon: "info",
            button: "OK"
        });
        return;
    }
    
    // Единый метод для всех платформ (ПК и мобильные)
    vkBridge.send('VKWebAppShowLeaderBoardBox', {
        user_result: parseInt(currentScore, 10) || 0
    })
    .then((data) => {
        console.log('✅ Таблица лидеров успешно открыта', data);
    })
    .catch((error) => {
        console.error('❌ Ошибка открытия таблицы лидеров:', error);
        
        // Если ошибка — показываем рекорд через swal
        swal({
            title: "🏆 Ваш рекорд",
            text: `${currentScore} очков`,
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