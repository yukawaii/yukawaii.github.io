// audio.js — Web Audio API система с независимыми каналами
class GameAudio {  
    constructor() {
        // Основной контекст для звуков (только sfx)
        this.audioContext = null;
        // Отдельный контекст для музыки
        this.musicContext = null;
        this.buffers = {};
        this.musicBuffers = {};
        this.muted = false;
        this.musicMuted = false;
        this.initialized = false;
        this.isLocalDev = window.location.protocol === 'file:';
        
        // Для музыки
        this.musicSource = null;
        this.musicGain = null;
        this.currentMusicTrack = null;
        this.musicStarted = false;
        
        // Для звуков
        this.sfxGain = null;

        this.isLoading = false;
        this.loadedTracks = [];
    }
    
    async init() {
        if (this.initialized) return;
        
        try {
            // Два отдельных контекста
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Узел для музыки
            this.musicGain = this.musicContext.createGain();
            this.musicGain.gain.value = 0.15;
            this.musicGain.connect(this.musicContext.destination);
            
            // Узел для звуков
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.3;
            this.sfxGain.connect(this.audioContext.destination);
            
            await this.loadSounds();
            this.initialized = true;
            console.log('✅ Web Audio инициализирован (раздельные контексты)');
        } catch (e) {
            console.error('❌ Ошибка инициализации Web Audio:', e);
        }
    }
    
       
    // ====== НОВАЯ ВЕРСИЯ loadSounds С ПРИОРИТЕТАМИ ======
    async loadSounds() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        const sounds = {
            intro: 'audio/mf.ogg',
            collide: 'audio/collide.ogg',
            rotate: 'audio/rotate.ogg',
            sweep: 'audio/sweep.ogg',
            pause: 'audio/pause.ogg',
            gameover: 'audio/gameover.ogg',
            highspins: 'audio/highspins.ogg',
            levelup: 'audio/levelup.ogg',
            '1': 'audio/1.ogg',
            '2': 'audio/2.ogg',
                     '4': 'audio/4.ogg'
        };
        
        // 🔥 КРИТИЧЕСКИ ВАЖНЫЕ ЗВУКИ (загружаются первыми)
        const essential = ['collide', 'rotate', 'sweep', 'gameover'];
        
        // 🎵 МУЗЫКА (загружается в фоне после основных звуков)
        const musicTracks = ['1', '2', '4', 'intro'];
        
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
    
pauseMusic() {
    if (this.musicContext && this.musicContext.state === 'running') {
        this.musicContext.suspend();
        console.log('🎵 Музыкальный контекст приостановлен');
    }
}

resumeMusic() {
    if (this.musicContext && this.musicContext.state === 'suspended') {
        this.musicContext.resume();
        console.log('🎵 Музыкальный контекст возобновлён');
    }
}

// Обновить существующие методы pauseAll/resumeAll
pauseAll() {
    if (this.audioContext && this.audioContext.state === 'running') {
        this.audioContext.suspend();
    }
    if (this.musicContext && this.musicContext.state === 'running') {
        this.musicContext.suspend();
    }
}

resumeAll() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
    }
    if (this.musicContext && this.musicContext.state === 'suspended') {
        this.musicContext.resume();
    }
}

    // Воспроизведение музыки (через отдельный канал music)
playMusic(trackName, volume = 0.15) {
    if (this.musicMuted || !this.musicContext || !this.buffers[trackName]) {
        console.warn(`Трек ${trackName} не загружен или музыка выключена`);
        return;
    }
    if (this.musicContext.state === 'suspended') {
        this.musicContext.resume();
    }
    this.stopMusic();
    this.currentMusicTrack = trackName;
    try {
        this.musicSource = this.musicContext.createBufferSource(); // ← используем musicContext
        this.musicSource.buffer = this.buffers[trackName];
        this.musicSource.loop = true;
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
    
 
    
    // Возобновление контекста после жеста пользователя
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Создаём глобальный экземпляр
const gameAudio = new GameAudio();