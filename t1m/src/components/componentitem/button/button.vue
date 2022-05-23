<template>
	<div class="button" :class="color+' '+size" :style="'top:'+top+'px;'+'left:'+left+'px'">
		<i :class="{active:active}"></i>
		<em :style="'transform:'+arrow+' scale(1,2)'" v-show="size==='s1'"></em>
		<span :class="position">{{label}}</span>
	</div>
</template>

<script>
import { transform} from '../../../unit/const.js'
//button组件
export default{
	props:['active','color','size','top','left','position','label','arrow'],
}
</script>

<style lang="less">
@import '../../../../static/css/btndex.less';
</style>