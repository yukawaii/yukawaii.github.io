//поделиться
function share2(){
  vkBridge.send("VKWebAppShowWallPostBox", {
    "message": "Игры для быстрого запоминания катаканы!",
    "attachments": "https://vk.ru/app8165904"
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
//  vkBridge.send("VKWebAppJoinGroup", {"group_id": 213417231});
// }
//пригласить друзей в игру
function infr(){
  vkBridge.send("VKWebAppShowInviteBox", {})
}

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
