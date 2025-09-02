//поделиться
function share2(){
  vkBridge.send("VKWebAppShowWallPostBox", {
    "message": "Интересная викторина про животных!",
    "attachments": "https://vk.ru/app8177204"
  });
}

function favor1(){
  vkBridge.send("VKWebAppAddToFavorites");
}
function myadd1(){
  vkBridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}
// function joingroup(){
//  vkBridge.send("VKWebAppJoinGroup", {"group_id": 213417231});}
//пригласить друзей в игру
function infr(){
  vkBridge.send("VKWebAppShowInviteBox", {})
}
