//重玩键回调方法
import event from '../../unit/event.js'
import states from '../states.js'
import unit from '../../unit/index.js'
import { fromJS,toJS } from 'immutable'

//重玩键按下
const down = (store) => {
	event.down({
      	key: 'r',
      	once: true,
      	callback: () => {
      		if (store.state.lock) {
    			return false;	
  			}
			if(store.state.cur !== null){
				states.overStart();
			}else{
				console.log(store.state.lock);
				if(store.state.lock){
		          	return false;
		        }
				states.start();
			}
		}
	})
}

//重玩键松开
const up = store => {
//store.commit('key_reset', false)
  	event.up({
    	key: 'reset'
  	})
}

export default {
  	down,
  	up
}