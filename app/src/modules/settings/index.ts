import api from '@/api';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useFlowsStore } from '@/stores/flows';
import RouterPass from '@/utils/router-passthrough';
import { defineModule } from '@directus/utils';
import Collections from './routes/data-model/collections/collections.vue';
import FieldDetail from './routes/data-model/field-detail/field-detail.vue';
import Fields from './routes/data-model/fields/fields.vue';
import NewCollection from './routes/data-model/new-collection.vue';
import FlowOperationDetail from './routes/flows/components/operation-detail.vue';
import FlowsDetail from './routes/flows/flow.vue';
import FlowsOverview from './routes/flows/overview.vue';
import NotFound from './routes/not-found.vue';
import PresetsCollection from './routes/presets/collection/collection.vue';
import PresetsItem from './routes/presets/item.vue';
import Project from './routes/project/project.vue';
import NewRole from './routes/roles/add-new.vue';
import RolesCollection from './routes/roles/collection.vue';
import RolesItem from './routes/roles/item/item.vue';
import RolesPermissionsDetail from './routes/roles/permissions-detail/permissions-detail.vue';
import RolesPublicItem from './routes/roles/public-item.vue';
import TranslationsCollection from './routes/translations/collection.vue';
import TranslationsItem from './routes/translations/item.vue';
import WebhooksCollection from './routes/webhooks/collection.vue';
import WebhooksItem from './routes/webhooks/item.vue';

export default defineModule({
	id: 'settings',
	name: '$t:settings',
	icon: 'settings',
	color: 'var(--primary)',
	routes: [
		{
			name: 'settings-data-model-redirect',
			path: '',
			redirect: '/settings/data-model',
		},
		{
			name: 'settings-project',
			path: 'project',
			component: Project,
		},
		{
			path: 'data-model',
			component: RouterPass,
			children: [
				{
					name: 'settings-collections',
					path: '',
					component: Collections,
					beforeEnter() {
						const collectionsStore = useCollectionsStore();
						collectionsStore.hydrate();
					},
					children: [
						{
							path: '+',
							name: 'settings-add-new',
							components: {
								add: NewCollection,
							},
						},
					],
				},
				{
					name: 'settings-fields',
					path: ':collection',
					component: Fields,
					async beforeEnter(to) {
						const collectionsStore = useCollectionsStore();
						const info = collectionsStore.getCollection(to.params.collection as string);

						if (!info) {
							return {
								name: 'settings-not-found',
								params: { _: to.path.split('/').slice(1) },
							};
						}

						if (!info?.meta) {
							await api.patch(`/collections/${to.params.collection}`, { meta: {} });
						}

						const fieldsStore = useFieldsStore();
						fieldsStore.hydrate();
					},
					props: (route) => ({
						collection: route.params.collection,
						field: route.params.field,
						type: route.query.type,
					}),
					children: [
						{
							path: ':field',
							name: 'settings-fields-field',
							components: {
								field: FieldDetail,
							},
						},
					],
				},
			],
		},
		{
			path: 'roles',
			component: RouterPass,
			children: [
				{
					name: 'settings-roles-collection',
					path: '',
					component: RolesCollection,
					children: [
						{
							path: '+',
							name: 'settings-add-new-role',
							components: {
								add: NewRole,
							},
						},
					],
				},
				{
					path: 'public',
					component: RolesPublicItem,
					props: true,
					children: [
						{
							path: ':permissionKey',
							components: {
								permissionsDetail: RolesPermissionsDetail,
							},
						},
					],
				},
				{
					name: 'settings-roles-item',
					path: ':primaryKey',
					component: RolesItem,
					props: true,
					children: [
						{
							path: ':permissionKey',
							components: {
								permissionsDetail: RolesPermissionsDetail,
							},
						},
					],
				},
			],
		},
		{
			path: 'presets',
			component: RouterPass,
			children: [
				{
					name: 'settings-presets-collection',
					path: '',
					component: PresetsCollection,
				},
				{
					name: 'settings-presets-item',
					path: ':id',
					component: PresetsItem,
					props: true,
				},
			],
		},
		{
			path: 'webhooks',
			component: RouterPass,
			children: [
				{
					name: 'settings-webhooks-collection',
					path: '',
					component: WebhooksCollection,
				},
				{
					name: 'settings-webhooks-item',
					path: ':primaryKey',
					component: WebhooksItem,
					props: true,
				},
			],
		},
		{
			path: 'flows',
			component: RouterPass,
			children: [
				{
					name: 'settings-flows-collection',
					path: '',
					component: FlowsOverview,
				},
				{
					name: 'settings-flows-item',
					path: ':primaryKey',
					component: FlowsDetail,
					props: true,
					async beforeEnter(to) {
						const { flows } = useFlowsStore();
						const existingFlow = flows.find((flow) => flow.id === to.params.primaryKey);

						if (!existingFlow) {
							return {
								name: 'settings-not-found',
								params: { _: to.path.split('/').slice(1) },
							};
						}
					},
					children: [
						{
							name: 'settings-flows-operation',
							path: ':operationId',
							component: FlowOperationDetail,
							props: true,
						},
					],
				},
			],
		},
		{
			path: 'translations',
			component: RouterPass,
			children: [
				{
					name: 'settings-translations-collection',
					path: '',
					component: TranslationsCollection,
				},
				{
					name: 'settings-translations-item',
					path: ':primaryKey',
					component: TranslationsItem,
					props: true,
				},
			],
		},
		{
			name: 'settings-not-found',
			path: ':_(.+)+',
			component: NotFound,
		},
	],
	preRegisterCheck: (user) => {
		return user.role.admin_access === true;
	},
});
