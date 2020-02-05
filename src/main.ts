import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';

import App from './app.vue';

Vue.use(VueCompositionAPI);

const app = new Vue({
	render: h => h(App)
}).$mount('#app');

export default app;
