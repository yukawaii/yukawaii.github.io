// ============================================================
//  INTERIOR DATA  – все интерьеры и их параметры
// ============================================================

const INTERIORS_DATA = {

        stenaL_fixed: {
        imagePath: 'images/interiors/stenaL_fixed.png',
        offsetX: 0.225,
        offsetY: 0.362,
        width: 861,
        height: 709
    },
        stenaR_fixed: {
        imagePath: 'images/interiors/stenaR_fixed.png',
        offsetX: 0.886,
        offsetY: 0.313,
        width: 447,
        height: 526
    },
        stenaC_fixed: {
        imagePath: 'images/interiors/stenaC_fixed.png',
        offsetX: 0.65,
        offsetY: 0.40,
        width: 552,
        height: 630
    },
        kamin_fixed: {
        imagePath: 'images/interiors/kamin_fixed.png',
        offsetX: 0.245,
        offsetY: 0.715,
        width: 632,
        height: 469
    },
        okno2_fixed: {
        imagePath: 'images/interiors/okno2_fixed.png',
        offsetX: 0.225,
        offsetY: 0.282,
        width: 220,
        height: 204
    },
        pol_fixed: {
        imagePath: 'images/interiors/pol_fixed.png',
        offsetX: 0.50,
        offsetY: 0.848,
        width: 1920,
        height: 326
    },
        list_fixed: {
        imagePath: 'images/interiors/list_fixed.png',
        offsetX: 0.50,
        offsetY: 0.75,
        width: 1917,
        height: 560
    },

        door2_fixed: {
        imagePath: 'images/interiors/door2_fixed.png',
        offsetX: 0.5,
        offsetY: 0.52,
        width: 535,
        height: 659
    },
        door_fixed: {
        imagePath: 'images/interiors/door_fixed.png',
        offsetX: 0.5,
        offsetY: 0.55,
        width: 358,
        height: 544
    },
    okno_fixed: {
        imagePath: 'images/interiors/okno_fixed.png',
        offsetX: 0.23,
        offsetY: 0.3,
        width: 271,
        height: 274
    },

};

window.INTERIORS_DATA = INTERIORS_DATA;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { INTERIORS_DATA };
}