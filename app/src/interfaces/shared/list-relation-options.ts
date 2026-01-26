import type { DeepPartial, Field } from '@directus/types';

export interface ListRelationOptionsConfig {
	collection: string | undefined;
	relatedCollection?: string | undefined;
	options: Record<string, any>;
	editing?: string;
	interfaceType: 'm2m' | 'o2m';
}

export function getTableSpacingOption(): DeepPartial<Field> {
	return {
		field: 'tableSpacing',
		name: '$t:layouts.tabular.spacing',
		schema: {
			default_value: 'cozy',
		} as any,
		meta: {
			interface: 'select-dropdown',
			options: {
				choices: [
					{
						text: '$t:layouts.tabular.compact',
						value: 'compact',
					},
					{
						text: '$t:layouts.tabular.cozy',
						value: 'cozy',
					},
					{
						text: '$t:layouts.tabular.comfortable',
						value: 'comfortable',
					},
				],
			},
			width: 'half',
		},
	};
}

export function getFieldsOption(
	collection: string | undefined,
	editing?: string,
	interfaceType: 'm2m' | 'o2m' = 'o2m',
): DeepPartial<Field> {
	const isM2M = interfaceType === 'm2m';
	const isEditing = editing === '+';

	if (isM2M && isEditing) {
		return {
			field: 'fields',
			name: '$t:columns',
			meta: {
				interface: 'presentation-notice',
				options: {
					text: '$t:interfaces.list-m2m.columns_configure_notice',
				},
			},
		};
	}

	return {
		field: 'fields',
		name: '$t:columns',
		meta: {
			interface: 'system-fields',
			options: {
				collectionName: collection,
			},
			width: 'full',
		},
	};
}

export function getTemplateOption(
	collection: string | undefined,
	editing?: string,
	interfaceType: 'm2m' | 'o2m' = 'o2m',
): DeepPartial<Field> {
	const isM2M = interfaceType === 'm2m';
	const isEditing = editing === '+';

	if (isM2M && isEditing) {
		return {
			field: 'template',
			name: '$t:display_template',
			meta: {
				interface: 'presentation-notice',
				options: {
					text: '$t:interfaces.list-m2m.display_template_configure_notice',
				},
			},
		};
	}

	return {
		field: 'template',
		name: '$t:display_template',
		meta: {
			interface: 'system-display-template',
			options: {
				collectionName: collection,
			},
			width: 'full',
		},
	};
}

export function getLayoutOption(): DeepPartial<Field> {
	return {
		field: 'layout',
		name: '$t:layout',
		schema: {
			default_value: 'list',
		} as any,
		meta: {
			interface: 'select-dropdown',
			options: {
				choices: [
					{
						text: '$t:list',
						value: 'list',
					},
					{
						text: '$t:table',
						value: 'table',
					},
				],
			},
			width: 'half',
		},
	};
}

export function getCommonOptions(config: ListRelationOptionsConfig): DeepPartial<Field>[] {
	const { collection, relatedCollection, options } = config;
	const filterCollection = relatedCollection || collection;

	return [
		getLayoutOption(),
		...(options.layout === 'table'
			? [getTableSpacingOption(), getFieldsOption(collection, config.editing, config.interfaceType)]
			: [getTemplateOption(collection, config.editing, config.interfaceType)]),
		{
			field: 'enableCreate',
			name: '$t:creating_items',
			schema: {
				default_value: true,
			} as any,
			meta: {
				interface: 'boolean',
				options: {
					label: '$t:enable_create_button',
				},
				width: 'half',
			},
		},
		{
			field: 'enableSelect',
			name: '$t:selecting_items',
			schema: {
				default_value: true,
			} as any,
			meta: {
				interface: 'boolean',
				options: {
					label: '$t:enable_select_button',
				},
				width: 'half',
			},
		},
		{
			field: 'limit',
			name: '$t:per_page',
			type: 'integer',
			meta: {
				interface: 'input',
				width: 'half',
			},
			schema: {
				default_value: 15,
			} as any,
		},
		{
			field: 'filter',
			name: '$t:filter',
			type: 'json',
			meta: {
				interface: 'system-filter',
				options: {
					collectionName: filterCollection || undefined,
				},
				conditions: [
					{
						rule: {
							enableSelect: {
								_eq: false,
							},
						},
						hidden: true,
					},
				],
			},
		},
		{
			field: 'enableSearchFilter',
			name: '$t:search_filter',
			schema: {
				default_value: false,
			} as any,
			meta: {
				interface: 'boolean',
				options: {
					label: '$t:enable_search_filter',
				},
				width: 'half',
				hidden: true,
				conditions: [
					{
						rule: {
							layout: {
								_eq: 'table',
							},
						},
						hidden: false,
					},
				],
			},
		},
		{
			field: 'enableLink',
			name: '$t:item_link',
			schema: {
				default_value: false,
			} as any,
			meta: {
				interface: 'boolean',
				options: {
					label: '$t:show_link_to_item',
				},
				width: 'half',
			},
		},
	];
}

export function getM2MSpecificOptions(): DeepPartial<Field>[] {
	return [
		{
			field: 'junctionFieldLocation',
			name: '$t:junction_field_location',
			type: 'string',
			schema: {
				default_value: 'bottom',
			} as any,
			meta: {
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							value: 'top',
							text: '$t:top',
						},
						{
							value: 'bottom',
							text: '$t:bottom',
						},
					],
				},
				width: 'half',
			},
		},
		{
			field: 'allowDuplicates',
			name: '$t:allow_duplicates',
			schema: {
				default_value: false,
			} as any,
			meta: {
				interface: 'boolean',
				width: 'half',
			},
		},
	];
}

export function getO2MSpecificOptions(collection: string | undefined): DeepPartial<Field>[] {
	return [
		{
			field: 'sort',
			name: '$t:sort',
			type: 'string',
			meta: {
				interface: 'system-field',
				options: {
					collectionName: collection || undefined,
				},
				width: 'half',
			},
		},
		{
			field: 'sortDirection',
			name: '$t:sort_direction',
			schema: {
				default_value: '+',
			} as any,
			type: 'string',
			meta: {
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '$t:sort_asc',
							value: '+',
						},
						{
							text: '$t:sort_desc',
							value: '-',
						},
					],
				},
				width: 'half',
			},
		},
	];
}
