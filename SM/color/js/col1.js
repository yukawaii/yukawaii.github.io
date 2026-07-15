"use strict";
customElements.define('jl-coloringbook', class extends HTMLElement 
{
    constructor() 
    {
        super();
        this.shadow = this.attachShadow({mode: 'open'}); 
        this.loadIcons();
        this.eyedropperMode = false;  
         this.deleteColorMode = false;  // =====удаление из палитры =====
         this.brushType = 'simple'; 
         let me = this;
window.addEventListener('brushUnlocked', function(e) {
    if (e.detail && e.detail.brushId) {
        // Закрываем меню кистей, если оно открыто
        const menu = me.shadowRoot.querySelector('.brushMenu');
        if (menu) {
            jQuery(menu).remove();
            jQuery('.brushSelectorButton', me.shadowRoot).removeClass('active');
        }
        me.showToast('✅ Кисть разблокирована! Откройте меню кистей заново.');
    }
});
        this.zoomLevel = 1;
        this.zoomMin = 0.5;
        this.zoomMax = 3;
  this.panMode = false;          // ← добавить
    this.panDragging = false;      // ← добавить
    this.panStartX = 0;            // ← добавить
    this.panStartY = 0;            // ← добавить
    this.panX = 0;                 // ← добавить
    this.panY = 0;                 // ← добавить // ← режим перетаскивания
    this.panBaseX = 0;
this.panBaseY = 0;
 this.lastNonEraserColor = 0; //ластик

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
                               
/* Стили для кнопки палитры (paletteToggle) */
.paletteToggle {
    border-color: #ec4899 !important;
}
.paletteToggle:focus,
.paletteToggle:active {
    outline: none !important;
    box-shadow: none !important;
}
.paletteToggle:not(.active) {
    background: rgba(168, 85, 247, 0.15) !important;
    border-color: #a855f7 !important;
    color: #f0eaff !important;
}
.paletteToggle:not(.active):hover {
    background: rgba(168, 85, 247, 0.15) !important;
    color: #f0eaff !important;
}
.paletteToggle.active {
    background: #ec4899 !important;
    color: #fff !important;
    border-color: #ec4899 !important;
}
.paletteToggle.active:hover {
    background: #ec4899 !important;
    color: #fff !important;
}

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
             /* Стили для кнопки лупы (zoomToggle) */
.zoomToggle {
    border-color: #3b82f6 !important;
}
.zoomToggle:focus,
.zoomToggle:active {
    outline: none !important;
    box-shadow: none !important;
}
.zoomToggle:not(.active) {
    background: rgba(168, 85, 247, 0.15) !important;
    border-color: #a855f7 !important;
    color: #f0eaff !important;
}
.zoomToggle:not(.active):hover {
    background: rgba(168, 85, 247, 0.15) !important;
    color: #f0eaff !important;
}
.zoomToggle.active {
    background: #3b82f6 !important;
    color: #fff !important;
    border-color: #3b82f6 !important;
}
.zoomToggle.active:hover {
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

/* Стили для кнопки "Рука" (panToggle) */
.panToggle {
    border-color: #3b82f6 !important;
}
.panToggle:focus,
.panToggle:active {
    outline: none !important;
    box-shadow: none !important;
}
.panToggle:not(.active) {
    background: rgba(168, 85, 247, 0.15) !important;
    border-color: #a855f7 !important;
    color: #f0eaff !important;
}
.panToggle:not(.active):hover {
    background: rgba(168, 85, 247, 0.15) !important; /* Не меняем фон при наведении в неактивном состоянии */
    color: #f0eaff !important;
}
.panToggle.active {
    background: #3b82f6 !important;
    color: #fff !important;
    border-color: #3b82f6 !important;
}
.panToggle.active:hover {
    background: #3b82f6 !important; /* В активном состоянии фон остаётся синим */
    color: #fff !important;
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
        <button class="panToggle button" id="panToggleBtn"><i class="material-icons" style="font-size:18px;">pan_tool</i></button>
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
this.canvasContainer.css('will-change', 'transform');

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
    const btn = jQuery(this);
    btn.toggleClass('active');
    btn.blur();
});
        jQuery('#zoomInBtn', this.shadowRoot).on('click', function() { me.zoomIn(); });
        jQuery('#zoomOutBtn', this.shadowRoot).on('click', function() { me.zoomOut(); });
        jQuery('#zoomResetBtn', this.shadowRoot).on('click', function() { me.zoomReset(); });
jQuery('#panToggleBtn', this.shadowRoot).on('click', function() {
    me.panMode = !me.panMode;
    const btn = jQuery(this);
    btn.blur(); // снимаем фокус с кнопки
    if (me.panMode) {
        btn.addClass('active');
        me.wrapper.css('cursor', 'grab');
        me.activeCanvas.css('cursor', 'grab');
        me.showToast('✋ Режим перемещения');
    } else {
        btn.removeClass('active');
        me.setCursor();
        me.activeCanvas.css('cursor', 'default');
        me.showToast('🖌️ Режим рисования');
    }
});
        
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
    const btn = jQuery(this);
    btn.toggleClass('active');
    btn.blur();
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
    
    // ОЧИЩАЕМ ПАЛИТРУ ПЕРЕД ПЕРЕСОЗДАНИЕМ
    palette.empty();
    
    let i=0;
    let className='';
    let me = this; // ← ВАЖНО: сохраняем this
    
    // === ЦИКЛ ДЛЯ ЦВЕТОВ (ОБЫЧНАЯ ПАЛИТРА) ===
    for (let value of this.paletteColors)
    {
        className='';
        if (i==(this.paletteColors.length-1)) className="eraser";
        
                   let colorDiv;
        if (className === 'eraser') {
            // Ластик – используем эмодзи вместо иконки
            colorDiv = jQuery(`<div class="paletteColor ${className} color${i}" style="background-color:${value};display:flex;align-items:center;justify-content:center;font-size:18px;color:#ff4444;">🧹</div>`).data('color',i);
        } else {
            colorDiv = jQuery(`<div class="paletteColor ${className} color${i}" style="background-color:${value};"><i class="material-icons"></i></div>`).data('color',i);
        }
        
        // Обработчик клика с учётом ластика
        colorDiv.on('click', function(){
            const clickedColor = jQuery(this).data('color');
            const isEraser = jQuery(this).hasClass('eraser');
            
            if (isEraser) {
                // Если ластик уже выбран, переключаемся на предыдущий цвет
                if (me.color === clickedColor) {
                    // Возвращаемся к последнему не-ластику, если он есть, иначе к первому цвету (0)
                    let prevColor = me.lastNonEraserColor !== undefined ? me.lastNonEraserColor : 0;
                    // Убедимся, что prevColor не ластик (на случай, если lastNonEraserColor = индекс ластика)
                    if (prevColor === me.paletteColors.length - 1) {
                        prevColor = 0;
                    }
                    me.color = prevColor;
                    me.setCursor();
                    jQuery(this).parent().children().removeClass('selected');
                    jQuery(`.paletteColor.color${me.color}`, me.shadowRoot).addClass('selected');
                    // Не обновляем lastNonEraserColor, так как мы переключились на цвет
                } else {
                    // Выбираем ластик, запоминаем текущий цвет как предыдущий
                    me.lastNonEraserColor = me.color;
                    me.color = clickedColor;
                    me.setCursor();
                    jQuery(this).parent().children().removeClass('selected');
                    jQuery(this).addClass('selected');
                }
            } else {
                // Обычный цвет
                me.color = clickedColor;
                me.setCursor();
                jQuery(this).parent().children().removeClass('selected');
                jQuery(this).addClass('selected');
                // Запоминаем как последний не-ластик
                me.lastNonEraserColor = clickedColor;
            }
        }).appendTo(palette);
        i++;
    }

    // === ПИПЕТКА ===
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

    // === КНОПКА ПРОДВИНУТОЙ ПАЛИТРЫ ===
    jQuery(`<div class="advancedPickerButton tool-btn" style="width:28px;height:28px;border-radius:50%;border:2px solid rgba(168,85,247,0.3);background:linear-gradient(135deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:0;line-height:0;flex-shrink:0;transition:all 0.2s ease;margin-left:4px;" title="Продвинутая палитра"><i class="material-icons" style="font-size:16px;line-height:1;color:white;text-shadow:0 0 4px rgba(0,0,0,0.5);">gradient</i></div>`)
        .appendTo(palette)
        .on('click', function() {
            me.openAdvancedPicker();
        });

    // === КНОПКА УДАЛЕНИЯ ЦВЕТА ===
    jQuery(`<div class="deleteColorButton tool-btn" style="width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,0,0,0.3);background:rgba(255,0,0,0.12);color:#ff4444;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:0;line-height:0;flex-shrink:0;transition:all 0.2s ease;margin-left:4px;" title="Удалить цвет из палитры"><i class="material-icons" style="font-size:16px;line-height:1;">close</i></div>`)
        .appendTo(palette)
        .on('click', function() {
            me.deleteColorMode = !me.deleteColorMode;
            jQuery(this).toggleClass('active');
            if (me.deleteColorMode) {
                jQuery(this).css({
                    'background': 'rgba(255,0,0,0.3)',
                    'border-color': '#ff0000',
                    'transform': 'scale(1.1)'
                });
                jQuery('.paletteColor', me.shadowRoot).each(function() {
                    if (!jQuery(this).hasClass('eraser')) {
                        jQuery(this).css({
                            'cursor': 'pointer',
                            'box-shadow': '0 0 15px rgba(255,0,0,0.3)',
                            'border-color': 'rgba(255,0,0,0.5)'
                        });
                    }
                });
                me.showToast('👆 Нажмите на цвет, чтобы удалить его из палитры');
            } else {
                jQuery(this).css({
                    'background': 'rgba(255,0,0,0.12)',
                    'border-color': 'rgba(255,0,0,0.3)',
                    'transform': 'scale(1)'
                });
                jQuery('.paletteColor', me.shadowRoot).css({
                    'cursor': '',
                    'box-shadow': '',
                    'border-color': ''
                });
            }
        });

    // === КНОПКА ВЫБОРА КИСТЕЙ ===
    jQuery(`<div class="brushSelectorButton tool-btn" style="width:28px;height:28px;border-radius:50%;border:2px solid rgba(168,85,247,0.3);background:rgba(168,85,247,0.15);color:#f0eaff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:0;line-height:0;flex-shrink:0;transition:all 0.2s ease;margin-left:4px;position:relative;" title="Выбор кисти"><i class="material-icons" style="font-size:16px;line-height:1;">brush</i></div>`)
        .appendTo(palette)
        .on('click', function(e) {
            e.stopPropagation();
            me.toggleBrushMenu();
        });

    // === ОБРАБОТЧИК УДАЛЕНИЯ ЦВЕТА ===
    palette.off('click.deleteColor').on('click.deleteColor', '.paletteColor:not(.eraser)', function(e) {
        if (!me.deleteColorMode) return;
        
        const colorElement = jQuery(this);
        const colorIndex = colorElement.data('color');
        
        if (me.paletteColors.length <= 2) {
            me.showToast('⚠️ Должен остаться хотя бы один цвет!');
            return;
        }
        
        me.paletteColors.splice(colorIndex, 1);
        me.generatePalette();
        me.deleteColorMode = false;
        jQuery('.deleteColorButton', me.shadowRoot).removeClass('active').css({
            'background': 'rgba(255,0,0,0.12)',
            'border-color': 'rgba(255,0,0,0.3)',
            'transform': 'scale(1)'
        });
        
        if (me.color >= me.paletteColors.length - 1) {
            me.color = 0;
        }
        jQuery('.paletteColor', me.shadowRoot).removeClass('selected');
        jQuery(`.paletteColor.color${me.color}`, me.shadowRoot).addClass('selected');
        me.setCursor();
        me.showToast('🗑️ Цвет удалён!');
    });

    // Стили
    jQuery('<style>.eyedropperButton.active { border-color: #a855f7 !important; transform: scale(1.2) !important; box-shadow: 0 0 20px rgba(168, 85, 247, 0.4) !important; } .advancedPickerButton:hover { transform: scale(1.15) !important; border-color: #a855f7 !important; } .deleteColorButton:hover { transform: scale(1.15) !important; border-color: #ff0000 !important; } .deleteColorButton.active { background: rgba(255,0,0,0.3) !important; border-color: #ff0000 !important; transform: scale(1.1) !important; } .brushSelectorButton:hover { transform: scale(1.15) !important; border-color: #a855f7 !important; } .brushSelectorButton.active { background: #a855f7 !important; border-color: #a855f7 !important; }</style>').appendTo(this.shadowRoot);
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
        
        this.activeCanvas.on('mousedown', function(e) {
    if (me.panMode) {
        me.panStart(e);
        return;
    }
    me.mouseDown(e);
})
.on('mouseup', function(e) {
    if (me.panMode) {
        me.panEnd(e);
        return;
    }
    me.mouseUp(e);
})
.on('mousemove', function(e) {
    if (me.panMode) {
        me.panMove(e);
        return;
    }
    me.mouseMove(e);
})
.on('click', function(e) {
    if (me.panMode) return; // в режиме панорамирования клик не нужен
    me.handleCanvasClick(e);
})
.on('touchstart', function(e) {
    if (me.panMode) {
        me.panStart(e.originalEvent);
        return;
    }
    return me.touchStart(e);
})
.on('touchend', function(e) {
    if (me.panMode) {
        me.panEnd(e.originalEvent);
        return;
    }
    return me.touchEnd(e);
})
.on('touchmove', function(e) {
    if (me.panMode) {
        me.panMove(e.originalEvent);
        return;
    }
    return me.touchMove(e);
})
.on('touchcancel', function(e) {
    if (me.panMode) {
        me.panDragging = false;
        return;
    }
    me.dragging = false;
});

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
     if (this.panMode) {
        this.panStart(oe.originalEvent);
        return;
    }
    
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
{  if (this.panMode) {
        this.panEnd(oe.originalEvent);
        return;
    }
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
{    if (this.panMode) {
        this.panMove(oe.originalEvent);
        return;
    }
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
    pos.brush = this.brushType || 'solid'; 
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

drawActivePath(saveToCanvas=false)
{
    this.clearActivePath();
    let ctx;
    let path=this.paths[this.paths.length-1];
    if (saveToCanvas==true || path[0].c==(this.paletteColors.length-1)) {ctx=this.ctx;} 
        else {ctx=this.activeCtx;}

    if (!path[0].c) {  path[0].c=0;}
    
    const brushType = path[0].brush || this.brushType || 'solid';
    const color = this.paletteColors[path[0].c];
    const lineWidth = path[0].s * (this.img[0].naturalWidth/this.img.width());
    
    ctx.save();
    
    if (path[0].c==(this.paletteColors.length-1)) {
        ctx.globalCompositeOperation="destination-out";
        ctx.strokeStyle = `white`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = lineWidth;
    } else {
        ctx.globalCompositeOperation="source-over";
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        switch(brushType) {
            case 'solid':
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1.0;
                break;
                
            case 'soft':
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth * 2.5;
                ctx.shadowColor = color;
                ctx.shadowBlur = lineWidth * 4;
                ctx.globalAlpha = 0.4;
                break;
                
            case 'sparkle':
                // Блёстки - обычная кисть + разноцветные звёздочки
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth * 1.2;
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1.0;
                break;
                
            case 'texture':
                // Текстура - обычная кисть с текстурным эффектом
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth * 1.3;
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 0.85;
                // Имитация текстуры через неровную линию (маленький dash)
                ctx.setLineDash([2, 1]);
                ctx.lineCap = 'butt';
                break;
                
            case 'dotted':
                // Пунктир - точки без свечения
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth * 0.6;
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1.0;
                ctx.setLineDash([2, 8]);
                ctx.lineCap = 'round';
                break;
                
case 'outline':
    // Обводка - белая сердцевина + цветной контур
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = lineWidth * 20;
    ctx.globalAlpha = 1.0;
    break;

case 'simple':
    // Простая - чуть больше и прозрачнее, чем твёрдая
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * 1.3;  // ← чуть больше
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.85;           // ← чуть прозрачнее
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    break;
case 'neon':
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * 1.5;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    break;
                
            case 'rainbow':
                const lastPoint = path[path.length-1];
                const gradient = ctx.createLinearGradient(path[0].x, path[0].y, lastPoint.x, lastPoint.y);
                gradient.addColorStop(0, '#ff0000');
                gradient.addColorStop(0.17, '#ff8800');
                gradient.addColorStop(0.33, '#ffff00');
                gradient.addColorStop(0.5, '#00ff00');
                gradient.addColorStop(0.67, '#0088ff');
                gradient.addColorStop(0.83, '#8800ff');
                gradient.addColorStop(1, '#ff00ff');
                ctx.strokeStyle = gradient;
                ctx.lineWidth = lineWidth * 1.5;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = lineWidth * 2;
                ctx.globalAlpha = 1.0;
                break;
                
            default:
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
        }
    }

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let j=1; j<path.length; ++j)
        ctx.lineTo(path[j].x, path[j].y);
ctx.stroke();

/// ===== НЕОН через filter: blur() =====
if (brushType === 'neon' && path[0].c != (this.paletteColors.length-1)) {
    const neonColor = color;
    const neonWidth = lineWidth;
    
    ctx.save();
    
    // 1. Большой ореол - сильно размытый
    ctx.filter = `blur(${neonWidth * 0.8}px)`;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = neonWidth * 4;
    ctx.strokeStyle = neonColor;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let j=1; j<path.length; ++j)
        ctx.lineTo(path[j].x, path[j].y);
    ctx.stroke();
    
    // 2. Средний ореол
    ctx.filter = `blur(${neonWidth * 0.3}px)`;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = neonWidth * 2;
    ctx.strokeStyle = neonColor;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let j=1; j<path.length; ++j)
        ctx.lineTo(path[j].x, path[j].y);
    ctx.stroke();
    
    ctx.restore();
}
// ===== КОНЕЦ =====

   // ===== ДОПОЛНИТЕЛЬНЫЙ ПРОХОД ДЛЯ ОБВОДКИ =====
if (brushType === 'outline' && path[0].c != (this.paletteColors.length-1)) {
    // Чёткая линия поверх для яркости
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = lineWidth * 0.6;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let j=1; j<path.length; ++j)
        ctx.lineTo(path[j].x, path[j].y);
    ctx.stroke();
    
    // Цветная линия чуть толще
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = lineWidth * 0.8;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let j=1; j<path.length; ++j)
        ctx.lineTo(path[j].x, path[j].y);
    ctx.stroke();
}
// ===== КОНЕЦ =====
    
    ctx.restore();
    
    // ===== ДОПОЛНИТЕЛЬНЫЙ ПРОХОД ДЛЯ БЛЁСТОК =====
if (brushType === 'sparkle' && path[0].c != (this.paletteColors.length-1)) {
    // Рисуем звёздочки с хаотичным разбросом
    const sparkleColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff', '#ff00ff'];
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    
    // Проходим по точкам пути и рисуем звёздочки
    for (let j = 0; j < path.length; j += 3) {
        if (j % 2 === 0) {
            const point = path[j];
            const sparkleColor = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
            const size = lineWidth * (0.2 + Math.random() * 0.8);
            
            // ===== ХАОТИЧНОЕ СМЕЩЕНИЕ =====
            const offsetX = (Math.random() - 0.5) * lineWidth * 2.5;
            const offsetY = (Math.random() - 0.5) * lineWidth * 2.5;
            // ===== КОНЕЦ =====
            
            // Рисуем звезду как 4-конечную звезду
            ctx.translate(point.x + offsetX, point.y + offsetY);
            ctx.fillStyle = sparkleColor;
            ctx.shadowColor = sparkleColor;
            ctx.shadowBlur = size * 2;
            
            // Рисуем крестик (звёздочка)
            const half = size / 2;
            ctx.beginPath();
            ctx.moveTo(-half, 0);
            ctx.lineTo(0, -half);
            ctx.lineTo(half, 0);
            ctx.lineTo(0, half);
            ctx.closePath();
            ctx.fill();
            
            // Второй крестик под углом 45 градусов
            ctx.beginPath();
            const rotHalf = half * 0.7;
            ctx.moveTo(-rotHalf, -rotHalf);
            ctx.lineTo(rotHalf, rotHalf);
            ctx.moveTo(rotHalf, -rotHalf);
            ctx.lineTo(-rotHalf, rotHalf);
            ctx.strokeStyle = sparkleColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
    ctx.restore();
}
// ===== КОНЕЦ ДОПОЛНИТЕЛЬНОГО ПРОХОДА =====
    
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
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
        
        const brushType = path[0].brush || this.brushType || 'solid';
        const color = this.paletteColors[path[0].c];
        const lineWidth = path[0].s * (this.img[0].naturalWidth/this.img.width());
        
        ctx.save();
        
        if (path[0].c==(this.paletteColors.length-1)) {
            ctx.globalCompositeOperation="destination-out";
            ctx.strokeStyle = `white`;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = lineWidth;
        } else {
            ctx.globalCompositeOperation="source-over";
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            switch(brushType) {
                case 'solid':
                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth;
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1.0;
                    break;
                    
                case 'soft':
                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth * 2.5;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = lineWidth * 4;
                    ctx.globalAlpha = 0.4;
                    break;
                    
                case 'sparkle':
                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth * 1.2;
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1.0;
                    break;
                    
                case 'texture':
                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth * 1.3;
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 0.85;
                    ctx.setLineDash([2, 1]);
                    ctx.lineCap = 'butt';
                    break;
                    
                case 'dotted':
                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth * 0.6;
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = 1.0;
                    ctx.setLineDash([2, 8]);
                    ctx.lineCap = 'round';
                    break;
                    
case 'outline':
    // Обводка - белая сердцевина + цветной контур
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = lineWidth * 20;
    ctx.globalAlpha = 1.0;
    break;

case 'simple':
    // Простая - чуть больше и прозрачнее, чем твёрдая
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * 1.3;  // ← чуть больше
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.85;           // ← чуть прозрачнее
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    break;
case 'neon':
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * 1.5;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    break;

                    
                case 'rainbow':
                    const lastPoint = path[path.length-1];
                    const gradient = ctx.createLinearGradient(path[0].x, path[0].y, lastPoint.x, lastPoint.y);
                    gradient.addColorStop(0, '#ff0000');
                    gradient.addColorStop(0.17, '#ff8800');
                    gradient.addColorStop(0.33, '#ffff00');
                    gradient.addColorStop(0.5, '#00ff00');
                    gradient.addColorStop(0.67, '#0088ff');
                    gradient.addColorStop(0.83, '#8800ff');
                    gradient.addColorStop(1, '#ff00ff');
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = lineWidth * 1.5;
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = lineWidth * 2;
                    ctx.globalAlpha = 1.0;
                    break;
                    
                default:
                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth;
            }
        }
        
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let j=1; j<path.length; ++j)
            ctx.lineTo(path[j].x, path[j].y);
      ctx.stroke();
// ===== НЕОН через filter: blur() =====
if (brushType === 'neon' && path[0].c != (this.paletteColors.length-1)) {
    const neonColor = color;
    const neonWidth = lineWidth;
    
    ctx.save();
    
    // 1. Большой ореол - сильно размытый
    ctx.filter = `blur(${neonWidth * 0.8}px)`;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = neonWidth * 4;
    ctx.strokeStyle = neonColor;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let j=1; j<path.length; ++j)
        ctx.lineTo(path[j].x, path[j].y);
    ctx.stroke();
    
    // 2. Средний ореол
    ctx.filter = `blur(${neonWidth * 0.3}px)`;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = neonWidth * 2;
    ctx.strokeStyle = neonColor;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let j=1; j<path.length; ++j)
        ctx.lineTo(path[j].x, path[j].y);
    ctx.stroke();
    
    ctx.restore();
}
// ===== КОНЕЦ =====

        // ===== ДОПОЛНИТЕЛЬНЫЙ ПРОХОД ДЛЯ ОБВОДКИ =====
if (brushType === 'outline' && path[0].c != (this.paletteColors.length-1)) {
    // Чёткая линия поверх для яркости
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = lineWidth * 0.6;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let j=1; j<path.length; ++j)
        ctx.lineTo(path[j].x, path[j].y);
    ctx.stroke();
    
    // Цветная линия чуть толще
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = lineWidth * 0.8;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let j=1; j<path.length; ++j)
        ctx.lineTo(path[j].x, path[j].y);
    ctx.stroke();
}
// ===== КОНЕЦ =====
    
    ctx.restore();
        
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        
       // ===== ДОПОЛНИТЕЛЬНЫЙ ПРОХОД ДЛЯ БЛЁСТОК =====
if (brushType === 'sparkle' && path[0].c != (this.paletteColors.length-1)) {
    // Рисуем звёздочки с хаотичным разбросом
    const sparkleColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff', '#ff00ff'];
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    
    // Проходим по точкам пути и рисуем звёздочки
    for (let j = 0; j < path.length; j += 3) {
        if (j % 2 === 0) {
            const point = path[j];
            const sparkleColor = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
            const size = lineWidth * (0.2 + Math.random() * 0.8);
            
            // ===== ХАОТИЧНОЕ СМЕЩЕНИЕ =====
            const offsetX = (Math.random() - 0.5) * lineWidth * 2.5;
            const offsetY = (Math.random() - 0.5) * lineWidth * 2.5;
            // ===== КОНЕЦ =====
            
            // Рисуем звезду как 4-конечную звезду
            ctx.translate(point.x + offsetX, point.y + offsetY);
            ctx.fillStyle = sparkleColor;
            ctx.shadowColor = sparkleColor;
            ctx.shadowBlur = size * 2;
            
            // Рисуем крестик (звёздочка)
            const half = size / 2;
            ctx.beginPath();
            ctx.moveTo(-half, 0);
            ctx.lineTo(0, -half);
            ctx.lineTo(half, 0);
            ctx.lineTo(0, half);
            ctx.closePath();
            ctx.fill();
            
            // Второй крестик под углом 45 градусов
            ctx.beginPath();
            const rotHalf = half * 0.7;
            ctx.moveTo(-rotHalf, -rotHalf);
            ctx.lineTo(rotHalf, rotHalf);
            ctx.moveTo(rotHalf, -rotHalf);
            ctx.lineTo(-rotHalf, rotHalf);
            ctx.strokeStyle = sparkleColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
    ctx.restore();
}
// ===== КОНЕЦ ДОПОЛНИТЕЛЬНОГО ПРОХОДА =====
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
    this.panX = 0;
    this.panY = 0;
    this.applyZoom();
}
    
applyZoom() {
      this.canvasContainer.css('will-change', 'transform');
    const percent = Math.round(this.zoomLevel * 100);
    this.canvasContainer.css({
        'transform': `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`,
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

setCursor()
{
    let size = this.sizer.val();
    if (size < 2) size=2;
    if (size > 32) size=32;
    let canvas=jQuery(`<canvas height="32" width="32"/>`);
    let context = canvas[0].getContext('2d');

    const centerX = 16;
    const centerY = 16;
    const radius = size/2;
    const color = this.paletteColors[this.color] || '#ffffff';
    
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    
    switch(this.brushType) {
        case 'soft':
            context.fillStyle = color;
            context.fill();
            context.shadowColor = color;
            context.shadowBlur = 20;
            context.globalAlpha = 0.4;
            context.beginPath();
            context.arc(centerX, centerY, radius * 1.5, 0, 2 * Math.PI);
            context.fill();
            break;
            
        case 'sparkle':
            context.fillStyle = color;
            context.fill();
            // Рисуем звёздочки
            const sparkleColors = ['#ff0000', '#ffff00', '#00ff00', '#0088ff', '#ff00ff'];
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const dist = radius * 1.3;
                const x = centerX + Math.cos(angle) * dist;
                const y = centerY + Math.sin(angle) * dist;
                const s = 2 + Math.random() * 2;
                context.fillStyle = sparkleColors[i % sparkleColors.length];
                context.shadowColor = sparkleColors[i % sparkleColors.length];
                context.shadowBlur = 5;
                context.beginPath();
                context.arc(x, y, s, 0, Math.PI * 2);
                context.fill();
            }
            break;
            
        case 'texture':
            context.fillStyle = color;
            context.fill();
            // Текстурный узор
            for (let i = 0; i < 8; i++) {
                const x = Math.random() * 32;
                const y = Math.random() * 32;
                context.fillStyle = color;
                context.globalAlpha = 0.3 + Math.random() * 0.3;
                context.fillRect(x, y, 2, 2);
            }
            break;
            
        case 'dotted':
            context.fillStyle = color;
            context.fill();
            context.globalAlpha = 1;
            context.shadowBlur = 0;
            // Пунктирный круг
            context.setLineDash([2, 4]);
            context.strokeStyle = color;
            context.lineWidth = 2;
            context.beginPath();
            context.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
            context.stroke();
            break;
case 'simple':
    // Простая - чуть больше и прозрачнее
    context.globalAlpha = 0.85;
    context.fillStyle = color;
    context.shadowBlur = 0;
    context.beginPath();
    context.arc(centerX, centerY, radius * 1.1, 0, Math.PI * 2);
    context.fill();
    break;
   case 'neon':
    // Неон с размытием
    context.shadowBlur = 0;
    context.globalAlpha = 1.0;
    
    // Сначала рисуем размытый ореол
    const grad = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2.5);
    grad.addColorStop(0, color);
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, 'transparent');
    context.filter = `blur(${radius * 0.5}px)`;
    context.beginPath();
    context.arc(centerX, centerY, radius * 2.5, 0, Math.PI * 2);
    context.fillStyle = grad;
    context.fill();
    
    // Яркая сердцевина
    context.filter = 'none';
    context.beginPath();
    context.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
    context.fillStyle = '#ffffff';
    context.fill();
    
    context.beginPath();
    context.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    break;
            
        case 'rainbow':
            const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.17, '#ff8800');
            gradient.addColorStop(0.33, '#ffff00');
            gradient.addColorStop(0.5, '#00ff00');
            gradient.addColorStop(0.67, '#0088ff');
            gradient.addColorStop(0.83, '#8800ff');
            gradient.addColorStop(1, '#ff00ff');
            context.fillStyle = gradient;
            context.shadowBlur = 0;
            context.fill();
            break;
            
        default: // solid
            context.fillStyle = color;
            context.fill();
            context.shadowBlur = 0;
    }
    
    context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    context.lineWidth = 1;
    context.globalAlpha = 1;
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(0, centerY);
    context.lineTo(32, centerY);
    context.moveTo(centerX, 0);
    context.lineTo(centerX, 32);
    context.stroke();
    
    let url=canvas[0].toDataURL();
    this.wrapper.css('cursor', `url(${url}) 16 16, pointer`);
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
// ===== ОТКРЫТЬ ПРОДВИНУТУЮ ПАЛИТРУ =====
openAdvancedPicker()
{
    let me = this;
    
    // Создаём модальное окно с палитрой
    const modal = jQuery(`
        <div class="advancedPickerModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            backdrop-filter: blur(8px);
            animation: fadeIn 0.3s ease;
        ">
            <div class="advancedPickerContent" style="
                background: rgba(20, 20, 40, 0.95);
                border-radius: 20px;
                padding: 24px;
                max-width: 380px;
                width: 90%;
                border: 1px solid rgba(168, 85, 247, 0.3);
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                position: relative;
            ">
               <button class="pickerClose" id="pickerCloseBtn" style="
    position: absolute;
    top: 12px;
    right: 16px;
    background: none;
    border: none;
    color: #888;
    font-size: 24px;
    cursor: pointer;
    transition: color 0.2s;
    z-index: 10;
">✖</button>
                
                <h3 style="
                    color: #f0eaff;
                    margin: 0 0 16px 0;
                    font-size: 18px;
                    text-align: center;
                ">🎨 Выберите цвет</h3>
                
                <div class="pickerPreview" style="
                    width: 100%;
                    height: 50px;
                    border-radius: 12px;
                    margin-bottom: 16px;
                    border: 2px solid rgba(255,255,255,0.1);
                    transition: background 0.1s;
                "></div>
                
                <div class="pickerHue" style="
                    width: 100%;
                    height: 24px;
                    border-radius: 12px;
                    background: linear-gradient(to right, 
                        #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000
                    );
                    margin-bottom: 12px;
                    cursor: pointer;
                    position: relative;
                    border: 1px solid rgba(255,255,255,0.1);
                ">
                    <div class="hueIndicator" style="
                        position: absolute;
                        top: -4px;
                        width: 4px;
                        height: 32px;
                        background: white;
                        border-radius: 2px;
                        box-shadow: 0 0 10px rgba(255,255,255,0.5);
                        pointer-events: none;
                    "></div>
                </div>
                
                <div class="pickerSaturation" style="
                    width: 100%;
                    height: 120px;
                    border-radius: 12px;
                    margin-bottom: 16px;
                    cursor: pointer;
                    position: relative;
                    border: 1px solid rgba(255,255,255,0.1);
                ">
                    <div class="satIndicator" style="
                        position: absolute;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 0 10px rgba(0,0,0,0.5);
                        pointer-events: none;
                        transform: translate(-50%, -50%);
                    "></div>
                </div>
                
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <input type="text" class="hexInput" value="#ffffff" style="
                        flex: 1;
                        padding: 8px 12px;
                        border-radius: 8px;
                        border: 1px solid rgba(255,255,255,0.1);
                        background: rgba(255,255,255,0.05);
                        color: #f0eaff;
                        font-size: 14px;
                        font-family: monospace;
                        text-transform: uppercase;
                    ">
                    <input type="color" class="nativePicker" value="#ffffff" style="
                        width: 40px;
                        height: 40px;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        background: none;
                    ">
                </div>
                
                <div style="display: flex; gap: 8px;">
                    <button class="pickerAdd" style="
                        flex: 1;
                        padding: 10px;
                        border-radius: 10px;
                        border: none;
                        background: linear-gradient(135deg, #a855f7, #7c3aed);
                        color: white;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s;
                    ">➕ Добавить</button>
                    <button class="pickerSelect" style="
                        flex: 1;
                        padding: 10px;
                        border-radius: 10px;
                        border: none;
                        background: linear-gradient(135deg, #22c55e, #16a34a);
                        color: white;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s;
                    ">✅ Выбрать</button>
                </div>
            </div>
        </div>
    `).appendTo('body');

    // Переменные состояния
    let currentColor = '#ffffff';
    let hue = 0;
    let sat = 100;
    let light = 50;
    let isHueDragging = false;
    let isSatDragging = false;

    const preview = modal.find('.pickerPreview');
    const hueEl = modal.find('.pickerHue');
    const satEl = modal.find('.pickerSaturation');
    const hueIndicator = modal.find('.hueIndicator');
    const satIndicator = modal.find('.satIndicator');
    const hexInput = modal.find('.hexInput');
    const nativePicker = modal.find('.nativePicker');

    // ===== ДОБАВЛЯЕМ ФУНКЦИЮ ПРЕОБРАЗОВАНИЯ HEX В RGB =====
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    // ===== КОНЕЦ =====

    // Обновить цвет
    function updateColor(h, s, l) {
        currentColor = hslToHex(h, s, l);
        preview.css('background', currentColor);
        hexInput.val(currentColor.toUpperCase());
        nativePicker.val(currentColor);
        
        // Обновляем фон насыщенности
        satEl.css('background', `linear-gradient(to right, 
            hsl(${h}, 0%, ${l}%), 
            hsl(${h}, 100%, ${l}%)
        )`);
    }

    // HSL в HEX
    function hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
        const toHex = x => Math.round(255 * f(x)).toString(16).padStart(2, '0');
        return `#${toHex(0)}${toHex(8)}${toHex(4)}`;
    }

    // HEX в HSL
    function hexToHsl(hex) {
        const r = parseInt(hex.slice(1,3), 16) / 255;
        const g = parseInt(hex.slice(3,5), 16) / 255;
        const b = parseInt(hex.slice(5,7), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    // Получить цвет по позиции мыши на насыщенности
    function getSatColor(e) {
        const rect = satEl[0].getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        sat = Math.round(x * 100);
        light = Math.round((1 - y) * 100);
        updateColor(hue, sat, light);
        satIndicator.css({
            left: x * 100 + '%',
            top: (1 - y) * 100 + '%'
        });
    }

    // Инициализация
    updateColor(0, 100, 50);

    // События для hue
    hueEl.on('mousedown', function(e) {
        isHueDragging = true;
        const rect = this.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        hue = Math.round(x * 360);
        updateColor(hue, sat, light);
        hueIndicator.css('left', x * 100 + '%');
    });

    $(document).on('mousemove', function(e) {
        if (isHueDragging) {
            const rect = hueEl[0].getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            hue = Math.round(x * 360);
            updateColor(hue, sat, light);
            hueIndicator.css('left', x * 100 + '%');
        }
        if (isSatDragging) {
            getSatColor(e);
        }
    });

    $(document).on('mouseup', function() {
        isHueDragging = false;
        isSatDragging = false;
    });

    // События для насыщенности
    satEl.on('mousedown', function(e) {
        isSatDragging = true;
        getSatColor(e);
    });

    // Touch события для мобильных
    hueEl.on('touchstart', function(e) {
        const touch = e.originalEvent.touches[0];
        const rect = this.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
        hue = Math.round(x * 360);
        updateColor(hue, sat, light);
        hueIndicator.css('left', x * 100 + '%');
    });

    satEl.on('touchstart', function(e) {
        const touch = e.originalEvent.touches[0];
        const rect = this.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
        sat = Math.round(x * 100);
        light = Math.round((1 - y) * 100);
        updateColor(hue, sat, light);
        satIndicator.css({
            left: x * 100 + '%',
            top: (1 - y) * 100 + '%'
        });
    });

    // Ввод hex
    hexInput.on('input', function() {
        let val = this.value.trim();
        if (/^#?[0-9a-f]{6}$/i.test(val.replace('#', ''))) {
            if (!val.startsWith('#')) val = '#' + val;
            const hsl = hexToHsl(val);
            hue = hsl.h;
            sat = hsl.s;
            light = hsl.l;
            updateColor(hue, sat, light);
            hueIndicator.css('left', (hue / 360) * 100 + '%');
            satIndicator.css({
                left: (sat / 100) * 100 + '%',
                top: (1 - light / 100) * 100 + '%'
            });
        }
    });

    // Native picker
    nativePicker.on('input', function() {
        const hsl = hexToHsl(this.value);
        hue = hsl.h;
        sat = hsl.s;
        light = hsl.l;
        updateColor(hue, sat, light);
        hueIndicator.css('left', (hue / 360) * 100 + '%');
        satIndicator.css({
            left: (sat / 100) * 100 + '%',
            top: (1 - light / 100) * 100 + '%'
        });
    });

    // ===== ОБНОВЛЁННЫЕ ОБРАБОТЧИКИ =====
    // Кнопка "Выбрать" - выбирает цвет и закрывает палитру
    modal.find('.pickerSelect').on('click', function() {
        const rgb = hexToRgb(currentColor);
        if (!rgb) {
            me.showToast('⚠️ Некорректный цвет');
            return;
        }
        const rgbaColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
        
        let colorExists = false;
        let existingIndex = -1;
        for (let i = 0; i < me.paletteColors.length - 1; i++) {
            if (me.paletteColors[i] === rgbaColor) {
                colorExists = true;
                existingIndex = i;
                break;
            }
        }
        
        if (!colorExists) {
            const colorIndex = me.paletteColors.length - 1;
            me.paletteColors.splice(colorIndex, 0, rgbaColor);
            existingIndex = colorIndex;
        }
        
        me.generatePalette();
        me.color = existingIndex;
        jQuery('.paletteColor', me.shadowRoot).removeClass('selected');
        jQuery(`.paletteColor.color${existingIndex}`, me.shadowRoot).addClass('selected');
        me.setCursor();
        modal.remove();
        me.showToast('✅ Цвет выбран!');
    });

    // Кнопка "Добавить" - добавляет цвет в палитру, НЕ закрывает окно
    modal.find('.pickerAdd').on('click', function() {
        const rgb = hexToRgb(currentColor);
        if (!rgb) {
            me.showToast('⚠️ Некорректный цвет');
            return;
        }
        const rgbaColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
        
        let colorExists = false;
        for (let i = 0; i < me.paletteColors.length - 1; i++) {
            if (me.paletteColors[i] === rgbaColor) {
                colorExists = true;
                break;
            }
        }
        
        if (!colorExists) {
            const colorIndex = me.paletteColors.length - 1;
            me.paletteColors.splice(colorIndex, 0, rgbaColor);
            me.generatePalette();
            me.showToast('✅ Цвет добавлен в палитру!');
        } else {
            me.showToast('⚠️ Этот цвет уже есть в палитре!');
        }
    });
    // ===== КОНЕЦ =====

    // Закрытие по кнопке ✖
    modal.find('.pickerClose').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        modal.remove();
    });

    // Закрытие по клику на фон
    modal.on('click', function(e) {
        if (e.target === this) {
            modal.remove();
        }
    });

    // Закрытие по клавише ESC
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (modal.is(':visible')) {
                modal.remove();
            }
        }
    });

    // Добавляем анимацию
    jQuery('<style>@keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }</style>').appendTo('head');
}

// ===== TOAST ДЛЯ COLORING.JS =====
showToast(message)
{
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.85);
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 16px;
        z-index: 999999;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.1);
        animation: toastFadeIn 0.3s ease;
        white-space: nowrap;
        max-width: 90%;
        overflow: hidden;
        text-overflow: ellipsis;
        pointer-events: none;
    `;
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
}

// ===== ПОКАЗАТЬ МОДАЛКУ ДЛЯ ОТКРЫТИЯ КИСТИ =====
showBrushUnlockModal(brushId)
{
    const brushName = this.getBrushName(brushId);
    const brushIcon = this.getBrushIcon(brushId);
    
    // Проверяем, существует ли глобальная функция openUnlockModal
    if (typeof openUnlockModal === 'function') {
        // Используем существующую модалку unlockModal
        const modal = document.getElementById('unlockModal');
        if (!modal) {
            this.showToast('⚠️ Модалка не найдена');
            return;
        }
        
        const title = modal.querySelector('.modal-header h2');
        const body = modal.querySelector('.modal-body');
        
        if (title) title.textContent = '🔓 Открыть кисть';
        if (body) {
            body.innerHTML = `
                <div style="text-align:center;padding:10px 0;">
                    <div style="font-size:48px;margin-bottom:10px;">${brushIcon}</div>
                    <p style="font-size:18px;color:var(--text-primary);margin-bottom:8px;">
                        Кисть <strong>«${brushName}»</strong>
                    </p>
                    <p style="font-size:15px;color:var(--text-secondary);margin-bottom:20px;">
                        Посмотрите рекламу, чтобы разблокировать эту кисть на <strong>24 часа</strong>! 🎬
                    </p>
                    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                        <button class="btn-neon" onclick="window._pendingBrushUnlock = '${brushId}'; window._pendingBrushUnlockFromColoring = true; watchAdForBrushUnlock();">🎬 Открыть</button>
                        <button class="btn-neon" onclick="closeUnlockModal();" style="background:rgba(255,0,0,0.1);border-color:#ef4444;">❌ Отмена</button>
                    </div>
                </div>
            `;
        }
        
        modal.classList.add('show');
        window._pendingBrushUnlock = brushId;
        window._pendingBrushUnlockFromColoring = true;
    } else {
        this.showToast(`🔒 Кисть «${brushName}» заблокирована!`);
    }
}

// ===== ПОЛУЧИТЬ НАЗВАНИЕ КИСТИ =====
getBrushName(brushId)
{
    const names = {
        simple: 'Простая',
        solid: 'Твёрдая',
        soft: 'Мягкая',
        texture: 'Текстура',
        dotted: 'Пунктир',
        outline: 'Обводка',
        neon: 'Неон',
        sparkle: 'Блёстки',
        rainbow: 'Радуга'
    };
    return names[brushId] || brushId;
}

// ===== ПОЛУЧИТЬ ИКОНКУ КИСТИ =====
getBrushIcon(brushId)
{
    const icons = {
        simple: '🖊️',
        solid: '✏️',
        soft: '🖌️',
        texture: '🌟',
        dotted: '▪️',
        outline: '🔲',
        neon: '💡',
        sparkle: '✨',
        rainbow: '🌈'
    };
    return icons[brushId] || '🖌️';
}

toggleBrushMenu()
{
    let me = this;
    
    const existingMenu = this.shadowRoot.querySelector('.brushMenu');
    if (existingMenu) {
        jQuery(existingMenu).remove();
        jQuery('.brushSelectorButton', this.shadowRoot).removeClass('active');
        return;
    }

    jQuery('.brushSelectorButton', this.shadowRoot).addClass('active');

    const brushes = [
        { id: 'simple', icon: '🖊️', name: 'Простая', defaultUnlocked: true },
        { id: 'solid', icon: '✏️', name: 'Твёрдая', defaultUnlocked: true },
        { id: 'soft', icon: '🖌️', name: 'Мягкая', defaultUnlocked: true },
        { id: 'texture', icon: '🌟', name: 'Текстура', defaultUnlocked: false },
        { id: 'dotted', icon: '▪️', name: 'Пунктир', defaultUnlocked: false },
        { id: 'outline', icon: '🔲', name: 'Обводка', defaultUnlocked: false },
        { id: 'neon', icon: '💡', name: 'Неон', defaultUnlocked: false },
        { id: 'sparkle', icon: '✨', name: 'Блёстки', defaultUnlocked: false },
        { id: 'rainbow', icon: '🌈', name: 'Радуга', defaultUnlocked: false }
    ];

    const menu = jQuery(`<div class="brushMenu" style="
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(20, 20, 40, 0.95);
        backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 8px;
        border: 1px solid rgba(168, 85, 247, 0.3);
        box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        z-index: 1000;
        min-width: 180px;
        animation: fadeIn 0.2s ease;
    ">`).appendTo(this.shadowRoot);

brushes.forEach(brush => {
    // ===== ПРОВЕРКА РАЗБЛОКИРОВАНА ЛИ КИСТЬ =====
    let isUnlocked = brush.defaultUnlocked || false;
    // Проверяем глобальное состояние, если функция доступна
    if (typeof isBrushUnlocked !== 'undefined') {
        isUnlocked = isBrushUnlocked(brush.id);
    }
    // ===== КОНЕЦ ПРОВЕРКИ =====
    
    const isActive = this.brushType === brush.id;
    const btn = jQuery(`<div class="brushOption" style="
        padding: 8px 6px;
        border-radius: 10px;
        cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};
        text-align: center;
        transition: all 0.2s ease;
        background: ${isActive ? 'rgba(168, 85, 247, 0.25)' : 'transparent'};
        border: 2px solid ${isActive ? '#a855f7' : 'transparent'};
        opacity: ${isUnlocked ? 1 : 0.4};
        ${!isUnlocked ? 'filter: grayscale(0.5);' : ''}
    ">`)
    .data('brush', brush.id)
    .appendTo(menu);
        
        // Если кисть заблокирована - добавляем замок
        const lockIcon = !isUnlocked ? '🔒' : '';

        jQuery(`<div style="font-size: 20px;">${brush.icon} ${lockIcon}</div>`).appendTo(btn);
        jQuery(`<div style="font-size: 10px; color: #f0eaff; margin-top: 2px;">${brush.name}</div>`).appendTo(btn);

       btn.on('click', function() {
    const brushId = jQuery(this).data('brush');
    
    // ===== ПРОВЕРЯЕМ РАЗБЛОКИРОВКУ =====
    let isUnlocked = brush.defaultUnlocked || false;
    if (typeof isBrushUnlocked !== 'undefined') {
        isUnlocked = isBrushUnlocked(brushId);
    }
    
    if (!isUnlocked) {
        // Показываем модалку открытия кисти
        if (typeof showBrushUnlockModal === 'function') {
            showBrushUnlockModal(brushId);
        } else if (typeof me.showBrushUnlockModal === 'function') {
            me.showBrushUnlockModal(brushId);
        } else {
            me.showToast('🔒 Кисть заблокирована! Откройте через рекламу.');
        }
        return;
    }
    // ===== КОНЕЦ =====
    
    me.brushType = brushId;
    me.setCursor();
    me.showToast(`🖌️ Кисть: ${brush.name}`);
            
            menu.find('.brushOption').css({
                'background': 'transparent',
                'border-color': 'transparent'
            });
            jQuery(this).css({
                'background': 'rgba(168, 85, 247, 0.25)',
                'border-color': '#a855f7'
            });
            
            setTimeout(() => {
                jQuery(menu).remove();
                jQuery('.brushSelectorButton', me.shadowRoot).removeClass('active');
            }, 300);
        });

        btn.on('mouseenter', function() {
            jQuery(this).css('background', 'rgba(168, 85, 247, 0.15)');
        });
        btn.on('mouseleave', function() {
            if (!jQuery(this).hasClass('active')) {
                jQuery(this).css('background', 'transparent');
            }
        });
    });

    const closeMenu = (e) => {
        if (!jQuery(e.target).closest('.brushMenu').length && !jQuery(e.target).closest('.brushSelectorButton').length) {
            jQuery(menu).remove();
            jQuery('.brushSelectorButton', me.shadowRoot).removeClass('active');
            $(document).off('click', closeMenu);
        }
    };
    setTimeout(() => {
        $(document).on('click', closeMenu);
    }, 100);
}

panStart(e) {
      if (e.touches && e.touches.length > 1) {
        return; // два пальца – не панорамируем
    }
    this.panDragging = true;
    const rect = this.canvasContainer[0].getBoundingClientRect();
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
    this.panStartX = clientX - rect.left;
    this.panStartY = clientY - rect.top;
    // Сохраняем текущие значения panX и panY как базовые
    this.panBaseX = this.panX;
    this.panBaseY = this.panY;
    this.wrapper.css('cursor', 'grabbing');
    this.activeCanvas.css('cursor', 'grabbing');
}

panMove(e) {
    if (!this.panDragging) return;
    if (e.touches && e.touches.length > 1) {
        return; // два пальца – не панорамируем
    }
    const rect = this.canvasContainer[0].getBoundingClientRect();
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
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const dx = x - this.panStartX;
    const dy = y - this.panStartY;
    // Применяем смещение относительно базовых значений
    this.panX = this.panBaseX + dx;
    this.panY = this.panBaseY + dy;
    this.applyZoom();
}

panEnd(e) {
    this.panDragging = false;
    this.wrapper.css('cursor', 'grab');
    this.activeCanvas.css('cursor', 'grab');
}


});