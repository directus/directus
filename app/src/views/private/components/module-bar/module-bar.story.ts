import markdown from './readme.md';
import ModuleBar from './module-bar.vue';
import { defineComponent } from '@vue/composition-api';
import VueRouter from 'vue-router';

import { useRequestsStore, useUserStore } from '@/stores/';
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
		},
		template: `
			<module-bar />
		`,
	});
