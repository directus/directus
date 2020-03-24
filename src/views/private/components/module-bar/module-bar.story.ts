import markdown from './readme.md';
import ModuleBar from './module-bar.vue';
import { defineComponent } from '@vue/composition-api';
import VueRouter from 'vue-router';
import useProjectsStore from '@/stores/projects';
import useRequestsStore from '@/stores/requests';
import useUserStore from '@/stores/user';
import i18n from '@/lang/';

export default {
	title: 'Views / Private / Components / Module Bar',
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		i18n,
		router: new VueRouter({}),
		components: { ModuleBar },
		setup() {
			const req = {};
			useRequestsStore(req);
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 1, avatar: null } as any;
			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';
		},
		template: `
			<module-bar />
		`,
	});
