import InterfaceMarkdown from './markdown.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'markdown',
	name: i18n.t('interfaces.markdown.markdown'),
	description: i18n.t('interfaces.markdown.description'),
	icon: 'functions',
	component: InterfaceMarkdown,
	types: ['text'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'textarea',
				options: {
					placeholder: i18n.t('enter_a_placeholder'),
				},
			},
		},
		{
			field: 'customSyntax',
			name: i18n.t('interfaces.markdown.customSyntax'),
			type: 'json',
			meta: {
				note: i18n.t('interfaces.markdown.customSyntax_label'),
				width: 'full',
				interface: 'repeater',
				options: {
					addLabel: i18n.t('interfaces.markdown.customSyntax_add'),
					template: '{{ name }}',
					fields: [
						{
							field: 'name',
							type: 'string',
							name: i18n.t('name'),
							meta: {
								interface: 'text-input',
								width: 'half',
							},
						},
						{
							field: 'icon',
							type: 'string',
							name: i18n.t('icon'),
							meta: {
								interface: 'icon',
								width: 'half',
							},
						},
						{
							field: 'prefix',
							type: 'string',
							name: i18n.t('prefix'),
							meta: {
								interface: 'text-input',
								width: 'half',
							},
						},
						{
							field: 'suffix',
							type: 'string',
							name: i18n.t('suffix'),
							meta: {
								interface: 'text-input',
								width: 'half',
							},
						},
						{
							field: 'box',
							type: 'string',
							name: i18n.t('interfaces.markdown.box'),
							meta: {
								interface: 'radio-buttons',
								width: 'half',
								options: {
									choices: [
										{
											text: i18n.t('inline'),
											value: 'inline',
										},
										{
											text: i18n.t('block'),
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
			name: i18n.t('interfaces.markdown.imageToken'),
			type: 'string',
			meta: {
				note: i18n.t('interfaces.markdown.imageToken_label'),
				width: 'full',
				interface: 'text-input',
			},
		},
	],
}));
