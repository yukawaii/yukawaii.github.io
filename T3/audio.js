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
    
    async loadSounds() {
        const sounds = {
            intro: 'audio/tetrismf.wav',
            collide: 'audio/tetriscollide.wav',
            rotate: 'audio/tetrisrotate.wav',
            sweep: 'audio/tetrissweep.wav',
            pause: 'audio/tetrispause.wav',
            gameover: 'audio/tetrisgameover.wav',
            highspins: 'audio/tetrishighspins.wav',
            levelup: 'audio/tetrislevelup.wav',
            '1': 'audio/1.ogg',
            '2': 'audio/2.ogg',
            '3': 'audio/3.ogg',
            '4': 'audio/4.ogg'
        };
        
        const loadPromises = [];
        
        for (const [name, url] of Object.entries(sounds)) {
            const promise = fetch(url)
                .then(response => {
                    if (!response.ok) {
                        console.warn(`⚠️ Файл ${url} не найден (${response.status})`);
                        throw new Error(`Файл ${url} не найден`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    this.buffers[name] = audioBuffer;
                    console.log(`✅ Загружен звук: ${name}`);
                })
                .catch(err => console.error(`❌ Ошибка загрузки ${name}:`, err));
            
            loadPromises.push(promise);
        }
        
        await Promise.all(loadPromises);
        console.log('📢 Все звуки загружены');
    }
    
    // Воспроизведение звукового эффекта (через отдельный канал sfx)
    playOneShot(name, volume = 0.3) {
        if (this.muted || !this.audioContext || !this.buffers[name]) return;
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
            
            source.start();
            
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