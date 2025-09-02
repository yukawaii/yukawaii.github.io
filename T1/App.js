//инициализация

vkBridge.subscribe((e) => console.log("vkBridge event", e));
vkBridge.send("VKWebAppInit", {});

//поделиться
function share2(){
  vkBridge.send("VKWebAppShowWallPostBox", {
    "message": "Тетрис прямо как на приставке!",
    "attachments": "https://vk.ru/app8167395"
  });
}

function favor1(){
  vkBridge.send("VKWebAppAddToFavorites");
}
function myadd1(){
  vkBridge.send("VKWebAppCheckNativeAds", {"ad_format": "interstitial"});
  vkBridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}

function myadd2(){
  bridge.send("VKWebAppCheckNativeAds", {"ad_format": "reward"});
  bridge.send("VKWebAppShowNativeAds", {ad_format:"reward"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}

// function joingroup(){
//   bridge.send("VKWebAppJoinGroup", {"group_id": 213417231});
// }
//     <button class = "iksweb" onclick="pauseGame(); myadd2()">Пауза</button><br />*/

//Top-table
