import Vue from 'vue';
import PrivateView from './private-view.vue';
import markdown from './readme.md';
import VueRouter from 'vue-router';
import { defineComponent } from '@vue/composition-api';
import useRequestsStore from '@/stores/requests';
import useProjectsStore from '@/stores/projects';
import useUserStore from '@/stores/user';
import { i18n } from '@/lang/';

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
		i18n,
		router: new VueRouter(),
		setup() {
			const req = {};
			useRequestsStore(req);
			const userStore = useUserStore(req);
			userStore.state.currentUser = { id: 1, avatar: null } as any;
			const projectsStore = useProjectsStore(req);
			projectsStore.state.currentProjectKey = 'my-project';
		},
		template: `
			<private-view />
		`
	});
