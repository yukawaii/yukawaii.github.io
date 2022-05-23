import i18nJSON from '../data-json/i18n.json'

//矩阵数组-对象属性名为方块形状;
export const blockShape={
	I:[[1,1,1,1]],
	L:[[0,0,1],[1,1,1]],
	J:[[1,0,0],[1,1,1]],
	Z:[[1,1,0],[0,1,1]],
	S:[[0,1,1],[1,1,0]],
	O:[[1,1],[1,1]],
	T:[[1,1,1],[0,1,0]]
}
//方块初始化坐标
export const origin = {
  I: [[-1, 1], [1, -1]],
  L: [[0, 0]],
  J: [[0, 0]],
  Z: [[0, 0]],
  S: [[0, 0]],
  O: [[0, 0]],
  T: [[0, 0], [1, 0], [-1, 1], [0, -1]]
}

//从本地数据中判断-读取标题
export let title = i18nJSON.data.title[lan];

//本地数据
export let i18n = i18nJSON.data;

//黑色
export const fillLine = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

//空白
export const blankLine = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

//方块类型对象转数组
export const blockType=Object.keys(blockShape);

//方块下落速度
export const speeds = [800, 650, 500, 370, 250, 160]

// 每消除eachLines行, 增加速度
export const eachLines = 20; 

//最高分限制
export const maxPoint = 999999999;

//基础方块矩阵
export const blankMatrix=(()=>{
	const matrix=[];
	for(let i = 0; i < 20; i++){
		matrix.push(blankLine);
	}
	return matrix;
})()

// 获取浏览器参数
export const getParam = param => {
  	const r = new RegExp(`\\?(?:.+&)?${param}=(.*?)(?:&.*)?$`)
  	const m = window.location.toString().match(r)
  	return m ? decodeURI(m[1]) : ''
}

//数据本地存储
export const StorageKey = 'VUE_TETRIS'

//上一局状态
export const lastRecord = (() => {
	let data = window.localStorage.getItem(StorageKey);
	if(!data){return false;}
	try{
		if(window.btoa){
			data=atob(data)
		}
		data = decodeURIComponent(data)
    	data = JSON.parse(data)
	}catch(e){
		if(window.console || window.console.error) {
			window.console.error('读取记录错误:', e)
    	}
		return false
	}
	return data;
})()

export const lan=(()=>{
	let l=getParam('lan').toLowerCase();
	if(!l && navigator.languages){
		l=navigator.languages.find(l=>i18nJSON.lan.indexOf(l)!=-1);
		
	}
	l=i18nJSON.lan.indexOf(l)==-1 ? i18nJSON.default : l
	return l;
})()

//transfrom-hack
export const transform = (function() {
  	const trans = [
    	'transform',
    	'webkitTransform',
    	'msTransform',
    	'mozTransform',
    	'oTransform'
  	]
  	const body = document.body
  	return trans.filter(e => body.style[e] !== undefined)[0]
})()