
var score,id, name1;

function getid(){
    vkBridge.send('VKWebAppGetUserInfo')
.then(data => {console.log(data);
    // *назначение переменных*
id = data.id;
name1=data.first_name;
sessionStorage.setItem('id', id);
setTimeout(function (){console.log("id^ "+ id);}, 3000);
})
.catch(error => console.log(error));
  }
  getid();
 

    function top0(){   
          vkBridge.send("VKWebAppShowLeaderBoardBox", {"app_id": 54636699,"user_result": totalStars, "global": 1})
        .then(data => console.log(data.success))  
       .catch(error => console.log(error));
        } 

function banner1(){
vkBridge.send('VKWebAppShowBannerAd', {  banner_location: 'bottom'  })
 .then((data) => {     if (data.result) {      // Баннерная реклама отобразилась   
   }  })  .catch((error) => {       console.log(error);
  });}

  banner1();

//пригласить друзей
function share2(){
  vkBridge.send("VKWebAppShowInviteBox", {})
}

















function myadd1(){
  vkBridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}

//пригласить друзей в игру
function infr(){
  vkBridge.send("VKWebAppShowInviteBox", {})
}

