import {StorageKey,blockType} from './const.js'
import { fromJS, List, toJS } from 'immutable'

const unit={
//	随机获取下一个方块类型
	getNextType(){
		const blockLen = blockType.length;
		return blockType[Math.floor(Math.random() * blockLen)];
	},
//	判断方块是否触底,触壁或触碰到其他方块
	want(nextMatrix,matrix){
		matrix = fromJS(matrix);
		const horizontal = fromJS(nextMatrix.shape).get(0).size;
		return nextMatrix.shape.every((arr1,index1) => arr1.every((arr2,index2) => {
				if(nextMatrix.xy[0] + index1 < 0){
//					按键过快导致-1/top-旋转
					return true;
				}else if(nextMatrix.xy[0] + index1 >= 20){
//					down/drop
          			return false;
				}else if(nextMatrix.xy[1] < 0){
//					left
					return false
				}else if (nextMatrix.xy[1] + horizontal > 10) {
//          		right
          			return false
				}else if(arr2){
//      		方块与方块之间的碰撞检测
					if(matrix.get(nextMatrix.xy[0] + index1).get(nextMatrix.xy[1] + index2)){
						return false;
					}else{
						return true;
					}
				}else{
        			return true;
        		}
			})
		)
	},
//	判断是否达到消除条件
	isClears(matrix){
		const clearLines = [];
		matrix.forEach((item,index) => {
			if(item.every(i => !!i)){
				clearLines.push(index);
			}
		})
		if(clearLines.length === 0){
			return false;
		}
		return clearLines;
	},
//	判断游戏是否结束,从上往下第一行是否有方块存在
	isOver(matrix){
		if(List.isList(matrix)){
			matrix = matrix.toJS();
		}
		return matrix[0].some(n => !!n);
	},
//	 将状态记录到 localStorage
	subscribeRecord(store){
//		console.log('状态记录-store',store);
//		观察者模式/发布-订阅模式
		store.subscribe(() => {
			let data = store.state;
			data = JSON.stringify(data);
	      	data = encodeURIComponent(data);
	//    	当前状态为锁定,不记录
	      	if(data.lock){
	      		return false;
	      	}
	      	if (window.btoa) {
	        	data = btoa(data)
	      	}
	      	localStorage.setItem(StorageKey, data);
      	})
	}
}

export default unit