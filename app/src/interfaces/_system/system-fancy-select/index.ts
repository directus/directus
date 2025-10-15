import { defineInterface } from '@directus/extensions';
import InputFancySelect from './input-fancy-select.vue';

export default defineInterface({
	id: 'system-fancy-select',
	name: '$t:interfaces.fancy-select.fancy-select',
	description: '$t:interfaces.fancy-select.description',
	icon: 'visibility',
	component: InputFancySelect,
	system: true,
	types: ['string', 'text'],
	group: 'standard',
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
	],
});
