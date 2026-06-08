//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться

function share1(){
  bridge.send("VKWebAppShowWallPostBox", {
    "message": "Аниме-пазлы на каждый день!",
    "attachments": "https://vk.ru/animepuzz"
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
//  bridge.send("VKWebAppJoinGroup", {"group_id": 213417231});
// }

vkBridge.send('VKWebAppShowBannerAd', {
  banner_location: 'bottom' // Положение баннера: 'top' (наверху) или 'bottom' (внизу)
})
.then((data) => {
  if (data.result) {
    console.log('Баннер успешно отображается');
  }
})
.catch((error) => {
  console.error('Ошибка при показе баннера:', error);
});


