import InterfaceSlider from './slider.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'slider',
	name: i18n.t('interfaces.slider.slider'),
	description: i18n.t('interfaces.slider.description'),
	icon: 'linear_scale',
	component: InterfaceSlider,
	types: ['integer', 'decimal', 'float', 'bigInteger'],
	options: [
		{
			field: 'minValue',
			name: i18n.t('interfaces.numeric.minimum_value'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'maxValue',
			name: i18n.t('interfaces.numeric.maximum_value'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'stepInterval',
			name: i18n.t('interfaces.numeric.step_interval'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'alwaysShowValue',
			name: i18n.t('interfaces.slider.always_show_value'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
		},
	],
}));
