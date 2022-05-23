//音效按键回调方法
import event from '../../unit/event.js'
//import states from '../states.js'
//import unit from '../../unit/index.js'
//import { fromJS,toJS } from 'immutable'

//音效按键按下方法
const down = (store) => {
//	结束/开始动画判断
	if(store.state.lock){
    	return false;
  	}
	event.down({
		key: 'music',
		once: true,
		callback: () => {
			store.commit('music', !store.state.music)
		}
	})
}

//音效按键松开方法
const up = store => {
//	store.commit('key_music', false)
  	event.up({
    	key: 'music'
  	})
}

export default {
  	down,
  	up
}