<template>
	<div class="matrix">
		<p v-for="(mtem,index) in matrix._tail.array">
			<b v-for="(btem,index) in mtem._tail.array" class="b" :class="{c:btem===1,d:btem===2}"></b>
		</p>
	</div>
</template>

<script>
import { List, fromJS, toJS } from 'immutable'
import { fillLine, blankLine } from '../../unit/const.js'
import unit from '../../unit/index.js'
import states from '../../vuex/states.js'
//矩阵组件
export default{
	data(){
		return{
			clearLines: false,
      		animateColor: 2,
      		isOver: false,
      		overState: null,
      		matrix:'',
		}
	},
	props:['propMatrix','reset','cur'],
	watch:{
		$props:{
			handler(val,oldVal){
				this.getPropsChange(val);
			},
			deep:true
		}
	},
	created(){
		this.getMatrix();
	},
	methods:{
//		初始化矩阵对象/重新渲染矩阵对象
		getMatrix(){
			if(this.isOver){
				this.matrix=this.overState;
			}else{
				this.matrix=this.getMatrixData();
			}
		},
		getMatrixData(props){
			if(!props){
				props=this.$props;
			}
//			当前方块本身对象
			const cur = props.cur;
//			上下2侧方块颜色数组0-灰色 1-黑色
			const shape = cur && cur.shape;
//			当前方块的坐标轴 0-X轴 1-Y轴
			const xy = fromJS(cur && cur.xy);
//			基础方块矩阵
			let matrix=fromJS(props.propMatrix);
			
			const clearLines = this.clearLines;

//			判断是否有需要消除的方块
			if(clearLines){
//				消除排满的那一行方块并重现循环基础矩阵对象
				const animateColor = this.animateColor;
//				消除之前循环数组-消除动画
				clearLines.forEach(cLine => {
					matrix = matrix.set(cLine, List([
	            			animateColor,
	            			animateColor,
				            animateColor,
				            animateColor,
				            animateColor,
				            animateColor,
				            animateColor,
				            animateColor,
				            animateColor,
				            animateColor
	            		])
          			)
				})
			}else if(shape){
//				在基础矩阵对象上循环建立初始化方块对象
				shape.forEach((sp,index1) => sp.forEach((p,index2) => {
						// 初始化竖坐标,可以为负
						if(p && xy.get(0) + index1 >= 0){
							let line = matrix.get(xy.get(0) + index1);
							let color;
							// 矩阵与方块重合
							if(line.get(xy.get(1) + index2) === 1 && !clearLines){
								color = 2
							}else{
								color = 1
							}
							line = line.set(xy.get(1) + index2, color);
              				matrix = matrix.set(xy.get(0) + index1, line);
						}
					})
				)
			}
			
			var matrixjson = {}
		    for(var i=0;i<props.propMatrix.length;i++){
		    	for(var j=0;j<props.propMatrix[i].length;j++){
		    		matrixjson[i] = props.propMatrix[i];
		    	}
		    }
			return matrix;
		},
		getPropsChange(props){
//			判断是否有那一行达到消除条件?返回那一行:返回false
			const clears = unit.isClears(props.propMatrix);
			const overs=props.reset;
			
			setTimeout(() => {
				this.clearLines = clears;
				this.isOver = props.reset;
			},0);
			this.getMatrix();
			if(clears && !this.clearLines){
				this.clearAnimate(clears);
			}
			if(!clears && overs && !this.isOver){
				this.setOverState(props);
			}
		},
//		待机动画
		setOverState(props){
			let overState=this.getMatrixData(props);
			this.overState=overState;
			
			if(props.reset==false){
				return false;
			}
//			基础矩阵循环变色动画
			const exLine= ((index) => {
				if(index <= 19){
					overState = overState.set(19-index,List(fillLine));
				}else if(index >= 20 && index <= 39){
					overState = overState.set(index - 20,List(blankLine));
				}else{
					states.overEnd();
					return;
				}
				this.overState = overState;
				this.getMatrix();
			})
			
			for(let i = 0;i <= 40;i++) {
        		setTimeout(exLine.bind(null, i), 40 * (i + 1))
      		}
		},
//		方块消除动画方法
		clearAnimate(clears){
//			传入当前矩阵数组对象.传入当前可消除行的数组下标
			setTimeout(() => {
				this.animateColor = 0;
				this.getMatrix();
				setTimeout(() => {
					this.animateColor = 2;
					this.getMatrix();
					setTimeout(() => {
						this.animateColor = 0;
						this.getMatrix();
						setTimeout(() => {
							states.clearLines(this.propMatrix, clears);
							this.clearLines=false;
						},150)
					},150);
				},150);
			},150);
		}
	}
}
</script>

<style>
.matrix{border: 2px solid #000;padding: 3px 1px 1px 3px;width: 228px;}
.matrix p{width: 220px;height: 22px;}
</style>