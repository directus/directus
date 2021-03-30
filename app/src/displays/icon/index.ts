import { defineDisplay } from '@/displays/define';
import DisplayIcon from './icon.vue';

export default defineDisplay({
	id: 'icon',
	name: '$t:displays.icon.icon',
	description: '$t:displays.icon.description',
	icon: 'insert_emoticon',
	handler: DisplayIcon,
	options: [
		{
			field: 'filled',
			name: '$t:displays.icon.filled',
			type: 'boolean',
			meta: {
				interface: 'toggle',
				width: 'half',
				options: {
					label: '$t:displays.icon.filled_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				interface: 'color',
				width: 'half',
			},
		},
	],
	types: ['string'],
});
