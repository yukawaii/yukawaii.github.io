//инициализация
const bridge = vkBridge.default;
bridge.send("VKWebAppInit", {});

var score,id,token;

function getid(){
    bridge.send('VKWebAppGetUserInfo')
.then(data => {console.log(data.id);
    // *назначение переменных*
id = data.id;
sessionStorage.setItem('id', id);
})
.catch(error => console.log(error));
  }
  getid();

     //первичная отправка очков в вк, проверка на 0
    function sendscore0(){
        score0=1;
     bridge.send("VKWebAppCallAPIMethod", {"method": "secure.addappEvent", "request_id": "32test", "params":
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
        bridge.send("VKWebAppGetAuthToken", { 
            "app_id": 8165024, 
            "scope": "friends,status"
          })
          .then(data => {console.log(data);
            token=data.access_token;
            sessionStorage.setItem('token', token);
    })
    .catch(error => console.log(error)); }
    
    gettoken();    