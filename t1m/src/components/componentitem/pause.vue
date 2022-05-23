<template>
	<div class="bg pause" :class="pause ? 'c' : ''"></div>
</template>

<script>
//	暂停图标组件
export default {
	props: ['pause'],
}
</script>

<style lang="less">
@import '../../../static/css/bntndex.less';
</style>