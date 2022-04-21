import { DeepPartial, Field } from '@directus/shared/types';
import { defineInterface } from '@directus/shared/utils';
import InterfaceInput from './input.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'input',
	name: '$t:interfaces.input.input',
	description: '$t:interfaces.input.description',
	icon: 'text_fields',
	component: InterfaceInput,
	types: ['string', 'uuid', 'bigInteger', 'integer', 'float', 'decimal', 'text'],
	group: 'standard',
	options: ({ field }) => {
		const fontOptions: DeepPartial<Field>[] = [
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
		];

		const standardOptions: DeepPartial<Field>[] = [
			{
				field: 'placeholder',
				name: '$t:placeholder',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'system-input-translated-string',
					options: {
						placeholder: '$t:enter_a_placeholder',
					},
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
		];

		const affixOptions: DeepPartial<Field>[] = [
			{
				field: 'prefix',
				name: '$t:prefix',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'system-input-translated-string',
					options: {
						placeholder: '$t:prefix_placeholder',
					},
				},
			},
			{
				field: 'suffix',
				name: '$t:suffix',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'system-input-translated-string',
					options: {
						placeholder: '$t:suffix_placeholder',
					},
				},
			},
		];

		const textOptions: DeepPartial<Field>[] = [
			{
				field: 'softLength',
				name: '$t:soft_length',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						placeholder: '255',
						min: 1,
						max: field.schema?.max_length,
					},
				},
			},
			...fontOptions,
			{
				field: 'trim',
				name: '$t:interfaces.input.trim',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.trim_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'masked',
				name: '$t:interfaces.input.mask',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.mask_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'clear',
				name: '$t:interfaces.input.clear',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.clear_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'slug',
				name: '$t:interfaces.input.slug',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.slug_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'spellcheck',
				name: '$t:interfaces.input.spellcheck',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.spellcheck_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
		];

		/**
		 * These values are all saved as strings, so treating them all as floats will
		 * allow us variable precision and scale without any extra code.
		 * ---
		 * In the future it might be a good idea to restrict these numbers to the
		 * data type of the current field being created.
		 */
		const numberOptions: DeepPartial<Field>[] = [
			{
				field: 'min',
				name: '$t:interfaces.input.minimum_value',
				type: 'float',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						hideDataWarnings: true,
					},
				},
			},
			{
				field: 'max',
				name: '$t:interfaces.input.maximum_value',
				type: 'float',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						hideDataWarnings: true,
					},
				},
			},
			{
				field: 'step',
				name: '$t:interfaces.input.step_interval',
				type: 'float',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						hideDataWarnings: true,
					},
				},
				schema: {
					default_value: 1,
				},
			},
		];

		const numberArrows: DeepPartial<Field>[] = [
			{
				field: 'hideArrows',
				name: '$t:interfaces.input.hide_arrows',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.hide_arrows_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
		];

		const dataWarnings: DeepPartial<Field>[] = [
			{
				field: 'hideDataWarnings',
				name: '$t:interfaces.input.hide_data_warnings',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.hide_data_warnings_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
		];

		if (field.type && ['bigInteger', 'integer', 'float', 'decimal'].includes(field.type)) {
			return {
				standard: [...standardOptions, ...numberOptions],
				advanced: [...fontOptions, ...affixOptions, ...numberArrows, ...dataWarnings],
			};
		}

		return {
			standard: [...standardOptions],
			advanced: [...affixOptions, ...textOptions, ...numberArrows],
		};
	},
	preview: PreviewSVG,
});
