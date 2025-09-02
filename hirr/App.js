//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться
function share1(){
vkBridge.send("VKWebAppShare", {"text": "Интересные игры!", "link": "vk.ru/app8156273"});
}
function share2(){
  vkBridge.send("VKWebAppShowWallPostBox", {
    "message": "Игры для быстрого запоминания хираганы!",
    "attachments": "https://vk.ru/app8165024"
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
// vkBridge.send("VKWebAppJoinGroup", {"group_id": 213417231});
// }

/*
	<script src = "../App.js"></script>
    <script>
        myadd1();
    </script>
    */
