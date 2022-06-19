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

const myApp = [{
    question: "<img src = '../mem/img/7.png' width='250' height='250' />",
    options: ["Опоссум", "Кенгуру", "Утконос", "Тушканчик"],
    answer: 1,
    description: "Кенгуру восточный серый. Хвост служит опорой, когда кенгуру стоит, и помогает балансировать при прыжках.",
}, {
    question: "<img src = '../mem/img/10.png' width='250' height='250' />",
    options: ["Утка", "Гусь", "Курица", "Голубь"],
    answer: 1,
    description: "Гусь куриный. Умеет быстро бегать и, в отличие от других гусей, не любит плавать.",
}, {
    question: "<img src = '../mem/img/9.png' width='250' height='250' />",
    options: ["Дельфин", "Акула серая", "Кит", "Акула белая"],
    answer: 1,
    description: "Акула серая рифовая. Проявляет интерес ко всему, что движется, и охотится по ночам.",
}, {
    question: "<img src = '../mem/img/8.png' width='250' height='250' />",
    options: ["Кукушка", "Соловей", "Выпь", "Дятел"],
    answer: 2,
    description: "Выпь малая. При опасности вытягивается по стойке смирно и становится практически незаметной.",
  /*  description: "The answer is innerHTML.", Тут можно добавить пояснения к ответу */
}, {
    question: "<img src = '../mem/img/6.png' width='250' height='250' />",
    options: ["Панда", "Коала", "Лемур", "Ленивец"],
    answer: 1,
    description: "Коала. Активна ночью, а днем предпочитает спать, уютно устроившись в кронах эвкалиптовых деревьев.",
},

{
    question: "<img src = '../mem/img/2.png' width='250' height='250' />",
    options: ["Рыба-пила", "Золотая", "Рыба анемоновая", "Рыба-Немо"],
    answer: 2,
    description: "Живут внутри ядовитых растений-актиний, заботятся о них. А актинии защищают анемонов.",
}, {
    question: "<img src = '../mem/img/3.png' width='250' height='250' />",
    options: ["Тушканчик", "Дрозд", "Лорикет", "Перепёл"],
    answer: 2,
    description: "Лорикет многоцветный. На конце его языка есть специальная щеточка. Он собирает ей нектар цветов, участвуя в опылении.",

}, {
    question: "<img src = '../mem/img/4.png' width='250' height='250' />",
    options: ["Дракон", "Саламандра", "Ящерица", "Змея"],
    answer: 2,
    description: "Ящерица плащеносная. При опасности открывает пасть и оттопыривает свой воротник, пугая противника. Может становиться на задние лапы, шипеть.",
}, {
    question: "<img src = '../mem/img/5.png' width='250' height='250' />",
    options:["Ламинария", "Тряпичник", "Анемоновая рыба", "Актиния"],
    answer: 1,
    description: "В целях защиты все тело тряпичников покрыто мелкими шипами.",

}, {
    question: "<img src = '../mem/img/1.png' width='250' height='250' />",
    options: ["Калибри", "Kанарейка", "Синица", "Шалашник"],
    answer: 3,
    description: "Шалашник атласный. Самцы строят шалаши и украшают их синими блестящими предметами, т.к. самкам нравится синий.",
},
//  CA-line
{
    question: "<img src = '../mem/img/11.png' width='250' height='250' />",
    options: ["Ехидна", "Ёж", "Броненосец", "Выдра"],
    answer: 0,
    description: "Ехидна австралийская. В её клюве есть электрорецепторы. Она улавливает колебания электрических полей, возникающие при движении, и ориентируется по ним.",
}, {
    question: "<img src = '../mem/img/12.png' width='250' height='250' />",
    options: ["Краб", "Рыба анемоновая", "Тряпичник", "Креветка"],
    answer: 3,
    description: "Креветка анемоновая. Не агрессивна по отношению к другим обитателям рифов, живёт в симбиозе с актинией.",

}, {
    question: "<img src = '../mem/img/13.png' width='250' height='250' />",
    options: ["Аист", "Журавль", "Пеликан", "Лебедь"],
    answer: 2,
    description: "Пеликан австралийский. Способен развить скорость до 56 км/ч.",
}, {
    question: "<img src = '../mem/img/14.png' width='250' height='250' />",
    options:["Выпь", "Дьявол", "Кот", "Лис"],
    answer: 1,
    description: "Тасманский дьявол. . Днем спит в укрытии, обустроив себе гнездо из травы, листьев и древесной коры.",

}, {
    question: "<img src = '../mem/img/15.png' width='250' height='250' />",
    options: ["Рыба-молот", "Пиранья", "Шишечник", "Тряпичник"],
    answer: 2,
    description: "Шишечник австралийский. Вибрируя грудными плавниками, он может издавать различные звуки и светится в темноте.",
},
{
    question: "<img src = '../mem/img/16.png' width='250' height='250' />",
    options: ["Утка-мандаринка", "Казарка", "Савка", "Утка Итона"],
    answer: 3,
    description: "Утка Итона древесная. Имеет длинные сильные ноги, может усаживаться на ветку дерева.",
}, {
    question: "<img src = '../mem/img/17.png' width='250' height='250' />",
    options: ["КА", "Казуар", "НУ", "КИ"],
    answer: 1,
    description: "Казуар шлемоносный. Ест мелких рептилий, амфибий, насекомых и моллюсков. Лакомится упавшими фруктами или плодами.",

}, {
    question: "<img src = '../mem/img/18.png' width='250' height='250' />",
    options: ["Муравей", "Саранча", "Тля", "Гусеница"],
    answer: 0,
    description: "Муравей-портной азиатский. Одни муравьи сворачивают из листьев конверты, а другие сшивают их паутинными нитями",
}, {
    question: "<img src = '../mem/img/19.png' width='250' height='250' />",
    options:["Какаду", "Голубь", "Воробей", "Соловей"],
    answer: 0,
    description: "Какаду розовый. У них есть птичьи «детские сады», в которых птенцы вместе обучаются навыкам взрослой жизни.",

}, {
    question: "<img src = '../mem/img/20.png' width='250' height='250' />",
    options: ["Тушканчик", "Броненосец", "Муравьед", "Белка"],
    answer: 2,
    description: "Муравьед сумчатый. Спит в дуплах или неглубоких норах. Сон крепкий, многие гибнут от пожаров, не успевая проснуться.",
},
{
    question: "<img src = '../mem/img/21.png' width='250' height='250' />",
    options: ["Пиранья", "Тапочник", "Шишечник", "Солнечник"],
    answer: 3,
    description: "Солнечник. Способен менять окраску, маскируясь под окружающую обстановку.",
}, {
    question: "<img src = '../mem/img/22.png' width='250' height='250' />",
    options: ["Кукабара", "Чупакабра", "Дрозд", "Канарейка"],
    answer: 0,
    description: "Кукабара смеющаяся. Гнездится в дуплах эвкалиптовых деревьев. Издает звуки, напоминающие человеческий смех.",

}, {
    question: "<img src = '../mem/img/23.png' width='250' height='250' />",
    options: ["Скорпион", "Краб", "Молох", "Тарантул"],
    answer: 2,
    description: "У каждого молоха есть своя небольшая территория с убежищем и уборной (это очень чистоплотные ящерицы)",
}, {
    question: "<img src = '../mem/img/24.png' width='250' height='250' />",
    options:["Молох", "Мурена", "Кукабара", "Саламандра"],
    answer: 1,
    description: "Мурена гигантская. Охотится в паре с морским окунем, который трясёт головой около её убежища, зовя на охоту.",

}, {
    question: "<img src = '../mem/img/26.png' width='250' height='250' />",
    options: ["Корелла", "Куропатка", "Соловей", "Перепёлка"],
    answer: 0,
    description: "Корелла. Превосходно прыгает по земле, лазит по стволам и веткам деревьев. Недовольство выражает неприятным криком. ",
},{
    question: "<img src = '../mem/img/25.png' width='250' height='250' />",
    options: ["Волк", "Гиена", "Лисица", "Собака"],
    answer: 3,
    description: "Собака динго. Динго ведет ночной образ жизни, предпочитает охотиться и общаться с другими собаками днем.",
},{
    question: "<img src = '../mem/img/27.png' width='250' height='250' />",
    options: ["Краб", "Прыгун", "Жаба", "Скакун"],
    answer: 1,
    description: "Прыгун илистый. Эта рыба может жить на берегу или мелководье. Большую часть времени проводит, зарывшись в грязь.",
},{
    question: "<img src = '../mem/img/28.png' width='250' height='250' />",
    options: ["Ворона", "Синица", "Галка", "Дрозд"],
    answer: 0,
    description: "Ворона-свистун. Нередко атакуют велосипедистов, считая их потенциальной угрозой. Моногамная птица.",
},{
    question: "<img src = '../mem/img/29.png' width='250' height='250' />",
    options: ["Крокодил", "Саламандра", "Варан", "Ящерица"],
    answer: 2,
    description: "Варан гигантский.  Умеет бегать как на четырех, так и на двух задних лапах.",
},{
    question: "<img src = '../mem/img/30.png' width='250' height='250' />",
    options: ["Муравьед", "Утконос", "Броненосец", "Варан"],
    answer: 1,
    description: "Утконос. Клюв мягкий и покрыт голой эластичной кожей.",
}]


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
    sessionStorage.setItem("score1", score);
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