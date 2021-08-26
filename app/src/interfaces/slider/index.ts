import { defineInterface } from '@directus/shared/utils';
import InterfaceSlider from './slider.vue';

export default defineInterface({
	id: 'slider',
	name: '$t:interfaces.slider.slider',
	description: '$t:interfaces.slider.description',
	icon: 'linear_scale',
	component: InterfaceSlider,
	types: ['integer', 'decimal', 'float', 'bigInteger'],
	options: [
		{
			field: 'minValue',
			name: '$t:interfaces.input.minimum_value',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
		{
			field: 'maxValue',
			name: '$t:interfaces.input.maximum_value',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
		{
			field: 'stepInterval',
			name: '$t:interfaces.input.step_interval',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
		{
			field: 'alwaysShowValue',
			name: '$t:interfaces.slider.always_show_value',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
			},
		},
	],
});
