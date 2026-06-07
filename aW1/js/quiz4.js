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
 score = 0;
let number = 0;
let myArray = [];
let interval;

function getid(){
    vkBridge.send('VKWebAppGetUserInfo')
.then(data => {console.log(data);
    // *назначение переменных*
id = data.id;
name1=data.first_name;
sessionStorage.setItem('id', id);
setTimeout(function (){console.log("id^ "+ id);}, 3000);
})
.catch(error => console.log(error));
  }
  getid();
  function gettoken(){
    vkBridge.send("VKWebAppGetAuthToken", { 
            "app_id": 8177204, 
            "scope": "friends,status"
          })
          .then(data => {console.log(data);
            token=data.access_token;
            sessionStorage.setItem('token', token);
            console.log("token^ for"+ id + "is^  :"+ token);
    })
    .catch(error => console.log(error)); }
    
    gettoken();  
    function myadd1(){
        vkBridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
      .then(data => console.log(data.result))
      .catch(error => console.log(error));
      }




function sendscore(){
  sessionStorage.setItem('score',score);
  vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "32test", "params":
 {"client_secret":"R1vw1yvDiH7viQAkPis4",
    "user_id":id,
  "activity_id":2,
   "value":score, 
   "v": "5.131", 
   "access_token":"6926f8496926f8496926f84999695a3e7d669266926f8490ba9c86b1a91f45b9c54eb0a"}})
.then(data => {console.log("Ответ на добавление очков:" + data);
})
.catch(error => console.log(error)); }

     // missiya na 25 ochkov
      function mis1(){
        if (score===25){
        
            vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "mis1", "params":
             {"client_secret":"R1vw1yvDiH7viQAkPis4",
             "user_id":id,
              "activity_id":3,
                      "v": "5.131", 
               "access_token":"6926f8496926f8496926f84999695a3e7d669266926f8490ba9c86b1a91f45b9c54eb0a"}})
            .then(data => {console.log("Ответ на добавление очков:" + data);
            })
            .catch(error => console.log(error));  
        }
    }
const myApp = [
    {
        question: "<img src = '../mem/img/53.png' width='250' height='250' />",
        options: ["Белка-летяга", "Летучая мышь", "Летучая лисица", "Летуяий паук"],
        answer: 2,
        description: "Лисица летучая большая, или калонг, днём отдыхает, зацепившись лапками за ветви, а на закате вылетает на охоту.",
    }, 
    {
        question: "<img src = '../mem/img/54.png' width='250' height='250' />",
        options: ["Омар", "Разбойник", "Краб", "Вор"],
        answer: 3,
        description: "Вор пальмовый. У пальмового вора на личиночной стадии много врагов: осьминоги, киты, различные хищные рыбы.",
    }, {
        question: "<img src = '../mem/img/55.png' width='250' height='250' />",
        options: ["Кобра", "Угорь", "Гаттерия", "Крайт"],
        answer: 3,
        description: "Крайт ужевидный морской проводит большую часть жизни в воде, но часто выходит на сушу.",
    },{
        question: "<img src = '../mem/img/56.png' width='250' height='250' />",
        options: ["Горлица", "Петроика", "Дюгонь", "Казуар"],
        answer: 0,
        description: "Горлица зебровая полосатая. Любит траву и различные семена растений, поедает небольших насекомых.",
    },{
        question: "<img src = '../mem/img/57.png' width='250' height='250' />",
        options: ["Корелла", "Игуана", "Павлин", "Пингвин"],
        answer: 1,
        description: "Игуана фиджийская полосатая. Ночью забирается на верхушки деревьев для отдыха и сна.   ",
    },{
        question: "<img src = '../mem/img/58.png' width='250' height='250' />",
        options: ["Рак-радуга", "Краб-клоун", "Креветка-арлекин", "Рыба-моллюск"],
        answer: 2,
        description: "Креветка-арлекин голубая. Живут парами. Каждая пара охраняет свою территорию.",
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
    sendscore();
    mis1();
    myadd1();
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