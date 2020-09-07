import InterfaceMarkdown from './markdown.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'markdown',
	name: i18n.t('markdown'),
	icon: 'functions',
	component: InterfaceMarkdown,
	types: ['text'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
			},
		},
		{
			field: 'tabbed',
			name: i18n.t('tabbed'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
		},
	],
	recommendedDisplays: ['raw'],
}));
