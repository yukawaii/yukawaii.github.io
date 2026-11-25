(function () {
    'use strict';
    var FRAMES = {
        achivments:            { x: 1,    y: 1   },
        anchient:              { x: 1,    y: 103 },
        bird:                  { x: 1,    y: 205 },
        butterfly:             { x: 1,    y: 307 },
        cactus:                { x: 1,    y: 409 },
        cat:                   { x: 103,  y: 1   },
        chameleon:             { x: 103,  y: 103 },
        chancel_error:         { x: 103,  y: 205 },
        check_ok:              { x: 103,  y: 307 },
        cherepaha:             { x: 103,  y: 409 },
        circle_refresh:        { x: 205,  y: 1   },
        cloud:                 { x: 205,  y: 103 },
        cobra:                 { x: 205,  y: 205 },
        coin:                  { x: 205,  y: 307 },
        corona:                { x: 205,  y: 409 },
        cow:                   { x: 307,  y: 1   },
        dolphin:               { x: 307,  y: 103 },
        duck:                  { x: 307,  y: 205 },
        earth_afrika_amerika:  { x: 307,  y: 307 },
        family:                { x: 307,  y: 409 },
        filin:                 { x: 409,  y: 1   },
        fish:                  { x: 409,  y: 103 },
        forest:                { x: 409,  y: 205 },
        fox:                   { x: 409,  y: 307 },
        fruits:                { x: 409,  y: 409 },
        gift:                  { x: 511,  y: 1   },
        help:                  { x: 511,  y: 103 },
        hint:                  { x: 511,  y: 205 },
        home_menu:             { x: 511,  y: 307 },
        hundred:               { x: 511,  y: 409 },
        japan:                 { x: 613,  y: 1   },
        kenguru:               { x: 613,  y: 103 },
        lion:                  { x: 613,  y: 205 },
        loading:               { x: 613,  y: 307 },
        locked:                { x: 613,  y: 409 },
        logo:                  { x: 715,  y: 1   },
        map:                   { x: 715,  y: 103 },
        moon:                  { x: 715,  y: 205 },
        mountain:              { x: 715,  y: 307 },
        mouse:                 { x: 715,  y: 409 },
        musical_animal:        { x: 817,  y: 1   },
        olen:                  { x: 817,  y: 103 },
        othergames:            { x: 817,  y: 205 },
        palec:                 { x: 817,  y: 307 },
        palitra:               { x: 817,  y: 409 },
        palm:                  { x: 919,  y: 1   },
        panda:                 { x: 919,  y: 103 },
        party_selebraition:    { x: 919,  y: 205 },
        pavlin:                { x: 919,  y: 307 },
        points:                { x: 919,  y: 409 },
        shark:                 { x: 1021, y: 1   },
        slon:                  { x: 1021, y: 103 },
        snake:                 { x: 1021, y: 205 },
        snow:                  { x: 1021, y: 307 },
        sokol:                 { x: 1021, y: 409 },
        soundoff:              { x: 1123, y: 1   },
        soundon:               { x: 1123, y: 103 },
        stroiteli:             { x: 1123, y: 205 },
        think:                 { x: 1123, y: 307 },
        tiger:                 { x: 1123, y: 409 },
        tv:                    { x: 1225, y: 1   },
        vegatarian:            { x: 1225, y: 103 }
    };
    var EMOJI_MAP = {
        '🐦': 'bird', '🦅': 'sokol', '🦉': 'filin', '🕊️': 'bird', '🐤': 'bird', '🐥': 'bird', '🐣': 'bird', '🐓': 'bird', '🦃': 'bird', '🐧': 'bird',
        '🦜': 'pavlin', '🦚': 'pavlin', '🦩': 'pavlin',
        '🦆': 'duck', '🦢': 'duck',
        '🐟': 'fish', '🐠': 'fish', '🐡': 'fish', '🦈': 'shark', '🐬': 'dolphin', '🐳': 'dolphin', '🐋': 'dolphin', '🦭': 'fish', '🦑': 'dolphin', '🐙': 'dolphin', '🦐': 'fish', '🦞': 'cherepaha', '🦀': 'cherepaha', '🐚': 'cherepaha',
        '🐢': 'cherepaha', '🐍': 'snake', '🦎': 'chameleon', '🐊': 'cobra', '🐸': 'chameleon', '🐉': 'anchient', '🐲': 'anchient', '🦕': 'anchient', '🦖': 'anchient',
        '🐛': 'butterfly', '🦋': 'butterfly', '🐝': 'butterfly', '🐞': 'butterfly', '🐌': 'butterfly', '🦂': 'cobra', '🕷️': 'cobra', '🕸️': 'cobra', '🪱': 'snake',
        '🐁': 'mouse', '🐀': 'mouse', '🐭': 'mouse', '🐹': 'mouse', '🐿️': 'mouse', '🦔': 'mouse', '🐇': 'mouse', '🐰': 'mouse',
        '🐱': 'cat', '🐈': 'cat', '🐈‍⬛': 'cat', '🦁': 'lion', '🐯': 'tiger', '🐅': 'tiger', '🐆': 'tiger',
        '🐴': 'olen', '🐎': 'olen', '🦄': 'olen', '🦓': 'olen', '🦌': 'olen', '🦒': 'olen',
        '🐘': 'slon', '🦣': 'slon', '🦏': 'slon', '🦛': 'slon', '🦍': 'slon', '🦧': 'slon',
        '🐪': 'cactus', '🐫': 'cactus', '🦙': 'olen', '🦘': 'kenguru',
        '🐄': 'cow', '🐮': 'cow', '🐂': 'cow', '🐃': 'cow', '🐖': 'cow', '🐷': 'cow', '🐽': 'cow', '🐏': 'cow', '🐑': 'cow', '🐐': 'cow', '🦬': 'cow',
        '🐕': 'fox', '🐶': 'fox', '🦮': 'fox', '🐕‍🦺': 'fox', '🐩': 'fox', '🐺': 'fox', '🦊': 'fox', '🦝': 'fox',
        '🐻': 'panda', '🐼': 'panda', '🐻‍❄️': 'snow',
        '🐨': 'kenguru', '🦥': 'cat', '🦦': 'cat', '🦨': 'cat', '🦡': 'cat', '🦇': 'fox',
        '🐵': 'mouse', '🐒': 'mouse',
        '🌍': 'earth_afrika_amerika', '🌎': 'earth_afrika_amerika', '🌏': 'earth_afrika_amerika', '🌐': 'earth_afrika_amerika',
        '🗺️': 'map', '🗺': 'map',
        '☀️': 'moon', '☀': 'moon', '🌞': 'moon',
        '🌝': 'moon', '🌚': 'moon', '🌛': 'moon', '🌜': 'moon', '🌙': 'moon', '🌑': 'moon', '🌒': 'moon', '🌓': 'moon', '🌔': 'moon', '🌕': 'moon', '🌖': 'moon', '🌗': 'moon', '🌘': 'moon',
        '⭐': 'corona', '🌟': 'corona', '✨': 'corona', '💫': 'corona',
        '❄️': 'snow', '❄': 'snow', '☃️': 'snow', '⛄': 'snow', '🌨️': 'snow',
        '🌧️': 'cloud', '🌦️': 'cloud', '🌥️': 'cloud', '⛅': 'cloud', '☁️': 'cloud', '☁': 'cloud', '🌤️': 'cloud', '⛈️': 'cloud', '🌩️': 'cloud', '🌪️': 'cloud', '💨': 'cloud', '🌬️': 'cloud',
        '💧': 'cloud', '💦': 'cloud', '☔': 'cloud', '☂️': 'cloud', '🌂': 'cloud',
        '🌊': 'dolphin',
        '🔥': 'party_selebraition', '💥': 'party_selebraition', '⚡': 'party_selebraition', '💢': 'chancel_error',
        '🌈': 'palitra',
        '🌲': 'forest', '🌳': 'forest', '🌴': 'palm', '🌵': 'cactus',
        '🌱': 'forest', '🌿': 'forest', '☘️': 'forest', '🍀': 'forest', '🎍': 'japan', '🎋': 'japan',
        '🌾': 'vegatarian', '🌻': 'palitra', '🌺': 'palitra', '🌸': 'palitra', '🌷': 'palitra', '🌹': 'palitra', '🥀': 'palitra', '🏵️': 'palitra', '💐': 'palitra',
        '🍁': 'fruits', '🍂': 'fruits', '🍃': 'fruits', '🌰': 'fruits',
        '🍄': 'vegatarian', '🍄‍🟫': 'vegatarian',
        '🏔️': 'mountain', '⛰️': 'mountain', '🌋': 'mountain', '🗻': 'mountain',
        '🏕️': 'forest', '🏖️': 'palm', '🏜️': 'cactus', '🏝️': 'palm', '🏞️': 'forest',
        '🏠': 'home_menu', '🏡': 'home_menu', '🏘️': 'home_menu', '🏚️': 'home_menu', '🏢': 'home_menu', '🏣': 'home_menu', '🏤': 'home_menu', '🏥': 'home_menu', '🏦': 'home_menu', '🏨': 'home_menu', '🏩': 'home_menu', '🏪': 'home_menu', '🏫': 'home_menu', '🏬': 'home_menu', '🏭': 'home_menu',
        '🏯': 'japan', '🏰': 'japan', '🗼': 'japan', '🗽': 'earth_afrika_amerika',
        '🏗️': 'stroiteli', '🏛️': 'anchient', '🗿': 'anchient', '🏺': 'anchient',
        '🚪': 'home_menu', '🛏️': 'home_menu', '🛋️': 'home_menu', '🪑': 'home_menu', '🚽': 'home_menu', '🚿': 'home_menu', '🛁': 'home_menu', '🧹': 'home_menu', '🧺': 'home_menu', '🧻': 'home_menu', '🧼': 'home_menu', '🧽': 'home_menu', '🧴': 'home_menu', '🧷': 'home_menu', '🪒': 'home_menu', '🧯': 'home_menu',
        '👑': 'corona', '🏆': 'achivments', '🥇': 'achivments', '🥈': 'achivments', '🥉': 'achivments', '🎖️': 'achivments', '🎗️': 'achivments', '🏅': 'achivments',
        '🎯': 'slon', '🎓': 'achivments',
        '📈': 'achivments', '📉': 'achivments', '📊': 'achivments',
        '💯': 'hundred',
        '💎': 'points', '💰': 'coin', '💴': 'coin', '💵': 'coin', '💶': 'coin', '💷': 'coin', '💸': 'coin', '💳': 'coin', '🪙': 'coin',
        '🧠': 'think', '🤔': 'think', '💡': 'hint', '💭': 'think', '💬': 'think',
        '🎁': 'gift', '🎀': 'gift', '🧧': 'gift',
        '🎉': 'party_selebraition', '🎊': 'party_selebraition', '🎈': 'party_selebraition', '🎂': 'party_selebraition', '🎆': 'party_selebraition', '🎇': 'party_selebraition', '🎄': 'forest', '🎃': 'party_selebraition', '🎪': 'party_selebraition', '🎠': 'party_selebraition', '🎡': 'party_selebraition', '🎢': 'party_selebraition',
        '😅': 'think', '🙈': 'think', '😱': 'chancel_error', '😊': 'party_selebraition', '😍': 'party_selebraition', '🤩': 'party_selebraition', '🥳': 'party_selebraition', '😎': 'party_selebraition', '😴': 'moon', '😀': 'party_selebraition', '😃': 'party_selebraition', '😄': 'party_selebraition', '😁': 'party_selebraition', '😂': 'party_selebraition', '🤣': 'party_selebraition', '☺️': 'party_selebraition', '😇': 'party_selebraition', '🙂': 'party_selebraition', '😉': 'party_selebraition', '😘': 'party_selebraition', '🥰': 'party_selebraition', '😋': 'party_selebraition', '😛': 'party_selebraition', '😜': 'party_selebraition', '😝': 'party_selebraition', '🤪': 'party_selebraition',
        '🤨': 'think', '🧐': 'think', '🤓': 'think', '😒': 'think', '😞': 'think', '😔': 'think', '😟': 'think', '😕': 'think', '🙁': 'think', '☹️': 'think', '😣': 'think', '😖': 'think', '😫': 'think', '😩': 'think', '🥺': 'think', '😢': 'think', '😭': 'think', '😤': 'think', '😠': 'think', '😡': 'think', '🤬': 'think', '🤯': 'think', '😳': 'think', '🥵': 'think', '🥶': 'snow', '😨': 'think', '😰': 'think', '😥': 'think', '😓': 'think', '🤗': 'party_selebraition', '🤭': 'think', '🤫': 'think', '🤥': 'think', '😶': 'think', '😐': 'think', '😑': 'think', '😬': 'think', '🙄': 'think', '😯': 'think', '😦': 'think', '😧': 'think', '😮': 'think', '😲': 'think', '🥱': 'think', '🤤': 'think', '😪': 'think', '😵': 'think', '🤐': 'think', '🥴': 'think', '🤢': 'chancel_error', '🤮': 'chancel_error', '🤧': 'think', '😷': 'think', '🤒': 'think', '🤕': 'think', '🤑': 'coin', '🤠': 'family', '😈': 'snake', '👿': 'snake', '👹': 'snake', '👺': 'snake', '🤡': 'party_selebraition', '💩': 'help', '👻': 'party_selebraition', '💀': 'chancel_error', '☠️': 'chancel_error', '👽': 'party_selebraition', '👾': 'party_selebraition', '🤖': 'party_selebraition',
        '😺': 'cat', '😸': 'cat', '😹': 'cat', '😻': 'cat', '😼': 'cat', '😽': 'cat', '🙀': 'cat', '😿': 'cat', '😾': 'cat',
        '👋': 'palec', '🤚': 'palec', '🖐️': 'palec', '✋': 'palec', '🖖': 'palec', '🤌': 'palec', '🤏': 'palec', '🤙': 'palec', '👈': 'palec', '👉': 'palec', '👆': 'palec', '👇': 'palec', '☝️': 'palec', '✊': 'palec', '👊': 'palec', '🤛': 'palec', '🤜': 'palec',
        '👌': 'check_ok', '👍': 'check_ok', '👎': 'chancel_error',
        '✌️': 'party_selebraition', '🤞': 'party_selebraition', '🤟': 'party_selebraition', '🤘': 'party_selebraition',
        '👏': 'party_selebraition', '🙌': 'party_selebraition', '👐': 'party_selebraition', '🤲': 'party_selebraition', '🙏': 'family', '🤝': 'family', '✍️': 'think', '🤳': 'tv', '💪': 'party_selebraition',
        '👂': 'think', '👃': 'think', '👀': 'think', '👁️': 'think', '👅': 'think', '👄': 'think', '💋': 'family', '🦷': 'think', '🦴': 'think',
        '💌': 'family', '💘': 'family', '💝': 'family', '💖': 'family', '💗': 'family', '💓': 'family', '💞': 'family', '💕': 'family', '💟': 'family', '❣️': 'family', '💔': 'family', '❤️': 'family', '🧡': 'family', '💛': 'family', '💚': 'family', '💙': 'family', '💜': 'family', '🤎': 'family', '🖤': 'family', '🤍': 'family',
        '1️⃣': 'points', '2️⃣': 'points', '3️⃣': 'points', '4️⃣': 'points', '5️⃣': 'points', '6️⃣': 'points', '7️⃣': 'points', '8️⃣': 'points', '9️⃣': 'points', '0️⃣': 'points', '#️⃣': 'points', '*️⃣': 'points',
        '▶️': 'check_ok', '▶': 'check_ok', '➡️': 'check_ok', '⬅️': 'check_ok', '⬆️': 'check_ok', '⬇️': 'check_ok', '↗️': 'check_ok', '↘️': 'check_ok', '↙️': 'check_ok', '↖️': 'check_ok', '↕️': 'check_ok', '↔️': 'check_ok',
        '↩️': 'circle_refresh', '↪️': 'circle_refresh', '⤴️': 'circle_refresh', '⤵️': 'circle_refresh',
        '🔄': 'circle_refresh', '🔁': 'circle_refresh', '🔃': 'circle_refresh',
        '✅': 'check_ok', '✔️': 'check_ok', '✔': 'check_ok', '☑️': 'check_ok',
        '❌': 'chancel_error', '✖️': 'chancel_error', '✖': 'chancel_error', '✕': 'chancel_error', '❎': 'chancel_error', '🚫': 'chancel_error', '⛔': 'chancel_error', '⚠️': 'chancel_error', '⚠': 'chancel_error', '‼️': 'chancel_error',
        '❓': 'help', '❔': 'help', '❗': 'hint', '⁉️': 'think',
        '⏰': 'circle_refresh', '⏱️': 'circle_refresh', '⏱': 'circle_refresh', '⏲️': 'circle_refresh', '🕰️': 'circle_refresh', '⌚': 'circle_refresh', '⌛': 'loading', '⏳': 'loading',
        '🕐': 'circle_refresh', '🕑': 'circle_refresh', '🕒': 'circle_refresh', '🕓': 'circle_refresh', '🕔': 'circle_refresh', '🕕': 'circle_refresh', '🕖': 'circle_refresh', '🕗': 'circle_refresh', '🕘': 'circle_refresh', '🕙': 'circle_refresh', '🕚': 'circle_refresh', '🕛': 'circle_refresh',
       '🐾': 'cat',
        '🔑': 'locked', '🗝️': 'locked', '🔒': 'locked', '🔓': 'locked', '🔏': 'locked', '🔐': 'locked',
        '🔊': 'soundon', '🔉': 'soundon', '🔈': 'soundoff', '🔇': 'soundoff', '📢': 'soundon', '📣': 'soundon', '🔔': 'soundon', '🔕': 'soundoff', '📯': 'musical_animal',
        '📺': 'tv', '📻': 'tv', '📱': 'tv', '📲': 'tv', '📞': 'tv', '☎️': 'tv', '📟': 'tv', '📠': 'tv', '📷': 'tv', '📸': 'tv', '📹': 'tv', '🎥': 'tv', '🎬': 'tv', '📽️': 'tv', '📼': 'tv', '📀': 'tv', '💿': 'tv', '💾': 'tv', '💽': 'tv', '🖥️': 'tv', '💻': 'tv', '⌨️': 'tv', '🖨️': 'tv', '🖱️': 'tv', '🖲️': 'tv', '📡': 'tv',
        '📖': 'help', '📚': 'help', '📕': 'help', '📗': 'help', '📘': 'help', '📙': 'help', '📓': 'help', '📒': 'help', '📔': 'help', '📃': 'help', '📜': 'help', '📄': 'help', '📰': 'help', '🗞️': 'help', '📋': 'help', '📁': 'help', '📂': 'help', '🗂️': 'help', '🗃️': 'help', '🗄️': 'help',
        '📍': 'map', '📌': 'check_ok', '📎': 'map', '🏷️': 'map', '🔖': 'map', '📅': 'map', '📆': 'map', '🗓️': 'map', '📇': 'map', '🔗': 'map', '⛓️': 'map', '🦯': 'map', '🦽': 'map', '🦼': 'map',
        '🎵': 'musical_animal', '🎶': 'musical_animal', '🎤': 'musical_animal', '🎧': 'musical_animal', '🎼': 'musical_animal', '🎷': 'musical_animal', '🎸': 'musical_animal', '🎹': 'musical_animal', '🎺': 'musical_animal', '🎻': 'musical_animal', '🥁': 'musical_animal', '🪕': 'musical_animal',
        '🎮': 'othergames', '🕹️': 'othergames', '🎲': 'othergames', '🎰': 'othergames', '🃏': 'othergames',
        '👥': 'family', '👨‍👩‍👧‍👦': 'family', '👨‍👩‍👧': 'family', '👨‍👩‍👦': 'family', '👪': 'family', '👨': 'family', '👩': 'family', '👶': 'family', '🧑': 'family', '👦': 'family', '👧': 'family', '👴': 'family', '👵': 'family', '👫': 'family', '👬': 'family', '👭': 'family', '💑': 'family', '💏': 'family', '💍': 'family',
        '🔧': 'stroiteli', '🔨': 'stroiteli', '⛏️': 'stroiteli', '⚒️': 'stroiteli', '🛠️': 'stroiteli', '🔩': 'stroiteli', '⚙️': 'stroiteli', '🗜️': 'stroiteli', '🧰': 'stroiteli',
        '🧲': 'think', '🔬': 'think', '🔭': 'think', '🧪': 'think', '⚗️': 'think', '🧫': 'think', '🧬': 'think',
        '💉': 'family', '💊': 'family', '🩺': 'family', '🩹': 'family', '🩸': 'family', '🫀': 'family', '🫁': 'family',
        '⚔️': 'sokol', '🗡️': 'sokol', '🛡️': 'sokol', '🏹': 'sokol',
        '📝': 'think', '✏️': 'think', '🖊️': 'think', '🖋️': 'think', '✒️': 'think',
        '🎨': 'palitra', '🖌️': 'palitra', '🖍️': 'palitra',
        '💯': 'hundred', '💤': 'moon', '🚀': 'party_selebraition', '🛸': 'party_selebraition',
        '🕐': 'circle_refresh', '🎭': 'help',
        '🏁': 'check_ok', '🚩': 'hint', '🎌': 'japan', '🏴': 'check_ok', '🏳️': 'check_ok',
        '🍎': 'fruits', '🍏': 'fruits', '🍊': 'fruits', '🍋': 'fruits', '🍌': 'fruits', '🍍': 'fruits', '🥭': 'fruits', '🥝': 'fruits', '🍇': 'fruits', '🍈': 'fruits', '🍉': 'fruits', '🍑': 'fruits', '🍐': 'fruits', '🍒': 'fruits', '🍓': 'fruits', '🥥': 'fruits',
        '🥕': 'vegatarian', '🍆': 'vegatarian', '🥑': 'vegatarian', '🥦': 'vegatarian', '🥬': 'vegatarian', '🥒': 'vegatarian', '🌶️': 'vegatarian', '🌽': 'vegatarian', '🧄': 'vegatarian', '🧅': 'vegatarian', '🥔': 'vegatarian', '🍠': 'vegatarian', '🍞': 'vegatarian', '🥐': 'vegatarian', '🍔': 'vegatarian', '🍕': 'vegatarian', '🍟': 'vegatarian', '🌭': 'vegatarian', '🥪': 'vegatarian', '🥗': 'vegatarian', '🍳': 'vegatarian', '🥚': 'gift',
        '🍰': 'gift', '🧁': 'gift', '🍭': 'gift', '🍬': 'gift', '🍫': 'gift', '🍪': 'gift', '🍩': 'gift',
        '☕': 'gift', '🍵': 'gift', '🥛': 'gift', '🍼': 'gift', '🥤': 'gift', '🍶': 'gift', '🍷': 'gift', '🍺': 'gift', '🍻': 'gift',
        '🍣': 'fish', '🍥': 'fish', '🍤': 'fish',
        '🛒': 'gift', '🛍️': 'gift', '🎒': 'gift', '👜': 'gift', '👛': 'gift', '👝': 'gift', '💼': 'family', '🧳': 'gift',
        '🔮': 'think', '📿': 'achivments', '🧿': 'help',
        '🎴': 'japan', '🀄': 'japan', '🎎': 'japan', '🎏': 'japan', '🎐': 'japan', '🎑': 'japan', '🏮': 'japan',
        '🏳️‍🌈': 'palitra', '🏴‍☠️': 'sokol'
    };
    var keys = Object.keys(EMOJI_MAP).sort(function (a, b) { return b.length - a.length; });
    function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    var EMOJI_RE = new RegExp('(' + keys.map(escRe).join('|') + ')', 'g');
    function has(name) { return Object.prototype.hasOwnProperty.call(FRAMES, name); }
    function html(name, size) {
        if (!has(name)) return '';
        var style = size ? ' style="--ui-sprite-size:' + size + '"' : '';
        return '<span class="ui-sprite ui-sprite--' + name + '"' + style + ' aria-hidden="true"></span>';
    }
    function icon(nameOrEmoji, size) {
        if (has(nameOrEmoji)) return html(nameOrEmoji, size);
        var name = EMOJI_MAP[nameOrEmoji];
        if (name && has(name)) return html(name, size);
        return String(nameOrEmoji);
    }
    function scanTextNode(node) {
        var text = node.nodeValue;
        if (!text) return;
        EMOJI_RE.lastIndex = 0;
        if (!EMOJI_RE.test(text)) return;
        EMOJI_RE.lastIndex = 0;
        var frag = document.createDocumentFragment();
        var last = 0, m;
        while ((m = EMOJI_RE.exec(text)) !== null) {
            var emoji = m[0];
            var name = EMOJI_MAP[emoji];
            if (!name) continue;
            if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
            var span = document.createElement('span');
            span.className = 'ui-sprite ui-sprite--' + name;
            span.setAttribute('aria-hidden', 'true');
            frag.appendChild(span);
            last = m.index + emoji.length;
        }
        if (last === 0) return;
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
    }
    function scanNode(node) {
        if (!node) return;
        if (node.nodeType === 3) { scanTextNode(node); return; }
        if (node.nodeType !== 1) return;
        var tag = node.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'OPTION') return;
        if (node.classList && node.classList.contains('ui-sprite')) return;
        if (node.classList && node.classList.contains('emoji-icon') && node.dataset && node.dataset.icon) {
            var ICON_MAP = {
                star: 'points',
                play: 'party_selebraition',
                collection: 'hundred',
                medal: 'achivments',
                games: 'othergames',
                home: 'home_menu',
                key: 'locked'
            };
            var sprite = ICON_MAP[node.dataset.icon];
            if (sprite && has(sprite)) {
                node.innerHTML = html(sprite);
            }
        }
        var kids = Array.prototype.slice.call(node.childNodes);
        for (var i = 0; i < kids.length; i++) scanNode(kids[i]);
    }
    function scan(root) { scanNode(root || document.body); }
function injectCSS() {
    var css = []
        .concat([
            '.ui-sprite{--ui-sprite-size:1.5em;display:inline-block;width:var(--ui-sprite-size);height:var(--ui-sprite-size);background-image:url("ui_atlas.png");background-repeat:no-repeat;background-size:calc(13.26 * var(--ui-sprite-size)) calc(5.1 * var(--ui-sprite-size));vertical-align:middle;flex-shrink:0;pointer-events:none;transform-origin:center}'
        ])
        .concat(Object.keys(FRAMES).map(function (name) {
            var f = FRAMES[name];
            return '.ui-sprite--' + name + '{background-position:calc(' + (-f.x / 100) + ' * var(--ui-sprite-size)) calc(' + (-f.y / 100) + ' * var(--ui-sprite-size))}';
        }))
        .concat([
            '.emoji-icon > .ui-sprite{--ui-sprite-size:1.6em}',
            '.modal-title .emoji-icon > .ui-sprite,',
            '.col-title .emoji-icon > .ui-sprite,',
            '.emoji-icon[style*="width:1em"] > .ui-sprite{--ui-sprite-size:1.1em}',
'.score-chip .emoji-icon > .ui-sprite,',
'.btn-primary.btn-lg .emoji-icon > .ui-sprite{transform:scale(1.6);transform-origin:center}',
'.btn-icon .emoji-icon > .ui-sprite,',
'.btn-icon > .ui-sprite,',
'.icon-btn .ui-sprite,',
'.btn-lg > .ui-sprite{transform:scale(1.6);transform-origin:center}',
'.btn-icon .btn-icon-count{margin-left:0.4em}',
'.score-chip [data-total-score],',
'.btn-primary.btn-lg [data-i18n="play"]{margin-left:0.6em;position:relative;z-index:2}',
'.btn-icon,.icon-btn,.score-chip,.btn-primary.btn-lg,.hero-actions{overflow:visible}',
            '.level-name .ui-sprite{transform:scale(2);transform-origin:center;margin-right:1.1em;margin-bottom:0.4em}',
            '.level-name{overflow:visible;line-height:1.4}',
            '.level-card{overflow:visible}',
            '.region-title .ui-sprite,.col-title .ui-sprite{transform:none;margin-right:0.4em;margin-bottom:0.1em}',
            '.region-title,.col-title{overflow:visible}',
'.description::before{content:"Интересный факт"!important;position:absolute!important;top:-14px!important;left:14px!important;padding:6px 14px 6px 46px!important;background:var(--wb-daily-bg, #fbbf24)!important;color:var(--wb-border, #5d4037)!important;border:2px solid var(--wb-border, #5d4037)!important;border-radius:22px!important;font-size:12px!important;font-weight:900!important;letter-spacing:.5px!important;line-height:1.35!important;box-shadow:0 2px 0 var(--wb-border, #5d4037)!important;z-index:1}',

'.description::after{content:""!important;position:absolute!important;top:-12px!important;left:22px!important;width:32px!important;height:32px!important;background:url("ui_atlas.png") no-repeat -32.96px -0.32px / 424.32px 163.2px!important;background-repeat:no-repeat!important;pointer-events:none!important;z-index:2}'        ]);
    var style = document.createElement('style');
    style.id = 'ui-sprite-css';
    style.textContent = css.join('\n');
    document.head.appendChild(style);
}
    var pending = [];
    var scheduled = false;
    function flushPending() {
        scheduled = false;
        var nodes = pending;
        pending = [];
        for (var i = 0; i < nodes.length; i++) {
            try { scanNode(nodes[i]); } catch (e) {}
        }
    }
    function installObserver() {
        var observer = new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var m = muts[i];
                if (m.type === 'childList') {
                    for (var j = 0; j < m.addedNodes.length; j++) {
                        pending.push(m.addedNodes[j]);
                    }
                } else if (m.type === 'characterData') {
                    pending.push(m.target);
                }
            }
            if (!scheduled && pending.length) {
                scheduled = true;
                requestAnimationFrame(flushPending);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
function init() {
    injectCSS();
    try {
        if (window.Sound && typeof window.Sound.apply === 'function' && !window.Sound.__uiSpritePatched) {
            var origSoundApply = window.Sound.apply;
            window.Sound.apply = function () {
                var r = origSoundApply.apply(this, arguments);
                setTimeout(function () { scan(document.body); }, 0);
                return r;
            };
            window.Sound.__uiSpritePatched = true;
        }
    } catch (e) {}
    try {
        if (window.Theme && typeof window.Theme.apply === 'function' && !window.Theme.__uiSpritePatched) {
            var origThemeApply = window.Theme.apply;
            window.Theme.apply = function () {
                var r = origThemeApply.apply(this, arguments);
                setTimeout(function () { scan(document.body); }, 0);
                return r;
            };
            window.Theme.__uiSpritePatched = true;
        }
    } catch (e) {}
    function forceRedrawToggles() {
        try { if (window.Sound && window.Sound.apply) window.Sound.apply(); } catch (e) {}
        try { if (window.Theme && window.Theme.apply) window.Theme.apply(); } catch (e) {}
        scan(document.body);
    }
    forceRedrawToggles();
    scan(document.body);
    installObserver();
    setTimeout(forceRedrawToggles, 500);
    setTimeout(forceRedrawToggles, 1500);
    setTimeout(forceRedrawToggles, 3000);
    console.log('[ui_sprite] Эмодзи→спрайты готовы');
}
    window.UiSprite = { has: has, html: html, icon: icon, scan: scan, FRAMES: FRAMES, EMOJI_MAP: EMOJI_MAP };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();