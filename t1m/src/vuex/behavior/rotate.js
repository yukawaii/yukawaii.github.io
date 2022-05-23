//上键/旋转键回调方法
import event from '../../unit/event.js'
import states from '../states.js'
import unit from '../../unit/index.js'
import { fromJS,toJS } from 'immutable'
import { music } from '../../unit/music.js'

//上键/旋转键按下
const down = (store) => {
	const state = store.state;
	const cur = state.cur;
	if(store.state.cur !== null){
//		方块旋转
		event.down({
			key: 'rotate',
			once: true,
			callback: () => {
//				结束/开始动画判断
				if(state.lock){
					console.log('rotate-19');
					return false;
				}
//				旋转音效判断
				if(music.rotate){
          			music.rotate();
        		}
//				暂停判断
				if(state.pause){
          			states.pause(false);
//        			return false;
        		}
				if (cur === null) {
          			return false;
        		}
				const rotate = cur.rotate();
		        if(unit.want(rotate, state.matrix)){
		          	store.commit('moveBlock', rotate);
		        }
			}
		})
	}else{
//		启示行减少-最少0行
		event.down({
			key: 'rotate',
      		begin: 200,
      		interval: 100,
			callback: () => {
				const state = store.state;
    			const cur = state.cur;
				let startLines = state.startLines;
	      		if(music.move){
	  				music.move();
	 			}
//	      		结束/开始动画判断
				if(state.lock){
          			return false;
        		}
				startLines = startLines + 1 > 10 ? 0 : startLines + 1;
        		store.commit('startLines', startLines);
			}
		})
	}
	
}

//上键松开
const up = (store) => {
//store.commit('key_rotate', false)
  	event.up({
    	key: 'rotate'
  	})
}

export default {
  	down,
	up
}