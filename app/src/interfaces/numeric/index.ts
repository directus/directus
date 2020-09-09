import InterfaceNumeric from './numeric.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'numeric',
	name: i18n.t('interfaces.numeric.numeric'),
	description: i18n.t('interfaces.numeric.description'),
	icon: 'dialpad',
	component: InterfaceNumeric,
	types: ['integer', 'decimal', 'float', 'bigInteger'],
	options: [
		{
			field: 'min',
			name: i18n.t('interfaces.numeric.minimum_value'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'max',
			name: i18n.t('interfaces.numeric.maximum_value'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'step',
			name: i18n.t('interfaces.numeric.step_interval'),
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
			name: i18n.t('placeholder'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: i18n.t('enter_a_placeholder'),
				},
			},
		},
		{
			field: 'iconLeft',
			name: i18n.t('icon_left'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'iconRight',
			name: i18n.t('icon_right'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'font',
			name: i18n.t('font'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: i18n.t('sans_serif'), value: 'sans-serif' },
						{ text: i18n.t('monospace'), value: 'monospace' },
						{ text: i18n.t('serif'), value: 'serif' },
					],
				},
			},
			schema: {
				default_value: 'sans-serif',
			},
		},
	],
}));
