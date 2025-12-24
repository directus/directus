import api from '@/api';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useFlowsStore } from '@/stores/flows';
import RouterPass from '@/utils/router-passthrough';
import { defineModule } from '@directus/extensions';
import Appearance from './routes/appearance/item.vue';
import AiOverview from './routes/ai/overview.vue';
import Collections from './routes/data-model/collections/collections.vue';
import FieldDetail from './routes/data-model/field-detail/field-detail.vue';
import Fields from './routes/data-model/fields/fields.vue';
import NewCollection from './routes/data-model/new-collection.vue';
import Extensions from './routes/extensions/extensions.vue';
import FlowOperationDetail from './routes/flows/components/operation-detail.vue';
import FlowsDetail from './routes/flows/flow.vue';
import FlowsOverview from './routes/flows/overview.vue';
import MarketplaceAccount from './routes/marketplace/routes/account/account.vue';
import MarketplaceExtension from './routes/marketplace/routes/extension/extension.vue';
import MarketplaceRegistry from './routes/marketplace/routes/registry/registry.vue';
import NotFound from './routes/not-found.vue';
import PoliciesCollection from './routes/policies/collection.vue';
import PoliciesItem from './routes/policies/item.vue';
import NewPolicy from './routes/policies/add-new.vue';
import PresetsCollection from './routes/presets/collection/collection.vue';
import PresetsItem from './routes/presets/item.vue';
import Project from './routes/project/project.vue';
import NewRole from './routes/roles/add-new.vue';
import RolesCollection from './routes/roles/collection.vue';
import RolesItem from './routes/roles/item.vue';
import RolesPublicItem from './routes/roles/public-item.vue';
import SystemLogs from './routes/system-logs/logs.vue';
import TranslationsCollection from './routes/translations/collection.vue';
import TranslationsItem from './routes/translations/item.vue';

export default defineModule({
	id: 'settings',
	name: '$t:settings',
	icon: 'settings',
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
			name: 'settings-appearance',
			path: 'appearance',
			component: Appearance,
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
							meta: {
								isFloatingView: true,
							},
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
							meta: {
								isFloatingView: true,
							},
							components: {
								field: FieldDetail,
							},
						},
					],
				},
			],
		},
		{
			path: 'policies',
			component: RouterPass,
			children: [
				{
					name: 'settings-policies-collection',
					path: '',
					component: PoliciesCollection,
					children: [
						{
							path: '+',
							name: 'settings-add-new-policy',
							meta: {
								isFloatingView: true,
							},
							components: {
								add: NewPolicy,
							},
						},
					],
				},
				{
					name: 'settings-policies-item',
					path: ':primaryKey',
					component: PoliciesItem,
					props: true,
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
							meta: {
								isFloatingView: true,
							},
						},
					],
				},
				{
					name: 'settings-roles-public-item',
					path: 'public',
					component: RolesPublicItem,
				},
				{
					name: 'settings-roles-item',
					path: ':primaryKey',
					component: RolesItem,
					props: true,
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
			path: 'ai',
			component: AiOverview,
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
							meta: {
								isFloatingView: true,
							},
							component: FlowOperationDetail,
							props: true,
						},
					],
				},
			],
		},
		{
			path: 'extensions',
			component: Extensions,
		},
		{
			name: 'marketplace',
			path: 'marketplace',
			component: RouterPass,
			children: [
				{
					name: 'marketplace-registry',
					path: '',
					component: MarketplaceRegistry,
				},
				{
					name: 'marketplace-account',
					path: 'account/:accountId',
					component: MarketplaceAccount,
					props: true,
				},
				{
					name: 'marketplace-extension',
					path: 'extension/:extensionId',
					component: MarketplaceExtension,
					props: true,
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
			name: 'settings-system-logs',
			path: 'system-logs',
			component: SystemLogs,
		},
		{
			name: 'settings-not-found',
			path: ':_(.+)+',
			component: NotFound,
		},
	],
	preRegisterCheck: (user) => {
		return user.admin_access === true;
	},
});
