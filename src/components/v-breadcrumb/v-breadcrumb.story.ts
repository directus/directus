import Vue from 'vue';
import markdown from './readme.md';
import VIcon from '../v-icon/';
import VBreadcrumb from './v-breadcrumb.vue';
import withPadding from '../../../.storybook/decorators/with-padding';

import VueRouter from 'vue-router';

Vue.use(VueRouter);

const router = new VueRouter();

Vue.component('v-breadcrumb', VBreadcrumb);
Vue.component('v-icon', VIcon);

export default {
	title: 'Components / Breadcrumb',
	component: VBreadcrumb,
	decorators: [withPadding],
	parameters: {
		notes: markdown,
	},
};

export const example = () => ({
	router,
	template: `
	<v-breadcrumb :items="[
		{disabled: false, to: 'Test', name: 'Collections', icon: 'home'},
		{disabled: false, to: 'Test', name: 'Locations'},
		{disabled: false, to: 'Test', name: 'New York'},
		{disabled: true, to: 'Test', name: 'Berlin'}
	]"/>
	`,
});
