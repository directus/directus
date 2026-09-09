import { defineModule } from '@directus/extensions';
import OperationDetail from './components/operation-detail.vue';
import Flow from './flow.vue';
import NotFound from './not-found.vue';
import Overview from './overview.vue';
import { useFlowsStore } from '@/stores/flows';

export default defineModule({
	id: 'flows',
	name: '$t:flows',
	icon: 'bolt',
	routes: [
		{
			name: 'flows-collection',
			path: '',
			component: Overview,
		},
		{
			path: 'folders',
			redirect: '/flows',
		},
		{
			name: 'flows-folder',
			path: 'folders/:folder',
			component: Overview,
			props: true,
		},
		{
			name: 'flows-item',
			path: ':primaryKey',
			component: Flow,
			props: true,
			beforeEnter(to) {
				const { flows } = useFlowsStore();
				const existingFlow = flows.find((flow) => flow.id === to.params.primaryKey);

				if (!existingFlow) {
					return {
						name: 'flows-not-found',
						params: { _: to.path.split('/').slice(1) },
					};
				}
			},
			children: [
				{
					name: 'flows-operation',
					path: ':operationId',
					meta: {
						isFloatingView: true,
					},
					component: OperationDetail,
					props: true,
				},
			],
		},
		{
			name: 'flows-not-found',
			path: ':_(.+)+',
			component: NotFound,
		},
	],
	preRegisterCheck(user) {
		return user.admin_access === true;
	},
});
