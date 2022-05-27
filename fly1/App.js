//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться
function share1(){
  bridge.send("VKWebAppShowWallPostBox", {
    "message": "Очень сложная и интересная игра!",
    "attachments": "https://vk.com/app8176436"
  });
}

//пригласить друзей в игру
function infr(){
  bridge.send("VKWebAppShowInviteBox", {})
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
function myadd2(){
  bridge.send("VKWebAppCheckNativeAds", {"ad_format": "reward"});
  bridge.send("VKWebAppShowNativeAds", {ad_format:"reward"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}

function joingroup(){
  bridge.send("VKWebAppJoinGroup", {"group_id": 213417231});
}
//Top-table
function top1(){
  showLeaderboardBox({user_result:"integer"});
}