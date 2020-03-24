import Vue from 'vue';

import './plugins';

import i18n from './lang/';
import router from './router';

import './styles/main.scss';
import './directives/register';
import './components/register';
import './views/register';
import './modules/register';
import './layouts/register';
import './interfaces/register';

import App from './app.vue';

Vue.config.productionTip = false;

new Vue({
	render: (h) => h(App),
	router,
	i18n,
}).$mount('#app');
