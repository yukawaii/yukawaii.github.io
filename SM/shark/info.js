/* import bridge from '@vkontakte/vk-bridge';

// Sends event to client
bridge.send('VKWebAppInit');

// Subscribes to event, sended by client
bridge.subscribe(e => console.log(e)); */

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
            "app_id": 51397074, 
            "scope": "friends,status"
          })
          .then(data => {console.log(data);
            token=data.access_token;
            sessionStorage.setItem('token', token);
            console.log("token^ for"+ id + "is^  :"+ token);
    })
    .catch(error => console.log(error)); }
    
    gettoken();  
     //первичная отправка очков в вк, проверка на 0
    function sendscore0(){

        score0=1;
        setTimeout(function (){
        vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "32test", "params":
     {"client_secret":"smb120LtJfzoiKfpLewX",
      "user_id":id,
      "activity_id":2,
       "value":score0, 
       "v": "5.131", 
       "global": 1,
    "access_token":"05ef65b705ef65b705ef65b76606ff2465005ef05ef65b7671e32d944708fa0cb9d325d",
   //  "access_token":token
      }})
    .then(data => {console.log("Ответ на первичное добавление очков:" + data);
    })
    .catch(error => console.log(error)); }, 3000);}
    sendscore0();

 function getsc(){
  getid();
  setTimeout(function (){
    vkBridge.send("VKWebAppCallAPIMethod", {"method": "apps.getScore", "request_id": "32test", "params":
       {"user_id":id,
         "v": "5.131", 
         "access_token":"05ef65b705ef65b705ef65b76606ff2465005ef05ef65b7671e32d944708fa0cb9d325d"}})
      .then(data => {console.log(data); score=data.response; console.log("getsc=  "+score); 
      })
      .catch(error => console.log(error)); }, 2000);}
getsc();

    function top0(){
      getsc();
          vkBridge.send("VKWebAppShowLeaderBoardBox", {"user_result": score, "global":1})
        .then(data => console.log(data.success))  
       .catch(error => console.log(error));
        } 