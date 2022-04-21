import { defineDisplay } from '@directus/shared/utils';
import DisplayDateTime from './datetime.vue';

export default defineDisplay({
	id: 'datetime',
	name: '$t:displays.datetime.datetime',
	description: '$t:displays.datetime.description',
	icon: 'query_builder',
	component: DisplayDateTime,
	options: ({ field }) => {
		const options = field.meta?.options || {};
		const fields = [
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

		if (options.relative) {
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
		} else {
			fields.push(
				{
					field: 'strict',
					name: 'Strict',
					type: 'boolean',
					meta: {
						width: 'half',
						interface: 'boolean',
						options: {
							label: 'Use strict units',
						},
						note: "Removes words like 'almost', 'over', 'less than'",
					},
					schema: {
						default_value: false,
					},
				},
				{
					field: 'suffix',
					name: 'Suffix',
					type: 'boolean',
					meta: {
						width: 'half',
						interface: 'boolean',
						options: {
							label: 'Show relative indicator',
						},
						note: "Uses words like 'in' and 'ago'",
					},
					schema: {
						default_value: true,
					},
				}
			);
		}

		return fields;
	},
	types: ['dateTime', 'date', 'time', 'timestamp'],
});
