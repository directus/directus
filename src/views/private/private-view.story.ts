import Vue from 'vue';
import PrivateView from './private-view.vue';
import markdown from './private-view.readme.md';
import VueRouter from 'vue-router';

Vue.component('private-view', PrivateView);
Vue.use(VueRouter);

const router = new VueRouter();

export default {
	title: 'Views / Private',
	component: PrivateView,
	parameters: {
		notes: markdown
	}
};

export const basic = () => ({
	router: router,
	template: `
<private-view />
`
});
