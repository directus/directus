import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import VueRouter from 'vue-router';
import router from './router';

import './styles/main.scss';

Vue.use(VueCompositionAPI);
Vue.use(VueRouter);

Vue.config.productionTip = false;

const app = new Vue({
	render: h => h('router-view'),
	router
}).$mount('#app');

export default app;
