import InterfaceDateTime from './datetime.vue';
import PreviewSVG from './preview.svg?raw';
import { defineInterface } from '@directus/extensions';
import type { DeepPartial, Field } from '@directus/types';

export default defineInterface({
	id: 'datetime',
	name: '$t:interfaces.datetime.datetime',
	description: '$t:interfaces.datetime.description',
	icon: 'today',
	component: InterfaceDateTime,
	types: ['dateTime', 'date', 'time', 'timestamp'],
	group: 'selection',
	options: ({ field }) => {
		const options = field.meta?.options || {};

		const fields: DeepPartial<Field>[] = [
			{
				field: 'relative',
				name: '$t:displays.datetime.relative',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:displays.datetime.relative_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
		];

		if (!options.relative) {
			fields.push({
				field: 'format',
				name: '$t:displays.datetime.format',
				type: 'string',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					options: {
						choices: [
							{ text: '$t:displays.datetime.long', value: 'long' },
							{ text: '$t:displays.datetime.short', value: 'short' },
						],
						allowOther: true,
					},
					note: '$t:displays.datetime.format_note',
				},
				schema: {
					default_value: 'long',
				},
			});

			if (field.type !== 'date') {
				fields.push(
					{
						field: 'includeSeconds',
						name: '$t:interfaces.datetime.include_seconds',
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
						field: 'use24',
						name: '$t:interfaces.datetime.use_24',
						type: 'boolean',
						meta: {
							width: 'half',
							interface: 'boolean',
						},
						schema: {
							default_value: true,
						},
					},
				);
			}
		} else {
			fields.push(
				{
					field: 'suffix',
					name: '$t:displays.datetime.suffix',
					type: 'boolean',
					meta: {
						width: 'half',
						interface: 'boolean',
						options: {
							label: '$t:displays.datetime.suffix_label',
						},
						note: '$t:displays.datetime.suffix_note',
					},
					schema: {
						default_value: true,
					},
				},
				{
					field: 'strict',
					name: '$t:displays.datetime.strict',
					type: 'boolean',
					meta: {
						width: 'half',
						interface: 'boolean',
						options: {
							label: '$t:displays.datetime.strict_label',
						},
						note: '$t:displays.datetime.strict_note',
					},
					schema: {
						default_value: false,
					},
				},
				{
					field: 'round',
					name: '$t:displays.datetime.round',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'select-dropdown',
						options: {
							choices: [
								{ text: '$t:displays.datetime.down', value: 'floor' },
								{ text: '$t:displays.datetime.nearest', value: 'round' },
								{ text: '$t:displays.datetime.up', value: 'ceil' },
							],
						},
						note: '$t:displays.datetime.round_note',
					},
					schema: {
						default_value: 'round',
					},
				},
			);
		}

		return fields;
	},
	recommendedDisplays: ['datetime'],
	preview: PreviewSVG,
});
