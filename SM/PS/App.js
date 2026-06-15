
vkBridge.send("VKWebAppInit", {});

var score,id,token, name1;

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
  function gettoken(){
    vkBridge.send("VKWebAppGetAuthToken", { 
            "app_id": 54636699, 
            "scope": "friends"
          })
          .then(data => {console.log(data);
            token=data.access_token;
            sessionStorage.setItem('token', token);
            console.log("token^ for"+ id + "is^  :"+ token);
    })
    .catch(error => console.log(error)); }
    
    gettoken();  
 //первичная отправка очков в вк, проверка на 0
    function sendscore0(){        score0=1;        setTimeout(function (){        vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "32test", "params":
     {"client_secret":"vTHFnjvA35iL1nEpMSTr",      "user_id":id,      "activity_id":1,       "value":score0,        "v": "5.131",        "global": 1,    "access_token":"60c64bd460c64bd460c64bd4e16387fb4f660c660c64bd40ae8b17ee1804f4670cb38e4",
         }})    .then(data => {console.log("Ответ на первичное добавление очков:" + data);    })    .catch(error => console.log(error)); }, 3000);}
             sendscore0();

//Обычная отправка очков в вк, таблицу лидеров, из игры.
function sendscore(){  sessionStorage.setItem('score',score);  vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "32test", "params":
 {"client_secret":"qp47UOdcqJmW94rKknxR",    "user_id":id,  "activity_id":1,   "value":gameState.level,    "v": "5.131",    "access_token":"60c64bd460c64bd460c64bd4e16387fb4f660c660c64bd40ae8b17ee1804f4670cb38e4"}}).then(data => {console.log("Ответ на добавление очков:" + data);}).catch(error => console.log(error)); 
}

 function getsc(){
  getid();
  setTimeout(function (){
    vkBridge.send("VKWebAppCallAPIMethod", {"method": "apps.getScore", "request_id": "32test", "params":
       {"user_id":id,
         "v": "5.131", 
         "access_token":"60c64bd460c64bd460c64bd4e16387fb4f660c660c64bd40ae8b17ee1804f4670cb38e4"}})
      .then(data => {console.log(data); score=data.response; console.log("getsc=  "+score); 
      })
      .catch(error => console.log(error)); }, 2000);}
getsc();

    function top0(){
      getsc();
          vkBridge.send("VKWebAppShowLeaderBoardBox", {"app_id": 54636699,"user_result": score, "global": 1})
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

