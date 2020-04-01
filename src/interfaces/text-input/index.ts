import InterfaceTextInput from './text-input.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'text-input',
	name: i18n.t('interfaces.text-input.text-input'),
	icon: 'box',
	component: InterfaceTextInput,
	options: [
		{
			field: 'monospace',
			name: 'Monospace',
			width: 'half',
			interface: 'switch',
		},
		{
			field: 'placeholder',
			name: 'Placeholder',
			width: 'half',
			interface: 'text-input',
		},
	],
}));
