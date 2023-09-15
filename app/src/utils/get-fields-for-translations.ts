import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

/**
 * Returns a list of the language code fields for a given collection
 * @example ['translations.languages_code.code', 'nested.my_trans_field.languages_code.code']
 * @param fields The fields to check
 * @param parentCollection The root collection
 * @returns A list of language code fields
 */
export function getFieldsForTranslations(fields: readonly string[], parentCollection: string): string[] {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();

	const translationFields: string[] = [];

	for (const field of fields) {
		const fieldParts = field.split('.');

		const fieldCombinations = [];

		for (let i = 0; i < fieldParts.length; i++) {
			fieldCombinations.push(fieldParts.slice(0, i + 1).join('.'));
		}

		for (const fieldCombination of fieldCombinations) {
			const field = fieldsStore.getField(parentCollection, fieldCombination);

			if (!field?.meta?.special?.includes('translations')) continue;

			const relations = relationsStore.getRelationsForField(parentCollection, field.field);

			const translationsRelation = relations.find(
				(relation) => relation.related_collection === parentCollection && relation.meta?.one_field === field.field
			);

			const languagesRelation = relations.find((relation) => relation !== translationsRelation);
			const languagesCollection = languagesRelation?.related_collection;

			if (!languagesCollection) continue;

			const languagesPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(languagesCollection);

			if (!languagesPrimaryKeyField) continue;

			translationFields.push(`${fieldCombination}.${languagesRelation.field}.${languagesPrimaryKeyField.field}`);
		}
	}

	return translationFields;
}
