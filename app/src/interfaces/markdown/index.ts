import InterfaceMarkdown from './markdown.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'markdown',
	name: i18n.t('markdown'),
	icon: 'text_fields',
	component: InterfaceMarkdown,
	types: ['text'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			system: {
				width: 'half',
				interface: 'text-input',
			},
		},
		{
			field: 'tabbed',
			name: i18n.t('tabbed'),
			system: {
				width: 'half',
				interface: 'toggle',
			},
		},
	],
}));
