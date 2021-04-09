import { defineDisplay } from '@/displays/define';
import DisplayFormattedValue from './formatted-value.vue';

export default defineDisplay({
	id: 'formatted-value',
	name: '$t:displays.formatted-value.formatted-value',
	description: '$t:displays.formatted-value.description',
	types: ['string', 'text', 'integer', 'float', 'decimal', 'bigInteger'],
	icon: 'text_format',
	handler: DisplayFormattedValue,
	options: [
		{
			field: 'formatTitle',
			name: '$t:displays.formatted-value.format_title',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:displays.formatted-value.format_title_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'bold',
			name: '$t:bold',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:displays.formatted-value.bold_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'color',
			name: '$t:color',
			meta: {
				width: 'half',
				interface: 'color',
			},
		},
		{
			field: 'font',
			name: '$t:font',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: '$t:sans_serif', value: 'sans-serif' },
						{ text: '$t:serif', value: 'serif' },
						{ text: '$t:monospace', value: 'monospace' },
					],
				},
			},
			schema: {
				default_value: 'sans-serif',
			},
		},
	],
});
