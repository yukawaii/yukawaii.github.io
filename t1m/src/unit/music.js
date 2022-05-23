// 使用 Web Audio API 来进行按键音效/动画音效控制分段播放
import store from '../vuex/store.js'
//import axios from 'axios'

//各个浏览器内核的兼容写法
const AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext;

export const hasWebAudioApi = {
	data: !!AudioContext && location.protocol.indexOf('http') !== -1,
}

//创建music对象
export const music = {};
(() => {
	if(!hasWebAudioApi.data){
		return false;
	}
	const url = './static/music/music.mp3';
	const context = new AudioContext();
	const audioAjax = new XMLHttpRequest();
	audioAjax.open('GET',url,true);
	audioAjax.responseType = 'arraybuffer';
	
	audioAjax.onload = () =>{
		context.decodeAudioData(
			audioAjax.response, 
			// 将拿到的audio解码转为buffer
			buff => {
				// 创建source源
				const getSource = () => {
					const source = context.createBufferSource();
					source.buffer = buff;
					source.connect(context.destination);
					return source;
				}
//				游戏开始音效,只有开始时播放一次
				music.start = () => {
					if(!store.state.music){
						return false;
					}
					getSource().start(0, 3.7202, 3.6224);
				}
//				游戏结束音效
				music.gameOver = () => {
					if(!store.state.music){
						return false;
					}
					getSource().start(0, 8.1276, 1.1437);
				}
//				下落键音效
				music.fall = () => {
					if (!store.state.music) {
            			return false;
          			}
          			getSource().start(0, 1.2558, 0.3546);
				}
//				下左右移动键音效
				music.move = () => {
					if(!store.state.music){
						return false;
					}
					getSource().start(0, 2.9088, 0.1437);
				}
//				旋转键/上键音效
				music.rotate = () => {
					if(!store.state.music){
						return false;
					}
					getSource().start(0, 2.2471, 0.0807);
				}
			},
			error => {
				if(window.console && window.console.error){
					window.console.error(`音频: ${url} 读取错误`, error);
          			hasWebAudioAPI.data = false;
				}
			}
		)
	}
	audioAjax.send();
})()





