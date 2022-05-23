//下落按键回调方法
import event from '../../unit/event.js'
import states from '../states.js'
import unit from '../../unit/index.js'
import { fromJS,toJS } from 'immutable'
import { music } from '../../unit/music.js'

//下落按键按下方法
const down = (store) => {
//	store.commit('key_drop', true);
	event.down({
		key: 'space',
		once: true,
		callback:() => {
			const state = store.state;
			const cur = state.cur;
//			结束/开始动画判断
			if(state.lock){
//				console.log('space-16');
				return false;
			}
			if(cur !== null){
//				暂停判断
				if(state.pause){
          			states.pause(false);
          			return false;
        		}
				if (music.fall) {
          			music.fall();
        		}
//				循环自增Y轴坐标实现方块置底
				let index = 0;
				let dropDown = cur.fallDown(index);
//				console.log('space-19',unit.want(dropDown,state.matrix));
				while(unit.want(dropDown,state.matrix)){
//					console.log('index++');
					dropDown = cur.fallDown(index);
					index++;
				}
//				重新建立基础方块对象，矩阵对象
				let matrix = fromJS(state.matrix);
				dropDown = cur.fallDown(index - 2);
//				console.log('space-26',dropDown,index);
				store.commit('moveBlock', dropDown);

				const shape = dropDown.shape;
				const xy = dropDown.xy;
//				console.log('space-31',xy);
//				在基础矩阵对象上循环建立方块对象
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
//				方块space触底效果
				store.commit('drop', true);
				setTimeout(() => {
          			store.commit('drop', false)
        		}, 100);
        		
				states.nextAround(matrix);
			}else{
				states.start();
			}
//			console.log('space-cur.13',state,cur);
		}
	})
}

const up = (store) => {
//	store.commit('key_drop', false);
	event.up({
    	key: 'space'
	})
}

export default {
  	down,
	up
}