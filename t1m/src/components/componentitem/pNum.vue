<template>
	<div class="pnum">
		<Number :number="pNum" />
	</div>
</template>

<script>
import Number from './number/number.vue'
//起始行展示组件
export default{
	props: ['pNum'],
	components:{
    	Number
  },
}
</script>

<style>
</style>