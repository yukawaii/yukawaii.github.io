const questionText = document.getElementById("question-text");
const optionBox = document.querySelector(".option-box");
const currentQuestionNum = document.querySelector(".current-question-num");
const answerDescription = document.querySelector(".answer-description");
const nextQuestionBtn = document.querySelector(".next-question-btn");
const correctAnswers = document.querySelector(".correct-answers");
const seeResultBtn = document.querySelector(".see-result-btn");
const remainingTime = document.querySelector(".remaining-time");
const timeUpText = document.querySelector(".time-up-text");
const quizHomeBox = document.querySelector(".quiz-home-box");
const quizBox = document.querySelector(".quiz-box");
const quizOverBox = document.querySelector(".quiz-over-box");
const startAgainQuizBtn = document.querySelector(".start-again-quiz-btn");
const goHomeBtn = document.querySelector(".go-home-btn");
const startQuizBtn = document.querySelector(".start-quiz-btn");
const nameText = document.getElementById("myForm");
const finalMsg = document.querySelector(".finalMsg");

let attempt = 0;
let questionIndex = 0;
let score = 0;
let number = 0;
let myArray = [];
let interval;

const myApp = [
 
    {
        question: "<img src = '../mem/img/65.png' width='250' height='250' />",
        options: ["Казначей", "Бюрократ", "Бургомистр", "Буржуй"],
        answer: 2,
        description: "Бургомистр. Представляет опасность для многих видов птиц, в том числе чаек.",
    }, {
        question: "<img src = '../mem/img/66.png' width='250' height='250' />",
        options: ["Боров", "Медведь бурый", "Медведь арктический", "Медведь белый"],
        answer: 3,
        description: "Медведь белый.Самцы и молодые самки редко ложатся в зимнюю спячку, предпочитая сну активные путешествия.",
    },{
        question: "<img src = '../mem/img/67.png' width='250' height='250' />",
        options: ["Кит синий", "Морской лев", "Кит горбатый", "Касатка"],
        answer: 0,
        description: "Кит синий. Может доживать до 120 лет. Возраст китов определяют по слоям в ушных пробках.",
    },{
        question: "<img src = '../mem/img/68.png' width='250' height='250' />",
        options: ["Сова белая", "Филин", "Сова полярная", "Сова пятнистая"],
        answer: 2,
        description: "Сова полярная. Основа питания — лемминги. Может охотиться на зайцев, горностаев, гусей, уток и белых куропаток.",
    },{
        question: "<img src = '../mem/img/69.png' width='250' height='250' />",
        options: ["Лис белый", "Песец голубой", "Песец белый", "Волк голубой"],
        answer: 1,
        description: "Песец голубой. Готов съесть все, что попадется на пути — от лемминга до лесных ягод и навоза северного оленя.",
    },{
        question: "<img src = '../mem/img/70.png' width='250' height='250' />",
        options: ["Белуха", "Кит белый", "Кит горбатый", "Дельфин"],
        answer: 0,
        description: "Белуха.Враги — белые медведи, которые подкарауливают белух на льдинах и касатки, нападающие в морских глубинах ",
    },{
        question: "<img src = '../mem/img/71.png' width='250' height='250' />",
        options: ["Казарка", "Кукабара", "Леди", "Гага"],
        answer: 3,
        description: "Гага обыкновенная.  Опасность представляет человек, который разоряет кладки ради ценного пуха.",
    },{
        question: "<img src = '../mem/img/72.png' width='250' height='250' />",
        options: ["Олень альповский", "Олень северный", "Олень горный", "Олень долинный"],
        answer: 1,
        description: "Олень северный. Зимой олени живут стадами, а летом — в одиночку, семьями или мелкими группами.",
    },{
        question: "<img src = '../mem/img/73.png' width='250' height='250' />",
        options: ["Рыба-луна", "Кит белый", "Рыба-молот", "Кит донный"],
        answer: 0,
        description: "Рыба-луна. В Японии, Корее и Тайване считается деликатесом, и популяция страдает от браконьеров.",
    },{
        question: "<img src = '../mem/img/74.png' width='250' height='250' />",
        options: ["Тупик", "Остроклюв", "Пингвин", "Утконос"],
        answer: 0,
        description: "Тупик атлантический. В поисках еды могут нырять на глубину до 10 м и оставаться под водой до двух минут.  ",
    },{
        question: "<img src = '../mem/img/75.png' width='250' height='250' />",
        options: ["Овец", "Бык", "Буйвол", "Овцебык"],
        answer: 3,
        description: "Овцебык. Основная пища овцебыка — мхи, лишайники, ягель, кора деревьев и кустарников",
    },{
        question: "<img src = '../mem/img/76.png' width='250' height='250' />",
        options: ["Урвал", "Соврал", "Нарвал", "Пристал"],
        answer: 2,
        description: "Нарвал. Предпочитая ледяную воду, кочуют вслед за арктическими льдами",
    },{
        question: "<img src = '../mem/img/77.png' width='250' height='250' />",
        options: ["Крачка", "Чайка", "Ласточка", "Синица"],
        answer: 0,
        description: "Крачка полярная. Получила название из-за звука, издаваемого в полете: «Крррррр».",
    },{
        question: "<img src = '../mem/img/78.png' width='250' height='250' />",
        options: ["Лисица", "Волк", "Бобёр", "Росомаха"],
        answer: 3,
        description: "Росомаха. Осторожный хищник-одиночка, всеядный. ",
    },{
        question: "<img src = '../mem/img/79.png' width='250' height='250' />",
        options: ["Ластоног", "Морж", "Тюлень", "Морской котик"],
        answer: 1,
        description: "Морж. Запаса воздуха моржу хватает в среднем на 10 минут, поэтому они не ныряют глубоко. ",
    }
    ]
  
function load() {
    //console.log("test");
    number++;
    questionText.innerHTML = myApp[questionIndex].question;
    createOptions();
    scoreBoard();
    currentQuestionNum.innerHTML = number + " / " + myApp.length;
}

function createOptions() {
    optionBox.innerHTML = "";
    for (let i = 0; i < myApp[questionIndex].options.length; i++) {
        // console.log(myApp[questionIndex].options[i]);
        const option = document.createElement("div");
        option.innerHTML = myApp[questionIndex].options[i];
        option.classList.add("option");
        option.id = i;
        option.setAttribute("onclick", "check(this)");
        optionBox.appendChild(option);
    }
}

function generateRandomQuestion() {
    let randomNumber = Math.floor(Math.random() * (myApp.length));
    let hitDuplicate = 0;
    if (myArray.length == 0) {
        questionIndex = randomNumber;
    } else {
        for (let i = 0; i < myArray.length; i++) {
            if (randomNumber == myArray[i]) {
                hitDuplicate = 1;
                // console.log("found duplicate")
            }
        }
        if (hitDuplicate == 1) {
            generateRandomQuestion();
            return;
        } else {
            questionIndex = randomNumber;
        }
    }

    myArray.push(randomNumber);
    // console.log(myArray);
    load();

}

function check(ele) {
    // console.log(ele.id);
    const id = ele.id;
    if (id == myApp[questionIndex].answer) {
        // console.log("correct");
        ele.classList.add("correct");
        score++;
        scoreBoard();
    } else {
        // console.log("wrong");
        ele.classList.add("wrong");
        // show correct answer when clicked answer is wrong;
        for (let i = 0; i < optionBox.children.length; i++) {
            if (optionBox.children[i].id == myApp[questionIndex].answer) {
                optionBox.children[i].classList.add("show-correct");
            }
        }
    }
    attempt++;
    disableOptions();
    showAnswerDescription();
    showNextQuestionBtn();
    stopTimer();

    if (number / (myApp.length) == 1) {
        // console.log("over");
        quizOver();
    }
}

function timeIsUp() {
    showTimeUpText();
    for (let i = 0; i < optionBox.children.length; i++) {
        if (optionBox.children[i].id == myApp[questionIndex].answer) {
            optionBox.children[i].classList.add("show-correct");
        }
    }
    disableOptions();
    showAnswerDescription();
    showNextQuestionBtn();

}

function startTimer() {
    let timeLimit = 10;
    remainingTime.classList.remove("less-time");
    interval = setInterval(() => {
        timeLimit--;
        if (timeLimit < 10) {
            timeLimit = "0" + timeLimit;
        }
        if (timeLimit < 6) {
            remainingTime.classList.add("less-time");
        }

        remainingTime.innerHTML = timeLimit;
        if (timeLimit == 0) {
            clearInterval(interval);
            timeIsUp();
        }
    }, 1000)
}

function stopTimer() {
    clearInterval(interval);
}

function disableOptions() {
    for (let i = 0; i < optionBox.children.length; i++) {
        optionBox.children[i].classList.add("already-answered");
    }
}

function showAnswerDescription() {
    // answer description will only show if it is definied
    if (typeof myApp[questionIndex].description !== "undefined") {
        answerDescription.classList.add("show");
        answerDescription.innerHTML = myApp[questionIndex].description;
    }
}

function hideAnswerDescription() {
    answerDescription.classList.remove("show");
    answerDescription.innerHTML = "";
}

function showNextQuestionBtn() {
    nextQuestionBtn.classList.add("show");

}

function hideNextQuestionBtn() {
    nextQuestionBtn.classList.remove("show");
}

function showTimeUpText() {
    timeUpText.classList.add("show");
}

function hideTimeUpText() {
    timeUpText.classList.remove("show");
}

function scoreBoard() {
    correctAnswers.innerHTML = score;
}

nextQuestionBtn.addEventListener("click", nextQuestion);

function nextQuestion() {
    // questionIndex++;
    generateRandomQuestion();
    // load();
    hideNextQuestionBtn();
    hideAnswerDescription();
    hideTimeUpText();
    startTimer();
}

function quizResult() {
    document.querySelector(".total-questions").innerHTML = myApp.length;
    document.querySelector(".total-attempt").innerHTML = attempt;
    document.querySelector(".total-correct").innerHTML = score;
    document.querySelector(".total-wrong").innerHTML = attempt - score;
    const percentage = (score / (myApp.length)) * 100;
    document.querySelector(".percentage").innerHTML = Math.floor(percentage) + "%";
    sessionStorage.setItem("score1", score);   sendscore();
}

let namesAndScores = JSON.parse(localStorage.getItem("namesAndScores"));

    if (namesAndScores === null) {
        namesAndScores = [
                {"name": "Melody",
                "score": "100%"}
        ]
    };

function resetQuiz() {
    attempt = 0;
    // questionIndex = 0;
    score = 0;
    number = 0;
    myArray = [];
}

function quizOver() {
    nextQuestionBtn.classList.remove("show");
    seeResultBtn.classList.add("show");
}

seeResultBtn.addEventListener("click", () => {
    // quizBox.style.display = "none";
    quizBox.classList.remove("show");
    seeResultBtn.classList.remove("show");
    quizOverBox.classList.add("show");
    quizResult();
})

startAgainQuizBtn.addEventListener("click", () => {
    quizBox.classList.add("show");
    quizOverBox.classList.remove("show");
    resetQuiz();
    nextQuestion();
})

goHomeBtn.addEventListener("click", () => {
    quizOverBox.classList.remove("show");
    quizHomeBox.classList.add("show");
    resetQuiz();
})

startQuizBtn.addEventListener("click", () => {
    quizBox.classList.add("show");
    quizHomeBox.classList.remove("show");
    startTimer();
    generateRandomQuestion();
})

// // window.onload = () => {
//     // load();
//     startTimer();
//     generateRandomQuestion();
// }