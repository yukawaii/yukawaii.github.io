//左键回调方法
import event from '../../unit/event.js'
import states from '../states.js'
import unit from '../../unit/index.js'
import { fromJS,toJS } from 'immutable'
import { music } from '../../unit/music.js'

//左键按下
const down = (store) => {
	event.down({
		key:'left',
		begin: 200,
    	interval: 100,
		callback:() => {
			const state = store.state;
			const cur = state.cur;
//			console.log('space-16',state.lock);
//			结束/开始动画判断
			if(state.lock){
      			return false;
    		}
//			左移音效判断
			if(music.move){
      			music.move();
   	 		}
			if(cur !== null){
				const left = cur.left();
//				暂停判断
				if(state.pause){
          			states.pause(false);
          			return false;
        		}
//				碰撞检测
				if(unit.want(left,state.matrix)){
//					console.log('left-25');
					
					store.commit('moveBlock', left)
				}else{
//					console.log('left-29',cur);
				}
				
			}else{
//				级别降低 && 小于1时重置为6
				let speed = state.speedStart;
				speed = speed - 1 < 1 ? 6 : speed - 1;
				store.commit('speedStart', speed);
			}
		}
	})
}

//左键松开
const up = (store) => {
//store.commit('key_left', false)
  	event.up({
    	key: 'left'
  	})
}

export default {
	down,
	up
}