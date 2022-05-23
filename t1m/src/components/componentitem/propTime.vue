<template>
	<div class="pTime">
		<Number :propTime="data" />
	</div>
</template>

<script>
import Number from './number/number.vue'
//时间展示组件
export default{
	data(){
		return{
			data:'',
			time_count:'',
		}
	},
	beforeMount(){
    	setInterval(this.onTime,1000);
  	},
	components:{
    	Number
  	},
	methods:{
		onTime(){
			const now = new Date();
        	const hour = this.formate(now.getHours());
        	const min = this.formate(now.getMinutes());
        	const sec = now.getSeconds() % 2;
        	const zt = hour.concat(sec ? 'd' : 'd_c', min);
        	this.data = zt;
		},
		formate(numTime){
			return  numTime < 10 ? `0${numTime}`.split('') : `${numTime}`.split('');
		}
	}
}
</script>

<style>
</style>