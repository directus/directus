import { Field, LogicalFilterAND } from '@directus/types';
import { validatePayload } from '@directus/utils';
import {
	FailedValidationError,
	FailedValidationErrorExtensions,
	joiValidationErrorItemToErrorExtensions,
} from '@directus/validation';
import { cloneDeep, flatten, isEmpty, isNil } from 'lodash';
import { applyConditions } from './apply-conditions';
import { parseFilter } from './parse-filter';
import { pushGroupOptionsDown } from './push-group-options-down';
import { useRelationsStore } from '@/stores/relations';
import type { ContentVersionMaybeNew } from '@/types/versions';

export function validateItem(
	item: Record<string, any>,
	fields: Field[],
	isNew: boolean,
	includeCustomValidations = false,
	currentVersion: ContentVersionMaybeNew | null = null,
): FailedValidationErrorExtensions[] {
	const relationsStore = useRelationsStore();
	const validationRules: LogicalFilterAND = { _and: [] };
	const updatedItem = cloneDeep(item);

	// Apply conditions to all fields
	const fieldsWithConditions = fields.map((field) => applyConditions(item, field, currentVersion));

	// group-level required/readonly after conditions have been applied.
	const fieldsWithResolvedGroups = pushGroupOptionsDown(fieldsWithConditions);

	// lookup map for group ancestry
	const fieldMap = new Map(fieldsWithResolvedGroups.map((f) => [f.field, f]));

	// Filter required fields. Skip any field whose ancestor is hidden group.
	const requiredFields = fieldsWithResolvedGroups.filter((field) => {
		if (field.meta?.required !== true) return false;
		let groupName = field.meta?.group;

		while (groupName) {
			const group = fieldMap.get(groupName);
			if (!group) break;
			if (group.meta?.hidden === true) return false;
			groupName = group.meta?.group ?? null;
		}

		return true;
	});

	requiredFields.forEach((field) => {
		applyRulesForRequiredFields(field.field, field, isNew);

		const relation = relationsStore.getRelationsForField(field.collection, field.field);
		if (!relation.length) return;

		const isEmptyArray = Array.isArray(updatedItem[field.field]) && isEmpty(updatedItem[field.field]);
		if (isEmptyArray) updatedItem[field.field] = null;
	});

	if (includeCustomValidations) fields.forEach(applyValidationRules);

	const errors = validatePayload(validationRules, updatedItem).map((error) =>
		error.details.map(
			(details) => new FailedValidationError(joiValidationErrorItemToErrorExtensions(details)).extensions,
		),
	);

	return flatten(errors).map((error) => {
		const errorField = fields.find((field) => field.field === error.field);
		return { ...error, hidden: errorField?.meta?.hidden, group: errorField?.meta?.group };
	});

	function applyRulesForRequiredFields(fieldKey: string, field: Field, isNew: boolean) {
		if (isNew && isNil(field.schema?.default_value)) {
			validationRules._and.push({
				[fieldKey]: {
					_submitted: true,
				},
			});
		}

		validationRules._and.push({
			[fieldKey]: {
				_nnull: true,
			},
		});
	}

	function applyValidationRules(field: Field) {
		if (isNil(updatedItem[field.field])) return;

		(field.meta?.validation as LogicalFilterAND)?._and?.forEach((validation: any) => {
			validationRules._and.push(parseFilter(validation));
		});
	}
}
