"use strict";
customElements.define('jl-coloringbook', class extends HTMLElement 
{
    constructor() 
    {
        super();
        this.shadow = this.attachShadow({mode: 'open'}); 
        this.loadIcons();
        this.eyedropperMode = false;  
        this.zoomLevel = 1;
        this.zoomMin = 0.5;
        this.zoomMax = 3;
    }

    init()
    {
        jQuery(this).css('display','block');
        this.paletteColors=[
            'rgba(87, 87, 87,0.8)',
            'rgba(220, 35, 35,0.8)',
            'rgba(42, 75, 215,0.8)',
            'rgba(29, 105, 20,0.8)',
            'rgba(129, 74, 25,0.8)',
            'rgba(129, 38, 192,0.8)',
            'rgba(160, 160, 160,0.8)',
            'rgba(129, 197, 122,0.8)',
            'rgba(157, 175, 255,0.8)',
            'rgba(41, 208, 208,0.8)',
            'rgba(255, 146, 51,0.8)',
            'rgba(255, 238, 51,0.8)',
            'rgba(233, 222, 187,0.8)',
            'rgba(255, 205, 243,0.8)',
            'white'];
        this.dragging=false;
        this.paths = [];
        let me=this;
        this.slots=jQuery(`<div class="slots" style="display:none"><slot></slot></div>`).appendTo(this.shadowRoot)
    
        this.slots.off('slotchange').on('slotchange', function()
        {
            me.drawTemplate()
        });
    }

    connectedCallback()
    {
        let auto =jQuery(this).attr('autoinit');
        if (auto!=='0') {
            this.init();
        } 
    }

    loadIcons()
    {
        try {
            let material = new FontFace('Material Icons', 'url(https://fonts.gstatic.com/s/materialicons/v50/flUhRq6tzZclQEJ-Vdg-IuiaDsNZ.ttf)');
            material.load().then(function(loaded_face) {
                document.fonts.add(loaded_face);
            }).catch(function(error) {});
        } catch(err) {}
    }
    
    drawTemplate()
    {
        jQuery(this).on('click', function(e) {e.preventDefault; e.stopPropagation()})
        jQuery(`
            <style>
                @font-face {
                    font-family: 'Material Icons';
                    font-style: normal;
                    font-weight: 400;
                    src: url(https://fonts.gstatic.com/s/materialicons/v50/flUhRq6tzZclQEJ-Vdg-IuiaDsNZ.ttf) format('truetype');
                }
                .material-icons {
                    font-family: 'Material Icons';
                    font-weight: normal;
                    font-style: normal;
                    font-size: 18px;
                    line-height: 1;
                    letter-spacing: normal;
                    text-transform: none;
                    display: inline-block;
                    white-space: nowrap;
                    word-wrap: normal;
                    direction: ltr;
                }
                .wrapper { 
                    width:100%; 
                    -webkit-touch-callout: none; 
                    -webkit-user-select: none; 
                    -khtml-user-select: none; 
                    -moz-user-select: none; 
                    -ms-user-select: none; 
                    user-select: none;
                    position: relative;
                    overflow: hidden;
                    touch-action: none;
                }
                
                .imageNav img {
                    box-sizing:border-box;
                    border:3px solid transparent;
                    width:12%; min-width:75px; max-width:150px;
                    margin:4px;
                }
                .imageNav img.selected {
                    border: 3px solid green; 
                }
                .toolbar {
                    z-index:100000;
                    position: sticky;
                    position: -webkit-sticky; 
                    top: 0;
                    background-color: rgba(200,200,200,.1);
                    padding: 4px 0;
                }
                .tools {
                    display:flex;
                    justify-content:flex-start;
                    flex-wrap:wrap;
                    max-width:100%;
                    gap: 4px;
                    align-items: center;
                }
                .sizerTool {
                    cursor:inherit;
                    align-self:flex-start;
                    width:64px;
                }
                .spacer {
                    flex-basis:0;
                    flex-grow:1;
                }
                .tools > * {margin:2px}

                .tools .button {
                    background: rgba(168, 85, 247, 0.15) !important;
                    border: 2px solid #a855f7 !important;
                    border-radius: 8px !important;
                    color: #f0eaff !important;
                    padding: 4px 8px !important;
                    cursor: pointer !important;
                    transition: all 0.3s ease !important;
                    font-size: 14px !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    box-shadow: 0 0 10px rgba(168, 85, 247, 0.1) !important;
                }
                .tools .button:hover {
                    background: #a855f7 !important;
                    color: #ffffff !important;
                    box-shadow: 0 0 25px rgba(168, 85, 247, 0.3) !important;
                }
                .tools .button:active {
                    transform: scale(0.95) !important;
                }
                .tools .undoButton { border-color: #f59e0b !important; }
                .tools .undoButton:hover { background: #f59e0b !important; }
                .tools .clearButton { border-color: #ef4444 !important; }
                .tools .clearButton:hover { background: #ef4444 !important; }
                .tools .saveButton { border-color: #22c55e !important; }
                .tools .saveButton:hover { background: #22c55e !important; }
                .tools .paletteToggle { border-color: #ec4899 !important; }
                .tools .paletteToggle:hover { background: #ec4899 !important; }
                .tools .paletteToggle.active { background: #ec4899 !important; color: #fff !important; }
                
                               .palette {
                    display: flex !important;
                    flex-wrap: wrap !important;
                    gap: 4px !important;
                    padding: 4px 0 !important;
                    align-items: center !important;
                }
                .palette .tool-btn {
                    width: 28px !important;
                    height: 28px !important;
                    border-radius: 50% !important;
                    border: 2px solid rgba(255, 255, 255, 0.15) !important;
                    background: rgba(168, 85, 247, 0.15) !important;
                    color: #f0eaff !important;
                    padding: 0 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 0 !important;
                    line-height: 0 !important;
                    flex-shrink: 0 !important;
                }
                .palette .tool-btn i {
                    font-size: 16px !important;
                    line-height: 1 !important;
                }
                .palette .tool-btn:hover {
                    transform: scale(1.15) !important;
                    border-color: #a855f7 !important;
                }
                .palette .tool-btn.active {
                    border-color: #a855f7 !important;
                    transform: scale(1.2) !important;
                    box-shadow: 0 0 20px rgba(168, 85, 247, 0.4) !important;
                }
                .paletteColor {
                    width: 28px !important;
                    height: 28px !important;
                    border-radius: 50% !important;
                    border: 2px solid rgba(255, 255, 255, 0.15) !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    display: inline-block !important;
                    flex-shrink: 0 !important;
                }
                .paletteColor:hover {
                    transform: scale(1.15) !important;
                    border-color: #a855f7 !important;
                }
                .paletteColor.selected {
                    border-color: #a855f7 !important;
                    transform: scale(1.2) !important;
                    box-shadow: 0 0 20px rgba(168, 85, 247, 0.4) !important;
                }
                .paletteColor.eraser {
    background: transparent !important;
    border-color: #efb944 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 16px !important;
    color: #ecef44 !important;
    font-weight: bold !important;
}
                
                .canvasWrapper {
                    display:inline-block;
                    position:relative;
                    width:100%;
                    overflow: hidden;
                    touch-action: none;
                }
                
                .canvasContainer {
                    position: relative;
                    transform-origin: 0 0;
                    transition: none;
                    touch-action: none;
                }
                
                .canvas {
                    z-index:1000;
                    position:absolute;
                    top:0;left:0;
                    width:100%;
                    touch-action: none;
                }
                .activeCanvas {
                    z-index:1001;
                    position:absolute;
                    top:0;left:0;
                    width:100%;
                    touch-action: none;
                }
                .canvasBackgroundImage {
                    width:100%;
                    display: block;
                    pointer-events: none;
                    touch-action: none;
                }
                
                .zoom-indicator {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    z-index: 2000;
                    pointer-events: none;
                }
                .zoomToggle {
    border-color: #3b82f6 !important;
}
.zoomToggle:hover {
    background: #3b82f6 !important;
}
.zoomToggle.active {
    background: #3b82f6 !important;
    color: #fff !important;
}

.zoomContainer {
    display: inline-block;
    margin-left: 4px;
}

.zoomTools {
    display: flex;
    gap: 4px;
    align-items: center;
    background: rgba(0,0,0,0.3);
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid rgba(59, 130, 246, 0.3);
}

.zoom-btn {
    background: rgba(59, 130, 246, 0.15) !important;
    border: 2px solid #3b82f6 !important;
    border-radius: 8px !important;
    color: #f0eaff !important;
    width: 32px !important;
    height: 32px !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
    font-size: 18px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0 !important;
    line-height: 1 !important;
}
.zoom-btn:hover {
    background: #3b82f6 !important;
    color: #ffffff !important;
    box-shadow: 0 0 25px rgba(59, 130, 246, 0.3) !important;
}
.zoom-btn:active {
    transform: scale(0.95) !important;
}
            </style>
        `).appendTo(this.shadowRoot);
        
        if (jQuery(this).attr('css')) {
            jQuery(`<link href="${jQuery(this).attr('css')}" rel="stylesheet" type="text/css" />`).appendTo(this.shadowRoot);
        }
        
        jQuery(`
            <div class="wrapper">
                <div class="imageNav"></div>
                <div class="toolbar">
                    <div class="tools">
                        <input class="sizerTool input" type="range" min="1" max="${jQuery(this).attr('maxbrushsize') || 32}">
                        
                        <button class="undoButton button"><i class="material-icons">undo</i></button>
                        <button class="clearButton button"><i class="material-icons">clear</i></button>
                        <button class="saveButton button"><i class="material-icons">save</i></button>
                        
                       <button class="zoomToggle button" id="zoomToggleBtn"><i class="material-icons" style="font-size:18px;">zoom_in</i></button>
<div class="zoomContainer" style="display:none;">
    <div class="zoomTools">
        <button class="zoom-btn" id="zoomInBtn"><i class="material-icons" style="font-size:18px;">zoom_in</i></button>
        <button class="zoom-btn" id="zoomOutBtn"><i class="material-icons" style="font-size:18px;">zoom_out</i></button>
        <button class="zoom-btn" id="zoomResetBtn"><i class="material-icons" style="font-size:18px;">center_focus_strong</i></button>
        <span class="zoom-level" id="zoomLevel">100%</span>
    </div>
</div>
                        
                        <div class="spacer"></div>
                        <button class="paletteToggle button"><i class="material-icons">palette</i></button>
                    </div>
                    <div class="paletteContainer" style="display:none;">
                        <div class="palette"></div>
                    </div>
                </div>
                <div class="canvasWrapper">
                    <div class="canvasContainer" id="canvasContainer">
                    </div>
                    <div class="zoom-indicator" id="zoomIndicator">100%</div>
                </div>
            </div>
        `).appendTo(this.shadowRoot);
        
        this.sizer = jQuery('.sizerTool', this.shadowRoot);
        this.sizer.val(15);
        this.wrapper = jQuery('.wrapper', this.shadowRoot);
        this.canvasContainer = jQuery('#canvasContainer', this.shadowRoot);
        this.zoomIndicator = jQuery('#zoomIndicator', this.shadowRoot);
        
        this.generatePalette();
        this.drawImageNav();
        
        let me = this;
        
        jQuery('.sizerTool', this.shadowRoot).on('input', function(){me.updateSize()});
        jQuery('.undoButton', this.shadowRoot).on('click', function(){me.paths.pop(); localStorage.setItem('v2:'+jQuery(me).attr('src'),JSON.stringify(me.paths)); me.refresh();});
        jQuery('.clearButton', this.shadowRoot).on('click', function(){me.paths=[];localStorage.setItem('v2:'+jQuery(me).attr('src'),JSON.stringify(me.paths));me.refresh();});
        jQuery('.saveButton', this.shadowRoot).on('click', function() {me.save()});
        
        jQuery('#zoomToggleBtn', this.shadowRoot).on('click', function() {
    const container = jQuery('.zoomContainer', me.shadowRoot);
    container.toggle();
    jQuery(this).toggleClass('active');
});
        jQuery('#zoomInBtn', this.shadowRoot).on('click', function() { me.zoomIn(); });
        jQuery('#zoomOutBtn', this.shadowRoot).on('click', function() { me.zoomOut(); });
        jQuery('#zoomResetBtn', this.shadowRoot).on('click', function() { me.zoomReset(); });

        
       jQuery(this.wrapper).on('wheel', function(e) {
    e.preventDefault();
    var delta = Math.max(-1, Math.min(1, e.originalEvent.deltaY || e.originalEvent.wheelDelta || 0));
    if (delta < 0) {
        me.zoomIn();
    } else if (delta > 0) {
        me.zoomOut();
    }
});    
        jQuery('.paletteToggle', this.shadowRoot).on('click', function() {
            const container = jQuery('.paletteContainer', me.shadowRoot);
            container.slideToggle(200);
            jQuery(this).toggleClass('active');
        });
    }

    generatePalette()
    {
        let paletteColors=[];
        let list= jQuery('slot',this.slots)[0].assignedElements();
        
        for (const x of list) {
            if (x.tagName=='I') {
                paletteColors.push(jQuery(x).attr('color'));
            }
        }
        if (paletteColors.length) this.paletteColors=paletteColors;
      
        let palette=jQuery('.palette',this.shadowRoot);
        let i=0;
        let className='';
        
        for (let value of this.paletteColors) {
            className='';
            if (i==(this.paletteColors.length-1)) className="eraser";
            let me=this;

            let html = `<div class="paletteColor ${className} color${i}" style="background-color:${value};">`;
if (className === 'eraser') {
    html = `<div class="paletteColor eraser color${i}" style="background: transparent; border-color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #ef4444;">🧹</div>`;
} else {
    html = `<div class="paletteColor color${i}" style="background-color:${value};"></div>`;
}
jQuery(html).data('color', i)
                .on('click',function(){
                    me.color=jQuery(this).data('color');
                    me.setCursor();
                    jQuery(this).parent().children().removeClass('selected');
                    jQuery(this).addClass('selected');
                }).appendTo(palette);
            i++;
        }

        let me = this;
        const eyedropperBtn = jQuery(`<div class="eyedropperButton tool-btn" style="width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);background:rgba(168,85,247,0.15);color:#f0eaff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:0;line-height:0;flex-shrink:0;transition:all 0.2s ease;"><i class="material-icons" style="font-size:16px;line-height:1;">colorize</i></div>`)
            .appendTo(palette)
            .on('click', function() {
                me.eyedropperMode = !me.eyedropperMode;
                jQuery(this).toggleClass('active');
                if (me.eyedropperMode) {
                    me.wrapper.css('cursor', 'crosshair');
                } else {
                    me.setCursor();
                }
            });

        jQuery('<style>.eyedropperButton.active { border-color: #a855f7 !important; transform: scale(1.2) !important; box-shadow: 0 0 20px rgba(168, 85, 247, 0.4) !important; }</style>').appendTo(this.shadowRoot);
    }

    drawImageNav()
    {
        this.images=[];
        let list= jQuery('slot',this.slots)[0].assignedElements();
        for (const x of list) {
            if (x.tagName=='IMG') {
                this.images.push(jQuery(x).attr('data-lazy-src')||jQuery(x).attr('src'));
            }
        }
        let me = this;
        let imageNav=jQuery('.imageNav',this.shadowRoot);
        jQuery(imageNav).empty();
        let sel=0;
        let i=0;
        if (jQuery(this).attr('randomize')) sel = Math.floor(Math.random()*this.images.length);
        if (this.images.length > 1) {
            for(const src of this.images) {
                let x= jQuery(`<img src="${src}">`).addClass('image').appendTo(imageNav)
                .on('click', function(){
                    me.selectImage(this);
                });
                if (sel==i) this.selectImage(x);
                i++;
            }
        } else this.selectImage(jQuery(`<img src="${this.images[0]}" />`));
    }

    selectImage(sourceImg)
    {
        this.src=jQuery(sourceImg).attr('src');
        this.img=jQuery(`<img class="canvasBackgroundImage" src="${this.src}">`)
        jQuery(sourceImg).siblings().removeClass('selected')
        jQuery(sourceImg).addClass('selected');
        this.drawCanvas();
    }

    drawCanvas()
    {
        let me = this;
        jQuery(this).attr('src',this.img.attr('src'));
        
        this.canvasContainer.empty().append(this.img);
        
        this.canvas = jQuery(`<canvas class="canvas"/>`).appendTo(this.canvasContainer);
        this.activeCanvas = jQuery(`<canvas class="activeCanvas"/>`).appendTo(this.canvasContainer);
        
        this.ctx = this.canvas[0].getContext('2d');
        this.activeCtx = this.activeCanvas[0].getContext('2d');

        this.img.off('load').on('load', function() {
            me.sizeCanvas();
            let x = window.localStorage.getItem('v2:'+jQuery(this).attr('src'));
            if (x){
                me.paths=JSON.parse(x);
                me.refresh();
            } else {
                me.paths=[];
                me.refresh();
            }
            if (!me.color) {
                jQuery('.paletteColor.color3', me.shadowRoot).trigger('click');
            }
        });
        
        this.activeCanvas.on('mousedown', function(e) {me.mouseDown(e);})
            .on('mouseup', function(e) {me.mouseUp(e);})
            .on('mousemove', function(e) {me.mouseMove(e);})
            .on('click', function(e) {me.handleCanvasClick(e);})
            .on('touchstart', function(e) {return me.touchStart(e);})
            .on('touchend', function(e) {return me.touchEnd(e);})
            .on('touchmove', function(e) {return me.touchMove(e);})
            .on('touchcancel', function(e) {me.dragging = false;});
    }

    getCanvasCoords(e) {
        const canvas = this.canvas[0];
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        let x = (clientX - rect.left);
        let y = (clientY - rect.top);
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: x * scaleX,
            y: y * scaleY
        };
    }

    getCursorPosition(e) {
        return this.getCanvasCoords(e);
    }

 handleCanvasClick(e) {
    // Если пипетка активна - обрабатываем только её
    if (this.eyedropperMode) {
        e.stopPropagation();
        e.preventDefault();
        this.pickColor(e);
        return;
    }
}

touchStart(oe)
{           
    // ===== ДОБАВЬТЕ ЭТУ ПРОВЕРКУ =====
    if (this.eyedropperMode) {
        // Не создаем путь в режиме пипетки
        return;
    }
    // ===== КОНЕЦ ПРОВЕРКИ =====
    
    let e = oe.originalEvent;
    // Просто передаём event — он содержит touches
    this.mouseDown(e);
}

   touchEnd(oe)
{
    // ===== ДОБАВЬТЕ ЭТУ ПРОВЕРКУ =====
    if (this.eyedropperMode) {
        this.dragging = false;
        return;
    }
    // ===== КОНЕЦ ПРОВЕРКИ =====

    let e=oe.originalEvent;
    this.mouseUp(e);
}

  touchMove(oe)
{   
    // ===== ДОБАВЬТЕ ЭТУ ПРОВЕРКУ =====
    if (this.eyedropperMode) {
        return;
    }
    // ===== КОНЕЦ ПРОВЕРКИ =====
    
    let e= oe.originalEvent;
    if (e.touches.length >=2) return true; // allow 2 finger gestures through
    e.preventDefault();
    e.stopPropagation();
    
    let touch = e.touches[0];

    e.clientX=touch.clientX;
    e.clientY=touch.clientY;
    this.mouseMove(e)
}

mouseDown(e)
{
    // ===== ДОБАВЬТЕ ЭТУ ПРОВЕРКУ =====
    if (this.eyedropperMode) {
        // Не создаем путь, просто выходим
        return;
    }
    // ===== КОНЕЦ ПРОВЕРКИ =====
    
    let pos = this.getCursorPosition(e);               
    this.dragging = true;
    pos.c=this.color;
    pos.s=this.sizer.val();
    this.paths.push([pos]);
    this.setCursor();
}

   mouseUp(e) 
{
    // ===== ДОБАВЬТЕ ЭТУ ПРОВЕРКУ =====
    if (this.eyedropperMode) {
        this.dragging = false;
        return;
    }
    // ===== КОНЕЦ ПРОВЕРКИ =====
    
    this.commitActivePath();
    if (this.dragging) localStorage.setItem('v2:'+jQuery(this).attr('src'),JSON.stringify(this.paths));
    this.dragging = false;
    // Обновляем прогресс после завершения рисования
    this.updateProgress();
}

    mouseMove(e) {
        if (!this.dragging) return;
        let pos = this.getCursorPosition(e);
        pos.x = Math.max(0, Math.min(pos.x, this.canvas[0].width - 1));
        pos.y = Math.max(0, Math.min(pos.y, this.canvas[0].height - 1));
        this.paths[this.paths.length-1].push(pos);
        this.drawActivePath();
    }

    commitActivePath() {
        this.drawActivePath(true);
        setTimeout(() => this.updateProgress(), 50);
    }

    clearActivePath() {
        let height = this.img[0].naturalHeight;
        let width = this.img[0].naturalWidth;
        let ctx = this.activeCtx;
        ctx.clearRect(0, 0, width, height);
    }

    drawActivePath(saveToCanvas=false) {
        // Если пипетка активна - НЕ РИСУЕМ!
    if (this.eyedropperMode) {
        return;
    }
        if (this.paths.length === 0 || !this.paths[this.paths.length-1] || this.paths[this.paths.length-1].length === 0) {
            return;
        }
        
        this.clearActivePath();
        let ctx;
        let path = this.paths[this.paths.length-1];
        
        if (saveToCanvas==true || path[0].c==(this.paletteColors.length-1)) {
            ctx = this.ctx;
        } else {
            ctx = this.activeCtx;
        }

        if (!path[0].c) { path[0].c=0; }
        
        ctx.strokeStyle = `${this.paletteColors[path[0].c]}`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = path[0].s * (this.img[0].naturalWidth / this.img.width());
        
        if (path[0].c==(this.paletteColors.length-1)) {
            ctx.globalCompositeOperation="destination-out";
            ctx.strokeStyle = `white`;
        } else {
            ctx.globalCompositeOperation="source-over";
        }
        
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let j=1; j<path.length; ++j) {
            ctx.lineTo(path[j].x, path[j].y);
        }
        ctx.stroke();
    }

    refresh() {
        this.clearActivePath();
        let height = this.img[0].naturalHeight;
        let width = this.img[0].naturalWidth;
        let ctx = this.ctx;
        ctx.clearRect(0, 0, width, height);
        
        for (let i=0; i<this.paths.length; ++i) {
            let path = this.paths[i];
            if (path.length<1) continue;
            if (!path[0].c) { path[0].c=0; }
            
            ctx.strokeStyle = `${this.paletteColors[path[0].c]}`;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = path[0].s * (this.img[0].naturalWidth / this.img.width());
            
            if (path[0].c==(this.paletteColors.length-1)) {
                ctx.globalCompositeOperation="destination-out";
                ctx.strokeStyle = `white`;
            } else {
                ctx.globalCompositeOperation="source-over";
            }
            
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let j=1; j<path.length; ++j) {
                ctx.lineTo(path[j].x, path[j].y);
            }
            ctx.stroke();
        }
        setTimeout(() => this.updateProgress(), 100);
    }
    
    zoomIn() {
        this.zoomLevel = Math.min(3, this.zoomLevel + 0.25);
        this.applyZoom();
    }
    
    zoomOut() {
        this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25);
        this.applyZoom();
    }
    
    zoomReset() {
        this.zoomLevel = 1;
        this.applyZoom();
    }
    
    applyZoom() {
        const percent = Math.round(this.zoomLevel * 100);
        this.canvasContainer.css({
            'transform': `scale(${this.zoomLevel})`,
            'transform-origin': '0 0'
        });
        this.zoomIndicator.text(percent + '%');
        jQuery('#zoomLevel', this.shadowRoot).text(percent + '%');
    }

    sizeCanvas() {
        this.canvas.attr('height', this.img[0].naturalHeight);
        this.canvas.attr('width', this.img[0].naturalWidth);
        this.activeCanvas.attr('height', this.img[0].naturalHeight);
        this.activeCanvas.attr('width', this.img[0].naturalWidth);
        this.zoomReset();
    }

    updateSize() {
        this.setCursor();
    }

setCursor() {
    let size = this.sizer.val();
    if (size < 2) size=2;
    if (size > 32) size=32;
    let canvas = jQuery(`<canvas height="64" width="64"/>`); // Увеличил размер для лучшей видимости
    let context = canvas[0].getContext('2d');

    // Очищаем канвас
    context.clearRect(0, 0, 64, 64);
    
    // Рисуем круг кисти
    context.beginPath();
    context.arc(32, 32, size/2, 0, 2 * Math.PI, false);
    
    // БЕЗ альфа-канала для четкого цвета
    const colorIndex = this.color !== undefined ? this.color : 0;
    const color = this.paletteColors[colorIndex];
    
    // Если это ластик - делаем особый курсор
    if (colorIndex === this.paletteColors.length - 1) {
        context.fillStyle = 'rgba(255,255,255,0.3)';
        context.fill();
        context.strokeStyle = '#ef4444';
        context.lineWidth = 2;
        context.stroke();
        // Рисуем крестик для ластика
        context.beginPath();
        context.moveTo(20, 20);
        context.lineTo(44, 44);
        context.moveTo(44, 20);
        context.lineTo(20, 44);
        context.stroke();
    } else {
        // Обычный цвет - РИСУЕМ НЕПРОЗРАЧНЫЙ КРУГ
        context.fillStyle = color;
        context.fill();
        // Обводка для видимости
        context.strokeStyle = 'rgba(0,0,0,0.3)';
        context.lineWidth = 1.5;
        context.stroke();
    }
    
    // Рисуем перекрестие для точности
    context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    context.lineWidth = 1;
    context.setLineDash([4, 4]);
    context.beginPath();
    context.moveTo(32, 0);
    context.lineTo(32, 64);
    context.moveTo(0, 32);
    context.lineTo(64, 32);
    context.stroke();
    context.setLineDash([]);
    
    let url = canvas[0].toDataURL();
    this.wrapper.css('cursor', `url(${url}) 32 32, crosshair`);
}

    updateProgress() {
        try {
            const canvas = this.canvas ? this.canvas[0] : null;
            const activeCanvas = this.activeCanvas ? this.activeCanvas[0] : null;
            
            if (!canvas) return;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            
            tempCtx.drawImage(canvas, 0, 0);
            if (activeCanvas) {
                tempCtx.drawImage(activeCanvas, 0, 0);
            }
            
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            let coloredPixels = 0;
            const totalPixels = data.length / 4;
            
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] > 10) coloredPixels++;
            }
            
            let percent = 0;
            if (totalPixels > 0) {
                percent = Math.min(Math.round((coloredPixels / totalPixels) * 100), 100);
                if (coloredPixels > 0 && percent === 0) percent = 1;
            }
            
            const event = new CustomEvent('progressUpdate', {
                detail: { 
                    percent: percent,
                    coloredPixels: coloredPixels,
                    totalPixels: totalPixels
                }
            });
            this.dispatchEvent(event);
            
        } catch(e) {}
    }

    getProgress() {
        return new Promise((resolve) => {
            try {
                const canvas = this.canvas ? this.canvas[0] : null;
                if (!canvas) {
                    resolve({ percent: 0, coloredPixels: 0, totalPixels: 0 });
                    return;
                }
                
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                let coloredPixels = 0;
                const totalPixels = data.length / 4;
                
                for (let i = 3; i < data.length; i += 4) {
                    if (data[i] > 10) coloredPixels++;
                }
                
                let percent = 0;
                if (totalPixels > 0) {
                    percent = Math.min(Math.round((coloredPixels / totalPixels) * 100), 100);
                    if (coloredPixels > 0 && percent === 0) percent = 1;
                }
                
                resolve({ percent, coloredPixels, totalPixels });
            } catch(e) {
                resolve({ percent: 0, coloredPixels: 0, totalPixels: 0 });
            }
        });
    }

pickColor(e) {
    if (!this.eyedropperMode) return; 
    const pos = this.getCursorPosition(e);
    
    if (pos.x < 0 || pos.y < 0 || pos.x >= this.canvas[0].width || pos.y >= this.canvas[0].height) {       
        return;
    }
    
    const x = Math.floor(pos.x);
    const y = Math.floor(pos.y);    
    // 1. СНАЧАЛА проверяем АКТИВНЫЙ canvas (текущая линия)
    let pixel = this.activeCtx.getImageData(x, y, 1, 1).data;
    let r = pixel[0], g = pixel[1], b = pixel[2], a = pixel[3];     
    // 2. Если на активном пусто - проверяем ОСНОВНОЙ canvas
    if (a < 10) {
        pixel = this.ctx.getImageData(x, y, 1, 1).data;
        r = pixel[0];
        g = pixel[1];
        b = pixel[2];
        a = pixel[3];       
    }    
    // Если всё ещё прозрачный - выходим
    if (a < 10) {  
        return;
    }
            // Ищем ближайший цвет в палитре
    let closestIndex = 0;
    let closestDist = Infinity;
    
    for (let i = 0; i < this.paletteColors.length - 1; i++) {
        const color = this.paletteColors[i];
        
        // Парсим цвет
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!match) continue;
        
        const cr = parseInt(match[1]);
        const cg = parseInt(match[2]);
        const cb = parseInt(match[3]);
        const ca = match[4] ? parseFloat(match[4]) : 1;
        
        // Корректируем цвет с учетом альфа-канала (смешиваем с белым)
        let adjustedR = cr;
        let adjustedG = cg;
        let adjustedB = cb;
        
        if (ca < 1) {
            const alpha = ca;
            adjustedR = Math.round(cr * alpha + 255 * (1 - alpha));
            adjustedG = Math.round(cg * alpha + 255 * (1 - alpha));
            adjustedB = Math.round(cb * alpha + 255 * (1 - alpha));
        }
        
        const dist = Math.sqrt(
            Math.pow(r - adjustedR, 2) +
            Math.pow(g - adjustedG, 2) +
            Math.pow(b - adjustedB, 2)
        );        
        
        if (dist < closestDist) {
            closestDist = dist;
            closestIndex = i;
        }
    }    
    // ПРИМЕНЯЕМ ЦВЕТ
    this.color = closestIndex;    
    // Обновляем UI палитры
    jQuery('.paletteColor', this.shadowRoot).removeClass('selected');
    jQuery(`.paletteColor.color${closestIndex}`, this.shadowRoot).addClass('selected');    
    // ОБНОВЛЯЕМ КУРСОР КИСТИ
    this.setCursor();    
    // Отключаем режим пипетки
    this.disableEyedropper();
}

disableEyedropper() {
    this.eyedropperMode = false;
    const btn = jQuery('.eyedropperButton', this.shadowRoot);
    btn.removeClass('active');
    this.wrapper.css('cursor', 'default');
    this.setCursor();
    // НЕ вызываем refresh(), НЕ перерисовываем ничего!
}
   
   async save() {
    try {
        // Загружаем фоновое изображение через fetch как blob (обходит CORS)
        const response = await fetch(this.img[0].src);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Создаем изображение из blob
        const bgImage = new Image();
        bgImage.src = url;
        
        // Ждем загрузки
        await new Promise((resolve) => {
            if (bgImage.complete) {
                resolve();
            } else {
                bgImage.onload = resolve;
            }
        });
        
        // Создаем временный canvas
        const width = bgImage.naturalWidth || bgImage.width;
        const height = bgImage.naturalHeight || bgImage.height;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        
        // Рисуем фоновое изображение
        ctx.drawImage(bgImage, 0, 0, width, height);
        
        // Рисуем раскраску поверх
        // Масштабируем canvas раскраски до размеров фона
        const overlayCanvas = this.canvas[0];
        ctx.drawImage(overlayCanvas, 0, 0, width, height);
        
        // Сохраняем
        const link = tempCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = link;
        a.download = 'coloring.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Очищаем URL
        URL.revokeObjectURL(url);
        
    } catch(e) {
        console.error('Ошибка:', e);
        // Если не получилось через fetch, пробуем альтернативный способ
        try {
            // Альтернативный способ - используем img напрямую
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = this.img[0].src;
            
            await new Promise((resolve) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = resolve;
                }
            });
            
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const ctx = tempCanvas.getContext('2d');
            
            ctx.drawImage(img, 0, 0, width, height);
            ctx.drawImage(this.canvas[0], 0, 0, width, height);
            
            const link = tempCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = link;
            a.download = 'coloring.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
        } catch(e2) {
            console.error('Ошибка:', e2);
            alert('Не удалось сохранить рисунок.\n\nНажмите правой кнопкой мыши на раскраску и выберите "Сохранить как"');
        }
    }
}

});