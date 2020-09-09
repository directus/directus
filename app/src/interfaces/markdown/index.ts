import InterfaceMarkdown from './markdown.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'markdown',
	name: i18n.t('interfaces.markdown.markdown'),
	description: i18n.t('interfaces.markdown.description'),
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
				options: {
					placeholder: i18n.t('enter_a_placeholder'),
				},
			},
		},
		{
			field: 'tabbed',
			name: i18n.t('interfaces.markdown.tabbed'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.markdown.tabbed_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
}));
