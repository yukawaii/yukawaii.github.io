import "@vkontakte/vkui/dist/vkui.css";
import { PromoBanner } from '@vkontakte/vkui';
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
  ReactDOM.render(
    <ConfigProvider>
      <AdaptivityProvider>
        <App />
      </AdaptivityProvider>
    </ConfigProvider>,
    document.getElementById("root")
  );

  <View activePanel="promo">
    <Panel id="promo">
      <FixedLayout vertical="bottom">
        <PromoBanner bannerData={promoBannerProps} />
      </FixedLayout>
    </Panel>
  </View>;