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
  
    return (
    <div>
        <PromoBanner bannerData={bannerData} />; </div>)
  }
  ReactDOM.render(Banner, document.getElementById('root'));
  

/*<View activePanel="promo">
  <Panel id="promo">
    <FixedLayout vertical="bottom">
    <Banner />
    </FixedLayout>
  </Panel>
</View>;
/* const domContainer = document.querySelector('#promo');
ReactDOM.render(useEffect, domContainer); */