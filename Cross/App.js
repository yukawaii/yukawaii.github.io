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
function ressend(){
  bridge.send("secure.addAppEvent", {
      activity_id: 2,
      value: score1
  })}

  function top1(){
    bridge.send("secure.addAppEvent", {activity_id: 2, value: score1, global:1});
    bridge.send("VKWebAppShowLeaderBoardBox", {user_result: score1, global:1})
    .then(data => console.log(data.success))  
   .catch(error => console.log(error));
    } 
