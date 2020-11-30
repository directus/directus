import { defineDisplay } from '@/displays/define';
import DisplayJsonValue from './formatted-json-value.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'formatted-json-value',
	name: i18n.t('displays.formatted-json-value.formatted-json-value'),
	description: i18n.t('displays.formatted-json-value.description'),
	types: ['json'],
	icon: 'settings_ethernet',
	handler: DisplayJsonValue,
	options: [
		{
			field: 'format',
			name: i18n.t('display_template'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
				options: {
					placeholder: '{{ field }}',
				},
			},
		},
	],
}));
