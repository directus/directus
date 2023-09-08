import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { FailedValidationException } from '@directus/exceptions';
import { Field, LogicalFilterAND } from '@directus/types';
import { validatePayload } from '@directus/utils';
import { cloneDeep, cloneDeepWith, flatten, isEmpty, isNil } from 'lodash';
import { applyConditions } from './apply-conditions';
import { extractEdits } from './extract-edits-from-item';
import { cloneArraysWithStringIndexes } from './clone-objects';

export function validateItem(item: Record<string, any>, fields: Field[], isNew: boolean) {
	const relationsStore = useRelationsStore();

	const validationRules = {
		_and: [],
	} as LogicalFilterAND;

	const translationsErrors: any[] = validateTranslationFields(item, fields);

	const fieldsWithConditions = fields.map((field) => applyConditions(item, field));

	const requiredFields = fieldsWithConditions.filter((field) => field.meta?.required === true);

	const updatedItem = cloneDeep(item);

	for (const field of requiredFields) {
		if (isNew && isNil(field.schema?.default_value)) {
			validationRules._and.push({
				[field.field]: {
					_submitted: true,
				},
			});
		}

		const relation = relationsStore.getRelationsForField(field.collection, field.field);

		// Check if we are dealing with a relational field that has an empty array as its value
		if (relation.length > 0 && Array.isArray(updatedItem[field.field]) && isEmpty(updatedItem[field.field])) {
			updatedItem[field.field] = null;
		}

		validationRules._and.push({
			[field.field]: {
				_nnull: true,
			},
		});
	}

	return [
		...flatten(
			validatePayload(validationRules, updatedItem).map((error) =>
				error.details.map((details) => new FailedValidationException(details).extensions)
			)
		).map((error) => {
			const errorField = fields.find((field) => field.field === error.field);
			return { ...error, hidden: errorField?.meta?.hidden, group: errorField?.meta?.group };
		}),
		...translationsErrors,
	];

	function validateTranslationFields(item: Record<string, any>, fields: Field[]) {
		const relationsStore = useRelationsStore();
		const fieldStore = useFieldsStore();
		const translationsErrors: any[] = [];

		const translationFields = fields
			.filter((field) => field.meta?.interface === 'translations')
			.flatMap((field) => {
				const translationCollection = relationsStore.getRelationsForField(field.collection, field.field)[0]?.collection;
				return { name: field.field, fields: fieldStore.getFieldsForCollection(translationCollection) };
			});

		if (translationFields?.length) {
			translationFields.forEach((translationField) => {
				let translationItem = extractEdits(cloneDeepWith(item[translationField.name], cloneArraysWithStringIndexes));
				translationItem = translationItem?.filter(
					(item: any) => typeof item === 'object' && item?.lingue_codice.codice === 'it'
				);
				translationItem = !translationItem?.length ? [{}] : translationItem;
				translationItem.forEach((languageItem: Record<string, any>) => {
					translationsErrors.push(...validateItem(languageItem, translationField.fields, isNew));
				});
			});
		}

		return translationsErrors;
	}
}
