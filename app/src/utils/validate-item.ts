import { useRelationsStore } from '@/stores/relations';
import {
	FailedValidationError,
	FailedValidationErrorExtensions,
	joiValidationErrorItemToErrorExtensions,
} from '@directus/validation';
import { NUMERIC_TYPES } from '@directus/constants';
import { ContentVersion, Field, LogicalFilterAND } from '@directus/types';
import { validatePayload } from '@directus/utils';
import { cloneDeep, flatten, isEmpty, isNil } from 'lodash';
import { applyConditions } from './apply-conditions';

export function validateItem(
	item: Record<string, any>,
	fields: Field[],
	isNew: boolean,
	includeCustomValidations = false,
	currentVersion: ContentVersion | null = null,
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

		const isEmptyArray = Array.isArray(updatedItem[field.field]) && isEmpty(updatedItem[field.field]);
		if (isEmptyArray) updatedItem[field.field] = null;
	});

	fieldsWithConditions.forEach((field) => {
		applyInterfaceOptionRules(field);
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

	function applyInterfaceOptionRules(field: Field) {
		if (isNil(updatedItem[field.field])) return;

		if (!NUMERIC_TYPES.includes(field.type as Exclude<typeof NUMERIC_TYPES, 'bigInteger'>[number])) return;

		const options = field.meta?.options;
		if (!options) return;

		const min = options.min;
		const max = options.max;

		if (min !== undefined && typeof min === 'number') {
			validationRules._and.push({
				[field.field]: {
					_gte: min,
				},
			});
		}

		if (max !== undefined && typeof max === 'number') {
			validationRules._and.push({
				[field.field]: {
					_lte: max,
				},
			});
		}
	}

	function applyValidationRules(field: Field) {
		if (isNil(updatedItem[field.field])) return;

		(field.meta?.validation as LogicalFilterAND)?._and?.forEach((validation: any) => {
			validationRules._and.push(validation);
		});
	}
}
