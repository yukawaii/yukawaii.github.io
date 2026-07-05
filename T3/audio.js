// audio.js — Web Audio API система с независимыми каналами
class GameAudio {  
    constructor() {
        this.audioContext = null;
        this.buffers = {};
        this.muted = false;
        this.musicMuted = false;
        this.initialized = false;
        this.isLocalDev = window.location.protocol === 'file:';
        
        // Отдельные узлы для музыки и звуков
        this.musicGain = null;
        this.musicSource = null;
        this.currentMusicTrack = null;
        this.musicStarted = false;
        
        // Отдельный узел для звуковых эффектов
        this.sfxGain = null;

         this.isLoading = false; // ← ДОБАВИТЬ
        this.loadedTracks = []; // ← ДОБАВИТЬ
    }
    
    async init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Создаём отдельные узлы для музыки и звуков
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = 0.15;
            this.musicGain.connect(this.audioContext.destination);
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.3;
            this.sfxGain.connect(this.audioContext.destination);
            
            await this.loadSounds();
            this.initialized = true;
            console.log('✅ Web Audio API инициализирован (независимые каналы)');
        } catch (e) {
            console.error('❌ Ошибка инициализации Web Audio:', e);
        }
    }
    
       
    // ====== НОВАЯ ВЕРСИЯ loadSounds С ПРИОРИТЕТАМИ ======
    async loadSounds() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        const sounds = {
            intro: 'audio/tetrismf.ogg',
            collide: 'audio/tetriscollide.ogg',
            rotate: 'audio/tetrisrotate.ogg',
            sweep: 'audio/tetrissweep.ogg',
            pause: 'audio/tetrispause.ogg',
            gameover: 'audio/tetrisgameover.ogg',
            highspins: 'audio/tetrishighspins.ogg',
            levelup: 'audio/tetrislevelup.ogg',
            '1': 'audio/1.ogg',
            '2': 'audio/2.ogg',
            '3': 'audio/1.ogg',
            '4': 'audio/4.ogg'
        };
        
        // 🔥 КРИТИЧЕСКИ ВАЖНЫЕ ЗВУКИ (загружаются первыми)
        const essential = ['collide', 'rotate', 'sweep', 'gameover'];
        
        // 🎵 МУЗЫКА (загружается в фоне после основных звуков)
        const musicTracks = ['1', '2', '3', '4', 'intro', 'loop'];
        
        // Остальные звуки (загружаются после музыки)
        const otherSounds = ['pause', 'highspins', 'levelup'];
        
        // 1️⃣ Сначала загружаем критически важные звуки
        console.log('🔊 Загрузка основных звуков...');
        const essentialPromises = essential.map(name => this.loadSound(name, sounds[name]));
        await Promise.all(essentialPromises);
        this.essentialLoaded = true;
        console.log('✅ Основные звуки загружены');
        
        // 2️⃣ Загружаем музыку (не блокируя)
        console.log('🎵 Загрузка музыки...');
        const musicPromises = musicTracks.map(name => this.loadSound(name, sounds[name]));
        Promise.all(musicPromises).then(() => {
            console.log('✅ Музыка загружена');
        }).catch(() => {});
        
        // 3️⃣ Загружаем остальные звуки (в фоне)
        const otherPromises = otherSounds.map(name => this.loadSound(name, sounds[name]));
        Promise.all(otherPromises).then(() => {
            console.log('✅ Остальные звуки загружены');
        }).catch(() => {});
        
        this.isLoading = false;
    }
    
    // Вспомогательная функция загрузки одного звука
    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`⚠️ Файл ${url} не найден (${response.status})`);
                return;
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.buffers[name] = audioBuffer;
            console.log(`✅ Загружен: ${name}`);
        } catch (err) {
            console.warn(`⚠️ Ошибка загрузки ${name}:`, err);
        }
    }
    
    // Воспроизведение звукового эффекта (через отдельный канал sfx)
    playOneShot(name, volume = 0.3) {
        if (this.muted || !this.audioContext || !this.buffers[name]) {
            // Если звук ещё не загружен — пробуем загрузить прямо сейчас
            if (!this.buffers[name]) {
                console.log(`🔄 Звук ${name} ещё не загружен, пропускаем`);
            }
            return;
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gain = this.audioContext.createGain();
            
            source.buffer = this.buffers[name];
            gain.gain.value = volume;
            
            // Подключаем к SFX-каналу (не к музыке!)
            source.connect(gain);
            gain.connect(this.sfxGain);
            
            source.start(this.audioContext.currentTime);
            
            // Автоматическое отключение после окончания
            source.onended = () => {
                gain.disconnect();
                source.disconnect();
            };
        } catch (e) {
            console.warn('Ошибка воспроизведения звука:', e);
        }
    }
    
    // Воспроизведение музыки (через отдельный канал music)
    playMusic(trackName, volume = 0.15) {
        if (this.musicMuted || !this.audioContext || !this.buffers[trackName]) {
            console.warn(`Трек ${trackName} не загружен или музыка выключена`);
            return;
        }
        
        this.stopMusic();
        this.currentMusicTrack = trackName;
        
        try {
            this.musicSource = this.audioContext.createBufferSource();
            this.musicSource.buffer = this.buffers[trackName];
            this.musicSource.loop = true;
            
            // Подключаем к музыкальному каналу (не к sfx!)
            this.musicSource.connect(this.musicGain);
            this.musicGain.gain.value = volume;
            
            this.musicSource.start();
            this.musicStarted = true;
            console.log(`🎵 Музыка запущена: ${trackName}`);
        } catch (e) {
            console.warn('Ошибка воспроизведения музыки:', e);
        }
    }
    
    stopMusic() {
        if (this.musicSource) {
            try {
                this.musicSource.stop();
                this.musicSource.disconnect();
            } catch(e) {}
            this.musicSource = null;
        }
        this.musicStarted = false;
        this.currentMusicTrack = null;
    }
    
    // Алиас для совместимости
    playLoop(name, volume = 0.15) {
        this.playMusic(name, volume);
    }
    
    stopLoop() {
        this.stopMusic();
    }
    
    pauseLoop() {
        // Приостанавливаем весь AudioContext для паузы
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }
    
    resumeLoop() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    setMuted(muted) {
        this.muted = muted;
        // Отключаем SFX-канал
        if (this.sfxGain) {
            this.sfxGain.gain.value = muted ? 0 : 0.3;
        }
    }
    
    setMusicMuted(muted) {
        this.musicMuted = muted;
        if (this.musicGain) {
            this.musicGain.gain.value = muted ? 0 : 0.15;
        }
        if (muted) {
            this.stopMusic();
        } else if (this.currentMusicTrack) {
            this.playMusic(this.currentMusicTrack);
        }
    }
    
    // Пауза всего аудио (для сворачивания)
    pauseAll() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }
    
    // Возобновление всего аудио
    resumeAll() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // Возобновление контекста после жеста пользователя
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Создаём глобальный экземпляр
const gameAudio = new GameAudio();