<template>
	<div class="number">
		<span v-for="(item,index) in data" :class="'bg s_'+item"></span>
	</div>
</template>

<script>
//number组件
export default{
	data(){
		return{
			data:[],
			length:6,
		}
	},
	watch:{
		$props:{
			handler(val,oldVal){
				this.numCreation(val);
			},
			deep:true,
		}
	},
	props: ['number','propTime','plevel'],
	created(){
//		初始化方法调用
		this.numInit();
		this.numCreation();
	},
	methods:{
//		初始化方法
		numInit(){
			for(let m = 0;m < this.length;m++){
				if(this.number == 0 && m == 0){
					this.data.unshift('0');
				}else{
					this.data.unshift('n');
				}
			}
		},
//		根据传入的参数返回值/不传参时为初始化-待完善
		numCreation(num){
			let numMatrix;
			if(this.propTime){
				numMatrix = (this.propTime+'').split(',');
				this.length = this.propTime.length;
			}else if(this.plevel){
				numMatrix = (this.plevel+'').split('');
			}else{
				numMatrix = (this.number+'').split('');
			}
			for(let n = 0,len = this.length - numMatrix.length;n < len;n++){
    			numMatrix.unshift('n');
			}
			this.data = numMatrix;
			return false;
		}
	}
}
</script>

<style>
</style>