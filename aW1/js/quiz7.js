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
        question: "<img src = '../mem/img/80.png' width='250' height='250' />",
        options: ["Грач", "Галка", "Ворон", "Сорока"],
        answer: 2,
        description: "Ворон. Перед образованием пары самец демонстрирует самке виртуозность своего полета, красоту голоса и умение добывать пищу.",
    }, {
        question: "<img src = '../mem/img/81.png' width='250' height='250' />",
        options: ["Волк", "Лис", "Хаски", "Овчарка"],
        answer: 0,
        description: "Волк серый. Известны случаи, когда стая разделялась — кто-то оставался в засаде, пока иные атакуют",
    },{
        question: "<img src = '../mem/img/82.png' width='250' height='250' />",
        options: ["Кобра", "Уж водяной", "Кукабара", "Анаконда"],
        answer: 1,
        description: "Уж водяной. Ночью отдыхает на суше, греется в лучах утреннего солнца — и отправляется на охоту.",
    },{
        question: "<img src = '../mem/img/83.png' width='250' height='250' />",
        options: ["Ястреб", "Стервятник", "Орёл", "Орлан"],
        answer: 3,
        description: "Орлан белоголовый. Находится на вершине экологической пирамиды и не имеет врагов в природе.",
    },{
        question: "<img src = '../mem/img/84.png' width='250' height='250' />",
        options: ["Заяц-беляк", "Кролик-беляк", "Заяц-бегун", "Кролик дикий"],
        answer: 0,
        description: "Заяц-беляк. Зарывается в теплый приречный песок, чтобы прогнать блох.",
    },{
        question: "<img src = '../mem/img/85.png' width='250' height='250' />",
        options: ["Геккон", "Ящерица", "Саламандра", "Тритон"],
        answer: 3,
        description: "Тритон обыкновенный. С октября по март пребывает в состоянии спячки, а весной выбирается из укрытия",
    },
    {
        question: "<img src = '../mem/img/86.png' width='250' height='250' />",
        options: ["Соловей", "Воробей", "Кукушка", "Сорока"],
        answer: 2,
        description: "Кукушка обыкновенная ведет одиночный образ жизни, не обременена постройкой гнезда и насиживанием яиц.",
    }, {
        question: "<img src = '../mem/img/87.png' width='250' height='250' />",
        options: ["Волк", "Медведь", "Морж", "Собака"],
        answer: 1,
        description: "Медведь бурый. Метит свою территорию, оставляя «задиры» — специальные отметины на коре.",
    },{
        question: "<img src = '../mem/img/88.png' width='250' height='250' />",
        options: ["Барсук", "Крот", "Мышь", "Енот"],
        answer: 1,
        description: "Крот европейский. ется дождевыми червями, реже — слизнями, многоножками, пауками и личинками.",
    },{
        question: "<img src = '../mem/img/89.png' width='250' height='250' />",
        options: ["Орлан", "Стервятник", "Беркут", "Ястреб"],
        answer: 2,
        description: "Беркут. При парении задний край крыла беркута напоминает английскую букву S.",
    },{
        question: "<img src = '../mem/img/90.png' width='250' height='250' />",
        options: ["Лисица", "Колли", "Хаски", "Волк рыжий"],
        answer: 0,
        description: "Лисица рыжая.У каждой пары есть своя территория с достаточным количеством пищи и норой.",
    },{
        question: "<img src = '../mem/img/91.png' width='250' height='250' />",
        options: ["Дельфин", "Рыба-молот", "Кит", "Косатка"],
        answer: 3,
        description: "Косатка считается опаснейшим хищником морей и океанов, английское название killer whale — «кит-убийца».",
    },
    {
        question: "<img src = '../mem/img/92.png' width='250' height='250' />",
        options: ["Журавль", "Аист", "Фламинго", "Цапля"],
        answer: 1,
        description: "Аист черный. Скрытная птица, про нее известно немного. Зимует в Африке.",
    },{
        question: "<img src = '../mem/img/93.png' width='250' height='250' />",
        options: ["Муравьед", "Крот", "Ёж", "Енот"],
        answer: 2,
        description: "Еж европейский.Самцы устраивают ожесточенные бои, добиваясь внимания самок: могут кусаться, громко фыркать, толкать друг друга",
    },{
        question: "<img src = '../mem/img/94.png' width='250' height='250' />",
        options: ["Муравей бурый", "Муравей карий", "Муравей чёрный", "Муравей рыжий"],
        answer: 3,
        description: "Муравей рыжий лесной.  Предпочитает хвойные леса, сластёна.",
    },{
        question: "<img src = '../mem/img/95.png' width='250' height='250' />",
        options: ["Сойка", "Соловей", "Снегирь", "Воробей"],
        answer: 0,
        description: "Сойка обыкновенная. На юге это оседлая птица, а в северных регионах — мигрирующая или кочующая.",
    },
    {
        question: "<img src = '../mem/img/96.png' width='250' height='250' />",
        options: ["Корова", "Олень", "Лось", "Як"],
        answer: 2,
        description: "Лось.  Основа рациона — лишайники, грибы и ягоды. Зимой обгрызает кору деревьев. ",
    },{
        question: "<img src = '../mem/img/97.png' width='250' height='250' />",
        options: ["Лисица", "Окунь", "Медуза", "Рыба-кит"],
        answer: 0,
        description: "Лисица морская, или скат колючий. Питается донными ракообразными, иногда мелкой рыбой.",
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