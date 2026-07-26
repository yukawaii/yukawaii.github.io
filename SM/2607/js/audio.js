// ============================================================
//  AUDIO MANAGER  (простые звуки через Web Audio)
// ============================================================
const AudioManager = {
    enabled: true,
    _ctx: null,

    init() {
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('[Audio] WebAudio not supported');
            this.enabled = false;
        }
    },

    /** Воспроизвести звук по типу: 'combine', 'click', 'levelup' */
    play(type) {
        if (!this.enabled || !this._ctx) return;
        try {
            const osc = this._ctx.createOscillator();
            const gain = this._ctx.createGain();
            osc.connect(gain);
            gain.connect(this._ctx.destination);
            gain.gain.value = 0.08;

            switch (type) {
                case 'combine':
                    osc.frequency.value = 880;
                    osc.type = 'sine';
                    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.15);
                    osc.start(this._ctx.currentTime);
                    osc.stop(this._ctx.currentTime + 0.15);
                    break;
                case 'click':
                    osc.frequency.value = 660;
                    osc.type = 'sine';
                    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.06);
                    osc.start(this._ctx.currentTime);
                    osc.stop(this._ctx.currentTime + 0.06);
                    break;
                case 'levelup':
                    osc.frequency.value = 523;
                    osc.type = 'square';
                    gain.gain.value = 0.05;
                    osc.start(this._ctx.currentTime);
                    osc.stop(this._ctx.currentTime + 0.2);
                    setTimeout(() => {
                        const o2 = this._ctx.createOscillator();
                        const g2 = this._ctx.createGain();
                        o2.connect(g2);
                        g2.connect(this._ctx.destination);
                        g2.gain.value = 0.05;
                        o2.frequency.value = 659;
                        o2.type = 'square';
                        o2.start(this._ctx.currentTime);
                        o2.stop(this._ctx.currentTime + 0.2);
                    }, 150);
                    break;
                default: break;
            }
        } catch (e) { /* ignore */ }
    },

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
};