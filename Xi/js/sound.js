const SFX = {
     bgmusic: new Audio(),
    played : false
}

SFX.bgmusic.src = "./images/bgmusic.mp3"
SFX.bgmusic.volume = .0;

//чтобы музыка повторялась 
if (typeof SFX.bgmusic.loop == 'boolean')
{
   SFX.bgmusic.loop = true;
}
else
{
   SFX.bgmusic.addEventListener('ended', function() {
       this.currentTime = 0;
       this.play();
   }, false);
}

//проверка вкл или выкл звуки
var mut = true;
//выключить звуки
function mutebtn() {
   if (mut===false){
                      SFX.bgmusic.volume = .0
   mut=true;
   SFX.bgmusic.pause ();
}
   // иначе - включить. Кнопка одна для вкл выкл
   else {
             SFX.bgmusic.volume = .03
       mut = false;
       SFX.bgmusic.play();
   }
}