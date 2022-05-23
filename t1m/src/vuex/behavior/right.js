//右键回调方法
import event from '../../unit/event.js'
import states from '../states.js'
import unit from '../../unit/index.js'
import { fromJS,toJS } from 'immutable'
import { music } from '../../unit/music.js'

//右键按下
const down = (store) => {
	event.down({
		key:'right',
		begin: 200,
    	interval: 100,
		callback:() => {
			const state = store.state;
			const cur = state.cur;
//			结束/开始动画判断
			if(state.lock){
//				console.log('space-16');
				return false;
			}
//			右移音效判断
			if(music.move){
      			music.move();
   	 		}
			if(cur !== null){
				const right = cur.right();
//				暂停判断
				if(state.pause){
          			states.pause(false);
          			return false;
        		}
//				碰撞检测
				if(unit.want(right,state.matrix)){
//					console.log('left-25');
					
					store.commit('moveBlock', right);
				}else{
//					console.log('left-29',cur);
				}
			}else{
				let speed = state.speedStart;
        		speed = speed + 1 > 6 ? 1 : speed + 1;
        		store.commit('speedStart', speed);
			}
		}
	})
}

//右键松开
const up = (store) => {
//store.commit('key_left', false)
  	event.up({
    	key: 'right'
  	})
}

export default {
	down,
	up
}