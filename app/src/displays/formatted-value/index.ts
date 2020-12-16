import { defineDisplay } from '@/displays/define';
import DisplayFormattedValue from './formatted-value.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'formatted-value',
	name: i18n.t('displays.formatted-value.formatted-value'),
	description: i18n.t('displays.formatted-value.description'),
	types: ['string', 'text'],
	icon: 'text_format',
	handler: DisplayFormattedValue,
	options: [
		{
			field: 'formatTitle',
			name: i18n.t('displays.formatted-value.format_title'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('displays.formatted-value.format_title_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'bold',
			name: i18n.t('bold'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('displays.formatted-value.bold_label'),
				},
			},
			schema: {
				default_value: false,
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
			schema: {
				default_value: 'sans-serif',
			},
		},
	],
}));
