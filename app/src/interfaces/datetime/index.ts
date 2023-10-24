import { defineInterface } from '@directus/extensions';
import InterfaceDateTime from './datetime.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'datetime',
	name: '$t:interfaces.datetime.datetime',
	description: '$t:interfaces.datetime.description',
	icon: 'today',
	component: InterfaceDateTime,
	types: ['dateTime', 'date', 'time', 'timestamp'],
	group: 'selection',
	options: ({ field }) => {
		if (field.type === 'date') {
			if (field.meta?.options) {
				field.meta.options = {};
			}

			return [];
		}

		return [
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
		];
	},
	recommendedDisplays: ['datetime'],
	preview: PreviewSVG,
});
