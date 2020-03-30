import { defineModule } from '@/modules/define';
import SettingsGlobal from './routes/global';
import { SettingsCollections, SettingsFields } from './routes/data-model/';
import SettingsRoles from './routes/roles';
import SettingsWebhooks from './routes/webhooks';

export default defineModule(({ i18n }) => ({
	id: 'settings',
	name: i18n.t('settings'),
	icon: 'settings',
	routes: [
		{
			path: '/',
			redirect: '/global',
		},
		{
			name: 'settings-global',
			path: '/global',
			component: SettingsGlobal,
		},
		{
			name: 'settings-collections',
			path: '/data-model',
			component: SettingsCollections,
		},
		{
			name: 'settings-fields',
			path: '/data-model/:collection',
			component: SettingsFields,
			props: true,
		},
		{
			name: 'settings-roles',
			path: '/roles',
			component: SettingsRoles,
		},
		{
			name: 'settings-webhooks',
			path: '/webhooks',
			component: SettingsWebhooks,
		},
	],
}));
