vkBridge.send("VKWebAppInit", {});

var score,id,token, name1;

function getid(){
    vkBridge.send('VKWebAppGetUserInfo')
.then(data => {console.log(data);
    // *назначение переменных*
id = data.id;
name1=data.first_name;
sessionStorage.setItem('id', id);
console.log("id^ "+ id);
})
.catch(error => console.log(error));
  }
  getid();

     //первичная отправка очков в вк, проверка на 0
    function sendscore0(){
        score0=1;
        vkBridge.send("VKWebAppCallAPIMethod", {"method": "secure.addappEvent", "request_id": "32test", "params":
     {"user_id":id,
      "activity_id":2,
       "value":score0, 
       "v": "5.1", 
       "access_token":"2612c80d2612c80d2612c80d77266e5ead226122612c80d446f8f02f2b5426621bfea1f"}})
    .then(data => {console.log("Ответ на первичное добавление очков:" + data);
    })
    .catch(error => console.log(error)); }
    sendscore0();

function gettoken(){
    vkBridge.send("VKWebAppGetAuthToken", { 
            "app_id": 8165024, 
            "scope": "friends,status"
          })
          .then(data => {console.log(data);
            token=data.access_token;
            sessionStorage.setItem('token', token);
            console.log("token^ for"+ id + "is^  :"+ token);
    })
    .catch(error => console.log(error)); }
    
    gettoken();    

 function getsc(){
    vkBridge.send("VKWebAppCallAPIMethod", {"method": "apps.getScore", "request_id": "32test", "params":
       {"user_id":id,
         "v": "5.131", 
         "access_token":"2612c80d2612c80d2612c80d77266e5ead226122612c80d446f8f02f2b5426621bfea1f"}})
      .then(data => {console.log(data); score=data.response;
      })
      .catch(error => console.log(error)); }
      getsc();

    function top0(){
          vkBridge.send("VKWebAppShowLeaderBoardBox", {user_result: score})
        .then(data => console.log(data.success))  
       .catch(error => console.log(error));
        } 
    function top1(){
        getsc().then(top0);
    }