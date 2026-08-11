const AudioManager = {
    enabled: true,
    _ctx: null,
    _currentAudio: null,
    _tracks: {},
    _selectedTrack: 'birds',
    soundEnabled: true,
    musicEnabled: true,
    _musicPausedByBlur: false,
    _soundGain: 3.5,

    init() {
        const settings = Storage.getSettings();
        this.soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
        this.musicEnabled = settings.musicEnabled !== undefined ? settings.musicEnabled : true;

        const prog = Storage.getProgress();
        this._selectedTrack = prog.selectedMusicTrack || 'birds';

        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('[Audio] WebAudio not supported');
            this.enabled = false;
        }

        this._loadAllTracks();
        this._bindFocusEvents();
        // Музыка НЕ запускается автоматически – ждём вызова playMusic()
    },

    _loadAllTracks() {
        this._tracks.birds = this._createAudioElement('./music/music.ogg');
        this._tracks.notes = this._createAudioElement('./music/music1.ogg');
    },

    _createAudioElement(src) {
        const audio = new Audio(src);
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0.1;
        return audio;
    },

    // ---- Публичные методы для управления музыкой ----
    setSelectedTrack(trackName) {
        if (trackName === this._selectedTrack) {
            // Выключаем музыку
            this._stopMusic();
            this._selectedTrack = null;
            this.musicEnabled = false;
        } else {
            // Включаем новый трек
            this._stopMusic();                // останавливаем текущий
            this._selectedTrack = trackName;
            this.musicEnabled = true;         // ⬅️ флаг ДО запуска
            this._playTrack(trackName);
        }
        // Сохраняем состояние
        const prog = Storage.getProgress();
        prog.selectedMusicTrack = this._selectedTrack;
        Storage.saveProgress(prog);
        Storage.saveSettings({ musicEnabled: this.musicEnabled });
    },

    // Основной метод для запуска музыки из игры (после нажатия "Играть")
    playMusic() {
        if (this._selectedTrack) {
            this._playTrack(this._selectedTrack);
        }
    },

    pauseMusic() {
        this._stopMusic();
    },

    resumeMusic() {
        if (this.musicEnabled && this._selectedTrack) {
            this._playTrack(this._selectedTrack);
        }
    },

    // ---- Внутренние методы ----
    _stopMusic() {
        if (this._currentAudio) {
            this._currentAudio.pause();
            this._currentAudio.muted = true;
            this._currentAudio = null;
        }
    },

    _playTrack(trackName) {
        if (!this.enabled || !this.musicEnabled || !trackName) return;
        const audio = this._tracks[trackName];
        if (!audio) return;
        audio.currentTime = 0;
        audio.muted = false;
        audio.volume = 0.1;
        this._currentAudio = audio;
        audio.play().catch(() => {});
    },

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        Storage.saveSettings({ soundEnabled: this.soundEnabled });
        return this.soundEnabled;
    },

    // ---- Обработка фокуса ----
    _bindFocusEvents() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this._musicPausedByBlur = true;
                this.pauseMusic();
            } else {
                if (this._musicPausedByBlur) {
                    this._musicPausedByBlur = false;
                    this.resumeMusic();
                }
            }
        });
        window.addEventListener('blur', () => {
            this._musicPausedByBlur = true;
            this.pauseMusic();
        });
        window.addEventListener('focus', () => {
            if (this._musicPausedByBlur) {
                this._musicPausedByBlur = false;
                this.resumeMusic();
            }
        });
    },

    // ---- Звуковые эффекты (без изменений) ----
    play(type) {
        if (!this.enabled || !this.soundEnabled || !this._ctx) return;
        try {
            switch (type) {
                case 'merge':
                    this._playMerge();
                    break;
                case 'spawn':
                    this._playSpawn();
                    break;
                case 'select':
                    this._playSelect();
                    break;
                case 'click':
                    this._playClick();
                    break;
                case 'levelup':
                    this._playLevelup();
                    break;
                case 'combine':
                    this._playMerge();
                    break;
                case 'box_disappear':
                    this._playBoxDisappear();
                    break;
                default: break;
            }
        } catch (e) { /* ignore */ }
    },

    // ---- БАЗОВЫЕ ЗВУКИ ----
    _playSelect() {
        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();
        osc.connect(gain);
        gain.connect(this._ctx.destination);
        osc.frequency.value = 600;
        osc.type = 'sine';
        gain.gain.value = 0.04 * this._soundGain;
        gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.05);
        osc.start(this._ctx.currentTime);
        osc.stop(this._ctx.currentTime + 0.05);
    },

    _playClick() {
        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();
        osc.connect(gain);
        gain.connect(this._ctx.destination);
        osc.frequency.value = 660;
        osc.type = 'sine';
        gain.gain.value = 0.08 * this._soundGain;
        gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.06);
        osc.start(this._ctx.currentTime);
        osc.stop(this._ctx.currentTime + 0.06);
    },

    // ========== MERGE ==========
    _playMerge() {
        const variant = Math.floor(Math.random() * 3);
        switch (variant) {
            case 0:
                this._bellTone(1200, 0.12, 0.10);
                setTimeout(() => this._bellTone(900, 0.10, 0.08), 80);
                break;
            case 1:
                this._caramelBell();
                break;
            case 2:
                this._bellTone(880, 0.10, 0.08);
                setTimeout(() => this._bellTone(1100, 0.10, 0.08), 60);
                break;
        }
    },

    // ========== SPAWN ==========
    _playSpawn() {
        const variant = Math.floor(Math.random() * 3);
        switch (variant) {
            case 0:
                this._bellTone(1200, 0.08, 0.08);
                setTimeout(() => this._bellTone(1500, 0.06, 0.06), 30);
                break;
            case 1:
                this._bellTone(1400, 0.08, 0.06);
                setTimeout(() => this._bellTone(1800, 0.06, 0.05), 40);
                break;
            case 2:
                this._arpeggio([523, 659, 784], 0.08, 0.07);
                break;
        }
    },

    // ========== LEVELUP ==========
    _playLevelup() {
        const variant = Math.floor(Math.random() * 4);
        switch (variant) {
            case 0:
                this._melody([523, 659, 784], 0.12, 0.10);
                break;
            case 1:
                this._melody([523, 587, 659, 784, 880], [0.15, 0.12, 0.15, 0.12, 0.25], 0.08);
                break;
            case 2:
                this._chord([523, 659, 784], 0.25, 0.12);
                setTimeout(() => this._chord([659, 784, 988], 0.25, 0.10), 200);
                break;
            case 3:
                this._arpeggio([1200, 1500, 1800, 1500, 1200], 0.06, 0.06);
                break;
        }
    },

    _playBoxDisappear() {
        this._playPaperRustle();
    },

    _playPaperRustle() {
        const ctx = this._ctx;
        const buffer = this._generateNoiseBuffer(0.04);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1.2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04 * this._soundGain, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(ctx.currentTime);
        source.stop(ctx.currentTime + 0.04);

        setTimeout(() => {
            this._bellTone(660, 0.12, 0.025);
        }, 60);
        setTimeout(() => {
            this._bellTone(880, 0.10, 0.02);
        }, 160);
    },

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    _generateNoiseBuffer(duration) {
        const sampleRate = this._ctx.sampleRate;
        const buffer = this._ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        return buffer;
    },

    _bellTone(freq, duration, gainVal = 0.10) {
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.value = gainVal * this._soundGain;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    },

    _caramelBell() {
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.16);
        osc.type = 'sine';
        gain.gain.value = 0.08 * this._soundGain;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
    },

    _bubble(duration, gainVal = 0.08) {
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);
        osc.type = 'sine';
        gain.gain.value = gainVal * this._soundGain;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    },

    _arpeggio(freqs, duration, gainVal = 0.08) {
        const ctx = this._ctx;
        freqs.forEach((f, i) => {
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = f;
                osc.type = 'sine';
                gain.gain.value = gainVal * (1 - i * 0.15) * this._soundGain;
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration);
            }, i * 50);
        });
    },

    _melody(freqs, durationsOrGain, gainVal = 0.08) {
        const ctx = this._ctx;
        let durations;
        if (Array.isArray(durationsOrGain)) {
            durations = durationsOrGain;
        } else {
            durations = freqs.map(() => durationsOrGain);
            gainVal = gainVal || 0.08;
        }
        let timeOffset = 0;
        freqs.forEach((f, i) => {
            const dur = durations[i] || 0.1;
            setTimeout(() => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = f;
                osc.type = 'sine';
                gain.gain.value = gainVal * (1 - i * 0.05) * this._soundGain;
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + dur);
            }, timeOffset * 1000);
            timeOffset += dur;
        });
    },

    _chord(freqs, duration, gainVal = 0.10) {
        const ctx = this._ctx;
        freqs.forEach((f) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = f;
            osc.type = 'sine';
            gain.gain.value = (gainVal / freqs.length) * this._soundGain;
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        });
    },

    // ---- Дополнительные звуки ----
    playBubbleSequence() {
        if (!this.enabled || !this._ctx) return;
        const tones = [
            { freq: 500, duration: 0.08, vol: 0.035 },
            { freq: 580, duration: 0.09, vol: 0.030 },
            { freq: 660, duration: 0.10, vol: 0.025 },
            { freq: 740, duration: 0.08, vol: 0.020 }
        ];
        tones.forEach((t, i) => {
            setTimeout(() => {
                this._bubbleTone(t.freq, t.duration, t.vol);
            }, i * 90);
        });
    },

    _bubbleTone(freq, duration, gainVal) {
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.value = gainVal * this._soundGain;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    },

    playStars() {
        if (!this.enabled || !this._ctx) return;
        const freqs = [1200, 1500, 1800, 1500, 1200];
        const duration = 0.08;
        const gainVal = 0.06;
        freqs.forEach((f, i) => {
            setTimeout(() => {
                const osc = this._ctx.createOscillator();
                const gain = this._ctx.createGain();
                osc.connect(gain);
                gain.connect(this._ctx.destination);
                osc.frequency.value = f;
                osc.type = 'sine';
                gain.gain.setValueAtTime(gainVal * (1 - i * 0.15) * this._soundGain, this._ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
                osc.start(this._ctx.currentTime);
                osc.stop(this._ctx.currentTime + duration);
            }, i * 60);
        });
    }
};