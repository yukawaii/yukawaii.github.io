<template>
	<div class="logo" v-show="vshow">
		<div class="bg dragon" :class="logoStyle" ></div>
		<p v-html="titleCenter"></p>
	</div>
</template>

<script>
import { i18n, lan } from '../../unit/const.js'
//Logo-恐龙组件
export default{
	props:['reset','cur'],
	data(){
		return{
			timeOut:null,
			titleCenter:'',
			logoStyle:'s1',
			vshow:false,
		}
	},
	created(){
		this.getTitleCenter();
	},
	beforeMount(){
		this.setAnimate(this.$props);
	},
	watch:{
		$props:{
			handler(val,oldVal){
				this.setAnimate(val);
			},
			deep: true,
		}
	},
	methods:{
//		获取中/英/俄标题
		getTitleCenter(){
			this.titleCenter = i18n.titleCenter[lan];
		},
//		动画方法
		setAnimate(animate){
			clearTimeout(this.timeOut);
			if(animate.cur || animate.reset){
				this.vshow = false;
				return;
			}
//			方向默认右/跑步动画计数
			let direction = 'r';
			let count = 0;
			
//			公共函数方法
			const setFunction = (funct,delay) => {
				if(!funct){
					return
				}
				this.timeOut = setTimeout(funct,delay);
			}
//			显示Logo
			const show = funct => {
				setFunction(() => {
					this.vshow = true;
					if(funct){
						funct();
					}
				},200);
			}
//			隐藏Logo
			const hide = funct => {
				setFunction(() => {
					this.vshow = false;
					if(funct){
						funct();
					}
				},200)
			}
//			龙眼动画
			const eyes = (funct,delay1,delay2) => {
				setFunction(() => {
					this.logoStyle = direction + 2;
					setFunction(() => {
						this.logoStyle = direction + 1;
						if(funct){
							funct();
						}
					},delay2)
				},delay1)
			}
//			跑步动画
			const run = funct => {
				setFunction(() => {
					this.logoStyle = direction + 4;
					setFunction(() => {
						this.logoStyle = direction + 3;
						count++;
						if(count === 10 || count === 20 || count === 30){
							direction = (direction == "r" ? direction = "l" : direction = "r");
						}
						if(count < 40){
							run(funct);
							return;
						}
						this.logoStyle = direction + 1;
						if(funct){
							setFunction(funct,4000);
						}
					},100)
				},100)
			}
//			动画循环
			const dra = () => {
				count = 0;
				eyes(() => {
					eyes(() => {
						eyes(() => {
							this.logoStyle = direction + 2;
							run(dra)
						},150,150);
					},150,150);
				},1000,1500);
			}
			
//			动画循环调用实现
			show(() => {
				hide(() => {
					show(() => {
						hide(() => {
							show(() => {
								dra();
							})
						})
					})
				})
			})
		}
	}
}
</script>

<style lang="less">
@import '../../../static/css/lndex.less';
</style>