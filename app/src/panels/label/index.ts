import { definePanel } from '@directus/utils';
import PanelLabel from './panel-label.vue';

export default definePanel({
	id: 'label',
	name: '$t:panels.label.name',
	description: '$t:panels.label.description',
	icon: 'title',
	component: PanelLabel,
	options: ({ options }) => {
		if(!options) options = {};
		return [
			{
				field: 'text',
				name: '$t:label',
				type: 'string',
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
								text: 'Left',
								value: 'left',
							},
							{
								text: 'Center',
								value: 'center',
							},
							{
								text: 'Right',
								value: 'right',
							},
							{
								text: 'Justify',
								value: 'justify',
							},
						],
					},
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
								text: 'Thin',
								value: 100
							},
							{
								text: 'Extra Light',
								value: 200
							},
							{
								text: 'Light',
								value: 300
							},
							{
								text: 'Normal',
								value: 400
							},
							{
								text: 'Medium',
								value: 500
							},
							{
								text: 'Semi Bold',
								value: 600
							},
							{
								text: 'Bold',
								value: 700
							},
							{
								text: 'Extra Bold',
								value: 800
							},
							{
								text: 'Black',
								value: 900
							},
						],
					},
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
								text: 'Normal',
								value: 'normal',
							},
							{
								text: 'Italic',
								value: 'italic',
							},
							{
								text: 'Oblique',
								value: 'oblique',
							},
						],
					},
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
			},
		];
	},
	minWidth: 6,
	minHeight: 2,
});
