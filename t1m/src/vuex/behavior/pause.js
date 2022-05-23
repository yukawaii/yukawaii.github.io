//暂停键回调方法
import event from '../../unit/event.js'
import states from '../states.js'
//import unit from '../../unit/index.js'
//import { fromJS,toJS } from 'immutable'

function myadd (){
	bridge.send("VKWebAppShowNativeAds", {ad_format:"interstitial"})
.then(data => console.log(data.result))
.catch(error => console.log(error));
};
//暂停键按下
const down = (store) => {
	event.down({
		key:'pause',
		once:true,
		callback: () => {
			const state = store.state;
			const cur = state.cur;
      		const pause = state.pause;
		    if(state.lock){
		    	return false;
		    }
		    
		    if(cur !== null){
//		 		暂停
        		states.pause(!pause);
				myadd();
      		}else{
        // 		重新的开始
        		states.start();
      		}
		}
	})
}

//暂停键松开
const up = store => {
//	store.commit('key_pause', false)；
  	event.up({
    	key: 'pause'
  	})
}

export default {
	down,
  	up
}


