import { defineInterface } from '@directus/shared/utils';
import InterfaceDateTime from './datetime.vue';
import PreviewSVG from './preview.svg?raw';
import type { DeepPartial } from '@directus/shared/src/types/misc';
import type { Field } from '@directus/shared/src/types/fields';
import { useFieldsStore } from '@/stores/fields';

export default defineInterface({
	id: 'datetime',
	name: '$t:interfaces.datetime.datetime',
	description: '$t:interfaces.datetime.description',
	icon: 'today',
	component: InterfaceDateTime,
	types: ['dateTime', 'date', 'time', 'timestamp'],
	group: 'selection',
	options: (ctx) => {
		const { field, collection } = ctx;
		const label = field.type === 'time' ? 'time' : 'date';

		const opts: DeepPartial<Field>[] = [];
		const allowedTypes = ['dateTime', 'date', 'time', 'timestamp'];

		if (collection) {
			const fieldsStore = useFieldsStore();

			const choices: { text: string; value: string }[] = [];
			fieldsStore.getFieldsForCollection(collection).forEach((otherField) => {
				if (allowedTypes.includes(otherField.type) && otherField.field !== field.field) {
					choices.push({
						text: otherField.name,
						value: otherField.field,
					});
				}
			});

			opts.push(
				{
					field: 'minField',
					name: `$t:interfaces.datetime.min_${label}`,
					type: 'string',
					meta: {
						width: 'half',
						interface: 'select-dropdown',
						note: '$t:interfaces.datetime.setting_other_value',
						options: {
							choices,
							showDeselect: true,
							allowOther: true,
						},
					},
				},
				{
					field: 'maxField',
					name: `$t:interfaces.datetime.max_${label}`,
					type: 'string',
					meta: {
						width: 'half',
						interface: 'select-dropdown',
						note: '$t:interfaces.datetime.setting_other_value',
						options: {
							choices,
							showDeselect: true,
							allowOther: true,
						},
					},
				}
			);
		}

		if (field.type === 'date') {
			return {
				standard: [],
				advanced: opts,
			};
		}

		return {
			standard: [
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
			],
			advanced: opts,
		};
	},
	recommendedDisplays: ['datetime'],
	preview: PreviewSVG,
});
