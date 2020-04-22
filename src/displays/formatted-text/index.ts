import { defineDisplay } from '@/displays/define';
import DisplayFormattedText from './formatted-text.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'formatted-text',
	name: i18n.t('formatted_text'),
	types: ['string'],
	icon: 'box',
	handler: DisplayFormattedText,
	options: [
		{
			field: 'bold',
			name: i18n.t('bold'),
			width: 'half',
			interface: 'toggle',
		},
		{
			field: 'subdued',
			name: i18n.t('subdued'),
			width: 'half',
			interface: 'toggle',
		},
		{
			field: 'font',
			name: i18n.t('font'),
			width: 'half',
			interface: 'dropdown',
			options: {
				items: [
					{ itemText: i18n.t('sans_serif'), itemValue: 'sans-serif' },
					{ itemText: i18n.t('serif'), itemValue: 'serif' },
					{ itemText: i18n.t('monospace'), itemValue: 'monospace' },
				],
			},
		},
	],
}));
