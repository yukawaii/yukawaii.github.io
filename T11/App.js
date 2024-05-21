//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться
function share2(){
  bridge.send("VKWebAppShowWallPostBox", {
    "message": "Тетрис прямо как на приставке!",
    "attachments": "https://vk.com/app8167395"
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
