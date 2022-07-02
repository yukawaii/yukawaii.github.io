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

function getinfo(){
  bridge.send('VKWebAppGetUserInfo')
  .then(data => {userid = data.id; console.log("data_id: " + data.id + " MY userid: " + userid);
  sessionStorage.setItem("userid", userid);
      // *назначение переменных*
      return userid;
      
  })
  .catch(error => console.log(error));
 // getsc();
  
}
    
     //получение очков из вк
   function getsc(){
      bridge.send("VKWebAppCallAPIMethod", {"method": "apps.getScore", "request_id": "getscore", "params":
       {"user_id": userid, "v":"5.131",
        "access_token":"6926f8496926f8496926f84999695a3e7d669266926f8490ba9c86b1a91f45b9c54eb0a", global:1}})
      .then(data => {console.log("Очков на вк:" + data.response);
        // *назначение переменных*
     (score2 = data.response);
        return data.response;
      })
      .catch(error => console.log(error));} 
  
  //отправка очков в вк
  function sendscore(){
    getsc();
    var userid = sessionStorage.getItem('userid');
    var score1 = sessionStorage.getItem('score1');
    var scorsum= score1+score2;
    sessionStorage.setItem("scorsum", scorsum);
  bridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "appevent", "params": 
  {"client_secret":"R1vw1yvDiH7viQAkPis4", 
  "user_id":userid, "activity_id":2, "value":scorsum, "v":"5.131",
   "access_token":"6926f8496926f8496926f84999695a3e7d669266926f8490ba9c86b1a91f45b9c54eb0a",
   "global":1}})
   .then(data => {console.log("Ответ на добавление очков:" + data.response);
  })
  .catch(error => console.log(error)); }

  //доска топ

  function showLeaderBoard(scorsum)
{
  var scorsum = sessionStorage.getItem('scorsum');
	bridge.send("VKWebAppShowLeaderBoardBox", {user_result:scorsum, global:1})
         .then(data => console.log(data.success))  
         .catch(error => console.log(error));
}

