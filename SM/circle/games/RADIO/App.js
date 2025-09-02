/* инициализация
const bridge = vkBridge.default;
vkBridge.subscribe((e) => console.log("vkBridge event", e));
vkBridge.send("VKWebAppInit", {});   */

//поделиться
function share2(){
  vkBridge.send("VKWebAppShowWallPostBox", {
    "message": "Японское радио!",
    "attachments": "https://vk.ru/app51531990"
  });
}

function favor1(){
  vkBridge.send("VKWebAppAddToFavorites");
}

function myAdd1(){
  vkBridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}
function joingroup(){
  vkBridge.send("VKWebAppJoinGroup", {"group_id": 213417231});
}

//пригласить друзей в игру
function infr(){
  vkBridge.send("VKWebAppShowInviteBox", {})
  .then(data => console.log(data.success))  
 .catch(error => console.log(error));
}
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////
var userid;
function getinfo(){
  vkBridge.send('VKWebAppGetUserInfo')
  .then(function (data) {userid = data.id; console.log("data_id: " + data.id + " MY userid: " + userid);
  sessionStorage.setItem("userid", userid);
      // *назначение переменных*
      return userid;
      
  })
  .catch(error => console.log(error));
 // getsc();
  
};
    
function sendmes(){
  
  vkBridge.send("VKWebAppCallAPIMethod", {
  "method": "messages.send",
  "request_id": "sendOrder",
  "params": {
      "user_id": userid,
      "v": "5.102",
      "random_id": "random id "+ Math.random(),
      "peer_id": 213417231,
      "message": "Помоги разработчику: пройди опрос, оставь замечания по приложению! <br> http://",
      "access_token": "622a2818622a2818622a2818276256f0986622a622a281800bc642eaaa7170413f766fd"
  }
})}