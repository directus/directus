import { definePanel } from '@directus/extensions';
import PanelLabel from './panel-label.vue';
import PreviewSVG from './preview.svg?raw';

export default definePanel({
	id: 'label',
	name: '$t:panels.label.name',
	description: '$t:panels.label.description',
	icon: 'title',
	preview: PreviewSVG,
	component: PanelLabel,
	options: ({ options }) => {
		return [
			{
				field: 'text',
				name: '$t:label',
				type: 'string',
				required: true,
				meta: {
					interface: options?.whiteSpace == 'nowrap' ? 'input' : 'input-multiline',
				},
			},
			{
				field: 'whiteSpace',
				type: 'string',
				name: '$t:text_wrap',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: 'Normal',
								value: 'normal',
							},
							{
								text: 'No Wrap',
								value: 'nowrap',
							},
							{
								divider: true,
							},
							{
								text: 'Preserve',
								value: 'pre',
							},
							{
								text: 'Preserve Wrap',
								value: 'pre-wrap',
							},
							{
								text: 'Preserve Line',
								value: 'pre-line',
							},
							{
								text: 'Break Spaces',
								value: 'break-spaces',
							},
						],
					},
				},
				schema: {
					default_value: 'nowrap',
				},
			},
			{
				field: 'styleDivider',
				type: 'alias',
				meta: {
					interface: 'presentation-divider',
					options: {
						icon: 'style',
						title: 'Style & Format',
					},
					special: ['alias', 'no-data'],
				},
			},
			{
				field: 'color',
				name: '$t:color',
				type: 'string',
				meta: {
					interface: 'select-color',
					width: 'half',
					options: {
						placeholder: '$t:automatic',
					},
				},
			},
			{
				field: 'textAlign',
				type: 'string',
				name: '$t:text_align',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:left',
								value: 'left',
							},
							{
								text: '$t:center',
								value: 'center',
							},
							{
								text: '$t:right',
								value: 'right',
							},
							{
								text: '$t:justify',
								value: 'justify',
							},
						],
					},
				},
				schema: {
					default_value: 'center',
				},
			},
			{
				field: 'fontWeight',
				type: 'string',
				name: '$t:font_weight',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:fonts.thin',
								value: 100,
							},
							{
								text: '$t:fonts.extra_light',
								value: 200,
							},
							{
								text: '$t:fonts.light',
								value: 300,
							},
							{
								text: '$t:fonts.normal',
								value: 400,
							},
							{
								text: '$t:fonts.medium',
								value: 500,
							},
							{
								text: '$t:fonts.semi_bold',
								value: 600,
							},
							{
								text: '$t:fonts.bold',
								value: 700,
							},
							{
								text: '$t:fonts.extra_bold',
								value: 800,
							},
							{
								text: '$t:fonts.black',
								value: 900,
							},
						],
					},
				},
				schema: {
					default_value: 800,
				},
			},
			{
				field: 'fontStyle',
				type: 'string',
				name: '$t:font_style',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:fonts.normal',
								value: 'normal',
							},
							{
								text: '$t:fonts.italic',
								value: 'italic',
							},
							{
								text: '$t:fonts.oblique',
								value: 'oblique',
							},
						],
					},
				},
				schema: {
					default_value: 'normal',
				},
			},
			{
				field: 'fontSize',
				type: 'string',
				name: '$t:font_size',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: '$t:fonts.small', value: '32px' },
							{ text: '$t:fonts.medium', value: '48px' },
							{ text: '$t:fonts.large', value: '64px' },
							{ text: '$t:fonts.auto', value: 'auto' },
						],
					},
				},
				schema: {
					default_value: 'auto',
				},
			},
			{
				field: 'font',
				type: 'string',
				name: '$t:font',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: '$t:displays.formatted-value.font_sans_serif', value: 'sans-serif' },
							{ text: '$t:displays.formatted-value.font_serif', value: 'serif' },
							{ text: '$t:displays.formatted-value.font_monospace', value: 'monospace' },
						],
					},
				},
				schema: {
					default_value: 'sans-serif',
				},
			},
		];
	},
	minWidth: 6,
	minHeight: 2,
});
