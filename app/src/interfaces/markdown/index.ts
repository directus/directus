import InterfaceMarkdown from './markdown.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface({
	id: 'markdown',
	name: '$t:interfaces.markdown.markdown',
	description: '$t:interfaces.markdown.description',
	icon: 'functions',
	component: InterfaceMarkdown,
	types: ['text'],
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'textarea',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'customSyntax',
			name: '$t:interfaces.markdown.customSyntax',
			type: 'json',
			meta: {
				note: '$t:interfaces.markdown.customSyntax_label',
				width: 'full',
				interface: 'repeater',
				options: {
					addLabel: '$t:interfaces.markdown.customSyntax_add',
					template: '{{ name }}',
					fields: [
						{
							field: 'name',
							type: 'string',
							name: '$t:name',
							meta: {
								interface: 'text-input',
								width: 'half',
							},
						},
						{
							field: 'icon',
							type: 'string',
							name: '$t:icon',
							meta: {
								interface: 'icon',
								width: 'half',
							},
						},
						{
							field: 'prefix',
							type: 'string',
							name: '$t:prefix',
							meta: {
								interface: 'text-input',
								width: 'half',
							},
						},
						{
							field: 'suffix',
							type: 'string',
							name: '$t:suffix',
							meta: {
								interface: 'text-input',
								width: 'half',
							},
						},
						{
							field: 'box',
							type: 'string',
							name: '$t:interfaces.markdown.box',
							meta: {
								interface: 'radio-buttons',
								width: 'half',
								options: {
									choices: [
										{
											text: '$t:inline',
											value: 'inline',
										},
										{
											text: '$t:block',
											value: 'block',
										},
									],
								},
							},
							schema: {
								default_value: 'inline',
							},
						},
					],
				},
			},
		},
		{
			field: 'imageToken',
			name: '$t:interfaces.markdown.imageToken',
			type: 'string',
			meta: {
				note: '$t:interfaces.markdown.imageToken_label',
				width: 'full',
				interface: 'text-input',
			},
		},
	],
});
