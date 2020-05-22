import InterfaceTextInput from './text-input.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'text-input',
	name: i18n.t('text_input'),
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
			field: 'font',
			name: 'Font',
			width: 'half',
			interface: 'dropdown',
			default: 'sans-serif',
			options: {
				choices: [
					{ text: 'Sans Serif', value: 'sans-serif' },
					{ text: 'Monospace', value: 'monospace' },
					{ text: 'Serif', value: 'serif' },
				],
			},
		},
	],
}));
