//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться
function share1(){
bridge.send("VKWebAppShare", {"text": "Интересные игры!", "link": "https://vk.ru/app8177204"});
}
function share2(){
  bridge.send("VKWebAppShowWallPostBox", {
    "message": "Классная викторина про животных!",
    "attachments": "https://vk.ru/app8177204"
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
let scorsum=0;

function getinfo(){
  bridge.send('VKWebAppGetUserInfo')
  .then(data => {userid = data.id; console.log("data_id: " + data.id + " MY userid: " + userid);
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
        "access_token":"bd17d005bd17d005bd17d00549bd6b1b43bbd17bd17d005df87316362d28b5eab868dac", global:1}})
      .then(data => {console.log("Очков на вк:" + data.response);
        // *назначение переменных*
     (score2 = data.response);
        return data.response;
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
  {"client_secret":"Pl4TYB00x4HZc4SiqXhj", 
  "user_id":userid, "activity_id":2, "value":scorsum, "v":"5.131",
   "access_token":"bd17d005bd17d005bd17d00549bd6b1b43bbd17bd17d005df87316362d28b5eab868dac",
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

