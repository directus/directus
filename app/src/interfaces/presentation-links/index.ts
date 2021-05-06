import { defineInterface } from '@/interfaces/define';
import InterfacePresentationLinks from './presentation-links.vue';

export default defineInterface({
	id: 'presentation-links',
	name: '$t:interfaces.presentation-links.presentation-links',
	description: '$t:interfaces.presentation-links.description',
	icon: 'smart_button',
	component: InterfacePresentationLinks,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	groups: ['presentation'],
	options: [
		{
			field: 'links',
			type: 'json',
			name: '$t:interfaces.presentation-links.links',
			meta: {
				width: 'full',
				interface: 'list',
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
								interface: 'input',
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
								interface: 'select-icon',
							},
						},
						{
							field: 'type',
							name: '$t:type',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'select-dropdown',
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
								interface: 'input',
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
