// ============================================================
//  SPRITE ATLAS  – управление текстурными атласами (multi‑pack)
// ============================================================
const SpriteAtlas = {
    _atlases: {},          // { name: [ { image, data }, ... ] }
    _loaded: false,
    _callbacks: [],

    loadAll(callback) {
        if (this._loaded) {
            callback && callback();
            return;
        }

        const atlasGroups = {
            items: [
                { path: 'images/atlas/items_atlas0.png', dataPath: 'images/atlas/items_atlas0.json' }
                // если будут другие части, добавить сюда
            ],
            interiors: [
                { path: 'images/atlas/interiors_atlas0.png', dataPath: 'images/atlas/interiors_atlas0.json' },
                { path: 'images/atlas/interiors_atlas1.png', dataPath: 'images/atlas/interiors_atlas1.json' }
            ],
            ui: [
                { path: 'images/atlas/ui_atlas0.png', dataPath: 'images/atlas/ui_atlas0.json' }
            ],
            chara: [
                { path: 'images/atlas/chara_atlas0.png', dataPath: 'images/atlas/chara_atlas0.json' }
            ],
            events: [
                { path: 'images/atlas/events_atlas.png', dataPath: 'images/atlas/events_atlas.json' }
            ]
        };

        let total = 0;
        for (const g of Object.values(atlasGroups)) total += g.length;
        let loaded = 0;

        const onLoad = () => {
            loaded++;
            if (loaded === total) {
                this._loaded = true;
                this._callbacks.forEach(fn => fn());
                this._callbacks = [];
                callback && callback();
            }
        };

        for (const [group, files] of Object.entries(atlasGroups)) {
            this._atlases[group] = [];
            files.forEach(file => {
                fetch(file.dataPath)
                    .then(res => {
                        if (!res.ok) throw new Error('HTTP ' + res.status);
                        return res.json();
                    })
                    .then(data => {
                        if (Array.isArray(data.frames)) {
                            const map = {};
                            data.frames.forEach(f => { map[f.filename] = f; });
                            data.frames = map;
                        }
                        const img = new Image();
                        img.onload = () => {
                            this._atlases[group].push({ image: img, data });
                            onLoad();
                        };
                        img.onerror = () => {
                            console.warn(`[SpriteAtlas] Ошибка загрузки ${file.path}`);
                            onLoad();
                        };
                        img.src = file.path;
                    })
                    .catch(err => {
                        console.warn(`[SpriteAtlas] Ошибка JSON ${file.dataPath}`, err);
                        onLoad();
                    });
            });
        }

        setTimeout(() => {
            if (!this._loaded) {
                console.warn('[SpriteAtlas] Таймаут загрузки атласов');
                this._loaded = true;
                this._callbacks.forEach(fn => fn());
                this._callbacks = [];
                callback && callback();
            }
        }, 10000);
    },

    getSprite(atlasName, spriteName) {
        const parts = this._atlases[atlasName];
        if (!parts) return null;
        for (const part of parts) {
            const frame = part.data.frames?.[spriteName];
            if (frame) {
                return {
                    image: part.image,
                    sx: frame.frame.x,
                    sy: frame.frame.y,
                    sw: frame.frame.w,
                    sh: frame.frame.h,
                };
            }
        }
        return null;
    },

    getSpriteDataURL(atlasName, spriteName) {
        const sprite = this.getSprite(atlasName, spriteName);
        if (!sprite) return null;
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = sprite.sw;
            canvas.height = sprite.sh;
            ctx.drawImage(sprite.image, sprite.sx, sprite.sy, sprite.sw, sprite.sh, 0, 0, sprite.sw, sprite.sh);
            return canvas.toDataURL('image/png');
        } catch (e) {
            console.warn('[SpriteAtlas] Ошибка создания dataURL', atlasName, spriteName, e);
            return null;
        }
    }
};

window.SpriteAtlas = SpriteAtlas;