// In plain English
// When I click on a LEVEL button, groups of 10 will populate based on which level, the heading under the pomodoro will change to reflect the current level (and group)
// When I click on a GROUP button, all ten(or less) KANJI buttons will populate based on which group, these will link to each card -> if I press on a KANJI button, the card for that kanji will show
// Flash Card information will populate based on which LEVEL, GROUP, and KANJI button was pressed
// Default is N5 Group 1
// The PREVIOUS and NEXT buttons rotate through the kanji
// FLASH CARD should flip on click (instead of hover)

/*---------------------------
	  ALERT BOX
---------------------------
document.querySelector('#close-alert').addEventListener('click', function(){
    this.parentNode.setAttribute('class', 'hide');
})

*/

/*---------------------------
	  TIPS SECTION
---------------------------*/
//  Expand How To and Tips - Working

document.getElementById('how-to-container').addEventListener('click', function(){
    document.getElementById('how-to-details').classList.toggle('details')
})
/*
document.getElementById('tips-container').addEventListener('click', function(){
    document.getElementById('tips-details').classList.toggle('details')
})

*/
/*---------------------------
	  BUTTONS
---------------------------*/

// Toggle Learning Mode and Flash Card Mode Buttons- Working
document.getElementById('flash-card-mode').addEventListener('click', function(){
    document.getElementById('learning').classList.add('hide')
    document.getElementById('flashcard').classList.remove('hide')
    
    document.getElementById('learning-mode').classList.remove('selected')
    document.getElementById('flash-card-mode').classList.add('selected')
})
document.getElementById('learning-mode').addEventListener('click', function(){
    document.getElementById('flashcard').classList.add('hide')
    document.getElementById('learning').classList.remove('hide')

    document.getElementById('flash-card-mode').classList.remove('selected')
    document.getElementById('learning-mode').classList.add('selected')
})

// Level Buttons - Working 
    // but need to set a default for group

    // Global Variables

var n
let levelButtons = document.getElementsByClassName('level-button')
let levelTitle = document.getElementById('level')

    // Functions

let n5ButtonClick = document.getElementById('n5').addEventListener('click', function(){
    for (let i = 0; i < levelButtons.length; i++) {
            levelButtons[i].classList.remove('selected')
    }
    this.classList.add('selected')
    n = 'N5'
    levelTitle.innerHTML = 'Н5'
    groupTitle.innerHTML = 'Выбери уровень'
    groupButtonAction(n)
})
let n4ButtonClick = document.getElementById('n4').addEventListener('click', function(){
    for (let i = 0; i < levelButtons.length; i++) {
            levelButtons[i].classList.remove('selected')
    }
    this.classList.add('selected')
    n = 'N4'
    levelTitle.innerHTML = 'Н4'
    groupTitle.innerHTML = 'Выбери уровень'
    groupButtonAction(n)
})
let n3ButtonClick = document.getElementById('n3').addEventListener('click', function(){
    for (let i = 0; i < levelButtons.length; i++) {
            levelButtons[i].classList.remove('selected')
    }
    this.classList.add('selected')
    n = 'N3'
    levelTitle.innerHTML = 'Н3'
    groupTitle.innerHTML = 'Выбери уровень'
    groupButtonAction(n)
})

/*
let n2ButtonClick = document.getElementById('n2').addEventListener('click', function(){
    for (let i = 0; i < levelButtons.length; i++) {
            levelButtons[i].classList.remove('selected')
    }
    this.classList.add('selected')
    n = 'N2'
    levelTitle.innerHTML = 'Н2'
    groupTitle.innerHTML = 'Выбери уровень'
    groupButtonAction(n)
}) */
/*
let n1ButtonClick = document.getElementById('n1').addEventListener('click', function(){
    for (let i = 0; i < levelButtons.length; i++) {
            levelButtons[i].classList.remove('selected')
    }
    this.classList.add('selected')
    n = 'N1'
    levelTitle.innerHTML = 'Н1'
    groupTitle.innerHTML = 'Выбери уровень'
    groupButtonAction(n)
})
*/ 
let onomatopeaButtonClick = document.getElementById('onomatopea').addEventListener('click', function(){
    for (let i = 0; i < levelButtons.length; i++) {
            levelButtons[i].classList.remove('selected')
    }
    this.classList.add('selected')
    n = 'onomatopea'
    levelTitle.innerHTML = 'Ономатопея'
    groupTitle.innerHTML = 'Выбери уровень'
    groupButtonAction(n)
})


// Group Buttons - Working
    
    // Global Variables

var g
let q
let id
let groupTitle = document.getElementById('group')
let groupObjectPropertyNames
    // Functions
    // Main Group Button Function : combines delete and create functions depending on which level is selected
function groupButtonAction(n) {
    switch (n) {
        case 'N5':
            groupObjectPropertyNames = Object.keys(N5)
            break
        case 'N4':
            groupObjectPropertyNames = Object.keys(N4)
            break
        case 'N3':
            groupObjectPropertyNames = Object.keys(N3)
            break
        case 'N2':
            groupObjectPropertyNames = Object.keys(N2)
            break
        case 'N1':
            groupObjectPropertyNames = Object.keys(N1)
            break
 	case 'onomatopea':
            groupObjectPropertyNames = Object.keys(onomatopea)
            break
    }
    
    deleteCurrentGroupButtons()
    
    for(let i = 0; i < groupObjectPropertyNames.length; i++) {
        if (i < 9){
            groupButtonText = `Ур. 0${i + 1}`
        } else {
            groupButtonText = `Ур. ${i + 1}`
        }

        createGroupButtons(groupButtonText)
    }
}

    // Delete Group Button Function

let groupButtonsContainer = document.getElementById('group-buttons-container')
let allGroupButtons = document.getElementsByClassName('group-button')

function deleteCurrentGroupButtons() {
    var child = groupButtonsContainer.lastElementChild;  
    while (child) { 
        groupButtonsContainer.removeChild(child); 
        child = groupButtonsContainer.lastElementChild;
    }
}
    // Create Group Button Function

function createGroupButtons(buttonText) {
    var groupButton = document.createElement('BUTTON')
    groupButton.innerText = buttonText
    groupButton.className = 'group-button'
    groupButtonsContainer.appendChild(groupButton)
    groupButton.addEventListener('click', groupButtonSelected)
}

    // Selected Group Button

function groupButtonSelected () {
    
    getN = document.getElementById('level').innerHTML
    getG = document.getElementById('group').innerHTML

    for (let i = 0; i < allGroupButtons.length; i++) {
        allGroupButtons[i].classList.remove('selected')
    }

    this.classList.add('selected')
    g = this.innerText
    groupTitle.innerHTML = g

    // To get the data to use for the Kanji buttons and Cards 
    function read_prop(prop) {
        let obj
        switch (n) {
            case 'N5':
                obj = N5
                break
            case 'N4':
                obj = N4
                break
            case 'N3':
                obj = N3
                break
            case 'N2':
                obj = N2
                break
            case 'N1':
                obj = N1
                break
	 case 'onomatopea':
                obj = onomatopea
                break
        }
        return obj[prop];
    }
    q = read_prop(g)
    
    deleteCurrentKanjiButtons()

    for (id = 0; id < q.length; id++) {
        getK = q[id].kanji
        
        createKanjiButtons(getK)
    }

    // Set Card Info Default Values - will need to DRY this
    getKanji[0].innerHTML = q[0].kanji
    getOnyomi[0].innerHTML = q[0].onyomi
    getKunyomi[0].innerHTML = q[0].kunyomi
    getDefinition[0].innerHTML = q[0].definition
    getExamples1[0].innerHTML = q[0].examples[0]
    getExamples2[0].innerHTML = q[0].examples[1]
    getExamples3[0].innerHTML = q[0].examples[2]
	  getExamples3[0].innerHTML = q[0].examples[3]
	  getExamples4[0].innerHTML = q[0].examples[4]
	  getExamples5[0].innerHTML = q[0].examples[5]
	  getExamples6[0].innerHTML = q[0].examples[6]


    getKanji[1].innerHTML = q[0].kanji
    getOnyomi[1].innerHTML = q[0].onyomi
    getKunyomi[1].innerHTML = q[0].kunyomi
    getDefinition[1].innerHTML = q[0].definition
    getExamples1[1].innerHTML = q[0].examples[0]
    getExamples2[1].innerHTML = q[0].examples[1]
    getExamples3[1].innerHTML = q[0].examples[2]
		  getExamples3[0].innerHTML = q[0].examples[3]
	  getExamples4[0].innerHTML = q[0].examples[4]
	  getExamples5[0].innerHTML = q[0].examples[5]
	  getExamples6[0].innerHTML = q[0].examples[6]
  
}


// Kanji Buttons & Card Content

    // Global Variables
let getK
let k
let getKanji = document.getElementsByClassName('kanji')
let getOnyomi = document.getElementsByClassName('onyomi')
let getKunyomi = document.getElementsByClassName('kunyomi')
let getDefinition = document.getElementsByClassName('definition')
let getExamples1 = document.getElementsByClassName('examples1')
let getExamples2 = document.getElementsByClassName('examples2')
let getExamples3 = document.getElementsByClassName('examples3')
let getExamples4 = document.getElementsByClassName('examples4')
let getExamples5 = document.getElementsByClassName('examples5')
let getExamples6 = document.getElementsByClassName('examples6')



    // Functions

    // Delete Kanji Button Function & Variable
let kanjiButtonsContainer = document.getElementById('kanji-buttons-container')

function deleteCurrentKanjiButtons() {
    var child = kanjiButtonsContainer.lastElementChild;  
    while (child) { 
        kanjiButtonsContainer.removeChild(child); 
        child = kanjiButtonsContainer.lastElementChild;
    }
}
    // Create Kanji Button Function
function createKanjiButtons(kanjiObj) {
    var kanjiButton = document.createElement('BUTTON')
        kanjiButton.innerText = kanjiObj
        kanjiButton.className = 'kanji-button'
        kanjiButton.id = id //Technically this shouldn't be possible??? But it is working...
        kanjiButtonsContainer.appendChild(kanjiButton)
        kanjiButton.addEventListener('click', kanjiButtonSelected)

        document.getElementById('0').classList.add('selected')
}

// Selected Kanji Button
function kanjiButtonSelected () {
    let allKanjiButtons = document.getElementsByClassName('kanji-button') 
    
    for (let i = 0; i <allKanjiButtons.length ; i++) {
        allKanjiButtons[i].classList.remove('selected')
    }

    this.classList.add('selected')
  
    // Set Card Info - will need to DRY this
    getKanji[0].innerHTML = q[this.id].kanji
    getOnyomi[0].innerHTML = q[this.id].onyomi
    getKunyomi[0].innerHTML = q[this.id].kunyomi
    getDefinition[0].innerHTML = q[this.id].definition
    getExamples1[0].innerHTML = q[this.id].examples[0]
    getExamples2[0].innerHTML = q[this.id].examples[1]
    getExamples3[0].innerHTML = q[this.id].examples[2]
		  getExamples3[0].innerHTML = q[0].examples[3]
	  getExamples4[0].innerHTML = q[0].examples[4]
	  getExamples5[0].innerHTML = q[0].examples[5]
	  getExamples6[0].innerHTML = q[0].examples[6]

    getKanji[1].innerHTML = q[this.id].kanji
    getOnyomi[1].innerHTML = q[this.id].onyomi
    getKunyomi[1].innerHTML = q[this.id].kunyomi
    getDefinition[1].innerHTML = q[this.id].definition
    getExamples1[1].innerHTML = q[this.id].examples[0]
    getExamples2[1].innerHTML = q[this.id].examples[1]
    getExamples3[1].innerHTML = q[this.id].examples[2]
		  getExamples3[0].innerHTML = q[0].examples[3]
	  getExamples4[0].innerHTML = q[0].examples[4]
	  getExamples5[0].innerHTML = q[0].examples[5]
	  getExamples6[0].innerHTML = q[0].examples[6]
}



// Toggle Flashcard
const toggle = function(){
   document.querySelector('#flashcard').classList.toggle('flashcard')
}

document.getElementById('flashcard').addEventListener('click', toggle)
