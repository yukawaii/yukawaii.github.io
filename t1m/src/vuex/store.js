import Vue from 'vue'
import Vuex from 'vuex'
import mutations from './mutation.js'
import Block from '../unit/block'
import unit from '../unit/index.js'
import { blankMatrix,lastRecord,blockType,maxPoint } from '../unit/const.js'
import { hasWebAudioApi } from '../unit/music.js'

Vue.use(Vuex)

const matrixInitState = lastRecord && Array.isArray(lastRecord.matrix) ? lastRecord.matrix : blankMatrix;

const lockInitState = lastRecord && lastRecord.lock !== undefined ? !!lastRecord.lock : false;

const resetInitState = lastRecord && lastRecord.reset ? !!lastRecord.reset : false;

const pauseInitState = lastRecord && lastRecord.pause !== undefined ? !!lastRecord.pause : false;

const dropInitState = lastRecord && lastRecord.drop !== undefined ? !!lastRecord.drop : false;

let startLinesInitState = lastRecord &&　!isNaN(parseInt(lastRecord.startLines,10)) ? parseInt(lastRecord.startLines,10) : 0;
	if(startLinesInitState < 0 || startLinesInitState > 10){
  		startLinesInitState = 0;
	}

let clearLinesInitState = lastRecord && !isNaN(parseInt(lastRecord.clearLines, 10)) ? parseInt(lastRecord.clearLines, 10) : 0;
	if(clearLinesInitState < 0){
  		clearLinesInitState = 0;
	}
	
//方块下落速度判断
let speedRunInitState = lastRecord && !isNaN(parseInt(lastRecord.speedRun, 10)) ? parseInt(lastRecord.speedRun, 10) : 1;

//方块级别判断
let speedStartInitState = lastRecord && !isNaN(parseInt(lastRecord.speedStart, 10)) ? parseInt(lastRecord.speedStart, 10) : 1;
	if(speedStartInitState < 1 || speedStartInitState > 6){
  		speedStartInitState = 1;
	}

//分数判断
let pointsInitState = lastRecord && !isNaN(parseInt(lastRecord.points, 10)) ? parseInt(lastRecord.points, 10) : 0;
	if(pointsInitState < 0){
		pointsInitState = 0;
	}else if(pointsInitState > maxPoint){
		pointsInitState > maxPoint
	}

//最高分判断
let maxPointInitState = lastRecord && !isNaN(parseInt(lastRecord.maxPoints, 10)) ? parseInt(lastRecord.maxPoints, 10) : 0;
	if(maxPointInitState < 0){
	  	maxPointInitState = 0
	}else if(maxPointInitState > maxPoint) {
		maxPointInitState = maxPoint;
	}

//音效生效判断
let musicInitState = lastRecord && lastRecord.music !== undefined ? !!lastRecord.music : true
	if(!hasWebAudioApi.data){
		musicInitState = false
	}

//下一个方块数据判断-返回值
const nextInitState = lastRecord && blockType.indexOf(lastRecord.next) !== -1 ? lastRecord.next : unit.getNextType()

const curInitState = (() => {
	// 无记录 或 有记录 但方块为空, 返回 null
  	if(!lastRecord || !lastRecord.cur){
    	return null
  	}
  	const cur = lastRecord.cur;
//	console.log(cur,lastRecord);
	const option = {
    	type: cur.type,
    	rotateIndex: cur.rotateIndex,
    	shape: cur.shape,
    	xy: cur.xy
	}
	return new Block(option);
})()

const state={
//	音效-状态
	music:musicInitState,
//	基础矩-状态
	matrix: matrixInitState,
//	当前方块-状态
	cur: curInitState,
//	下一个方块-状态
	next: nextInitState,
//	游戏开始/游戏结束-状态
	lock: lockInitState,
	reset: resetInitState,
//	右侧暂停-状态
	pause: pauseInitState,
//	方块下落速度-状态
	speedRun: speedRunInitState,
//	方块级别-状态
	speedStart: speedStartInitState,
	startLines: startLinesInitState,
//	消除行数-状态
	clearLines: clearLinesInitState,
//	计分-状态
	points:pointsInitState,
//	最高分-状态
	maxPoints:maxPointInitState,
//	space触底特效-状态
	drop: dropInitState,
//	按键-状态
	keyboard:{
		rotate:false,
		down:false,
		left:false,
		right:false,
		drop:false,
		reset:false,
		music:false,
		pause:false,
	}
}

export default new Vuex.Store({
	state,
	mutations
})