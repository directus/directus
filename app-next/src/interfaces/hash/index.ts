import InterfaceHash from './hash.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface({
	id: 'hash',
	name: '$t:interfaces.hash.hash',
	description: '$t:interfaces.hash.description',
	icon: 'fingerprint',
	component: InterfaceHash,
	types: ['hash'],
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'masked',
			name: '$t:interfaces.hash.masked',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.hash.masked_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
});
