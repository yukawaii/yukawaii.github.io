var score,id,token,name1;const __PLATFORM=window.__PLATFORM||{isOK:!1,isVK:!0,platform:"vk",userId:0,storagePrefix:"",launchParams:{}};
const IS_OK_PLATFORM=__PLATFORM.isOK;"undefined"!=typeof vkBridge&&(window.vkBridge=vkBridge);
function getid(){if(__PLATFORM.userId&&__PLATFORM.userId>0)return id=__PLATFORM.userId,void sessionStorage.setItem("id",id);vkBridge.send("VKWebAppGetUserInfo").then((e=>{id=e.id,name1=e.first_name,sessionStorage.setItem("id",id)})).catch((()=>{}))}
getid();
let __bannerShown=!1,__bannerRetryTimer=null,__bannerAttempts=0;const __BANNER_MAX=3,__BANNER_DELAY=3e5;
function showBannerAd(){"undefined"!=typeof vkBridge&&vkBridge.send("VKWebAppShowBannerAd",{banner_location:"bottom"}).then((n=>{n&&n.result&&document.body.classList.add("has-vk-banner")})).catch((n=>{}))}
function showBannerWithRetry(){if(__bannerShown)return;if("undefined"==typeof vkBridge)return;if(__bannerRetryTimer)return;__bannerAttempts++;const n=__bannerAttempts;vkBridge.send("VKWebAppShowBannerAd",{banner_location:"bottom"}).then((function(e){if(e&&(!0===e.result||1===e.result))return __bannerShown=!0,void document.body.classList.add("has-vk-banner");scheduleBannerRetry(n)})).catch((function(e){scheduleBannerRetry(n)}))}
function scheduleBannerRetry(attemptNo) {
    if (__bannerShown) return;
    if (attemptNo >= __BANNER_MAX) {
        console.warn('⛔ Banner retry limit (' + __BANNER_MAX + ')');
        return;
    }
    __bannerRetryTimer = setTimeout(function () {
        __bannerRetryTimer = null;
        showBannerWithRetry();
    }, __BANNER_DELAY);
}
function checkAndShowBanner() {
    if (typeof vkBridge === 'undefined') return;
    vkBridge.send('VKWebAppCheckBannerAd', {})
        .then((data) => {
            if (!data || !data.result) {
                showBannerWithRetry();
            }
        })
        .catch(() => {
            showBannerWithRetry();
        });
}
var __initVKBridgeDone = false;
var __vkBridgeReadyPromise = null;
function initVKBridge(){return __vkBridgeReadyPromise||(__initVKBridgeDone?Promise.resolve():(__initVKBridgeDone=!0,"undefined"==typeof vkBridge?(__vkBridgeReadyPromise=Promise.resolve(),__vkBridgeReadyPromise):(__vkBridgeReadyPromise=vkBridge.send("VKWebAppInit",{}).then((()=>{setTimeout((function(){showBannerWithRetry()}),500),setTimeout((function(){"function"==typeof preloadAd&&preloadAd()}),1e3);try{vkBridge.subscribe((function(e){var i=e.detail.type;"VKWebAppViewHide"===i&&"function"==typeof pauseGame&&pauseGame(),"VKWebAppViewRestore"===i&&"function"==typeof resumeGame&&resumeGame(),"VKWebAppBannerAdClosedByUser"===i&&setTimeout(checkAndShowBanner,3e4)}))}catch(e){}})).catch((function(e){})),__vkBridgeReadyPromise)))}
function share2(){IS_OK_PLATFORM||vkBridge.send("VKWebAppShowInviteBox",{})}
function infr() { share2(); }
