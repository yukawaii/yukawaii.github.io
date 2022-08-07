//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться
function share1(){
bridge.send("VKWebAppShare", {"text": "Интересные игры!", "link": "https://vk.com/app8177204"});
}
function share2(){
  bridge.send("VKWebAppShowWallPostBox", {
    "message": "Классная викторина про животных!",
    "attachments": "https://vk.com/app8177204"
  });
}

function favor1(){
bridge.send("VKWebAppAddToFavorites");
}

function myAdd1(){
  bridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}
function joingroup(){
  bridge.send("VKWebAppJoinGroup", {"group_id": 213417231});
}

//пригласить друзей в игру
function infr(){
  bridge.send("VKWebAppShowInviteBox", {})
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
  bridge.send('VKWebAppGetUserInfo')
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
      bridge.send("VKWebAppCallAPIMethod", {"method": "apps.getScore", "request_id": "getscore", "params":
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
  bridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "appevent", "params": 
  {"client_secret":"n34FNAF7MZWUhCKmUEZX", 
  "user_id":userid, "activity_id":2, "value":scorsum, "v":"5.131",
   "access_token":"622a2818622a2818622a2818276256f0986622a622a281800bc642eaaa7170413f766fd",
   "global":1}})
   .then(data => {console.log("Ответ на добавление очков:" + data.response);
  })
  .catch(error => console.log(error)); }

  //доска топ

  function showLeaderBoard(scorsum)
{
  var scorsum = sessionStorage.getItem('scorsum');
	vkBridge.send("VKWebAppShowLeaderBoardBox", {user_result:scorsum, global:1})
         .then(data => console.log(data.success))  
         .catch(error => console.log(error));
}

function sendmes(){
bridge.send("VKWebAppCallAPIMethod", {
  "method": "messages.send",
  "request_id": "sendOrder",
  "params": {
      "user_id": user_id,
      "v": "5.102",
      "random_id": guid,
      "peer_id": group_id,
      "message": sendInfo,
      "access_token": token
  }
})}