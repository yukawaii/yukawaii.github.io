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
//турнирная табличка
/*
var userid=0;

  function getid(){
    bridge.send('VKWebAppGetUserInfo')
.then(data => {console.log(data.id);
    // *назначение переменных*
userid = data.id;
})
.catch(error => console.log(error));
  }

  getid();
  var token="0";
function gettoken(){
    bridge.send("VKWebAppGetAuthToken", { 
        "app_id": 8171561, 
        "scope": "friends,status"
      })
      .then(data => {console.log(data);
        token=data;
})
.catch(error => console.log(error)); }

gettoken();

function getsc(){
  bridge.send("VKWebAppCallAPIMethod", {"method": "apps.getScore", "request_id": "32test", "params":
 {"user_id":userid,
   "v": "5.131", 
   "access_token":token}})
.then(data => {console.log(data); score=data;
})
.catch(error => console.log(error)); }

getsc();
  //отправка очков в вк
  function ressend(){
bridge.send("VKWebAppCallAPIMethod", {"method": "secure.addappEvent", "request_id": "32test", "params":
 {"user_id":userid,
  "activity_id":2,
   "value":score, 
   "v": "5.1", 
   "access_token":"a79a560da79a560da79a560d9da7e6e624aa79aa79a560dc51cd511726b4813a807b9ec"}})
.then(response => {console.log("Ответ на добавление очков:" + response);
})
.catch(error => console.log(error)); }

  function top1(){
    bridge.send("VKWebAppShowLeaderBoardBox", {user_result: score, global:1})
    .then(data => console.log(data.success))  
   .catch(error => console.log(error));
    } */