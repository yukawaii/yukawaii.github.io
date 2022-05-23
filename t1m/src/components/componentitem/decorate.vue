<template>
	<div class="decorate">
		<div class="topBorder">
			<span v-for="(item,index) in 10" class="ml" :class="{w40:index==0||index==5,l:index<5,r:index>=5}"></span>
		</div>
		<h1>{{title}}</h1>
		<div class="centView">
			<div class="view">
				<div>
					<b v-for="(btem,index) in 8" class="clear" v-if="index==1 || index==4"></b>
					<b class="em" v-else-if="index==5"></b>
					<b class="p" v-else-if="index==7"></b>
					<b class="b c" v-else></b>
				</div>
				<div>
					<b v-for="(btem,index) in 9" class="clear" v-if="index==2 || index==5"></b>
					<b class="em" v-else-if="index==0 || index==6"></b>
					<b class="p" v-else-if="index==8"></b>
					<b class="b c" v-else></b>
				</div>
				<div>
					<b v-for="(btem,index) in 5" class="p" v-if="index==4"></b>
					<b class="b c" v-else></b>
				</div>
				<div>
					<b v-for="(btem,index) in 7" class="clear" v-if="index==1 || index==4"></b>
					<b class="p" v-else-if="index==6"></b>
					<b class="b c" v-else ></b>
				</div>
				<div>
					<b v-for="(btem,index) in 7" class="clear" v-if="index==2 || index==4"></b>
					<b class="p" v-else-if="index==6"></b>
					<b class="b c" v-else ></b>
				</div>
				<div>
					<b v-for="(btem,index) in 11" class="clear" v-if="index==2 || index==5 || index==8"></b>
					<b class="em" v-else-if="index==0 || index==3 || index==6 || index==9"></b>
					<b class="b c" v-else ></b>
				</div>
			</div>
			<div class="view l">
				<div>
					<b v-for="(btem,index) in 8" class="clear" v-if="index==2 || index==5"></b>
					<b class="em" v-else-if="index==0"></b>
					<b class="p" v-else-if="index==7"></b>
					<b class="b c" v-else></b>
				</div>
				<div>
					<b v-for="(btem,index) in 7" class="clear" v-if="index==1 || index==4"></b>
					<b class="p" v-else-if="index==6"></b>
					<b class="b c" v-else></b>
				</div>
				<div>
					<b v-for="(btem,index) in 5" class="p" v-if="index==4"></b>
					<b class="b c" v-else></b>
				</div>
				<div>
					<b v-for="(btem,index) in 9" class="clear" v-if="index==2 || index==5"></b>
					<b class="em" v-else-if="index==0 || index==6"></b>
					<b class="p" v-else-if="index==8"></b>
					<b class="b c" v-else ></b>
				</div>
				<div>
					<b v-for="(btem,index) in 9" class="clear" v-if="index==2 || index==5"></b>
					<b class="em" v-else-if="index==3 || index==6"></b>
					<b class="p" v-else-if="index==8"></b>
					<b class="b c" v-else ></b>
				</div>
				<div>
					<b v-for="(btem,index) in 7" class="clear" v-if="index==1 || index==3 || index==5"></b>
					<b class="b c" v-else ></b>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { i18n, lan } from '../../unit/const.js'
//整体界面上半部分-UI组件
export default{
	name:'decorate',
	computed:{
		title:()=>i18n.title[lan],
	}
}
</script>

<style>
.decorate .topBorder span.w40{width:40px;}
</style>
<style lang="less">
@import '../../../static/css/dndex.less';
</style>