import { useRelationsStore } from '@/stores/relations';
import { FailedValidationError, joiValidationErrorItemToErrorExtensions } from '@directus/validation';
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
) {
	const relationsStore = useRelationsStore();
	const validationRules: LogicalFilterAND = { _and: [] };
	const updatedItem = cloneDeep(item);

	const fieldsWithConditions = fields.map((field) => {
		const conditionedField = applyConditions(item, field, currentVersion);

		// output is correct
		console.log('Field validation:', {
			field: field.field,
			exists: field.field in item,
			required: conditionedField.meta?.required,
			conditionRule: field.meta?.conditions?.[0]?.rule,
		});

		return conditionedField;
	});

	const requiredFields = fieldsWithConditions.filter((field) => field.meta?.required === true);

	// output is correct
	console.log(
		'Required fields:',
		requiredFields.map((f) => f.field),
	);

	requiredFields.forEach((field) => {
		applyRulesForRequiredFields(field.field, field, isNew);

		const relation = relationsStore.getRelationsForField(field.collection, field.field);
		if (!relation.length) return;

		const isEmptyArray = Array.isArray(updatedItem[field.field]) && isEmpty(updatedItem[field.field]);
		if (isEmptyArray) updatedItem[field.field] = null;
	});

	if (includeCustomValidations) fields.forEach(applyValidationRules);

	// After all rules are applied
	console.log('Final validation rules:', JSON.parse(JSON.stringify(validationRules, null, 2)));

	console.log('updatedItem', updatedItem);

	const errors = validatePayload(validationRules, updatedItem).map((error) =>
		error.details.map(
			(details) => new FailedValidationError(joiValidationErrorItemToErrorExtensions(details)).extensions,
		),
	);

	// output is NOT correct. Should result in an error when $version equals v001 and title is null.
	console.log('Validation errors:', JSON.parse(JSON.stringify(errors, null, 2)));

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
			validationRules._and.push(validation);
		});
	}
}
