import { Field, LogicalFilterAND } from '@directus/types';
import { validatePayload } from '@directus/utils';
import {
	FailedValidationError,
	FailedValidationErrorExtensions,
	joiValidationErrorItemToErrorExtensions,
} from '@directus/validation';
import { cloneDeep, flatten, isEmpty, isNil, isPlainObject } from 'lodash';
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
	originalItem: Record<string, any> | null = null,
): FailedValidationErrorExtensions[] {
	const relationsStore = useRelationsStore();
	const validationRules: LogicalFilterAND = { _and: [] };
	const updatedItem = cloneDeep(item);

	const fieldsWithConditions = fields.map((field) => {
		const conditionedField = applyConditions(item, field, currentVersion);

		return conditionedField;
	});

	const requiredFields = fieldsWithConditions.filter((field) => field.meta?.required === true);

	requiredFields.forEach((field) => {
		applyRulesForRequiredFields(field.field, field, isNew);

		const relation = relationsStore.getRelationsForField(field.collection, field.field);
		if (!relation.length) return;

		const value = updatedItem[field.field];

		// On update, relational interfaces stage their changes as a
		// `{ create, update, delete }` object rather than a plain array. When every
		// existing related item is removed (and nothing new is created) the field is
		// effectively empty, so normalize it to `null` to trigger required validation
		// (see directus/directus#27695).
		if (isStagedRelationalChanges(value)) {
			const existingCount = Array.isArray(originalItem?.[field.field]) ? originalItem![field.field].length : 0;
			const netCount = Math.max(existingCount - value.delete.length, 0) + value.create.length;

			if (netCount === 0) updatedItem[field.field] = null;
			return;
		}

		const isEmptyArray = Array.isArray(value) && isEmpty(value);
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

type StagedRelationalChanges = {
	create: unknown[];
	update: unknown[];
	delete: unknown[];
};

/**
 * Relational interfaces (o2m/m2m/m2a) stage their edits as a
 * `{ create, update, delete }` object instead of a plain array of related items.
 */
function isStagedRelationalChanges(value: unknown): value is StagedRelationalChanges {
	return (
		isPlainObject(value) &&
		Array.isArray((value as Record<string, unknown>)['create']) &&
		Array.isArray((value as Record<string, unknown>)['update']) &&
		Array.isArray((value as Record<string, unknown>)['delete'])
	);
}
