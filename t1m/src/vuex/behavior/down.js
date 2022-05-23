//下键回调方法
import event from '../../unit/event.js'
import states from '../states.js'
import unit from '../../unit/index.js'
import { fromJS,toJS } from 'immutable'
import { music } from '../../unit/music.js'

//下键按下
const down = (store) => {
	if(store.state.cur !== null){
//		方块加速下落/方块触底/方块叠加
		event.down({
			key: 'down',
      		begin: 40,
      		interval: 40,
      		callback: stopDownTrigger => {
      			const state = store.state;
    			const cur = state.cur;
				const drop = cur.fallDown();
//				暂停判断
				if(state.pause){
          			states.pause(false);
          			return false;
        		}
				
//				console.log('music.move',music.move);
				if(music.move){
          			music.move();
       	 		}
				
//				结束/开始动画判断
				if(state.lock){
          			return false;
        		}
				if(unit.want(drop, state.matrix)){
//					console.log('down-20');
					store.commit('moveBlock', drop);
					states.auto();
				}else{
//					console.log('down-24');
//					在基础矩阵对象上循环建立方块对象
					const shape = cur.shape;
					const xy = cur.xy;
					let matrix = fromJS(state.matrix);
					shape.forEach((sp,index1) => sp.forEach((p,index2) => {
	//						console.log(xy[0],xy[1])
							if (p && xy[0] + index1 >= 0) {
	//               			竖坐标可以为负
	              				let line = matrix.get(xy[0] + index1);
	              				line = line.set(xy[1] + index2, 1);
	//            				console.log('line',line.toJS())
	              				matrix = matrix.set(xy[0] + index1, line);
	            			}
						})
					)
					states.nextAround(matrix, stopDownTrigger);
				}
      		}
		})
	}else{
		console.log('61');
//		启示行增加-最多10行
		event.down({
			key: 'down',
      		begin: 200,
      		interval: 100,
      		callback:() => {
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
				startLines = startLines -1 < 0 ? 10 : startLines -1;
				store.commit('startLines', startLines);
      		}
      	});
//		console.log('music.move',music.move);
	}
}

//下键松开
const up = store => {
//store.commit('key_down', false)
  	event.up({
    	key: 'down'
  	})
}

export default {
  down,
  up
}