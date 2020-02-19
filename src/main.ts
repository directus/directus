import Vue from 'vue';

import './styles/main.scss';
import './plugins';
import './directives/register';
import './components/register';
import './views/register';

import router from './router';
import i18n from './lang/';

Vue.config.productionTip = false;

const app = new Vue({
	render: h => h('router-view'),
	router,
	i18n
}).$mount('#app');

export default app;
