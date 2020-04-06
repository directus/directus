import InterfaceTextarea from './textarea.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'textarea',
	name: i18n.t('interfaces.textarea.textarea'),
	icon: 'box',
	component: InterfaceTextarea,
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
		{
			field: 'rows',
			name: 'Rows',
			width: 'half',
			interface: 'numeric',
			options: {
				min: 5,
				max: 100,
			},
			default: 8,
		},
	],
}));
