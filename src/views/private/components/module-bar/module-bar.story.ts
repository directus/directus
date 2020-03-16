import markdown from './readme.md';
import ModuleBar from './module-bar.vue';
import { defineComponent } from '@vue/composition-api';
import VueRouter from 'vue-router';
import useProjectsStore from '@/stores/projects';
import useRequestsStore from '@/stores/requests';

export default {
	title: 'Views / Private / Components / Module Bar',
	parameters: {
		notes: markdown
	}
};

export const basic = () =>
	defineComponent({
		router: new VueRouter(),
		components: { ModuleBar },
		setup() {
			useProjectsStore({});
			useRequestsStore({});
		},
		template: `
			<module-bar />
		`
	});
