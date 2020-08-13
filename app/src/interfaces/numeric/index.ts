import InterfaceNumeric from './numeric.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'numeric',
	name: i18n.t('numeric'),
	icon: 'dialpad',
	component: InterfaceNumeric,
	types: ['integer', 'decimal', 'float', 'bigInteger'],
	options: [
		{
			field: 'min',
			name: i18n.t('minimum_value'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'max',
			name: i18n.t('maximum_value'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'step',
			name: i18n.t('step_interval'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
		},
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
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
		},
	],
}));
