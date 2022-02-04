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
		const textOptions: { standard: DeepPartial<Field>[]; advanced: DeepPartial<Field>[] } = {
			standard: [
				{
					field: 'placeholder',
					name: '$t:placeholder',
					meta: {
						width: 'full',
						interface: 'input',
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
			],
			advanced: [
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
			],
		};

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
			{
				field: 'placeholder',
				name: '$t:placeholder',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
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

		if (field.type && ['bigInteger', 'integer', 'float', 'decimal'].includes(field.type)) {
			return numberOptions;
		}

		return textOptions;
	},
	preview: PreviewSVG,
});
