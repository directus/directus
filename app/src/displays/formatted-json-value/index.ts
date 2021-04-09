import { defineDisplay } from '@/displays/define';
import DisplayJsonValue from './formatted-json-value.vue';

export default defineDisplay({
	id: 'formatted-json-value',
	name: '$t:displays.formatted-json-value.formatted-json-value',
	description: '$t:displays.formatted-json-value.description',
	types: ['json'],
	icon: 'settings_ethernet',
	handler: DisplayJsonValue,
	options: [
		{
			field: 'format',
			name: '$t:display_template',
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
});
