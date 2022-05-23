<template>
	<div class="nextType">
		<div v-for="(ntem,index) in nextMatrix">
			<b v-for="(nbtem,index) in ntem" class="b" :class="nbtem ? 'c' : ''"></b>
		</div>
	</div>
</template>

<script>
import { blockShape } from '../../unit/const.js'
// 方块在右侧展示中的坐标/位置偏移基准
const xy = {
	I: [1, 0],
  	O: [0, 1],
  	L: [0, 0],
  	J: [0, 0],
  	Z: [0, 0],
  	S: [0, 0],
  	T: [0, 0]
}
//方块右侧展示区域的基础矩阵
const empty = [[0, 0, 0, 0], [0, 0, 0, 0]]
export default{
	data(){
		return{
			nextMatrix:empty,
		}
	},
	props:['nextType'],
	watch:{
	    $props:{
	      	handler(val,oldVal) {
	      		this.setNextType(val.nextType);
	      	},
	      	deep: true,
	    }
	},
	mounted() {
    	this.setNextType(this.nextType);
  	},
	methods:{
		setNextType(type){
			const nextShape = blockShape[type];
			const nextMatrix = empty.map(e => [...e]);
			nextShape.forEach((n,s1) => {
				n.forEach((x,s2) => {
//					判断类型数组对象下的分数组的子元素是否等于1/显示中的位置偏移
					if(x){
						nextMatrix[s1 + xy[type][0]][s2 + xy[type][1]] = 1;
					}
				})
			})
			this.nextMatrix = nextMatrix;
		},
	},
}
</script>

<style lang="less">
/*@import '../../../static/css/nndex.less';*/
</style>