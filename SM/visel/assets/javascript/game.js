$(function(){

	var userGuess = 7;
	var userWin = 0;
	var userLoss = 0;
	var trophyCount = 0;
	var wordCount = 1;
	var wordChoices = ["reserve", "potato", "steak", "jive", "cyclical", "garage", "institution", "express", "dinosaur", "viaduct", "delusion", "ankle", "jolly", "listing", "stimulation", "tense", "downstairs", "golf", "performance", "competition", "valuable", "accuracy", "equilibrium", "fiddle", "football", "stability", "maker", "tolerance", "travel", "audience", "overlook", "certainty", "newspaper", "agenda", "seminar", "envelope", "standpoint", "intended", "mumble", "customer", "seventh", "overseas"];
	var random = randomWord();
	var chosenWord = wordChoices[random].toUpperCase();
	var correctGuess = chosenWord.length;
	var gameWords = 4;
	var lettersGuessed = [];
	var arrayReset = [];

	function randomWord() {
  		return Math.floor(Math.random() * wordChoices.length);
	}

	function wordString(word) {
		for (i = 0; i < word.length; i++) {
			var wordLetter = $("<span>");
			$(wordLetter).attr('id', "letterID" + [i]);;
        	$(wordLetter).addClass("hiddenLetter visibleLetter");
        	$(wordLetter).text(word.slice(i,i+1));
        	$(wordLetter).attr("data-code", word.charCodeAt(i,i+1));
        	$("#display").append($(wordLetter));
		}
	}

	function userLetters(arr, val) {
  		return arr.some(function(arrVal) {
    	return val === arrVal;
  		});
	}

	function resetGame() {
		$(".letter-button").removeAttr("disabled");
		userGuess = 7;
		$("#guessesLeft").text("Wrong Guesses (" + userGuess + " left)");
		$("#guessesMade").addClass("filler");
		$("#guessesMade").text("none");
		$("#display").empty();
		wordChoices.splice(random, 1);
		arrayReset.push(chosenWord);
		gameWords--;
		if (gameWords >= 0) {
			wordCount++;
			$("#wordsLeft").text("Word " + wordCount + " of 5:");
			lettersGuessed = [];
			random = randomWord();
			chosenWord = wordChoices[random].toUpperCase();
			correctGuess = chosenWord.length;
			wordString(chosenWord);
		}
		else {
			if (userWin > userLoss) {
				trophyCount++;
				$("#trophies").text(trophyCount);
				$("#userTrophies").removeClass("filler");
				if (trophyCount == 1 ) {
					$("#userTrophies").html('<i class="fa fa-trophy" aria-hidden="true"></i>');
				}
				else {
					$("#userTrophies").append(" " + '<i class="fa fa-trophy" aria-hidden="true"></i>');
				}
			}
			var lowEnd = 65;
			var highEnd = 90;
			while(lowEnd <= highEnd){
				lettersGuessed.push(lowEnd++);
			}
			var resetBtn = $("<button>");
        	$(resetBtn).addClass("btn btn-danger reset-btn");
        	$(resetBtn).text("Play Again?");
        	$("#display").html('<h1 class="restart-text">Game Over!</h1><hr>');
        	$("#display").append(resetBtn);
        	$("#wordsLeft").empty();
		}
	}

	wordString(chosenWord);

	$(".btn-link").on("click", function() {
    	$("#mobileKeyboard").html('<div class="container"><div class="row"><div class="col-md-4 col-md-offset-4 col-sm-6 col-sm-offset-3"><div class="panel panel-default"><div id="keyboard" class="panel-body keyboard-panel"></div></div></div></div></div>');
    	var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    	for(i=0; i<letters.length; i++){
	        var letterBtn = $("<button>");
	        $(letterBtn).addClass("letter-button");
	        $(letterBtn).attr("data-letter", i + 65);
	        $(letterBtn).text(letters[i]);
	        $("#keyboard").append(letterBtn);
      	}
		location.href = "#mobileKeyboard";
    });

    $("#mobileKeyboard").on("click", ".letter-button", function() {
    	if (gameWords >= 0 && userLetters(lettersGuessed, parseInt($(this).attr("data-letter"))) == false) {
	    	lettersGuessed.push(parseInt($(this).attr("data-letter")));
	    	$(this).attr("disabled", "disabled");
			var e = new Event("keyup");
			e.keyCode = $(this).attr("data-letter");
			e.which = e.keyCode;
			document.dispatchEvent(e);
		}
		else if (gameWords >= 0 && userLetters(lettersGuessed, parseInt($(this).attr("data-letter"))) == true) {
			$(this).attr("disabled", "disabled");
		}
    });

	$(document).keyup(function(e) {
		var userChoice = String.fromCharCode(event.keyCode);
		userFail = 0;
        if (event.keyCode >= 65 && event.keyCode <= 90 && userLetters(lettersGuessed, event.keyCode) == false) {
        	lettersGuessed.push(event.keyCode);
        	for (i = 0; i < chosenWord.length; i++) {
        		var correctLetter = String.fromCharCode($("#letterID" + i.toString()).attr("data-code"));
	        	if (userChoice == correctLetter) {
	        		$("#letterID" + i.toString()).removeClass("hiddenLetter");
	        		correctGuess--;
	        		if (correctGuess == 0) {
	        			userWin++;
	        			$("#winningWords").removeClass("filler");
	        			$("#wins").text(userWin);
	        			if (userWin == 1) {
	        				$("#winningWords").text(chosenWord);
	        			}
	        			else {
	        				$("#winningWords").append(", " + chosenWord);
	        			}
	        			resetGame();
	        		}
	        	}
	        	else {
	        		userFail++;
	        	}
	        	if (userFail == chosenWord.length) {
	        		userGuess--;
		        	$("#guessesLeft").text("Wrong Guesses (" + userGuess + " left)");
	        		if (userGuess == 0) {
	        			userLoss++;
	        			$("#losingWords").removeClass("filler");
	        			$("#losses").text(userLoss);
	        			if (userLoss == 1) {
	        				$("#losingWords").text(chosenWord);
	        			}
	        			else {
	        				$("#losingWords").append(", " + chosenWord);
	        			}
	        			resetGame();
	        		}
	        		else if (userGuess == 6) {
	        			$("#guessesMade").removeClass("filler");
			            $("#guessesMade").text(userChoice);
			        }
			        else {
			            $("#guessesMade").append(", " + userChoice);
			        }
	        	}
	        }
    	}
    });

    $("#display").on("click", ".reset-btn", function() {
		lettersGuessed = [];
		$.merge(wordChoices, arrayReset)
		arrayReset = [];
    	$("#display").empty();
		userWin = 0;
		userLoss = 0;
		wordCount = 1;
		$("#wins").text(userWin);
		$("#losses").text(userLoss);
		$("#wordsLeft").text("Word " + wordCount + " of 5:");
		$("#winningWords").addClass("filler");
		$("#winningWords").text("(none)");
		$("#losingWords").addClass("filler");
		$("#losingWords").text("(none)");
       	random = randomWord();
		chosenWord = wordChoices[random].toUpperCase();
		correctGuess = chosenWord.length;
		gameWords = 4;
		wordString(chosenWord);
    });

});