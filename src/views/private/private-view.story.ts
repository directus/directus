import Vue from 'vue';
import PrivateView from './private-view.vue';
import markdown from './private-view.readme.md';

Vue.component('private-view', PrivateView);

export default {
	title: 'Views / Private',
	component: PrivateView,
	parameters: {
		notes: markdown
	}
};

export const basic = () => ({
	template: `
<private-view />
`
});
