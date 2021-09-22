import api from '@/api';
import { defineModule } from '@directus/shared/utils';
import { useCollectionsStore, useFieldsStore } from '@/stores';
import RouterPass from '@/utils/router-passthrough';
import Collections from './routes/data-model/collections/collections.vue';
import FieldDetail from './routes/data-model/field-detail/field-detail.vue';
import Fields from './routes/data-model/fields/fields.vue';
import NewCollection from './routes/data-model/new-collection.vue';
import NotFound from './routes/not-found.vue';
import PresetsCollection from './routes/presets/collection/collection.vue';
import PresetsItem from './routes/presets/item.vue';
import Project from './routes/project/project.vue';
import NewRole from './routes/roles/add-new.vue';
import RolesCollection from './routes/roles/collection.vue';
import RolesItem from './routes/roles/item/item.vue';
import RolesPermissionsDetail from './routes/roles/permissions-detail/permissions-detail.vue';
import RolesPublicItem from './routes/roles/public-item.vue';
import WebhooksCollection from './routes/webhooks/collection.vue';
import WebhooksItem from './routes/webhooks/item.vue';

export default defineModule({
	id: 'settings',
	name: '$t:settings',
	icon: 'settings',
	color: 'var(--warning)',
	routes: [
		{
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
						const fieldsStore = useFieldsStore();

						if (!info?.meta) {
							await api.patch(`/collections/${to.params.collection}`, { meta: {} });
						}

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
			name: 'settings-not-found',
			path: ':_(.+)+',
			component: NotFound,
		},
	],
	preRegisterCheck: (user) => {
		return user.role.admin_access === true;
	},
	order: Infinity,
	persistent: true,
});
