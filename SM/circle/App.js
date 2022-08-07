//инициализация
const bridge = vkBridge.default;
vkBridge.subscribe((e) => console.log("vkBridge event", e));
vkBridge.send("VKWebAppInit", {});

//поделиться
function share2(){
  vkBridge.send("VKWebAppShowWallPostBox", {
    "message": "Классная игра для изучения японского языка!",
    "attachments": "https://vk.com/app8181888"
  });
}

function favor1(){
bridge.send("VKWebAppAddToFavorites");
}

function myAdd1(){
  vkBridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}
function joingroup(){
  vkBridge.send("VKWebAppJoinGroup", {"group_id": 213417231});
}

//пригласить друзей в игру
function infr(){
  vkBridge.send("VKWebAppShowInviteBox", {})
  .then(data => console.log(data.success))  
 .catch(error => console.log(error));
}
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////
var userid;
let score1=0; 
sessionStorage.setItem('score1', score1);
let scorsum=0;

function getinfo(){
  vkBridge.send('VKWebAppGetUserInfo')
  .then(function (data) {userid = data.id; console.log("data_id: " + data.id + " MY userid: " + userid);
  sessionStorage.setItem("userid", userid);
      // *назначение переменных*
      return userid;
      
  })
  .catch(error => console.log(error));
 // getsc();
  
};
    
     //получение очков из вк
   function getsc(){
    vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "appevent", "params": 
    {"client_secret":"n34FNAF7MZWUhCKmUEZX", 
    "user_id":userid, "activity_id":2, "value":1, "v":"5.131",
     "access_token":"622a2818622a2818622a2818276256f0986622a622a281800bc642eaaa7170413f766fd",
     "global":1}});
     vkBridge.send("VKWebAppCallAPIMethod", {"method": "apps.getScore", "request_id": "getscore", "params":
       {"user_id": userid, "v":"5.131",
        "access_token":"622a2818622a2818622a2818276256f0986622a622a281800bc642eaaa7170413f766fd", global:1}})
      .then(data => {console.log("Очков на вк:" + data.response);
        // *назначение переменных*
     (score2 = data.response);
        return score2;
      })
      .catch(error => console.log(error));} ;


  //отправка очков в вк
  function sendscore(){
    getsc();
    var userid = sessionStorage.getItem('userid');
  
    var score1 = sessionStorage.getItem('score1');
    var scorsum= score1+score2;
    sessionStorage.setItem("scorsum", scorsum);
    vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "appevent", "params": 
  {"client_secret":"n34FNAF7MZWUhCKmUEZX", 
  "user_id":userid, "activity_id":2, "value":scorsum, "v":"5.131",
   "access_token":"622a2818622a2818622a2818276256f0986622a622a281800bc642eaaa7170413f766fd",
   "global":1}})
   .then(data => {console.log("Ответ на добавление очков:" + data.response);
  })
  .catch(error => console.log(error)); }

  //доска топ

 


  function showLeaderboard(scorsum) {
    scorsum = sessionStorage.getItem('scorsum');
    if(isMobileOrTablet()) {
      vkBridge.send("VKWebAppShowLeaderBoardBox", {user_result: score})
        .then(data => console.log(data))  
        .catch(error => console.log(error));          
    } else {
      vkBridge.send("VKWebAppCallAPIMethod", 
        {
          "method": "apps.getLeaderboard", 
          "params": { "v": vkApiVersion, "access_token": accessToken, "type": "score", "global": 1, "extended": 1 } 
        }
      )
      .then(data => console.log(data))  
      .catch(error => console.log(error));          
    }
  }

function sendmes(){
  vkBridge.send("VKWebAppCallAPIMethod", {
  "method": "messages.send",
  "request_id": "sendOrder",
  "params": {
      "user_id": user_id,
      "v": "5.102",
      "random_id": "random id "+ Math.random(),
      "peer_id": 213417231,
      "message": "Помоги разработчику: пройди опрос, оставь замечания по приложению! <br> http://",
      "access_token": "622a2818622a2818622a2818276256f0986622a622a281800bc642eaaa7170413f766fd"
  }
})}