import InterfaceInputHash from './input-hash.vue';
import PreviewSVG from './preview.svg?raw';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'input-hash',
	name: '$t:interfaces.input-hash.hash',
	description: '$t:interfaces.input-hash.description',
	icon: 'fingerprint',
	recommendedDisplays: ['hash'],
	component: InterfaceInputHash,
	types: ['hash'],
	group: 'other',
	preview: PreviewSVG,
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'system-input-translated-string',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'masked',
			name: '$t:interfaces.input-hash.masked',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.input-hash.masked_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
});
