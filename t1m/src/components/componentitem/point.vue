<template>
	<div class="point">
		<p>{{pointTitle}}</p>
		<Number :number="pointNum" />
	</div>
</template>

<script>
import Number from './number/number.vue'
import { i18n , lan } from '../../unit/const.js'
const iPoint = i18n.point[lan];
const iHighest = i18n.heightPoint[lan];
const iLastRound = i18n.lastRound[lan];
//计分展示组件
export default{
	data(){
		return{
			pointTimeout:null,
			pointTitle:'',
			pointNum:0,
		}
	},
	props: ['cur','maxPoint','points'],
	watch:{
		$props:{
			handler(val,oldVal){
				this.onChange(val);
			},
			deep: true,
		}
	},
	components:{
    	Number
  	},
	mounted(){
		this.onChange(this.$props);
	},
	methods:{
		onChange(props){
			clearInterval(this.pointTimeout);
//			正在进行游戏 ? true : false
			if(props.cur){
				this.pointTitle = props.points >= props.maxPoint ? iHighest : iPoint
				this.pointNum = props.points;
			}else{
				if(props.points !== 0){
					const toggle = () => {
						this.pointTitle = iLastRound;
						this.pointNum = props.points;
						this.pointTimeout = setTimeout(() => {
							this.pointTitle = iHighest;
							this.pointNum = props.maxPoint;
							this.pointTimeout = setTimeout(toggle,200);
						},3000);
					}
					toggle();
				}else{
					this.pointTitle = iHighest;
					this.pointNum = props.maxPoint;
				}
			}
		}
	},
}
</script>

<style lang="less">
@import '../../../static/css/pondex.less';
</style>