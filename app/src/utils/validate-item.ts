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

	const fieldsWithConditions = fields.map((field) => {
		const conditionedField = applyConditions(item, field, currentVersion);

		return conditionedField;
	});

	// Build a lookup for quickly determining whether a group is currently hidden (after
	// conditions are applied). Used to skip required-validation for fields whose parent
	// group is not visible.
	const fieldHiddenState = new Map<string, boolean>(
		fieldsWithConditions.map((f) => [f.field, f.meta?.hidden === true]),
	);

	function isInHiddenGroup(groupId: string | null | undefined): boolean {
		if (!groupId) return false;
		if (fieldHiddenState.get(groupId) === true) return true;
		const parentGroup = fieldsWithConditions.find((f) => f.field === groupId)?.meta?.group;
		return isInHiddenGroup(parentGroup);
	}

	const requiredFields = fieldsWithConditions.filter((field) => {
		if (field.meta?.required !== true) return false;
		// Alias/presentation fields (dividers, notices, groups) store no data — skip them.
		if (field.type === 'alias') return false;
		// Fields inside a hidden group are not visible to the user and must not block saving.
		if (isInHiddenGroup(field.meta?.group)) return false;
		return true;
	});

	requiredFields.forEach((field) => {
		applyRulesForRequiredFields(field.field, field, isNew);

		const relation = relationsStore.getRelationsForField(field.collection, field.field);
		if (!relation.length) return;

		const isEmptyArray = Array.isArray(updatedItem[field.field]) && isEmpty(updatedItem[field.field]);
		if (isEmptyArray) updatedItem[field.field] = null;
	});

	if (includeCustomValidations) fieldsWithConditions.forEach(applyValidationRules);

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
		// Skip custom validations for fields inside a hidden group
		if (isInHiddenGroup(field.meta?.group)) return;

		(field.meta?.validation as LogicalFilterAND)?._and?.forEach((validation: any) => {
			validationRules._and.push(parseFilter(validation));
		});
	}
}
