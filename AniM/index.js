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
  
    return newFunction(bannerData);
}
 


<View activePanel="promo">
  <Panel id="promo">
    <FixedLayout vertical="bottom">
    <Banner />
    </FixedLayout>
  </Panel>
</View>;

function newFunction(bannerData) {
    return <PromoBanner bannerData={bannerData} />;
}

