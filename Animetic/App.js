//инициализация
const bridge = vkBridge.default;
bridge.subscribe((e) => console.log("vkBridge event", e));
bridge.send("VKWebAppInit", {});

//поделиться
function share1(){
bridge.send("VKWebAppShare", {"text": "Интересные игры!", "link": "vk.com/app8156273"});
}
function favor1(){
bridge.send("VKWebAppAddToFavorites");
}
function myadd1(){
  bridge.send("VKWebAppCheckNativeAds", {"ad_format": "interstitial"});
  bridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
}


const Banner = () => {
  const [bannerData, setBannerData] = useState({});

  useEffect(() => {
    bridge.send("VKWebAppGetAds").then((bannerInfo) => {
      setBannerData(bannerInfo);
    });
  }, []);

  if (!bannerData) {
    return null;
  }

  return <PromoBanner bannerData={bannerData} />;
}

function myadd2(){
  bridge.send("VKWebAppGetAds")
  .then((bannerInfo) => {
    setBannerData(bannerInfo);
  return <PromoBanner bannerData={bannerData} />;
}); }