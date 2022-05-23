// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router/index.js'
import store from './vuex/store.js'

import './unit/const.js';
import  unit  from './unit/index.js';

unit.subscribeRecord(store); // 将更新的状态记录到localStorage


Vue.config.productionTip = false


/* eslint-disable no-new */
new Vue({
  	el: '#app',
	router,
  	store,
  	template: '<App/>',
  	components: { App }
})
