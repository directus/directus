import { defineInterface } from '@/interfaces/define';
import InterfaceButtonLinks from './button-links.vue';

export default defineInterface({
	id: 'button-links',
	name: '$t:interfaces.button-links.button-links',
	description: '$t:interfaces.button-links.description',
	icon: 'smart_button',
	component: InterfaceButtonLinks,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	groups: ['presentation'],
	options: [
		{
			field: 'links',
			type: 'json',
			name: '$t:interfaces.button-links.links',
			meta: {
				width: 'full',
				interface: 'repeater',
				options: {
					placeholder: '$t:title',
					template: '{{ label }}',
					fields: [
						{
							field: 'label',
							type: 'string',
							name: '$t:label',
							meta: {
								width: 'full',
								interface: 'text-input',
								options: {
									placeholder: '$t:label',
								},
							},
						},
						{
							field: 'icon',
							name: '$t:icon',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'icon',
							},
						},
						{
							field: 'type',
							name: '$t:type',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'dropdown',
								default_value: 'normal',
								options: {
									choices: [
										{ text: '$t:primary', value: 'primary' },
										{ text: '$t:normal', value: 'normal' },
										{ text: '$t:info', value: 'info' },
										{ text: '$t:success', value: 'success' },
										{ text: '$t:warning', value: 'warning' },
										{ text: '$t:danger', value: 'danger' },
									],
								},
							},
							schema: {
								default_value: 'normal',
							},
						},
						{
							field: 'url',
							type: 'string',
							name: '$t:url',
							meta: {
								width: 'full',
								interface: 'text-input',
								options: {
									font: 'monospace',
									placeholder: 'https://example.com/articles/{{ id }}/{{ slug }}',
								},
							},
						},
					],
				},
			},
		},
	],
});
