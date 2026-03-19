import { Field, Item } from '@directus/types';
import { cloneDeep } from 'lodash';
import { applyConditions } from './apply-conditions';
import { getFieldsInGroup } from './get-fields-in-group';
import { mergeItemData } from './merge-item-data';

export function shouldClearField(field: Field, currentValues: Record<string, any>): boolean {
	if (!field.meta?.conditions) return false;

	const fieldWithConditions = applyConditions(currentValues, field, null);
	return !!fieldWithConditions.meta?.hidden && !!fieldWithConditions.meta?.clear_hidden_value_on_save;
}

export function clearHiddenFieldsByCondition(edits: Item, fields: Field[], defaultValues: any, item: any): Item {
	const currentValues = mergeItemData(defaultValues, item, edits);

	const fieldsToClearMap: Map<string, any> = new Map();

	function addFieldToClear(field: Field) {
		const defaultValue = field.schema?.default_value;
		fieldsToClearMap.set(field.field, defaultValue !== undefined ? defaultValue : null);
	}

	for (const field of fields) {
		if (shouldClearField(field, currentValues)) {
			if (field.meta?.special?.includes('group')) {
				const fieldsInGroup = getFieldsInGroup(field.field, fields);

				for (const groupField of fieldsInGroup) {
					addFieldToClear(groupField);
				}
			} else {
				addFieldToClear(field);
			}
		}
	}

	if (fieldsToClearMap.size === 0) {
		return edits;
	}

	const editsWithClearedValues = cloneDeep(edits);

	for (const [field, defaultValue] of fieldsToClearMap) {
		editsWithClearedValues[field] = defaultValue;
	}

	return editsWithClearedValues;
}
