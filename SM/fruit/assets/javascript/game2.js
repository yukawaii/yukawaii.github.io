// global variables

var target = 0;
var wins = 0;
var losses = 0;
var yourScore = 0;



// make 1st fruit element add class and image src

var fruits = {
    blackberry: {
        points: Math.floor(Math.random() * (12)) + 1,
        img: "assets/images/blackberry.png",
        attr: blackberry,
    },
    grapefruit: {
        points: Math.floor(Math.random() * (12)) + 1,
        img: "assets/images/grapefruit.png",
        attr: grapefruit,
    },
    banana: {
        points: Math.floor(Math.random() * (12)) + 1,
        img: "assets/images/banana.png",
        attr: banana,
    },
    pomegranate: {
        points: Math.floor(Math.random() * (12)) + 1,
        img: "assets/images/pomegranate.png",
        attr: pomegranate,
       
    },
    
   
};

