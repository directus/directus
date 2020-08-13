import { defineDisplay } from '@/displays/define';
import DisplayFormattedValue from './formatted-value.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'formatted-value',
	name: i18n.t('formatted_value'),
	types: ['string', 'text'],
	icon: 'text_format',
	handler: DisplayFormattedValue,
	options: [
		{
			field: 'formatTitle',
			name: i18n.t('format_title'),
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('auto_format_casing'),
				},
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'bold',
			name: i18n.t('bold'),
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('use_bold_style'),
				},
			},
		},
		{
			field: 'color',
			name: i18n.t('color'),
			meta: {
				width: 'half',
				interface: 'color',
			},
		},
		{
			field: 'font',
			name: i18n.t('font'),
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: i18n.t('sans_serif'), value: 'sans-serif' },
						{ text: i18n.t('serif'), value: 'serif' },
						{ text: i18n.t('monospace'), value: 'monospace' },
					],
				},
			},
		},
	],
}));
