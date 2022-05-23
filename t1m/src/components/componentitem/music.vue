<template>
	<div class="bg music" :class="music ? '' : 'c'"></div>
</template>

<script>
//	音效图标组件
	export default {
  		props: ['music'],
	}
</script>

<style lang="less">
@import '../../../static/css/bntndex.less';
</style>