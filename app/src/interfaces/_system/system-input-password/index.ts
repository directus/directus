import InputPassword from './input-password.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-input-password',
	name: '$t:interfaces.input-password.input-password',
	description: '$t:interfaces.input-password.description',
	icon: 'visibility',
	component: InputPassword,
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
