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

  const domContainer = document.querySelector('#promo');
ReactDom.render(<PromoBanner bannerData={bannerData} />, domContainer);

/*<View activePanel="promo">
  <Panel id="promo">
    <FixedLayout vertical="bottom">
    <Banner />
    </FixedLayout>
  </Panel>
</View>;
/* const domContainer = document.querySelector('#promo');
ReactDOM.render(useEffect, domContainer); */