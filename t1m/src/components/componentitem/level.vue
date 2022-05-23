<template>
	<div class="level">
		<Number :plevel="level" />
	</div>
</template>

<script>
import Number from './number/number.vue'
//等级组件
export default{
	props: ['level'],
	components:{
    	Number
  	},
}
</script>

<style>
</style>