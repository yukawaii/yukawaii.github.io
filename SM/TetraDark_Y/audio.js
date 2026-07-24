// audio.js — Web Audio API система
class GameAudio {  
    constructor() {
        this.audioContext = null;
        this.buffers = {};
        this.muted = false;
            this.loopSource = null;
        this.loopGain = null;
        this.currentLoopName = null;
        this.initialized = false;
        this.isLocalDev = window.location.protocol === 'file:';
             this.musicMuted = false; // Отдельный мьют для музыки
        this.musicSource = null;
        this.musicGain = null;
        this.currentMusicTrack = null;
    }
    
    async init() {
        if (this.initialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadSounds();
            this.initialized = true;
            console.log('Web Audio API инициализирован');
        } catch (e) {
            console.error('Ошибка инициализации Web Audio:', e);
        }
    }
        
async loadSounds() {
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
    
    // Добавим проверку существования файлов
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
                console.log(`✅ Загружен звук: ${name} (${url})`);
            })
            .catch(err => console.error(`❌ Ошибка загрузки ${name} (${url}):`, err));
        
        loadPromises.push(promise);
    }
    
    await Promise.all(loadPromises);
    console.log('📢 Все звуки загружены:', Object.keys(this.buffers));
}
    
    playOneShot(name, volume = 0.3) {
        if (this.muted || !this.audioContext || !this.buffers[name]) return;
        
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        
        source.buffer = this.buffers[name];
        gain.gain.value = volume;
        
        source.connect(gain);
        gain.connect(this.audioContext.destination);
        source.start();
    }
    
    playLoop(name, volume = 0.15) {
        if (this.muted || !this.audioContext || !this.buffers[name]) return;
        
        // Останавливаем текущий луп
        this.stopLoop();
        
        this.currentLoopName = name;
        this.loopSource = this.audioContext.createBufferSource();
        this.loopGain = this.audioContext.createGain();
        
        this.loopSource.buffer = this.buffers[name];
        this.loopGain.gain.value = volume;
        this.loopSource.loop = true;
        
        this.loopSource.connect(this.loopGain);
        this.loopGain.connect(this.audioContext.destination);
        this.loopSource.start();
    }
    
    stopLoop() {
        if (this.loopSource) {
            try {
                this.loopSource.stop();
            } catch(e) {}
            this.loopSource = null;
        }
        this.currentLoopName = null;
    }
    
    pauseLoop() {
        // Для Web Audio API пауза = остановка, так как нет встроенной паузы
        if (this.loopSource && this.currentLoopName) {
            this.loopSource.stop();
            this.loopSource = null;
        }
    }
    
    resumeLoop() {
        if (this.currentLoopName && !this.muted) {
            this.playLoop(this.currentLoopName);
        }
    }
    
    setMuted(muted) {
        this.muted = muted;
        if (muted) {
            this.stopLoop();
        } else if (this.currentLoopName) {
            this.playLoop(this.currentLoopName);
        }
    }
    
    // Возобновление контекста после пользовательского жеста
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

      setMusicMuted(muted) {
        this.musicMuted = muted;
        if (muted) {
            this.stopLoop();
        } else if (this.currentMusicTrack) {
            this.playMusic(this.currentMusicTrack);
        }
    }
    

// Метод для воспроизведения музыки
playMusic(trackName, volume = 0.15) {
    if (this.musicMuted) return;
    if (!this.audioContext || !this.buffers[trackName]) {
        console.warn(`Трек ${trackName} не загружен или аудио не инициализировано`);
        return;
    }
    
    this.stopMusic();
    this.currentMusicTrack = trackName;
    this.musicSource = this.audioContext.createBufferSource();
    this.musicGain = this.audioContext.createGain();
    
    this.musicSource.buffer = this.buffers[trackName];
    this.musicGain.gain.value = volume;
    this.musicSource.loop = true;
    
    this.musicSource.connect(this.musicGain);
    this.musicGain.connect(this.audioContext.destination);
    this.musicSource.start();
    console.log(`🎵 Музыка запущена: ${trackName}`);
}
    
    stopMusic() {
        if (this.musicSource) {
            try { this.musicSource.stop(); } catch(e) {}
            this.musicSource = null;
        }
        this.currentMusicTrack = null;
    }
    
    setMusicMuted(muted) {
        this.musicMuted = muted;
        if (muted) {
            this.stopMusic();
        } else if (this.currentMusicTrack) {
            this.playMusic(this.currentMusicTrack);
        }
    }
    
    // Метод для остановки ВСЕХ звуков (для паузы, сворачивания)
    pauseAll() {
        if (this.audioContext) this.audioContext.suspend();
    }
    
    resumeAll() {
        if (this.audioContext) this.audioContext.resume();
    }
}

// Создаём глобальный экземпляр
const gameAudio = new GameAudio();