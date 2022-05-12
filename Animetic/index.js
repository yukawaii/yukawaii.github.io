import "@vkontakte/vkui/dist/vkui.css";
import "@vkontakte/vkui/dist/vkui.css";
import React from "react";
import ReactDOM from "react-dom";

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

  ReactDOM.render(Banner, document.getElementById('banner').innerHTML);