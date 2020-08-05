import { defineModule } from '@/modules/define';
import SettingsProject from './routes/project';
import { SettingsCollections, SettingsNewCollection, SettingsFields, SettingsFieldDetail } from './routes/data-model/';
import { SettingsRolesBrowse, SettingsRolesDetail } from './routes/roles';
import { SettingsWebhooksBrowse, SettingsWebhooksDetail } from './routes/webhooks';
import { SettingsPresetsBrowse, SettingsPresetsDetail } from './routes/presets';
import SettingsNotFound from './routes/not-found';

export default defineModule(({ i18n }) => ({
	id: 'settings',
	name: i18n.t('settings'),
	icon: 'settings',
	color: 'var(--warning)',
	routes: [
		{
			path: '/',
			redirect: '/project',
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
						add: SettingsNewCollection
					}
				}
			]
		},
		{
			name: 'settings-fields',
			path: '/data-model/:collection',
			component: SettingsFields,
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
		},
		{
			name: 'settings-roles-detail',
			path: '/roles/:primaryKey',
			component: SettingsRolesDetail,
			props: true,
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
}));
