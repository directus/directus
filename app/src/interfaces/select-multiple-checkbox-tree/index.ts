import PreviewSVG from './preview.svg?raw';
import InterfaceSelectMultipleCheckboxesTree from './select-multiple-checkbox-tree.vue';
import { defineInterface } from '@directus/extensions';
import { DeepPartial, Field } from '@directus/types';

const repeaterFields: DeepPartial<Field>[] = [
	{
		field: 'text',
		type: 'string',
		name: '$t:text',
		meta: {
			required: true,
			width: 'half',
			interface: 'system-input-translated-string',
			options: {
				placeholder: '$t:interfaces.select-dropdown.choices_name_placeholder',
			},
		},
	},
	{
		field: 'value',
		type: 'string',
		name: '$t:value',
		meta: {
			required: true,
			width: 'half',
			interface: 'input',
			options: {
				font: 'monospace',
				placeholder: '$t:interfaces.select-dropdown.choices_name_placeholder',
			},
		},
	},
];

const repeaterFieldsChildren: DeepPartial<Field> = {
	field: 'children',
	type: 'json',
	name: '$t:children',
	meta: {
		width: 'full',
		interface: 'list',
		options: {
			fields: repeaterFields,
		},
	},
};

function getNestedRepeaterFields(level = 0, maxLevel = 3): DeepPartial<Field>[] {
	if (level < maxLevel) {
		return [
			...repeaterFields,
			{
				...repeaterFieldsChildren,
				meta: {
					...repeaterFieldsChildren.meta,
					options: {
						fields: getNestedRepeaterFields(level + 1),
					},
				},
			},
		];
	}

	return repeaterFields;
}

export default defineInterface({
	id: 'select-multiple-checkbox-tree',
	name: '$t:interfaces.select-multiple-checkbox-tree.name',
	icon: 'account_tree',
	component: InterfaceSelectMultipleCheckboxesTree,
	description: '$t:interfaces.select-multiple-checkbox-tree.description',
	types: ['json', 'csv'],
	group: 'selection',
	options: [
		{
			field: 'choices',
			type: 'json',
			name: '$t:choices',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					template: '{{ text }}',
					fields: getNestedRepeaterFields(),
				},
			},
		},
		{
			field: 'valueCombining',
			type: 'string',
			name: '$t:interfaces.select-multiple-checkbox-tree.value_combining',
			schema: {
				default_value: 'all',
			},
			meta: {
				note: '$t:interfaces.select-multiple-checkbox-tree.value_combining_note',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '$t:all',
							value: 'all',
						},
						{
							text: '$t:branch',
							value: 'branch',
						},
						{
							text: '$t:leaf',
							value: 'leaf',
						},
						{
							text: '$t:indeterminate',
							value: 'indeterminate',
						},
						{
							text: '$t:exclusive',
							value: 'exclusive',
						},
					],
				},
			},
		},
	],
	recommendedDisplays: ['labels'],
	preview: PreviewSVG,
});
