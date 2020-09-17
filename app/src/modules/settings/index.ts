import { defineModule } from '@/modules/define';
import SettingsProject from './routes/project/project.vue';
import SettingsCollections from './routes/data-model/collections/collections.vue';
import SettingsNewCollection from './routes/data-model/new-collection.vue';
import SettingsFields from './routes/data-model/fields/fields.vue';
import SettingsFieldDetail from './routes/data-model/field-detail/field-detail.vue';
import SettingsRolesBrowse from './routes/roles/browse.vue';
import SettingsRolesPublicDetail from './routes/roles/public-detail.vue';
import SettingsRolesPermissionsDetail from './routes/roles/permissions-detail/permissions-detail.vue';
import SettingsRolesDetail from './routes/roles/detail/detail.vue';
import SettingsPresetsBrowse from './routes/presets/browse/browse.vue';
import SettingsPresetsDetail from './routes/presets/detail.vue';
import SettingsWebhooksBrowse from './routes/webhooks/browse.vue';
import SettingsWebhooksDetail from './routes/webhooks/detail.vue';
import SettingsNewRole from './routes/roles/add-new.vue';
import SettingsNotFound from './routes/not-found.vue';
import api from '@/api';
import { useCollection } from '@/composables/use-collection';
import { ref } from '@vue/composition-api';

export default defineModule(({ i18n }) => ({
	id: 'settings',
	name: i18n.t('settings'),
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
			component: SettingsProject,
		},
		{
			name: 'settings-collections',
			path: '/data-model',
			component: SettingsCollections,
			children: [
				{
					path: '+',
					name: 'settings-add-new',
					components: {
						add: SettingsNewCollection,
					},
				},
			],
		},
		{
			name: 'settings-fields',
			path: '/data-model/:collection',
			component: SettingsFields,
			async beforeEnter(to, from, next) {
				const { info } = useCollection(ref(to.params.collection));

				if (!info.value?.meta) {
					await api.patch(`/collections/${to.params.collection}`, { meta: {} });
				}

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
						field: SettingsFieldDetail,
					},
				},
			],
		},
		{
			name: 'settings-roles-browse',
			path: '/roles',
			component: SettingsRolesBrowse,
			children: [
				{
					path: '+',
					name: 'settings-add-new-role',
					components: {
						add: SettingsNewRole,
					},
				}
			]
		},
		{
			path: '/roles/public',
			component: SettingsRolesPublicDetail,
			props: true,
			children: [
				{
					path: ':permissionKey',
					components: {
						permissionsDetail: SettingsRolesPermissionsDetail,
					},
				},
			],
		},
		{
			name: 'settings-roles-detail',
			path: '/roles/:primaryKey',
			component: SettingsRolesDetail,
			props: true,
			children: [
				{
					path: ':permissionKey',
					components: {
						permissionsDetail: SettingsRolesPermissionsDetail,
					},
				},
			],
		},
		{
			name: 'settings-presets-browse',
			path: '/presets',
			component: SettingsPresetsBrowse,
		},
		{
			name: 'settings-presets-detail',
			path: '/presets/:id',
			component: SettingsPresetsDetail,
			props: true,
		},
		{
			name: 'settings-webhooks-browse',
			path: '/webhooks',
			component: SettingsWebhooksBrowse,
		},
		{
			name: 'settings-webhooks-detail',
			path: '/webhooks/:primaryKey',
			component: SettingsWebhooksDetail,
			props: true,
		},
		{
			name: 'settings-not-found',
			path: '*',
			component: SettingsNotFound,
		},
	],
	preRegisterCheck: (user) => {
		return user.role.admin === true;
	},
	order: Infinity,
	persistent: true,
}));
