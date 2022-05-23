<template>
	<div class="keyboard" :style="'margin-top:'+fillNum+'px'">
		<vbutton color="blue" size="s1" :top="0"   :left="374" :label="ren.rotation" arrow="translate(0, 63px)" position="position" :active="keyboard('rotate')" ref="dom-rotate"></vbutton>
		<vbutton color="blue" size="s1" :top="90"  :left="464" :label="ren.labelRight" arrow="translate(-60px, -12px) rotate(90deg)" :active="keyboard('right')" ref="dom-right"></vbutton>
		<vbutton color="blue" size="s1" :top="180" :left="374" :label="ren.labelDown" arrow="translate(0,-57px) rotate(180deg)" :active="keyboard('down')" ref="dom-down"></vbutton>
		<vbutton color="blue" size="s1" :top="90"  :left="284" :label="ren.labelLeft" arrow="translate(60px, 3px) rotate(270deg)" :active="keyboard('left')" ref="dom-left"></vbutton>
		<vbutton color="blue" size="s0" :top="100" :left="52"  :label="ren.labelDropSpace" arrow="translate(60px, 3px) rotate(270deg)" :active="keyboard('drop')" ref="dom-drop"></vbutton>
		<vbutton color="red"  size="s2" :top="0"   :left="196" :label="ren.labelReset" :active="keyboard('reset')" ref="dom-reset"></vbutton>
		<vbutton color="green" size="s2" :top="0"  :left="106" :label="ren.labelSound" :active="keyboard('music')" ref="dom-music"></vbutton>
		<vbutton color="green" size="s2" :top="0"  :left="16"  :label="ren.labelPause" :active="keyboard('pause')" ref="dom-pause"></vbutton>
	</div>
</template>

<script>
import Vbutton from './button/button.vue'
import Todo from '../../vuex/behavior/index.js'
import store from '../../vuex/store.js'
import { i18n, lan } from '../../unit/const.js'
//按键绑定/调用-按键组件
export default{
	data(){
		return{
			fillNum:0,
			ren:{
				rotation:i18n.rotation[lan],
				labelRight:i18n.right[lan],
				labelDown:i18n.down[lan],
				labelLeft:i18n.left[lan],
				labelDropSpace:`${i18n.drop[lan]} (SPACE)`,
				labelReset:`${i18n.reset[lan]}(R)`,
				labelSound:`${i18n.sound[lan]}(S)`,
				labelPause:`${i18n.pause[lan]}(P)`,
			}
			
		}
	},
	props: ['fill'],
	watch:{
		'fill':function(newValue,oldVal){
			this.fillNum = newValue + 20;
		}
	},
	mounted(){
		this.setkey();
	},
	computed:{
//  	keyboard1() {
//    		return this.$store.state.keyboard;
//  	}
    },
	methods:{
		keyboard(Index){
			return this.$store.state.keyboard[Index];
	    },
	    setkey(){
//	    	对于手机操作, 触发了touchstart, 将作出记录, 不再触发后面的mouse事件
			const touchEventCatch = {};
			const mouseDownEventCatch = {};
			
			// 在鼠标触发mousedown,停止冒泡,不触发touchend
			document.addEventListener('touchstart',e => {
				if(e.preventDefault){
					e.preventDefault();
				}
			},true);
			
	//		 在鼠标触发mousedown,移除元素时可以不触发mouseup, 这里做一个兼容, 以mouseout模拟mouseup
			document.addEventListener('mousedown',e => {
				if(e.preventDefault){
					e.preventDefault()
				}
			},true);
			
//			监听按键事件
			Object.keys(Todo).forEach(key => {
				this.$refs[`dom-${key}`].$el.addEventListener('mousedown',() => {
					Todo[key].down(store);
					this.$store.state.keyboard[key] = true;
				},true);
				
				this.$refs[`dom-${key}`].$el.addEventListener('mouseup',() => {
					Todo[key].up(store);
					this.$store.state.keyboard[key] = false;
				},true);
				
				this.$refs[`dom-${key}`].$el.addEventListener('mouseout',() => {
					Todo[key].up(store);
					this.$store.state.keyboard[key] = false;
				},true);
				
//				手机端touch
				this.$refs[`dom-${key}`].$el.addEventListener('touchstart',() => {
					Todo[key].down(store);
					this.$store.state.keyboard[key] = true;
				},true);
				
				this.$refs[`dom-${key}`].$el.addEventListener('touchend',() => {
					Todo[key].up(store);
					this.$store.state.keyboard[key] = false;
				},true);
			})
	   }
	},
	components: {
    	Vbutton
  	}
	
}
</script>

<style>
.keyboard{width: 580px;height: 330px;margin: 20px auto 0;position: relative;}
</style>