//поделиться
function share1(){
bridge.send("VKWebAppShare", {"text": "Интересные игры!", "link": "vk.com/app8156273"});
}
function share2(){
  bridge.send("VKWebAppShowWallPostBox", {
    "message": "Игры для быстрого запоминания хираганы!",
    "attachments": "https://vk.com/app8165024"
  });
}

function favor1(){
bridge.send("VKWebAppAddToFavorites");
}
function myadd1(){
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
}

  function top1(){
    bridge.send("VKWebAppShowLeaderBoardBox", {user_result: score, global:1})
    .then(data => console.log(data.success))  
   .catch(error => console.log(error));
    } 
