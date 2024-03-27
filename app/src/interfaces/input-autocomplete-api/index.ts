import { defineInterface } from '@directus/extensions';
import InterfaceInputAutocompleteAPI from './input-autocomplete-api.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'input-autocomplete-api',
	name: '$t:interfaces.input-autocomplete-api.input-autocomplete-api',
	description: '$t:interfaces.input-autocomplete-api.description',
	icon: 'find_in_page',
	component: InterfaceInputAutocompleteAPI,
	types: ['string', 'text'],
	localTypes: ['standard'],
	group: 'standard',
	recommendedDisplays: ['formatted-value'],
	options: [
		{
			field: 'url',
			name: '$t:url',
			type: 'string',
			meta: {
				interface: 'input',
				options: {
					placeholder: 'https://example.com/search?q={{value}}',
					font: 'monospace',
				},
				width: 'full',
			},
		},
		{
			field: 'resultsPath',
			name: '$t:interfaces.input-autocomplete-api.results_path',
			type: 'string',
			meta: {
				interface: 'input',
				options: {
					placeholder: 'result.predictions',
					font: 'monospace',
				},
				width: 'full',
			},
		},
		{
			field: 'textPath',
			name: '$t:interfaces.input-autocomplete-api.text_path',
			type: 'string',
			meta: {
				interface: 'input',
				options: {
					placeholder: 'structured_main_text',
					font: 'monospace',
				},
				width: 'half',
			},
		},
		{
			field: 'valuePath',
			name: '$t:interfaces.input-autocomplete-api.value_path',
			type: 'string',
			meta: {
				interface: 'input',
				options: {
					placeholder: 'structured_main_value',
					font: 'monospace',
				},
				width: 'half',
			},
		},
		{
			field: 'trigger',
			name: '$t:interfaces.input-autocomplete-api.trigger',
			type: 'string',
			schema: {
				default_value: 'throttle',
			},
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: 'Throttle',
							value: 'throttle',
						},
						{
							text: 'Debounce',
							value: 'debounce',
						},
					],
				},
			},
		},
		{
			field: 'rate',
			name: '$t:interfaces.input-autocomplete-api.rate',
			type: 'integer',
			schema: {
				default_value: 500,
			},
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
		{
			field: 'placeholder',
			name: '$t:placeholder',
			meta: {
				width: 'half',
				interface: 'system-input-translated-string',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'font',
			name: '$t:font',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: '$t:sans_serif', value: 'sans-serif' },
						{ text: '$t:monospace', value: 'monospace' },
						{ text: '$t:serif', value: 'serif' },
					],
				},
			},
			schema: {
				default_value: 'sans-serif',
			},
		},
		{
			field: 'iconLeft',
			name: '$t:icon_left',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
		{
			field: 'iconRight',
			name: '$t:icon_right',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
	],
	preview: PreviewSVG,
});
