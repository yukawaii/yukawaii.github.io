
//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться
bridge.send("VKWebAppShare", {"link": "vk.com/app8156273#Anime_games"});
