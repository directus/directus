import { defineInterface } from '@directus/shared/utils';
import InterfaceDateTime from './datetime.vue';
import PreviewSVG from './preview.svg?raw';
import type { DeepPartial } from "@directus/shared/src/types/misc";
import type { Field } from "@directus/shared/src/types/fields";

export default defineInterface({
	id: 'datetime',
	name: '$t:interfaces.datetime.datetime',
	description: '$t:interfaces.datetime.description',
	icon: 'today',
	component: InterfaceDateTime,
	types: ['dateTime', 'date', 'time', 'timestamp'],
	group: 'selection',
	options: ({ field }) => {
		const label = field.type === 'time' ? 'time' : 'date'
		const opts: DeepPartial<Field>[] = [
			{
				field: 'minField',
				name: `$t:interfaces.datetime.min_${label}_field`,
				type: 'string',
				meta: {
					width: 'half',
				},
			},
			{
				field: 'maxField',
				name: `$t:interfaces.datetime.max_${label}_field`,
				type: 'string',
				meta: {
					width: 'half',
				},
			}
		];

		if (field.type === 'date') {
			if (field.meta?.options) {
				field.meta.options = {};
			}
			return opts;
		}

		opts.push(
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

		return opts
	},
	recommendedDisplays: ['datetime'],
	preview: PreviewSVG,
});
