import InterfaceSlider from './slider.vue';
import { defineInterface } from '@/interfaces/define';

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
			name: '$t:interfaces.numeric.minimum_value',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'maxValue',
			name: '$t:interfaces.numeric.maximum_value',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'stepInterval',
			name: '$t:interfaces.numeric.step_interval',
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'alwaysShowValue',
			name: '$t:interfaces.slider.always_show_value',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
		},
	],
});
