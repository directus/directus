import InterfaceTextInput from './text-input.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'text-input',
	name: i18n.t('interfaces.text-input.text-input'),
	icon: 'text_fields',
	component: InterfaceTextInput,
	options: [
		{
			field: 'placeholder',
			name: 'Placeholder',
			width: 'half',
			interface: 'text-input',
		},
		{
			field: 'iconLeft',
			name: 'Icon Left',
			width: 'half',
			interface: 'icon',
		},
		{
			field: 'iconRight',
			name: 'Icon Right',
			width: 'half',
			interface: 'icon',
		},
		{
			field: 'trim',
			name: 'Trim',
			width: 'half',
			interface: 'toggle',
		},
		{
			field: 'font',
			name: 'Font',
			width: 'half',
			interface: 'select-one-dropdown',
			options: {
				items: [
					{ itemText: 'Sans', itemValue: 'sans-serif' },
					{ itemText: 'Mono', itemValue: 'monospace' },
					{ itemText: 'Serif', itemValue: 'serif' },
				],
			},
		},
	],
}));
