const game = () =>{

    let pScore=0;
    let cScore=0;
    
    const PlayBtn = document.querySelector(".intro button");
    
    

    // start game
    const startGame = () =>{
        const intro = document.querySelector(".intro");
        const match = document.querySelector(".match");

        PlayBtn.addEventListener("click",()=>{
            intro.classList.replace("fadeIn","fadeOut");
            match.classList.remove("fadeOut","fadeIn");
        });
    };

    // choose options
    const PlayGame = () =>{
        
        const options = document.querySelectorAll(".options button");
        const playerHand = document.querySelector(".player-hand");
        const computerHand = document.querySelector(".computer-hand");
        const hands = document.querySelectorAll(".hands img");

        // remove animation
        hands.forEach(hand => {
            hand.addEventListener("animationend",()=>{
                hand.style.animation = "";
            });
        });
        
        // computer choise list
        const computerList = ["камень","бумага","ножницы"];

        options.forEach(option =>{
            option.addEventListener("click",()=>{
                
                const computerIndex = Math.floor(Math.random() * 3);
                const computerChoise = computerList[computerIndex];
                
                // default images
                playerHand.src = './assets/камень.png';
                computerHand.src = './assets/камень.png';

                // add animation
                playerHand.style.animation = "shakePlayer 2s ease";
                computerHand.style.animation = "shakeComputer 2s ease";

                setTimeout(()=>{
                    // update images
                    playerHand.src = './assets/' + option.textContent + '.png';
                    computerHand.src = './assets/' + computerChoise + '.png';

                    //  call compare
                    compareOption(option.textContent,computerChoise);

                    // call update score
                    updateScore();

                    // match winner
                    matchWinner();

                },2000);

                

            });
        });
    };

    // compare for the Round winner
    const compareOption = (playerChoise,computerChoise) => {
        const winner = document.querySelector(".winner");

        // checking for a tie
        if(playerChoise === computerChoise){
            winner.textContent = "Ничья";
            return;
        }

        // checking for a rock
        if(playerChoise === "камень"){
            if(computerChoise === "бумага"){
                winner.textContent = "Ты проиграл";
                cScore++;
                return;
            }else{
                winner.textContent = "Это победа!";
                pScore++;
                return;
            }
        }

        // checking for a paper
        if(playerChoise === "бумага"){
            if(computerChoise === "ножницы"){
                winner.textContent = "Комп победил";
                cScore++;
                return;
            }else{
                winner.textContent = "Победа твоя!";
                pScore++;
                return;
            }
        }

        // checking for a scissors
        if(playerChoise === "ножницы"){
            if(computerChoise === "камень"){
                winner.textContent = "Проигрыш";
                cScore++;
                return;
            }else{
                winner.textContent = "Победа!";
                pScore++;
                return;
            }
        }
    };

    // update score
    const updateScore = () =>{
        const playerScore = document.querySelector(".player-score p");
        const computerScore = document.querySelector(".computer-score p");

        playerScore.textContent = pScore;
        computerScore.textContent = cScore;
    };

    // check for match winner
    const matchWinner = () =>{
        const matchWinner = document.querySelector(".title");
        const match = document.querySelector(".match");
        const end = document.querySelector(".end");

        if(pScore === 5){
            matchWinner.textContent = "Кубок твой!";
            match.classList.remove("fadeIn");
            match.classList.add("fadeOut");
            end.classList.remove("fadeOut");
            end.classList.add("fadeIn");
            
        }else if(cScore === 5){
            matchWinner.textContent = "Кубок у компьютера.";
            match.classList.remove("fadeIn");
            match.classList.add("fadeOut");
            end.classList.remove("fadeOut");
            end.classList.add("fadeIn");
        }
    };

    // reset the game
    const PlayAgain = () =>{
        const match = document.querySelector(".match");
        const end = document.querySelector(".end");
        const PlayAgainBtn = document.querySelector(".end button");
        const playerHand = document.querySelector(".player-hand");
        const computerHand = document.querySelector(".computer-hand");


        PlayAgainBtn.addEventListener("click",() => {
            playerHand.src = "./assets/камень.png";
            computerHand.src = "./assets/камень.png";
            pScore = 0;
            cScore = 0;

            // call update score
            updateScore();

            match.classList.remove("fadeOut");
            match.classList.add("fadeIn");
            end.classList.remove("fadeIn");
            end.classList.add("fadeOut");
        });
    };
    

    
    // call inner functions
    startGame();
    PlayGame();
    PlayAgain();

};

// start game
game();