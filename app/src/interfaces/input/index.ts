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

		const smartNumberControls: DeepPartial<Field>[] = [
			{
				field: 'smartNumberControls',
				name: '$t:interfaces.input.smart_number_controls',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.smart_number_controls_label',
					},
				},
				schema: {
					default_value: false,
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
		];

		const numberOptions: DeepPartial<Field>[] = [
			{
				field: 'min',
				name: '$t:interfaces.input.minimum_value',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
				},
			},
			{
				field: 'max',
				name: '$t:interfaces.input.maximum_value',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
				},
			},
			{
				field: 'step',
				name: '$t:interfaces.input.step_interval',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
				},
				schema: {
					default_value: 1,
				},
			},
		];

		const stringNumDivider: DeepPartial<Field>[] = [
			{
				field: 'string_num_divider',
				name: 'string_num_divider',
				type: 'alias',
				meta: {
					width: 'full',
					interface: 'presentation-divider',
					special: ['alias', 'no-data'],
					options: {
						inlineTitle: true,
						title: 'Inline number options',
					},
				},
			},
		];

		if (field.type && ['bigInteger', 'integer', 'float', 'decimal'].includes(field.type)) {
			return [...standardOptions, ...numberOptions, ...fontOptions, ...affixOptions];
		}
		if (field.type && ['string', 'text'].includes(field.type)) {
			// If field is not a masked/password input, we could possibly use smart number controls
			if (field.meta?.options?.masked === undefined || field.meta?.options?.masked !== true) {
				if (field.meta?.options?.smartNumberControls) {
					return {
						standard: [...standardOptions],
						advanced: [...affixOptions, ...textOptions, ...smartNumberControls, ...stringNumDivider, ...numberOptions],
					};
				}
				return {
					standard: [...standardOptions],
					advanced: [...affixOptions, ...textOptions, ...smartNumberControls],
				};
			}
		}

		return {
			standard: [...standardOptions],
			advanced: [...affixOptions, ...textOptions],
		};
	},
	preview: PreviewSVG,
});
