import { defineModule } from '@/modules/define';
import Project from './routes/project/project.vue';
import Collections from './routes/data-model/collections/collections.vue';
import NewCollection from './routes/data-model/new-collection.vue';
import Fields from './routes/data-model/fields/fields.vue';
import FieldDetail from './routes/data-model/field-detail/field-detail.vue';
import RolesCollection from './routes/roles/collection.vue';
import RolesPublicItem from './routes/roles/public-item.vue';
import RolesPermissionsDetail from './routes/roles/permissions-detail/permissions-detail.vue';
import RolesItem from './routes/roles/item/item.vue';
import PresetsCollection from './routes/presets/collection/collection.vue';
import PresetsItem from './routes/presets/item.vue';
import WebhooksCollection from './routes/webhooks/collection.vue';
import WebhooksItem from './routes/webhooks/item.vue';
import NewRole from './routes/roles/add-new.vue';
import NotFound from './routes/not-found.vue';
import api from '@/api';
import { useCollection } from '@/composables/use-collection';
import { ref } from '@vue/composition-api';
import { useCollectionsStore, useFieldsStore } from '@/stores';

export default defineModule({
	id: 'settings',
	name: '$t:settings',
	icon: 'settings',
	color: 'var(--warning)',
	routes: [
		{
			path: '/',
			redirect: '/data-model',
		},
		{
			name: 'settings-project',
			path: '/project',
			component: Project,
		},
		{
			name: 'settings-collections',
			path: '/data-model',
			component: Collections,
			beforeEnter(to, from, next) {
				const collectionsStore = useCollectionsStore();
				collectionsStore.hydrate();
				next();
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
			path: '/data-model/:collection',
			component: Fields,
			async beforeEnter(to, from, next) {
				const { info } = useCollection(ref(to.params.collection));
				const fieldsStore = useFieldsStore();

				if (!info.value?.meta) {
					await api.patch(`/collections/${to.params.collection}`, { meta: {} });
				}

				fieldsStore.hydrate();

				next();
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
		{
			name: 'settings-roles-collection',
			path: '/roles',
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
			path: '/roles/public',
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
			path: '/roles/:primaryKey',
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
		{
			name: 'settings-presets-collection',
			path: '/presets',
			component: PresetsCollection,
		},
		{
			name: 'settings-presets-item',
			path: '/presets/:id',
			component: PresetsItem,
			props: true,
		},
		{
			name: 'settings-webhooks-collection',
			path: '/webhooks',
			component: WebhooksCollection,
		},
		{
			name: 'settings-webhooks-item',
			path: '/webhooks/:primaryKey',
			component: WebhooksItem,
			props: true,
		},
		{
			name: 'settings-not-found',
			path: '*',
			component: NotFound,
		},
	],
	preRegisterCheck: (user) => {
		return user.role.admin_access === true;
	},
	order: Infinity,
	persistent: true,
});
