import { DeepPartial, Field } from '@directus/types';
import { defineInterface } from '@directus/extensions';
import InterfaceCode from './input-code.vue';
import PreviewSVG from './preview.svg?raw';
import { modeMap } from './import-codemirror-mode';

const choices = Object.entries(modeMap)
	.concat([
		['json', { name: 'JSON', import: () => Promise.resolve({}) }],
		['plaintext', { name: 'Plain Text', import: () => Promise.resolve({}) }],
	])
	.map(([key, entry]) => ({
		text: entry.name,
		value: key,
	}))
	.sort((a, b) => a.text.localeCompare(b.text));

export default defineInterface({
	id: 'input-code',
	name: '$t:interfaces.input-code.code',
	description: '$t:interfaces.input-code.description',
	icon: 'code',
	component: InterfaceCode,
	types: ['string', 'json', 'text', 'geometry'],
	group: 'standard',
	preview: PreviewSVG,
	options: ({ field }) => {
		const sharedOptions: DeepPartial<Field>[] = [
			{
				field: 'lineNumber',
				name: '$t:interfaces.input-code.line_number',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
				},
				schema: {
					default_value: true,
				},
			},
			{
				field: 'lineWrapping',
				name: '$t:interfaces.input-code.line_wrapping',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'template',
				name: '$t:template',
				type: 'text',
				meta: {
					width: 'full',
					interface: 'input-code',
					options: {
						placeholder: '$t:interfaces.input-code.placeholder',
					},
				},
			},
		];

		const defaultOptions: DeepPartial<Field>[] = [
			{
				field: 'language',
				name: '$t:language',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'select-dropdown',
					options: { choices },
				},
			},
			...sharedOptions,
		];

		const jsonOptions: DeepPartial<Field>[] = [...sharedOptions];

		if (field?.type === 'json') {
			return jsonOptions;
		}

		return defaultOptions;
	},
});
