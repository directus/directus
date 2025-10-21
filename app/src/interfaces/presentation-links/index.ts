import { defineInterface } from '@directus/extensions';
import InterfacePresentationLinks from './presentation-links.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'presentation-links',
	name: '$t:interfaces.presentation-links.presentation-links',
	description: '$t:interfaces.presentation-links.description',
	icon: 'smart_button',
	component: InterfacePresentationLinks,
	hideLabel: true,
	hideLoader: true,
	autoKey: true,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	options: ({ collection }) => [
		{
			field: 'links',
			name: '$t:interfaces.presentation-links.links',
			type: 'json',
			meta: {
				interface: 'list',
				options: {
					fields: [
						{
							field: 'label',
							type: 'string',
							name: '$t:label',
							meta: {
								width: 'full',
								interface: 'system-input-translated-string',
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
							field: 'actionType',
							type: 'string',
							name: '$t:interfaces.presentation-links.action_type',
							schema: {
								default_value: 'link',
							},
							meta: {
								interface: 'select-dropdown',
								options: {
									choices: [
										{ text: 'Link', value: 'link' },
										{ text: 'Flow', value: 'flow' },
									],
								},
							},
						},
						{
							field: 'url',
							type: 'string',
							name: '$t:url',
							meta: {
								width: 'full',
								interface: 'system-display-template',
								options: {
									collectionName: collection,
									font: 'monospace',
									placeholder: 'https://example.com/articles/{{ id }}/{{ slug }}',
								},
								conditions: [
									{
										rule: {
											actionType: {
												_eq: 'flow',
											},
										},
										hidden: true,
									},
								],
							},
						},
						{
							field: 'flow',
							type: 'string',
							name: '$t:flow',
							meta: {
								width: 'full',
								interface: 'system-flow-select',
								options: {},
								conditions: [
									{
										rule: {
											actionType: {
												_eq: 'link',
											},
										},
										hidden: true,
									},
								],
							},
						},
					],
				},
			},
		},
	],
	preview: PreviewSVG,
});
