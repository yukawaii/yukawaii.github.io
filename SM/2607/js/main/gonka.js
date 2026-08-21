// ============================================================
//  RACE MANAGER  — финальная версия с динамическими ботами
//  🏎️  Скорость ботов зависит от игрока и времени
//  🏆  Всегда есть победитель (набирает максимум очков)
//  🥈🥉  Второе и третье места требуют преодоления второй ступени
//  ⏱️  Обновление прогресса каждые 10 секунд
//  📈  В начале гонки боты набирают 1-5% очков для активности
//  🎯  Гарантированный минимум очков для ботов в первые минуты
//  ⚖️  Адаптивная скорость для коротких гонок
// ============================================================

const RaceManager = {
    // ----- Внутренние свойства -----
    _game: null,
    _activeRace: null,
    _interval: null,
    _timerInterval: null,
    _updateInterval: 10000,     // 🔄 обновление каждые 10 секунд
    _modalOpen: false,
    _button: null,
    _initialized: false,
    _buttonRetryTimer: null,
    _activeModalElement: null,
        _finishedRace: null,        // завершённая гонка с непоказанным результатом

    // ----- Инициализация -----
    init(game) {
        if (this._initialized) {
            console.warn('[RaceManager] Уже инициализирован');
            return;
        }
        this._game = game;
        this._initialized = true;
       // console.log('[RaceManager] Инициализация...');

        this._loadActiveRace();
        if (this._activeRace) {
            const config = this._activeRace.config;
            if (!this._isGlobalRaceActive(config)) {
                console.warn('[RaceManager] Глобальный сезон истёк, завершаем гонку');
                this._activeRace.state.ended = true;
                this._saveState();
                this._activeRace = null;
            } else {
                this._startUpdateLoop();
                this._startTimerUpdate();
               // console.log('[RaceManager] Активная гонка загружена, id:', config.id);
            }
        } else {
           // console.log('[RaceManager] Нет активной гонки');
        }

        this._updateButtonVisibility();
        clearTimeout(this._buttonRetryTimer);
        this._buttonRetryTimer = setTimeout(() => {
            this._updateButtonVisibility();
        }, 300);

                if (this._badgeUpdateInterval) {
            clearInterval(this._badgeUpdateInterval);
            this._badgeUpdateInterval = null;
        }
    },

    // ----- Проверка глобального сезона -----
    _isGlobalRaceActive(config) {
        if (!config.globalStartMonth || !config.globalStartDay) return true;
        const now = new Date();
        const year = now.getFullYear();
        const startDate = new Date(year, config.globalStartMonth - 1, config.globalStartDay);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + config.globalDurationDays - 1);
        return now >= startDate && now <= endDate;
    },

    // ----- Загрузка состояния активной гонки и поиск завершённой с непоказанным результатом -----
    _loadActiveRace() {
        // 1️⃣ Ищем незавершённую активную гонку
        for (const config of RACE_CONFIGS) {
            const key = 'cafe_race_' + config.id;
            let state = Storage.get(key);
            // Если Storage не дал данных, пробуем напрямую из localStorage
            if (!state) {
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        state = parsed.data;
                        console.log('[RaceManager] Загружено из localStorage (прямой доступ):', key, state);
                    }
                } catch (e) {
                    console.warn('[RaceManager] Ошибка чтения из localStorage:', e);
                }
            }
            if (state && typeof state === 'object' && !state.ended) {
                this._activeRace = {
                    config: config,
                    state: state,
                };
                if (!state._lastBotUpdate) {
                    state._lastBotUpdate = state.startTime || Date.now();
                }
                this._restoreBotProfiles(state, config);
                console.log('[RaceManager] Найдена активная гонка:', config.id, state);
                return;
            }
        }
        this._activeRace = null;

        // 2️⃣ Если нет активной, ищем завершённую гонку с непоказанным результатом
        for (const config of RACE_CONFIGS) {
            const key = 'cafe_race_' + config.id;
            let state = Storage.get(key);
            if (!state) {
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        state = parsed.data;
                    }
                } catch (e) { /* ignore */ }
            }
            if (state && typeof state === 'object' && state.ended === true && state.resultShown !== true) {
                this._finishedRace = {
                    config: config,
                    state: state,
                };
                this._restoreBotProfiles(state, config);
                console.log('[RaceManager] Найдена завершённая гонка с непоказанным результатом:', config.id, state);
                return;
            }
        }
        this._finishedRace = null;
    },

 // 🔧 Восстанавливаем профили ботов (принимает state и config)
    _restoreBotProfiles(state, config) {
        // Если config не передан, пытаемся взять из this._activeRace (обратная совместимость)
        if (!config) {
            if (this._activeRace) {
                config = this._activeRace.config;
            } else {
                console.warn('[RaceManager] _restoreBotProfiles: config не передан и нет активной гонки');
                return;
            }
        }
        const maxScore = config.targetScores[config.targetScores.length - 1];
        const durationSeconds = config.durationHours * 3600;
        let speedFactor = 0.7;
        if (config.durationHours <= 1) {
            speedFactor = 1.5;
        } else if (config.durationHours <= 3) {
            speedFactor = 1.0;
        } else {
            speedFactor = 0.7;
        }
        const targetSpeed = (maxScore / durationSeconds) * speedFactor;

        for (const bot of state.participants.bots) {
            if (bot.profile) {
                const profile = BOT_PROFILES[bot.profile];
                if (profile) {
                    bot.profileParams = {
                        ...profile,
                        speedCurve: profile.speedCurve.bind(profile),
                    };
                } else {
                    const profiles = Object.keys(BOT_PROFILES);
                    const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
                    bot.profile = randomProfile;
                    bot.profileParams = {
                        ...BOT_PROFILES[randomProfile],
                        speedCurve: BOT_PROFILES[randomProfile].speedCurve.bind(BOT_PROFILES[randomProfile]),
                    };
                }
            } else {
                const profiles = Object.keys(BOT_PROFILES);
                const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
                bot.profile = randomProfile;
                bot.profileParams = {
                    ...BOT_PROFILES[randomProfile],
                    speedCurve: BOT_PROFILES[randomProfile].speedCurve.bind(BOT_PROFILES[randomProfile]),
                };
            }
            const individualFactor = 0.5 + Math.random() * 1.0;
            bot._baseSpeed = targetSpeed * individualFactor;
            if (bot.phaseShift === undefined) bot.phaseShift = Math.random() * 0.3 - 0.15;
            if (bot._burstCooldown === undefined) bot._burstCooldown = 0;
            if (bot._inactiveUntil === undefined) bot._inactiveUntil = Date.now() + Math.random() * 30000;
            if (bot._activeUntil === undefined) bot._activeUntil = 0;
            const gapPercent = 0.05 + Math.random() * 0.15;
            bot._maxGap = Math.max(5, Math.floor(maxScore * gapPercent));
            if (bot._speedCurveFactor === undefined) bot._speedCurveFactor = 0.7 + Math.random() * 0.6;
            bot._targetScore = 0;
        }
    },

    // ----- Сохранение состояния -----
    _saveState() {
        if (!this._activeRace) return;
        const key = 'cafe_race_' + this._activeRace.config.id;
        Storage.set(key, this._activeRace.state);
    },

    // ----- Старт новой гонки -----
    startRace(raceId) {
                // Если есть завершённая гонка с непоказанным результатом, сбрасываем её (игрок начинает новую)
        this._finishedRace = null;

        const config = RACE_CONFIGS.find(c => c.id === raceId);
        if (!config) {
            console.warn('[RaceManager] Конфигурация гонки не найдена:', raceId);
            return false;
        }
        if (!this._isGlobalRaceActive(config)) {
            ModalManager.showErrorModal(
                getText('race_season_ended_title', 'Сезон завершён'),
                getText('race_season_ended_text', 'Этот ивент уже закончился. Ждите следующего года!')
            );
            return false;
        }

        if (this._activeRace) {
            this._activeRace.state.ended = true;
            this._saveState();
            this._activeRace = null;
        }

        //console.log('[RaceManager] Старт гонки:', config.id);

        const state = {
            startTime: Date.now(),
            _lastBotUpdate: Date.now(),
            participants: {
                player: {
                    name: getText('race_player', 'Вы'),
                    score: 0,
                    avatar: 'player',
                },
                bots: this._generateBots(config),
            },
            ended: false,
            rewards: null,
            rewardsClaimed: false,
               resultShown: false,          // 🆕 флаг, что результат ещё не показан
        };

        const key = 'cafe_race_' + config.id;
        Storage.set(key, state);
        this._activeRace = { config, state };
        this._startUpdateLoop();
        this._startTimerUpdate();
        this._updateButtonVisibility();
     //   console.log('[RaceManager] Гонка запущена, участников ботов:', state.participants.bots.length);
        return true;
    },

    // ----- Генерация ботов -----
    _generateBots(config) {
        const count = 4;
        const shuffledNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);
        const profiles = Object.keys(BOT_PROFILES);
        const maxScore = config.targetScores[config.targetScores.length - 1];
        const durationSeconds = config.durationHours * 3600;
        let speedFactor = 0.7;
        if (config.durationHours <= 1) {
            speedFactor = 1.5;
        } else if (config.durationHours <= 3) {
            speedFactor = 1.0;
        } else {
            speedFactor = 0.7;
        }
        const targetSpeed = (maxScore / durationSeconds) * speedFactor;

        const bots = [];
        for (let i = 0; i < count; i++) {
            const name = shuffledNames[i % shuffledNames.length];
            const profileName = profiles[Math.floor(Math.random() * profiles.length)];
            const profile = BOT_PROFILES[profileName];
            const phaseShift = Math.random() * 0.3 - 0.15;
            const avatarNum = Math.floor(Math.random() * 10) + 1;
            const individualFactor = 0.5 + Math.random() * 1.0;
            const gapPercent = 0.05 + Math.random() * 0.15;

            bots.push({
                name: name,
                score: 0,
                profile: profileName,
                profileParams: {
                    ...profile,
                    speedCurve: profile.speedCurve.bind(profile),
                },
                phaseShift: phaseShift,
                avatar: `k${avatarNum}.png`,
                _burstCooldown: 0,
                _baseSpeed: targetSpeed * individualFactor,
                _inactiveUntil: Date.now() + Math.random() * 30000,
                _activeUntil: 0,
                _maxGap: Math.max(5, Math.floor(maxScore * gapPercent)),
                _speedCurveFactor: 0.7 + Math.random() * 0.6,
                _targetScore: 0,
            });
        }
        return bots;
    },

    // ----- Таймер для обновления секунд -----
    _startTimerUpdate() {
        if (this._timerInterval) clearInterval(this._timerInterval);
        this._timerInterval = setInterval(() => {
            if (this._modalOpen && this._activeModalElement) {
                this._updateTimerOnly();
            }
        }, 1000);
          // 🏷️ Обновляем плашку на кнопке каждую минуту
        if (this._badgeUpdateInterval) clearInterval(this._badgeUpdateInterval);
        this._badgeUpdateInterval = setInterval(() => {
            this._updateRaceButtonLabel();
        }, 600000); // 10 минут
    },

    _updateTimerOnly() {
        const modalEl = this._activeModalElement;
        if (!modalEl) return;
        const state = this._activeRace.state;
        if (!state) return;
        const config = this._activeRace.config;
        const now = Date.now();
        const elapsed = (now - state.startTime) / 1000;
        const remaining = Math.max(0, config.durationHours * 3600 - elapsed);
        const timeStr = this._formatTime(remaining);
        const timerEl = modalEl.querySelector('.race-timer');
        if (timerEl) timerEl.textContent = '⏱ ' + timeStr;
    },

    // ----- Основной цикл обновления прогресса (каждые 10 секунд) -----
    _startUpdateLoop() {
        if (this._interval) clearInterval(this._interval);
        this._interval = setInterval(() => {
            this._updateRaceProgress();
        }, this._updateInterval);
        this._updateRaceProgress();
    },

    _updateRaceProgress() {
        if (!this._activeRace || this._activeRace.state.ended) return;
        const state = this._activeRace.state;
        const config = this._activeRace.config;
        const now = Date.now();
        const maxScore = config.targetScores[config.targetScores.length - 1];
        const durationSeconds = config.durationHours * 3600;

        // Ограничиваем максимальное время между обновлениями (60 секунд)
        const maxTimeDelta = 60;
        let timeDelta = (now - (state._lastBotUpdate || state.startTime)) / 1000;
        if (timeDelta > maxTimeDelta) timeDelta = maxTimeDelta;
        state._lastBotUpdate = now;

        const elapsedSeconds = (now - state.startTime) / 1000;
        const timeProgress = Math.min(elapsedSeconds / durationSeconds, 1);
        const currentHour = new Date(now).getHours();
        const playerScore = state.participants.player.score;

        // 🎯 Основной цикл начисления очков ботам
        for (const bot of state.participants.bots) {
            // 1️⃣ Периоды активности/бездействия
            if (now < bot._inactiveUntil) continue;
            if (now >= bot._inactiveUntil && bot._activeUntil === 0) {
                const activeDuration = (10 + Math.random() * 20) * (0.5 + timeProgress * 0.5);
                bot._activeUntil = now + activeDuration * 1000;
            }
            if (bot._activeUntil > 0 && now >= bot._activeUntil) {
                const inactiveDuration = 15 + Math.random() * 45;
                bot._inactiveUntil = now + inactiveDuration * 1000;
                bot._activeUntil = 0;
                continue;
            }

            const profile = bot.profileParams;
            if (!profile || typeof profile.speedCurve !== 'function') continue;

            let speedMultiplier = profile.baseSpeed || 0.8;
            const curveMultiplier = profile.speedCurve(timeProgress + (bot.phaseShift || 0));
            speedMultiplier *= Math.max(0.1, curveMultiplier);

            const timeSpeedFactor = this._getTimeSpeedFactor(timeProgress);
            speedMultiplier *= timeSpeedFactor;

            const diff = playerScore - bot.score;
            if (diff > 0) {
                const catchUpFactor = Math.min(diff / maxScore, 0.5) * 1.2;
                speedMultiplier *= (1 + catchUpFactor);
            } else if (diff < 0) {
                const gap = -diff;
                if (gap > bot._maxGap) {
                    continue;
                }
                const aheadFactor = Math.min(gap / bot._maxGap, 1) * 0.7;
                speedMultiplier *= (1 - aheadFactor);
            }

            const dayMultiplier = DAY_CYCLE.speedMultiplierByHour(currentHour);
            speedMultiplier *= dayMultiplier;

            const noise = 0.85 + Math.random() * 0.3;
            speedMultiplier *= noise;

            if (bot._burstCooldown <= 0 && Math.random() < profile.burstChance) {
                speedMultiplier *= profile.burstMultiplier;
                bot._burstCooldown = 60 + Math.random() * 120;
            } else if (bot._burstCooldown > 0) {
                bot._burstCooldown -= timeDelta;
            }

            speedMultiplier = Math.max(0.1, Math.min(speedMultiplier, 2.5));

            const increment = bot._baseSpeed * speedMultiplier * timeDelta;
            const maxIncrement = maxScore * 0.05;
            const safeIncrement = Math.min(increment, maxIncrement);
            bot.score = Math.min(bot.score + safeIncrement, maxScore);
        }

        // 🎯 ГАРАНТИРОВАННЫЙ МИНИМУМ ОЧКОВ ДЛЯ БОТОВ В ПЕРВЫЕ МИНУТЫ
        this._ensureBotMinimumScores();

        // Проверяем завершение гонки
        this._checkRaceEnd();
        this._saveState();

        // Обновляем модалку
        if (this._modalOpen && this._activeModalElement) {
            this._updateActiveModalData();
        }
    },

    // 🎯 Функция зависимости скорости от времени
    _getTimeSpeedFactor(progress) {
        if (progress < 0.05) {
            return 0.1 + (progress / 0.05) * 0.2;
        }
        if (progress < 0.2) {
            const t = (progress - 0.05) / 0.15;
            return 0.3 - t * 0.15;
        }
        if (progress < 0.5) {
            const t = (progress - 0.2) / 0.3;
            return 0.15 + t * 0.15;
        }
        if (progress < 0.75) {
            const t = (progress - 0.5) / 0.25;
            return 0.3 + t * 0.4;
        }
        const t = (progress - 0.75) / 0.25;
        return 0.7 + t * 0.8;
    },

       // 🎯 ГАРАНТИРОВАННЫЙ МИНИМУМ ОЧКОВ ДЛЯ БОТОВ В ПЕРВЫЕ МИНУТЫ
    // 🎯 ГАРАНТИРОВАННЫЙ МИНИМУМ ОЧКОВ ДЛЯ БОТОВ В ПЕРВЫЕ МИНУТЫ
    _ensureBotMinimumScores() {
        const state = this._activeRace.state;
        const config = this._activeRace.config;
        const now = Date.now();
        const elapsedSeconds = (now - state.startTime) / 1000;
        const maxScore = config.targetScores[config.targetScores.length - 1];

        // Получаем всех ботов, сортируем по очкам (по возрастанию)
        const bots = state.participants.bots.slice().sort((a, b) => a.score - b.score);

        // 📌 5–30 секунд: минимум 1–4 бота должны иметь >=1 очко (имитация старта)
        if (elapsedSeconds >= 5 && elapsedSeconds < 30) {
            const minScore = 1;
            const maxBots = 4;
            // Выбираем ботов, у которых меньше minScore
            const toBoost = bots.filter(b => b.score < minScore);
            const count = Math.min(toBoost.length, maxBots);
            for (let i = 0; i < count; i++) {
                const bot = toBoost[i];
                // Добавляем случайное количество очков от 1 до 2
                const add = 1 + Math.floor(Math.random() * 2); // 1 или 2
                bot.score = Math.min(bot.score + add, maxScore);
            }
        }

        // 📌 30–60 секунд: минимум 2 бота должны иметь >=3 очка (моментально в 30 сек)
        else if (elapsedSeconds >= 30 && elapsedSeconds < 60) {
            const minScore = 3;
            const minBots = 2;
            // Смотрим, сколько ботов уже имеют >= minScore
            const hasEnough = bots.filter(b => b.score >= minScore).length;
            if (hasEnough < minBots) {
                // Нужно добавить очков недостающим ботам
                const toBoost = bots.filter(b => b.score < minScore);
                const need = minBots - hasEnough;
                const count = Math.min(toBoost.length, need);
                for (let i = 0; i < count; i++) {
                    const bot = toBoost[i];
                    // Добавляем ровно до minScore (но не больше maxScore)
                    const target = Math.min(minScore, maxScore);
                    if (bot.score < target) {
                        bot.score = target;
                    }
                }
            }
        }

        // 📌 60–240 секунд (1–4 минуты): минимум 1–3 бота должны иметь 3–7 очков (моментально в 60 сек)
        else if (elapsedSeconds >= 60 && elapsedSeconds < 240) {
            const minScore = 3;
            const maxScoreTarget = 7;
            // Определяем, сколько ботов должны получить очки (1-3)
            const targetCount = 1 + Math.floor(Math.random() * 3); // 1, 2 или 3
            // Выбираем ботов с наименьшим количеством очков, у которых ещё нет нужного количества
            const toBoost = bots.filter(b => b.score < maxScoreTarget);
            const count = Math.min(toBoost.length, targetCount);
            for (let i = 0; i < count; i++) {
                const bot = toBoost[i];
                // Добавляем случайное количество очков от minScore до maxScoreTarget
                const add = minScore + Math.floor(Math.random() * (maxScoreTarget - minScore + 1));
                const target = Math.min(bot.score + add, maxScore);
                if (bot.score < target) {
                    bot.score = target;
                }
            }
        }
    },


    // ----- Обновление модалки (прогресс-бары, очки) с явной установкой очков игрока -----
    _updateActiveModalData() {
        const modalEl = this._activeModalElement;
        if (!modalEl) return;

        const state = this._activeRace.state;
        const config = this._activeRace.config;
        const now = Date.now();
        const elapsed = (now - state.startTime) / 1000;
        const remaining = Math.max(0, config.durationHours * 3600 - elapsed);
        const timeStr = this._formatTime(remaining);
        const timerEl = modalEl.querySelector('.race-timer');
        if (timerEl) timerEl.textContent = '⏱ ' + timeStr;

        const participants = [
            { type: 'player', data: state.participants.player, avatar: 'player' },
            ...state.participants.bots.map(b => ({ type: 'bot', data: b, avatar: b.avatar })),
        ];
        participants.sort((a, b) => b.data.score - a.data.score);

        const targets = config.targetScores;
        const listEl = modalEl.querySelector('.race-participants-list');
        if (!listEl) return;

        const rows = listEl.querySelectorAll('.race-participant-row');
        rows.forEach((row, index) => {
            const p = participants[index];
            if (!p) return;
            const scoreEl = row.querySelector('.race-participant-score');
            if (scoreEl) scoreEl.textContent = Math.floor(p.data.score);

            const progressContainer = row.querySelector('.race-progress-container');
            if (progressContainer) {
                const fills = progressContainer.querySelectorAll('.race-progress-fill');
                const score = p.data.score;
                const step = 10;
                fills.forEach((fill, segIndex) => {
                    const prevTarget = segIndex === 0 ? 0 : targets[segIndex - 1];
                    const currentTarget = targets[segIndex];
                    const segmentRange = currentTarget - prevTarget;
                    let scoreInSegment = Math.max(0, score - prevTarget);
                    scoreInSegment = Math.min(scoreInSegment, segmentRange);
                    const roundedScore = Math.floor(scoreInSegment / step) * step;
                    let segmentProgress = roundedScore / segmentRange;
                    if (score >= currentTarget) segmentProgress = 1;
                    fill.style.width = (segmentProgress * 100) + '%';
                });
            }

            const chestEl = row.querySelector('.race-chest');
            if (chestEl) {
                const place = index + 1;
                if (place <= 3) {
                    const chestUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/sunduk${place}.png`) || '🎁';
                    chestEl.innerHTML = `<img src="${chestUrl}" style="width:2rem; height:2rem; object-fit:contain;">`;
                } else {
                    chestEl.innerHTML = `<span style="width:2rem; display:inline-block;"></span>`;
                }
            }
        });

        // 🎯 ЯВНО ОБНОВЛЯЕМ ОЧКИ ИГРОКА (чтобы избежать багов с индексами)
        const playerRow = listEl.querySelector('.race-participant-row[data-player="true"]');
        if (playerRow) {
            const playerScoreEl = playerRow.querySelector('.race-participant-score');
            if (playerScoreEl) {
                const playerScore = state.participants.player.score;
                playerScoreEl.textContent = Math.floor(playerScore);
            }
        }
    },

    onScoreAdded(amount) {
        if (!this._activeRace || this._activeRace.state.ended) return;
        const player = this._activeRace.state.participants.player;
        const maxScore = this._activeRace.config.targetScores[this._activeRace.config.targetScores.length - 1];
        player.score = Math.min(player.score + amount, maxScore);
        this._saveState();
        if (this._modalOpen && this._activeModalElement) {
            this._updateActiveModalData();
        }
        this._checkRaceEnd();

        // 🎯 Обновляем общий интерфейс игры, чтобы игрок видел, что его очки не изменились
        // Альтернативно, если есть метод обновления только счёта:
        if (this._game && typeof this._game.updateScoreOnly === 'function') {
            this._game.updateScoreOnly();
        }
    },

    // ----- Проверка завершения гонки -----
    _checkRaceEnd() {
        const state = this._activeRace.state;
        if (state.ended) return;
        const config = this._activeRace.config;
        const now = Date.now();
        const elapsed = (now - state.startTime) / 1000 / 3600;
        const timeLimit = config.durationHours;
        const maxScore = config.targetScores[config.targetScores.length - 1];

        const allParticipants = [
            state.participants.player,
            ...state.participants.bots
        ];
        const maxReached = allParticipants.some(p => p.score >= maxScore);

        if (elapsed >= timeLimit || maxReached) {
            this._finishRace();
        }
    },

       // ----- Прямое сохранение в localStorage (для надёжности) -----
    _saveStateDirect() {
        if (!this._activeRace) return;
        const key = 'cafe_race_' + this._activeRace.config.id;
        const data = {
            data: this._activeRace.state,
            _timestamp: Date.now()
        };
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log('[RaceManager] Прямое сохранение в localStorage:', key);
        } catch (e) {
            console.warn('[RaceManager] Ошибка прямого сохранения:', e);
        }
    },

    // ----- Завершение гонки (гарантируем победителя и топ-3 с порогами) -----
    _finishRace() {
        const state = this._activeRace.state;
        if (state.ended) return;
        state.ended = true;

        const config = this._activeRace.config;
        const maxScore = config.targetScores[config.targetScores.length - 1];
        const secondTarget = config.targetScores.length >= 2 ? config.targetScores[1] : maxScore;

        const all = [
            { type: 'player', data: state.participants.player, avatar: 'player' },
            ...state.participants.bots.map(b => ({ type: 'bot', data: b, avatar: b.avatar })),
        ];
        let winner = all.find(p => p.data.score >= maxScore);
        if (!winner) {
            all.sort((a, b) => b.data.score - a.data.score);
            const leader = all[0];
            const needed = maxScore - leader.data.score;
            if (needed > 0) {
                leader.data.score = maxScore;
                const remaining = all.slice(1);
                for (const p of remaining) {
                    if (p.data.score < secondTarget) {
                        p.data.score = Math.min(secondTarget, p.data.score + Math.floor(needed * 0.2));
                    }
                }
            }
        }

        all.sort((a, b) => b.data.score - a.data.score);
        for (let i = 1; i < Math.min(3, all.length); i++) {
            const p = all[i];
            if (p.data.score < secondTarget) {
                const maxAdd = Math.max(0, all[0].data.score - 1);
                const add = Math.min(secondTarget - p.data.score, maxAdd - p.data.score);
                p.data.score += Math.max(0, add);
            }
        }
        all.sort((a, b) => b.data.score - a.data.score);

        const playerIndex = all.findIndex(p => p.type === 'player');
        if (playerIndex === 0 && state.participants.player.score < maxScore * 0.1) {
            const botIndex = all.findIndex(p => p.type === 'bot');
            if (botIndex > 0) {
                const temp = all[0];
                all[0] = all[botIndex];
                all[botIndex] = temp;
                all.sort((a, b) => b.data.score - a.data.score);
            }
        }

        state.participants.player.score = all.find(p => p.type === 'player').data.score;
        for (let i = 0; i < state.participants.bots.length; i++) {
            const botData = all.find(p => p.type === 'bot' && p.data === state.participants.bots[i]);
            if (botData) {
                state.participants.bots[i].score = botData.data.score;
            }
        }

        const finalPlayerIndex = all.findIndex(p => p.type === 'player');
        const place = finalPlayerIndex + 1;

        let rewards = [];
        if (place <= 3) {
            rewards = this._generateRewards(place);
        }
        state.rewards = rewards;
        state.resultShown = false; // 🆕 гарантируем, что результат не был показан

        // 💾 Принудительное сохранение в localStorage и через Storage
        this._saveState();
        this._saveStateDirect(); // новый метод

        if (this._interval) clearInterval(this._interval);
        this._interval = null;
        if (this._timerInterval) clearInterval(this._timerInterval);
        this._timerInterval = null;

        if (this._modalOpen) {
            ModalManager.closeCenterModal();
            this._modalOpen = false;
            this._activeModalElement = null;
        }
        if (this._badgeUpdateInterval) {
            clearInterval(this._badgeUpdateInterval);
            this._badgeUpdateInterval = null;
        }

        this._showFinishModal();
    },

    _generateRewards(place) {
        const game = this._game;
        if (!game) return [];
        const availableTypes = game.sceneConfig.availableTypes || [];
        const validTypes = availableTypes.filter(t => game.itemData[t] && game.itemData[t].name);
        if (validTypes.length === 0) return [];

        const getRandomItem = (minLevel, maxLevel) => {
            const type = validTypes[Math.floor(Math.random() * validTypes.length)];
            const maxLv = game.maxLevels[type] || 1;
            const level = Math.min(minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1)), maxLv);
            return { typeIndex: type, level: level };
        };
        const getRandomGenerator = () => {
            const spawnable = validTypes.filter(t => game.itemData[t].spawnable);
            if (spawnable.length === 0) return getRandomItem(2, 5);
            const type = spawnable[Math.floor(Math.random() * spawnable.length)];
            const spawnLevels = game.itemData[type].spawnLevels || [];
            const level = spawnLevels.length > 0 ? spawnLevels[Math.floor(Math.random() * spawnLevels.length)] : 1;
            return { typeIndex: type, level: level };
        };
        let items = [];
        if (place === 1) {
            items.push(getRandomGenerator());
            items.push(getRandomItem(2, 5));
            items.push(getRandomItem(2, 5));
        } else if (place === 2) {
            items.push(getRandomItem(2, 5));
            items.push(getRandomItem(2, 5));
            items.push(getRandomItem(2, 5));
        } else if (place === 3) {
            items.push(getRandomItem(2, 3));
            items.push(getRandomItem(2, 3));
            items.push(getRandomItem(2, 3));
        }
        return items;
    },

        // ----- Возвращает оставшееся время до конца сезона в читаемом формате -----
    // 📅 Если сезон не активен, возвращает null
    _getSeasonTimeLeft() {
        // Находим первую активную гонку
        let activeConfig = null;
        for (const config of RACE_CONFIGS) {
            if (this._isGlobalRaceActive(config)) {
                activeConfig = config;
                break;
            }
        }
        if (!activeConfig) return null;

        const now = new Date();
        const year = now.getFullYear();
        const startDate = new Date(year, activeConfig.globalStartMonth - 1, activeConfig.globalStartDay);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + activeConfig.globalDurationDays - 1);
        // Устанавливаем конец дня (23:59:59)
        endDate.setHours(23, 59, 59, 999);

        const diffMs = endDate - now;
        if (diffMs <= 0) return null;

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) {
            return `${diffDays}д`;
        } else {
            return `${diffHours}ч`;
        }
    },
        // ----- Обновляет плашку с оставшимся временем на кнопке гонки -----
    _updateRaceButtonLabel() {
        const btn = document.getElementById('race-btn');
        if (!btn) return;

        // Удаляем старую плашку, если есть
        const oldBadge = btn.querySelector('.race-time-badge');
        if (oldBadge) oldBadge.remove();

        const timeLeft = this._getSeasonTimeLeft();
        if (!timeLeft) return; // сезон неактивен или уже закончился

        // Создаём плашку
        const badge = document.createElement('span');
      badge.className = 'time-badge';
        badge.textContent = timeLeft;
        badge.style.cssText = `
            position: absolute;
            top: -4px;
            right: -4px;
            background: #ff6b6b;
            color: #fff;
            font-size: 0.6rem;
            font-weight: bold;
            padding: 1px 4px;
            border-radius: 8px;
            border: 1px solid #2a1f14;
            box-shadow: 1px 1px 0 #2a1f14;
            line-height: 1.2;
            pointer-events: none;
            z-index: 5;
        `;
        btn.style.position = 'relative';
        btn.appendChild(badge);
    },

    // ----- Кнопка в правой панели -----
    _updateButtonVisibility() {
        //console.log('[RaceManager] Обновление видимости кнопки...');
        const rightPanel = document.getElementById('right-panel');
        if (!rightPanel) {
            setTimeout(() => this._updateButtonVisibility(), 200);
            return;
        }
        let btn = document.getElementById('race-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'race-btn';
            btn.className = 'tb-btn';
            const iconUrl = SpriteAtlas.getSpriteDataURL('ui', 'ui/race.png') || '🏁';
            btn.innerHTML = `<img src="${iconUrl}" style="width:90%; height:90%; object-fit:contain;" onerror="this.outerHTML='🏁';">`;
            btn.addEventListener('pointerdown', () => this.showRaceModal());
            rightPanel.appendChild(btn);
        }
        let anyActive = false;
        for (const config of RACE_CONFIGS) {
            if (this._isGlobalRaceActive(config)) { anyActive = true; break; }
        }
        const hasActive = this._activeRace !== null;
        const canStart = !hasActive && anyActive;
        const show = hasActive || canStart;
        btn.style.display = show ? 'flex' : 'none';
                // 🏷️ Обновляем плашку с временем, если кнопка видима
                    if (show) {
                        this._updateRaceButtonLabel();
                    } else {
                        // Если кнопка скрыта, удаляем плашку (на всякий случай)
                        const badge = btn.querySelector('.race-time-badge');
                        if (badge) badge.remove();
                    }
        this._button = btn;
       // console.log('[RaceManager] Кнопка видима?', show);

        // 🏷️ Обновляем плашку с временем, если кнопка видима
        if (show) {
            this._updateRaceButtonLabel();
        } else {
            const badge = btn.querySelector('.race-time-badge');
            if (badge) badge.remove();
        }
    },

    // ----- Открытие модалки -----
    showRaceModal() {
      //  console.log('[RaceManager] Открытие модалки');
        if (!this._activeRace) {
            // Если есть завершённая гонка с непоказанным результатом – показываем её
            if (this._finishedRace) {
                // Подменяем _activeRace на завершённую, чтобы _showFinishModal использовал её
                this._activeRace = this._finishedRace;
                this._finishedRace = null;
                this._modalOpen = true;
                this._showFinishModal();
                return;
            }

            // Если нет завершённой, проверяем, активен ли сезон для старта новой
            let anyActive = false, activeConfig = null;
            for (const config of RACE_CONFIGS) {
                if (this._isGlobalRaceActive(config)) { anyActive = true; activeConfig = config; break; }
            }
            if (anyActive && activeConfig) {
                this._showStartRaceModal(activeConfig);
            } else {
                ModalManager.showCenterModal({
                    title: getText('race_season_ended_title', 'Сезон завершён'),
                    body: getText('race_season_ended_text', 'Этот ивент уже закончился. Ждите следующего года!'),
                    buttons: [{ text: getText('ok', 'OK'), onClick: () => ModalManager.closeCenterModal() }],
                });
            }
            return;
        }
        this._modalOpen = true;
        const state = this._activeRace.state;
        if (state.ended) {
            this._showFinishModal();
        } else {
            this._showActiveModal();
        }
    },

    // ----- Модалка старта -----
    _showStartRaceModal(config) {
        const bodyHtml = `
            <div style="text-align:center; padding:0.5rem;">
                ${getText('race_start_desc', 'Вы готовы соревноваться с другими игроками? Гонка длится {hours} часов.', { hours: config.durationHours })}
            </div>
        `;
        ModalManager.showCenterModal({
            title: getText('race_start_title', 'Начать гонку?'),
            body: bodyHtml,
            buttons: [
                { text: getText('cancel', 'Отмена'), class: 'modal-btn-secondary', onClick: () => { ModalManager.closeCenterModal(); this._modalOpen = false; } },
                { text: getText('race_start', 'Начать'), onClick: () => { ModalManager.closeCenterModal(); this.startRace(config.id); this.showRaceModal(); } },
            ],
            onClose: () => { this._modalOpen = false; },
        });
    },

    // ----- Модалка активной гонки -----
    _showActiveModal() {
        const state = this._activeRace.state;
        const config = this._activeRace.config;
        const now = Date.now();
        const elapsed = (now - state.startTime) / 1000;
        const remaining = Math.max(0, config.durationHours * 3600 - elapsed);
        const timeStr = this._formatTime(remaining);

        const participants = [
            { type: 'player', data: state.participants.player, avatar: 'player' },
            ...state.participants.bots.map(b => ({ type: 'bot', data: b, avatar: b.avatar })),
        ];
        participants.sort((a, b) => b.data.score - a.data.score);

        const targets = config.targetScores;
        let html = `<div class="race-participants-list" style="display:flex; flex-direction:column; gap:0.6rem; width:100%; max-height:55vh; overflow-y:auto; padding:0.2rem 0;">`;
             for (let i = 0; i < participants.length; i++) {
            const p = participants[i];
            const isPlayer = p.type === 'player';
            const name = isPlayer ? getText('race_player', 'Вы') : p.data.name;
            const score = p.data.score;
            const place = i + 1;
            const dataPlayerAttr = isPlayer ? ' data-player="true"' : '';

            let avatarSrc;
            if (isPlayer) {
                avatarSrc = SpriteAtlas.getSpriteDataURL('chara', 'chara/pokupateli/k1.png');
            } else {
                const avatarName = p.avatar.replace(/\.[^.]+$/, '');
                avatarSrc = SpriteAtlas.getSpriteDataURL('chara', `chara/pokupateli/${avatarName}.png`);
            }
            if (!avatarSrc) {
                avatarSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23d9c5a6"/%3E%3Ctext x="20" y="25" font-size="20" text-anchor="middle" fill="%232a1f14"%3E👤%3C/text%3E%3C/svg%3E';
            }

            const step = 10;
            let segmentsHtml = '';
            for (let s = 0; s < targets.length; s++) {
                const prevTarget = s === 0 ? 0 : targets[s - 1];
                const currentTarget = targets[s];
                const segmentRange = currentTarget - prevTarget;
                let scoreInSegment = Math.max(0, score - prevTarget);
                scoreInSegment = Math.min(scoreInSegment, segmentRange);
                const roundedScore = Math.floor(scoreInSegment / step) * step;
                let segmentProgress = roundedScore / segmentRange;
                if (score >= currentTarget) segmentProgress = 1;
                segmentsHtml += `
                    <div style="flex:1; height:100%; background:#d9c5a6; border-right:1px solid #2a1f14; position:relative; overflow:hidden;">
                        <div class="race-progress-fill" style="width:${segmentProgress * 100}%; height:100%; background:#4caf50; transition: width 0.3s ease;"></div>
                    </div>
                `;
            }

            let chestHtml = '';
            if (place <= 3) {
                const chestUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/sunduk${place}.png`) || '🎁';
                chestHtml = `<img src="${chestUrl}" style="width:2rem; height:2rem; object-fit:contain;">`;
            } else {
                chestHtml = `<span style="width:2rem; display:inline-block;"></span>`;
            }

            html += `
                <div class="race-participant-row"${dataPlayerAttr} style="display:flex; align-items:center; gap:0.5rem; padding:0.2rem 0; border-bottom:1px solid rgba(0,0,0,0.05);">
                    <div style="width:2.5rem; height:2.5rem; border-radius:50%; overflow:hidden; border:2px solid #2a1f14; flex-shrink:0;">
                        <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover; object-position:top;" alt="">
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:bold; font-size:0.9rem;">${name}</div>
                        <div style="display:flex; align-items:center; gap:0.3rem; height:1.2rem;">
                            <div class="race-progress-container" style="flex:1; height:100%; display:flex; background:#d9c5a6; border:1px solid #2a1f14; border-radius:2px; overflow:hidden;">
                                ${segmentsHtml}
                            </div>
                            <span class="race-participant-score" style="font-size:0.8rem; white-space:nowrap;">${Math.floor(score)}</span>
                        </div>
                    </div>
                    <div class="race-chest" style="flex-shrink:0;">${chestHtml}</div>
                </div>
            `;
        }
        html += `</div>`;
        const timerHtml = `<div class="race-timer" style="text-align:center; font-size:1.2rem; font-weight:bold; padding:0.5rem 0;">⏱ ${timeStr}</div>`;

        const modal = ModalManager.showCenterModal({
            title: getText('race_title', 'Гонка') + ': ' + getText(config.nameKey, config.nameKey),
            body: html + timerHtml,
            buttons: [
                { text: getText('close', 'Закрыть'), onClick: () => { ModalManager.closeCenterModal(); this._modalOpen = false; this._activeModalElement = null; } },
            ],
            onClose: () => { this._modalOpen = false; this._activeModalElement = null; },
        });
        this._activeModalElement = modal;
    },

    // ----- Финальная модалка (двухэтапная) -----
    // 🎯 Первый этап: модалка с призом и кнопкой "Получить" (только для победителей)
    // 🎯 Второй этап: модалка с подтверждением и кнопкой "Новая гонка" / "Закрыть"
    _showFinishModal() {
        const state = this._activeRace.state;
        const config = this._activeRace.config;
        const seasonActive = this._isGlobalRaceActive(config);

        // Получаем всех участников, сортируем по очкам
        const allParticipants = [
            { type: 'player', data: state.participants.player, avatar: 'player' },
            ...state.participants.bots.map(b => ({ type: 'bot', data: b, avatar: b.avatar })),
        ];
        allParticipants.sort((a, b) => b.data.score - a.data.score);
        const playerIndex = allParticipants.findIndex(p => p.type === 'player');
        const place = playerIndex + 1;
        const isWinner = place <= 3;
        const hasReward = isWinner && state.rewards && state.rewards.length > 0;
        const rewardClaimed = state.rewardsClaimed === true;

        // 🏆 Определяем заголовок
        const titleKey = isWinner ? 'pobeda' : 'konec';
        const title = getText(titleKey, isWinner ? 'Победа!' : 'Конец') + ' - ' + getText(config.nameKey, config.nameKey);

        // 📌 ЕСЛИ ЕСТЬ НАГРАДА И ОНА ЕЩЁ НЕ ПОЛУЧЕНА → ПОКАЗЫВАЕМ ПЕРВУЮ МОДАЛКУ (с призом)
  if (hasReward && !rewardClaimed) {
    // Сразу выдаём награду
    const inventory = Storage.getInventory() || [];
    for (const item of state.rewards) {
        inventory.push({ typeIndex: item.typeIndex, level: item.level });
    }
    Storage.saveInventory(inventory);
    if (this._game && this._game.updateInventoryButton) {
        this._game.updateInventoryButton();
    }
    state.rewardsClaimed = true;
    this._saveState();

    // Строим топ-3 (как было)
    const top3 = allParticipants.slice(0, 3);
    const targets = config.targetScores;
    let topHtml = `<div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:0.8rem;">`;
    top3.forEach((p, index) => {
        const isPlayer = p.type === 'player';
        const name = isPlayer ? getText('race_player', 'Вы') : p.data.name;
        const score = p.data.score;
        const placeNum = index + 1;
        let avatarSrc;
        if (isPlayer) {
            avatarSrc = SpriteAtlas.getSpriteDataURL('chara', 'chara/pokupateli/k1.png');
        } else {
            const avatarName = p.avatar.replace(/\.[^.]+$/, '');
            avatarSrc = SpriteAtlas.getSpriteDataURL('chara', `chara/pokupateli/${avatarName}.png`);
        }
        if (!avatarSrc) avatarSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23d9c5a6"/%3E%3Ctext x="20" y="25" font-size="20" text-anchor="middle" fill="%232a1f14"%3E👤%3C/text%3E%3C/svg%3E';
        const step = 10;
        let segmentsHtml = '';
        for (let s = 0; s < targets.length; s++) {
            const prevTarget = s === 0 ? 0 : targets[s - 1];
            const currentTarget = targets[s];
            const segmentRange = currentTarget - prevTarget;
            let scoreInSegment = Math.max(0, score - prevTarget);
            scoreInSegment = Math.min(scoreInSegment, segmentRange);
            const roundedScore = Math.floor(scoreInSegment / step) * step;
            let segmentProgress = roundedScore / segmentRange;
            if (score >= currentTarget) segmentProgress = 1;
            segmentsHtml += `
                <div style="flex:1; height:100%; background:#d9c5a6; border-right:1px solid #2a1f14; position:relative; overflow:hidden;">
                    <div class="race-progress-fill" style="width:${segmentProgress * 100}%; height:100%; background:#4caf50; transition: width 0.3s ease;"></div>
                </div>
            `;
        }
        const chestUrl = SpriteAtlas.getSpriteDataURL('ui', `ui/sunduk${placeNum}.png`) || '🎁';
        topHtml += `
            <div style="display:flex; align-items:center; gap:0.5rem; padding:0.2rem 0; border-bottom:1px solid rgba(0,0,0,0.05);">
                <div style="width:2rem; height:2rem; border-radius:50%; overflow:hidden; border:2px solid #2a1f14; flex-shrink:0;">
                    <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover; object-position:top;" alt="">
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; font-size:0.8rem;">${placeNum}. ${name}</div>
                    <div style="display:flex; align-items:center; gap:0.3rem; height:1rem;">
                        <div style="flex:1; height:100%; display:flex; background:#d9c5a6; border:1px solid #2a1f14; border-radius:2px; overflow:hidden;">
                            ${segmentsHtml}
                        </div>
                        <span style="font-size:0.7rem; white-space:nowrap;">${Math.floor(score)}</span>
                    </div>
                </div>
                <div style="flex-shrink:0; width:2rem; text-align:center;">
                    <img src="${chestUrl}" style="width:1.8rem; height:1.8rem; object-fit:contain;">
                </div>
            </div>
        `;
    });
    topHtml += `</div>`;

    // Награды (клетки предметов)
    let itemsHtml = '<div class="item-info-grid" style="justify-content:center; gap:0.5rem;">';
    for (const item of state.rewards) {
        const imgSrc = BoardCore.getItemImageDataUrl(this._game, item.typeIndex, item.level);
        itemsHtml += `<div class="item-info-cell" style="width:clamp(4rem, 8vmin, 6rem); height:clamp(4rem, 8vmin, 6rem);">
            <img src="${imgSrc}" style="width:90%; height:90%; object-fit:contain;">
        </div>`;
    }
    itemsHtml += '</div>';

    const bodyHtml = topHtml + `<div style="margin-top:0.5rem;">${itemsHtml}</div>`;

    const title = getText('pobeda', 'Победа!') + ' - ' + getText(config.nameKey, config.nameKey);

    // Кнопка теперь "Продолжить"
    ModalManager.showCenterModal({
        title: title,
        body: bodyHtml,
        buttons: [
            {
                text: getText('pause_resume', 'Продолжить'),
                onClick: () => {
                    ModalManager.closeCenterModal();
                    this._showFinishModal(); // покажет вторую модалку
                }
            }
        ],
        onClose: () => {
            this._modalOpen = false;
        },
    });
    this._modalOpen = true;
    return;
}

        // 📌 ДЛЯ ПРОИГРАВШИХ ИЛИ УЖЕ ПОЛУЧИВШИХ НАГРАДУ → ВТОРАЯ МОДАЛКА
        let bodyHtml = '';

        if (isWinner && rewardClaimed) {
            // ✅ Победитель уже получил награду
            bodyHtml = `
                <div style="text-align:center; padding:0.5rem;">
                    <div style="font-size:1.2rem; margin-bottom:0.5rem;">${getText('prize_sent', 'Приз отправлен в корзинку с припасами!')}</div>
                    <div style="font-size:1rem;">${getText('play_again', 'Сыграть ещё раз?')}</div>
                </div>
            `;
        } else {
            // ❌ Проигравший – показываем первого победителя и прогресс игрока
            // Получаем победителя (1-е место)
            const winner = allParticipants[0];
            const player = allParticipants.find(p => p.type === 'player');
            const targets = config.targetScores;

            // Функция для генерации HTML одного участника (без порядкового номера)
            const renderParticipantRow = (participant, showChest = true, label = '') => {
                const isPlayer = participant.type === 'player';
                const name = isPlayer ? getText('race_player', 'Вы') : participant.data.name;
                const score = participant.data.score;
                let avatarSrc;
                if (isPlayer) {
                    avatarSrc = SpriteAtlas.getSpriteDataURL('chara', 'chara/pokupateli/k1.png');
                } else {
                    const avatarName = participant.avatar.replace(/\.[^.]+$/, '');
                    avatarSrc = SpriteAtlas.getSpriteDataURL('chara', `chara/pokupateli/${avatarName}.png`);
                }
                if (!avatarSrc) avatarSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23d9c5a6"/%3E%3Ctext x="20" y="25" font-size="20" text-anchor="middle" fill="%232a1f14"%3E👤%3C/text%3E%3C/svg%3E';

                const step = 10;
                let segmentsHtml = '';
                for (let s = 0; s < targets.length; s++) {
                    const prevTarget = s === 0 ? 0 : targets[s - 1];
                    const currentTarget = targets[s];
                    const segmentRange = currentTarget - prevTarget;
                    let scoreInSegment = Math.max(0, score - prevTarget);
                    scoreInSegment = Math.min(scoreInSegment, segmentRange);
                    const roundedScore = Math.floor(scoreInSegment / step) * step;
                    let segmentProgress = roundedScore / segmentRange;
                    if (score >= currentTarget) segmentProgress = 1;
                    segmentsHtml += `
                        <div style="flex:1; height:100%; background:#d9c5a6; border-right:1px solid #2a1f14; position:relative; overflow:hidden;">
                            <div class="race-progress-fill" style="width:${segmentProgress * 100}%; height:100%; background:#4caf50; transition: width 0.3s ease;"></div>
                        </div>
                    `;
                }

                const chestHtml = showChest ? `<img src="${SpriteAtlas.getSpriteDataURL('ui', 'ui/sunduk1.png') || '🎁'}" style="width:2rem; height:2rem; object-fit:contain;">` : `<span style="width:2rem; display:inline-block;"></span>`;

                return `
                    <div style="display:flex; align-items:center; gap:0.5rem; padding:0.2rem 0; border-bottom:1px solid rgba(0,0,0,0.05);">
                        <div style="width:2rem; height:2rem; border-radius:50%; overflow:hidden; border:2px solid #2a1f14; flex-shrink:0;">
                            <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover; object-position:top;" alt="">
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:bold; font-size:0.8rem;">${label} ${name}</div>
                            <div style="display:flex; align-items:center; gap:0.3rem; height:1rem;">
                                <div style="flex:1; height:100%; display:flex; background:#d9c5a6; border:1px solid #2a1f14; border-radius:2px; overflow:hidden;">
                                    ${segmentsHtml}
                                </div>
                                <span style="font-size:0.7rem; white-space:nowrap;">${Math.floor(score)}</span>
                            </div>
                        </div>
                        <div style="flex-shrink:0; width:2rem; text-align:center;">
                            ${chestHtml}
                        </div>
                    </div>
                `;
            };

            // Строим два ряда: победитель и игрок
            let rowsHtml = '';
            // Ряд победителя (1-е место)
            rowsHtml += renderParticipantRow(winner, true, '1.');
            // Ряд игрока
            rowsHtml += renderParticipantRow(player, false, ''); // без сундука

            // Текст поражения
            const failText = getText('race_fail', 'Вы не попали в призовую тройку. Попробуйте в следующий раз!');
            bodyHtml = `
                <div style="display:flex; flex-direction:column; gap:0.5rem; padding:0.5rem;">
                    ${rowsHtml}
                    <div style="text-align:center; font-size:1rem; padding:0.5rem 0;">${failText}</div>
                    <div style="text-align:center; font-size:1rem;">${getText('play_again', 'Сыграть ещё раз?')}</div>
                </div>
            `;
        }

        // 🎯 Кнопки для второй модалки
        const buttons = [];
        if (seasonActive) {
            buttons.push({
                text: getText('race_start_new', 'Новая гонка'),
                class: 'modal-btn-secondary',
                onClick: () => {
                    ModalManager.closeCenterModal();
                    this._startNewRace(config.id);
                },
            });
        } else {
            buttons.push({
                text: getText('close', 'Закрыть'),
                class: 'modal-btn-secondary',
                onClick: () => {
                    ModalManager.closeCenterModal();
                    this._modalOpen = false;
                    this._activeRace = null;
                    this._updateButtonVisibility();
                },
            });
        }

        ModalManager.showCenterModal({
            title: title,
            body: bodyHtml,
            buttons: buttons,
            onClose: () => {
                this._modalOpen = false;
                if (!seasonActive) {
                    this._activeRace = null;
                    this._updateButtonVisibility();
                }
            },
        });
        this._modalOpen = true;
                // 🏁 Отмечаем, что результат был показан
        state.resultShown = true;
         this._saveState();
        this._saveStateDirect(); // дополнительное прямое сохранение
    },

    // ----- Запуск новой гонки -----
    _startNewRace(raceId) {
        if (this._activeRace) {
            this._activeRace.state.ended = true;
            this._saveState();
            this._activeRace = null;
        }
        const success = this.startRace(raceId);
        if (success) this.showRaceModal();
        else this._updateButtonVisibility();
    },


    // ----- Форматирование времени -----
    _formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}h ${m}m ${s}s`;
        else return `${m}m ${s}s`;
    },
};

window.RaceManager = RaceManager;