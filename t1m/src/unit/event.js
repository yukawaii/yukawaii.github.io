//公用event-按键down/up公用方法

const eventName = {}

// 键盘/手指按下-执行位移
const down = (env) => {
	const keys = Object.keys(eventName);
	keys.forEach((ikey) => {
		clearTimeout(eventName[ikey]);
		eventName[ikey] = null;
	})
	if (!env.callback) {
    	return
  	}
	const clear = () => {
		clearTimeout(eventName[env.key]);
	}
	env.callback(clear);
	if (env.once === true) {
    	return false;
  	}
	let begin = env.begin || 100;
	const interval = env.interval || 50;
	const polling = () => {
		eventName[env.key] = setTimeout(() => {
			begin = null;
			polling();
			env.callback(clear);
		},begin || interval)
	}
	polling();
}

// 键盘/手指松开.移位-执行停止位移
const up = (env) => {
  	clearTimeout(eventName[env.key]);
  	eventName[env.key] = null;
  	if(!env.callback){
    	return false;
  	}
  	env.callback();
}

export default {
  	down,
  	up
}
