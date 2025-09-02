//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться
function share1(){
bridge.send("VKWebAppShare", {"text": "Интересные игры!", "link": "https://vk.ru/app8165904"});
}
function share2(){
  bridge.send("VKWebAppShowWallPostBox", {
    "message": "Игры для быстрого запоминания катаканы!",
    "attachments": "https://vk.ru/app8165904"
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
// function joingroup(){
//   bridge.send("VKWebAppJoinGroup", {"group_id": 213417231});
// }
