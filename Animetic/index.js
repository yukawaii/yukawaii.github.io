import "@vkontakte/vkui/dist/vkui.css";
import "@vkontakte/vkui/dist/vkui.css";

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

<View activePanel="promo">
  <Panel id="promo">
    <FixedLayout vertical="bottom">
    <PromoBanner bannerData={bannerData} />
    </FixedLayout>
  </Panel>
</View>;