//import { score1 } from './index.js';
//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться
function share1(){
  bridge.send("VKWebAppShowWallPostBox", {
    "message": "Интересная игра!",
    "attachments": "https://vk.com/app8171561"
  });
}

function favor1(){
bridge.send("VKWebAppAddToFavorites");
}
function myadd1(){
  bridge.send("VKWebAppCheckNativeAds", {"ad_format": "interstitial"});
  bridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}
function joingroup(){
  bridge.send("VKWebAppJoinGroup", {"group_id": 213417231});
}
function myadd2(){
  bridge.send("VKWebAppCheckNativeAds", {"ad_format": "reward"});
  bridge.send("VKWebAppShowNativeAds", {ad_format:"reward"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}
//пригласить друзей в игру
function infr(){
  bridge.send("VKWebAppShowInviteBox", {})
}
var token;
var userid; 

function getinfo(){
bridge.send('VKWebAppGetUserInfo')
.then(data => {userid = data.id; console.log("data_id: " + data.id + "MY userid: " + userid);
    // *назначение переменных*
})
.catch(error => console.log(error));
getsc();}
  
    //получение очков из вк
    /* рабочая  function getsc(){
    bridge.send("VKWebAppCallAPIMethod", {"method": "apps.getScore", "request_id": "getscore", "params":
     {"user_id": userid, "v":"5.131",
      "access_token":"a79a560da79a560da79a560d9da7e6e624aa79aa79a560dc51cd511726b4813a807b9ec", global:1}})
    .then(data => {console.log("Очков на вк:" + data.response);
      // *назначение переменных*
      score2 = data.response;
    })
    .catch(error => console.log(error));}   возвращает очки в консоль верно */

    const score2 = () => { bridge.send("VKWebAppCallAPIMethod", 
    {"method": "apps.getScore", "request_id": "getscore", "params":
    {"user_id": userid, "v":"5.131",
     "access_token":"a79a560da79a560da79a560d9da7e6e624aa79aa79a560dc51cd511726b4813a807b9ec", global:1}})
    
  return data.response;
};
/*
function getsc(){
const score2 = bridge.send("VKWebAppCallAPIMethod",
  {
    "method": "apps.getScore", "request_id": "getscore", "params": 
    {
      "user_id": userid, "v":"5.131", 
      "access_token":"a79a560da79a560da79a560d9da7e6e624aa79aa79a560dc51cd511726b4813a807b9ec", global:1
    }
  }
);

return score2;
}   */


//отправка очков в вк
function sendscore(){
bridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "appevent", "params": 
{"client_secret":"qp47UOdcqJmW94rKknxR", 
"user_id":userid, "activity_id":2, "value":score1, "v": "5.131", "access_token":"a79a560da79a560da79a560d9da7e6e624aa79aa79a560dc51cd511726b4813a807b9ec", global:1}})
.then(r => {console.log("Ответ на добавление очков:" + r.response);
})
.catch(error => console.log(error)); }

function top1(){
  sendscore();
 // getsc();
if (typeof score2 === 'undefined' || score2 === null){
bridge.send("VKWebAppShowLeaderBoardBox", {"user_result": score1, "global":1})
.then(data => console.log("Score2 андифайн. Скор1: : " + data.success))  
.catch(error => console.log("Score2андифайношибка: " +error +"score1: " + score1));   sendscore();}
else {
  bridge.send("VKWebAppShowLeaderBoardBox", {"user_result": score2, "global":1})
.then(data => console.log("Score2: " + data.success))  
.catch(error => console.log("Score2ошибка: " + error));}
}
