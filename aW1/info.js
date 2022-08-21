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
            "app_id": 8177204, 
            "scope": "friends,status"
          })
          .then(data => {console.log(data);
            token=data.access_token;
            sessionStorage.setItem('token', token);
            console.log("token^ for  "+ id + "is^  :"+ token);
    })
    .catch(error => console.log(error)); }
    
    gettoken();  
     //первичная отправка очков в вк, проверка на 0
    function sendscore0(){

        score0=1;
        setTimeout(function (){
        vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addAppEvent", "request_id": "32test", "params":
     {"client_secret":"R1vw1yvDiH7viQAkPis4",
      "user_id":id,
      "activity_id":2,
       "value":score0, 
       "v": "5.131", 
       "global": 1,
    "access_token":"6926f8496926f8496926f84999695a3e7d669266926f8490ba9c86b1a91f45b9c54eb0a",
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
         "access_token":"6926f8496926f8496926f84999695a3e7d669266926f8490ba9c86b1a91f45b9c54eb0a"}})
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