"use strict";
customElements.define('jl-coloringbook', class extends HTMLElement 
{
    constructor() 
    {
        super();
        this.shadow = this.attachShadow({mode: 'open'}); 
        this.loadIcons();
        this.eyedropperMode = false;  
         }

    init()
    {
        jQuery(this).css('display','block');
        //default colors
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
                'white']; // last color is eraser
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

        if (auto!=='0')
        {
            this.init();
        } 
    
    }

    loadIcons()
    {
        //load Material Icons.
        try
        {
            let material = new FontFace('Material Icons', 'url(https://fonts.gstatic.com/s/materialicons/v50/flUhRq6tzZclQEJ-Vdg-IuiaDsNZ.ttf)');
            material.load().then(function(loaded_face) {
                document.fonts.add(loaded_face);
            }).catch(function(error) {
                // error occurred
            });
        } 
        catch(err)
        {

        }
    }

    
    drawTemplate()
    {
        jQuery(this).on('click', function(e) {e.preventDefault; e.stopPropagation()})
        jQuery(
        `
       
            <style>
            /* ===== ДОПОЛНИТЕЛЬНЫЕ ИНСТРУМЕНТЫ ===== */
.paletteTools {
    display: flex;
    gap: 6px;
    padding: 4px 0 8px 0;
    flex-wrap: wrap;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    margin-bottom: 6px;
}

.paletteTools .tool-btn {
    width: 28px !important;
    height: 28px !important;
    border-radius: 50% !important;
    border: 2px solid rgba(168, 85, 247, 0.3) !important;
    background: rgba(168, 85, 247, 0.12) !important;
    color: #f0eaff !important;
    padding: 0 !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 0 !important;
    line-height: 0 !important;
}

.paletteTools .tool-btn i {
    font-size: 16px !important;
    line-height: 1 !important;
}

.paletteTools .tool-btn:hover {
    background: rgba(168, 85, 247, 0.3) !important;
    border-color: #a855f7 !important;
    transform: scale(1.1) !important;
}

.paletteTools .tool-btn.active {
    background: #a855f7 !important;
    color: #fff !important;
    border-color: #a855f7 !important;
}

                /*icons*/
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
                .wrapper { width:100%; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;}
                
                /*default theme*/
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
                    position: sticky;  position: -webkit-sticky; 
                    top: 0;
                    background-color: rgba(200,200,200,.1) 
                }
                .tools {
                    display:flex;
                    justify-content:flex-end;
                    flex-wrap:wrap;
                    max-width:100%;
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

/* ===== СТИЛИ КНОПОК (ТОЛЬКО ВНЕШНИЙ ВИД) ===== */
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
    background: linear-gradient(135deg, white 43%, red 45%, red 55%, white 57%, white) !important;
    border-color: red !important;
}

                
                .canvasWrapper {
                    display:inline-block;
                    position:relative;
                    width:100%
                }
                .canvas {
                    z-index:1000;
                    position:absolute;
                    top:0;left:0;
                    width:100%;
                }
                .activeCanvas {
                    z-index:1001;
                    position:absolute;
                    top:0;left:0;
                    width:100%;
                }
                .canvasBackgroundImage{width:100%}

            </style>`).appendTo(this.shadowRoot);
            if (jQuery(this).attr('css')) {
                jQuery(`<link href="${jQuery(this).attr('css')}" rel="stylesheet" type="text/css" />`).appendTo(this.shadowRoot);
            }       
          jQuery(`
<div class="wrapper">
    <div class="imageNav"></div>
    <div class="toolbar">
        <div class="tools">
            <input class="sizerTool input" type="range" min="1" max="${jQuery(this).attr('maxbrushsize') || 32}">
            <div class="spacer"></div>
     <button class="undoButton button"><i class="material-icons">undo</i></button>
<button class="clearButton button"><i class="material-icons">clear</i></button>
<button class="saveButton button"><i class="material-icons">save</i></button>
         
            <button class="paletteToggle button"><i class="material-icons">palette</i></button>
        </div>
   <div class="paletteContainer" style="display:none;">
    <div class="palette">
        <!-- Цвета будут здесь (генерируются через generatePalette) -->
        <!-- Пипетка будет добавлена в конец через JS -->
    </div>
</div>
    </div>
    <div class="canvasWrapper"></div>
</div>
`).appendTo(this.shadowRoot);
        this.sizer=jQuery('.sizerTool',this.shadowRoot);
        this.sizer.val(15);
        this.wrapper=jQuery('.wrapper',this.shadowRoot);
        this.generatePalette();
        this.drawImageNav(); 
        let me = this;
jQuery('.sizerTool',this.shadowRoot).on('input', function(){me.updateSize()});
jQuery(`.undoButton`,this.shadowRoot).on('click', function(){me.paths.pop(); me.refresh();});
jQuery(`.clearButton`,this.shadowRoot).on('click', function(){me.paths=[];localStorage.setItem('v2:'+jQuery(me).attr('src'),JSON.stringify(me.paths));me.refresh();});
jQuery(`.saveButton`,this.shadowRoot).on('click', function() {me.save()});


// === ПАЛИТРА (переключение) ===
jQuery(`.paletteToggle`,this.shadowRoot).on('click', function() {
    const container = jQuery('.paletteContainer', me.shadowRoot);
    container.slideToggle(200);
    jQuery(this).toggleClass('active');
});
  
    }

   generatePalette()
{
    let paletteColors=[];
    let list= jQuery('slot',this.slots)[0].assignedElements();
    
    for (const x of list)
    {
        if (x.tagName=='I')
        {
            paletteColors.push(jQuery(x).attr('color'));
        }
    }
    if (paletteColors.length) this.paletteColors=paletteColors;
  
    let palette=jQuery(`.palette`,this.shadowRoot);
    let i=0;
    let className='';
    
    // === ЦИКЛ ДЛЯ ЦВЕТОВ ===
    for (let value of this.paletteColors)
    {
        className='';
        if (i==(this.paletteColors.length-1)) className="eraser";
        let me=this;

        jQuery(`<div class="paletteColor ${className}  color${i}" style="background-color:${value};"><i class="material-icons"></i></div>`).data('color',i)
            .on('click',function(){
            me.color=jQuery(this).data('color');
            me.setCursor();
            jQuery(this).parent().children().removeClass('selected');
            jQuery(this).addClass('selected');
        }).appendTo(palette);
         i++;
    }

    // === ДОБАВЛЯЕМ ПИПЕТКУ В КОНЕЦ (ПОСЛЕ ЦИКЛА) ===
    let me = this;
    const eyedropperBtn = jQuery(`<div class="eyedropperButton tool-btn" style="width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);background:rgba(168,85,247,0.15);color:#f0eaff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:0;line-height:0;flex-shrink:0;transition:all 0.2s ease;"><i class="material-icons" style="font-size:16px;line-height:1;">colorize</i></div>`)
        .appendTo(palette)
        .on('click', function() {
            me.eyedropperMode = !me.eyedropperMode;
            jQuery(this).toggleClass('active');
            if (me.eyedropperMode) {
                me.wrapper.css('cursor', 'crosshair');
                me.activeCanvas.css('cursor', 'crosshair');
            } else {
                me.setCursor();
                me.activeCanvas.css('cursor', 'default');
            }
        });

    // Стили для активного состояния пипетки
    jQuery('<style>.eyedropperButton.active { border-color: #a855f7 !important; transform: scale(1.2) !important; box-shadow: 0 0 20px rgba(168, 85, 247, 0.4) !important; }</style>').appendTo(this.shadowRoot);
}

    drawImageNav()
    {

        this.images=[];
        let list= jQuery('slot',this.slots)[0].assignedElements();
        for (const x of list)
        {
            if (x.tagName=='IMG')
            {
                this.images.push(jQuery(x).attr('data-lazy-src')||jQuery(x).attr('src'));
            }
        }
        let me = this;
        let imageNav=jQuery('.imageNav',this.shadowRoot);
        jQuery(imageNav).empty();
        //imageNav=jQuery(`<div style="max-width:100%">`);
        let sel=0;
        let i=0;
        if (jQuery(this).attr('randomize')) sel = Math.floor(Math.random()*this.images.length);
        if (this.images.length > 1)
        {
            for(const src of this.images)
            {
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
    let canvasWrapper=jQuery('.canvasWrapper',this.shadowRoot).empty().append(this.img);
    this.canvas=jQuery(`<canvas class="canvas"/>`).appendTo(canvasWrapper);
    this.activeCanvas=jQuery(`<canvas class="activeCanvas"/>`).appendTo(canvasWrapper);
    
    // ===== ДОБАВЬТЕ ЗАПРЕТ КОНТЕКСТНОГО МЕНЮ =====
    this.canvas.on('contextmenu', function(e) { e.preventDefault(); return false; });
    this.activeCanvas.on('contextmenu', function(e) { e.preventDefault(); return false; });
    // ===== КОНЕЦ =====
    
    this.ctx=this.canvas[0].getContext('2d');
    this.activeCtx=this.activeCanvas[0].getContext('2d');

        //jQuery(img).replaceWith(this.wrapper);
        this.img.off('load').on('load', function() {
            me.sizeCanvas();
            let x = window.localStorage.getItem('v2:'+jQuery(this).attr('src'));
            if (x){
                me.paths=JSON.parse(x);
                me.refresh();
            } else
            {
                me.paths=[];
                me.refresh();
            }

            if (!me.color)
            {
                jQuery('.paletteColor.color3',me.shadowRoot).trigger('click');
            }
            //alert('yo');
        });
        
        this.activeCanvas.on('mousedown', function(e) {me.mouseDown(e);})
            .on('mouseup', function(e) {me.mouseUp(e);})
            .on('mousemove', function(e) {me.mouseMove(e);})
            .on('touchstart', function(e) {return me.touchStart(e);})
            .on('touchend', function(e) {return me.touchEnd(e);})
            .on('touchmove', function(e) {return me.touchMove(e);})
            .on('click', function(e) {me.pickColor(e);})

    }

touchStart(oe)
{           
    let e = oe.originalEvent;
    // Просто передаём event — он содержит touches
    this.mouseDown(e);
}

    touchEnd(oe)
    {

        let e=oe.originalEvent;
        this.mouseUp(e);

    }
    touchMove(oe)
    {   
        let e= oe.originalEvent;
        if (e.touches.length >=2) return true; // allow 2 finger gestures through
        e.preventDefault();
        e.stopPropagation();
        
        let touch = e.touches[0];

        e.clientX=touch.clientX;
        e.clientY=touch.clientY;
        this.mouseMove(e)
    }


    async print()
    {
        const dataUrl = await this.getImageData(); 

        let windowContent = '<!DOCTYPE html>';
        windowContent += '<html>';
        windowContent += '<head><title>Print Ваша картина</title></head>';
        windowContent += '<body>';
        windowContent += '<img src="' + dataUrl + '" style="width:100%">';
        windowContent += '</body>';
        windowContent += '</html>';

        const printWin = window.open('', '', 'width=' + screen.availWidth + ',height=' + screen.availHeight);
        printWin.document.open();
        printWin.document.write(windowContent); 

        printWin.document.addEventListener('load', function() {
            printWin.focus();
            printWin.print();
            printWin.document.close();
            printWin.close();            
        }, true);

    }

    loadImage(url) {
        return new  Promise(resolve => {
            const image = new Image();
            image.addEventListener('load', () => {
                resolve(image);
            });
            image.src = url; 
        });
    }
    async getImageData()
    {
        let height=this.img[0].naturalHeight;
        let width=this.img[0].naturalWidth
        let cv=jQuery(`<canvas height="${height}" width="${width}" />`)[0];
        let c = cv.getContext('2d');
        c.drawImage(this.img[0],0,0,width,height);
        let i= await this.loadImage(this.canvas[0].toDataURL('image/png'));
        c.drawImage(i,0,0);
        return cv.toDataURL('image/png');
    }

    async save()
    {
        let link=await this.getImageData();

        let x =jQuery(`<a download="ColoringBook.png">Download</a>`).attr('href',link).appendTo(this.wrapper)
        x[0].click();
        x.remove();

    }

    sizeCanvas()
    {
        this.canvasPos = this.canvas[0].getBoundingClientRect();
        this.canvas.attr('height',this.img[0].naturalHeight);
        this.canvas.attr('width',this.img[0].naturalWidth);
        this.activeCanvas.attr('height',this.img[0].naturalHeight);
        this.activeCanvas.attr('width',this.img[0].naturalWidth);
    }

getCursorPosition(e) 
{
    const canvas = this.canvas[0];
    
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
    
    const rect = canvas.getBoundingClientRect();
    
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: x * scaleX,
        y: y * scaleY
    };
}

    mouseDown(e)
    {
        let pos = this.getCursorPosition(e);               
        this.dragging = true;
        pos.c=this.color;
        pos.s=this.sizer.val();
        this.paths.push([pos]);
        this.setCursor();
    }

    mouseUp(e) 
    {
        this.commitActivePath();
        if (this.dragging) localStorage.setItem('v2:'+jQuery(this).attr('src'),JSON.stringify(this.paths));
        this.dragging = false;
        // Обновляем прогресс после завершения рисования
        this.updateProgress();
    }

    mouseMove(e)
    {
        let pos;
         if (!this.dragging) return;

        pos = this.getCursorPosition(e);
        this.paths[this.paths.length-1].push(pos); // Append point tu current path.
        this.drawActivePath();
    }

    commitActivePath()
    {
        this.drawActivePath(true);
        // После коммита пути обновляем прогресс
        setTimeout(() => this.updateProgress(), 50);
    }

    clearActivePath()
    {
        let height=this.img[0].naturalHeight;
        let width=this.img[0].naturalWidth;
        let ctx=this.activeCtx;
        ctx.clearRect(0, 0, width, height);
    }


    drawActivePath(saveToCanvas=false)
    {

        this.clearActivePath();
        let ctx;
        let path=this.paths[this.paths.length-1];
        if (saveToCanvas==true || path[0].c==(this.paletteColors.length-1)) {ctx=this.ctx;} 
            else {ctx=this.activeCtx;}

        if (!path[0].c) {  path[0].c=0;}
            ctx.strokeStyle = `${this.paletteColors[path[0].c]}`;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = path[0].s * (this.img[0].naturalWidth/this.img.width());
            if (path[0].c==(this.paletteColors.length-1)) 
            {
                /*eraser*/
                ctx.globalCompositeOperation="destination-out";
                ctx.strokeStyle = `white`;
            } else  ctx.globalCompositeOperation="source-over";
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let j=1; j<path.length; ++j)
                ctx.lineTo(path[j].x, path[j].y);
            ctx.stroke();
    }

    refresh()
    {   
        this.clearActivePath()
        let height=this.img[0].naturalHeight;
        let width=this.img[0].naturalWidth;
        let ctx=this.ctx;
        ctx.clearRect(0, 0, width, height);
        for (let i=0; i<this.paths.length; ++i) {
            let path = this.paths[i];
            if (path.length<1) continue;
            if (!path[0].c) { path[0].c=0;}
            ctx.strokeStyle = `${this.paletteColors[path[0].c]}`;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = path[0].s * (this.img[0].naturalWidth/this.img.width());
            if (path[0].c==(this.paletteColors.length-1)) 
            {
                /* eraser*/
                ctx.globalCompositeOperation="destination-out";
                ctx.strokeStyle = `white`;
            }
            else ctx.globalCompositeOperation="source-over";
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let j=1; j<path.length; ++j)
                ctx.lineTo(path[j].x, path[j].y);
            ctx.stroke();
        }
        // Обновляем прогресс после обновления
        setTimeout(() => this.updateProgress(), 100);
       
    }
   
    updateSize()
    {
        this.setCursor();
    }

    setCursor()
    {
        let size = this.sizer.val();
        if (size < 2) size=2;
        if (size > 32) size=32;
        let canvas=jQuery(`<canvas height="32" width="32"/>`);
        let context = canvas[0].getContext('2d');

        context.beginPath();
        context.arc(16, 16, size/2, 0, 2 * Math.PI, false);
        context.fillStyle = this.paletteColors[this.color];
        context.fill();
        context.strokeStyle='black'
        context.strokeWidth=2;
        context.stroke();
        context.strokeStyle='rgba(0, 0, 0, 0.5)';
        context.strokeWidth=2;
        context.beginPath();
        context.moveTo(0,16)
        context.lineTo(32,16)
        context.moveTo(16,0)
        context.lineTo(16,32)
        context.stroke();
        let url=canvas[0].toDataURL();
        this.wrapper.css('cursor', `url(${url}) 16 16, pointer`);
    }

          // ===== МЕТОД ПОДСЧЁТА ПРОГРЕССА (НОВЫЙ СПОСОБ) =====
    updateProgress() {
        try {
            const canvas = this.canvas ? this.canvas[0] : null;
            const activeCanvas = this.activeCanvas ? this.activeCanvas[0] : null;
            
            if (!canvas) return;

            // Создаём временный канвас для объединения
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            
            // Рисуем основной канвас
            tempCtx.drawImage(canvas, 0, 0);
            
            // Рисуем активный канвас (временные линии)
            if (activeCanvas) {
                tempCtx.drawImage(activeCanvas, 0, 0);
            }
            
            // Анализируем пиксели
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            
            let coloredPixels = 0;
            const totalPixels = data.length / 4;
            
            // Проверяем каждый пиксель (прозрачный или нет)
            for (let i = 3; i < data.length; i += 4) {
                // Если альфа-канал > 10, пиксель закрашен
                if (data[i] > 10) {
                    coloredPixels++;
                }
            }
            
            // Если закрашено меньше 1% — ставим 0%
            let percent = 0;
            if (totalPixels > 0) {
                percent = Math.min(Math.round((coloredPixels / totalPixels) * 100), 100);
                // Если процент меньше 1, но есть закрашенные пиксели — показываем 1%
                if (coloredPixels > 0 && percent === 0) percent = 1;
            }
            
            // Отправляем событие
            const event = new CustomEvent('progressUpdate', {
                detail: { 
                    percent: percent,
                    coloredPixels: coloredPixels,
                    totalPixels: totalPixels
                }
            });
            this.dispatchEvent(event);
            
        } catch(e) {
            // Игнорируем ошибки
            console.log('Progress error:', e);
        }
    }
        // ===== ПОЛУЧИТЬ ПРОГРЕСС (РУЧНОЙ ВЫЗОВ) =====
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
     
  // ===== ПИПЕТКА (выбор цвета с холста) =====
pickColor(e) {
    // Проверяем, активен ли режим пипетки
    if (!this.eyedropperMode) return;
    
    // Получаем позицию курсора
    const pos = this.getCursorPosition(e);
    const ctx = this.ctx;
    
    // Защита от выхода за границы
    if (pos.x < 0 || pos.y < 0 || pos.x >= this.canvas[0].width || pos.y >= this.canvas[0].height) {
        return;
    }
    
    // Получаем цвет пикселя
    const pixel = ctx.getImageData(Math.floor(pos.x), Math.floor(pos.y), 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const a = pixel[3];
    
    // Если пиксель прозрачный — игнорируем
    if (a < 10) {
        console.log('Прозрачный пиксель, цвет не выбран');
        return;
    }
    
    // Ищем ближайший цвет в палитре (без учёта последнего — ластика)
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
        
        // Евклидово расстояние в цветовом пространстве
        const dist = Math.sqrt(
            Math.pow(r - cr, 2) +
            Math.pow(g - cg, 2) +
            Math.pow(b - cb, 2)
        );
        
        if (dist < closestDist) {
            closestDist = dist;
            closestIndex = i;
        }
    }
    
    // Выбираем найденный цвет
    this.color = closestIndex;
    jQuery('.paletteColor', this.shadowRoot).removeClass('selected');
    jQuery(`.paletteColor.color${closestIndex}`, this.shadowRoot).addClass('selected');
    this.setCursor();
    
    // ===== ОТКЛЮЧАЕМ РЕЖИМ ПИПЕТКИ =====
    this.eyedropperMode = false;
    jQuery('.eyedropperButton', this.shadowRoot).removeClass('active');
    this.wrapper.css('cursor', 'default');
    this.activeCanvas.css('cursor', 'default');
    
    console.log(`🎨 Цвет выбран: ${this.paletteColors[closestIndex]}`);
}

});  // ← ЗДЕСЬ ЗАКРЫВАЕТСЯ КЛАСС