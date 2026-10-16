class GameAudio {  
    constructor() {
        this.audioContext = null;
        this.musicContext = null;
        this.buffers = {};
        this.musicBuffers = {};
        this.muted = false;
        this.musicMuted = false;
        this.initialized = false;
        this.isLocalDev = window.location.protocol === 'file:';
        this.musicSource = null;
        this.musicGain = null;
        this.currentMusicTrack = null;
        this.musicStarted = false;
        this.sfxGain = null;
        this.isLoading = false;
        this.loadedTracks = [];
    }
    async init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicContext = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.musicContext.createGain();
            this.musicGain.gain.value = 0.08;
            this.musicGain.connect(this.musicContext.destination);
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
        const essential = ['collide', 'rotate', 'sweep', 'gameover'];
        const musicTracks = ['1', '2', '4', 'intro'];
        const otherSounds = ['pause', 'highspins', 'levelup'];
        console.log('🔊 Загрузка основных звуков...');
        const essentialPromises = essential.map(name => this.loadSound(name, sounds[name]));
        await Promise.all(essentialPromises);
        this.essentialLoaded = true;
        console.log('✅ Основные звуки загружены');
        console.log('🎵 Загрузка музыки...');
        const musicPromises = musicTracks.map(name => this.loadSound(name, sounds[name]));
        Promise.all(musicPromises).then(() => {
            console.log('✅ Музыка загружена');
        }).catch(() => {});
        const otherPromises = otherSounds.map(name => this.loadSound(name, sounds[name]));
        Promise.all(otherPromises).then(() => {
            console.log('✅ Остальные звуки загружены');
        }).catch(() => {});
        this.isLoading = false;
    }
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
    playOneShot(name, volume = 0.3) {
        if (this.muted || !this.audioContext || !this.buffers[name]) {
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
            source.connect(gain);
            gain.connect(this.sfxGain);
            source.start(this.audioContext.currentTime);
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
playMusic(trackName, volume = 0.08) {
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
        this.musicSource = this.musicContext.createBufferSource();
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
_playMusicInternal(trackName, volume) {
    this.stopMusic();
    this.currentMusicTrack = trackName;
    try {
        this.musicSource = this.musicContext.createBufferSource();
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
    playLoop(name, volume = 0.08) {
        this.playMusic(name, volume);
    }
    stopLoop() {
        this.stopMusic();
    }
    pauseLoop() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }
    resumeLoop() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    setMusicMuted(muted) {
        this.musicMuted = muted;
        if (this.musicGain) {
            this.musicGain.gain.value = muted ? 0 : 0.08;
        }
        if (muted) {
            this.stopMusic();
        } else if (this.currentMusicTrack) {
            this.playMusic(this.currentMusicTrack);
        }
    }
    setMuted(muted) {
    this.muted = muted;
    if (this.sfxGain) {
        this.sfxGain.gain.value = muted ? 0 : 0.3;
    }
}
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
         stopAll() {
        this.stopMusic(); 
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
        if (this.musicContext && this.musicContext.state === 'running') {
            this.musicContext.suspend();
        }
        this.musicStarted = false;
        this.currentMusicTrack = null;
    }
ensureMusicContextActive() {
    if (!this.musicContext) return;
    if (this.musicContext.state === 'running') return;
    try {
        const emptyBuffer = this.musicContext.createBuffer(1, 1, 22050);
        const source = this.musicContext.createBufferSource();
        source.buffer = emptyBuffer;
        const gain = this.musicContext.createGain();
        gain.gain.value = 0;
        source.connect(gain);
        gain.connect(this.musicContext.destination);
        source.start();
        source.stop(this.musicContext.currentTime + 0.01);
        console.log('🎵 Музыкальный контекст активирован');
    } catch (e) {
        console.warn('Не удалось активировать музыкальный контекст:', e);
    }
}
}
const gameAudio = new GameAudio();