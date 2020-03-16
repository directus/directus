import Vue from 'vue';
import PrivateView from './private-view.vue';
import markdown from './readme.md';
import VueRouter from 'vue-router';
import { defineComponent } from '@vue/composition-api';

Vue.component('private-view', PrivateView);
Vue.use(VueRouter);

export default {
	title: 'Views / Private',
	parameters: {
		notes: markdown
	}
};

export const basic = () =>
	defineComponent({
		router: new VueRouter(),
		template: `
		<private-view />
	`
	});
