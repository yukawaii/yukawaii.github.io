//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться

function share1(){
  bridge.send("VKWebAppShowWallPostBox", {
    "message": "Аниме-пазлы на каждый день!",
    "attachments": "https://vk.com/animepuzz"
  });
}
function favor1(){
bridge.send("VKWebAppAddToFavorites");
}

//между экранами
function myadd2(){
  bridge.send("VKWebAppCheckNativeAds", {"ad_format": "interstitial"});
  bridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}

