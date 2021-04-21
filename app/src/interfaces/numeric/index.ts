import InterfaceNumeric from './numeric.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface({
	id: 'numeric',
	name: '$t:interfaces.numeric.numeric',
	description: '$t:interfaces.numeric.description',
	icon: 'dialpad',
	component: InterfaceNumeric,
	types: ['integer', 'decimal', 'float', 'bigInteger'],
	options: [
		{
			field: 'min',
			name: '$t:interfaces.numeric.minimum_value',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'max',
			name: '$t:interfaces.numeric.maximum_value',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'step',
			name: '$t:interfaces.numeric.step_interval',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
			schema: {
				default_value: 1,
			},
		},
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
			field: 'iconLeft',
			name: '$t:icon_left',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'iconRight',
			name: '$t:icon_right',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'font',
			name: '$t:font',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: '$t:sans_serif', value: 'sans-serif' },
						{ text: '$t:monospace', value: 'monospace' },
						{ text: '$t:serif', value: 'serif' },
					],
				},
			},
			schema: {
				default_value: 'sans-serif',
			},
		},
	],
});
