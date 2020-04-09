import { defineModule } from '@/modules/define';

export default defineModule(({ i18n }) => ({
	id: 'docs',
	name: i18n.t('help_and_docs'),
	icon: 'help',
	link: 'https://docs.directus.io',
}));
