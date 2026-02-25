import { GENERATE_SPECIAL, RELATIONAL_TYPES } from '@directus/constants';
import type { Field, Relation } from '@directus/types';

const DANGEROUS_SPECIALS = new Set<string>(GENERATE_SPECIAL);
const RELATIONAL_SPECIALS = new Set<string>(RELATIONAL_TYPES);
export type TranslationConfig = {
	translationField: string;
	translationsCollection: string;
	parentForeignKeyField: string;
	languageForeignKeyField: string;
	languagesCollection: string | null;
	valid: boolean;
};

export function isFieldEligibleForTranslations(field: Field, primaryKeyField: string | null): boolean {
	if (field.field === primaryKeyField) return false;
	if (field.meta?.system === true) return false;
	if (field.type === 'alias') return false;
	if (field.schema?.has_auto_increment === true) return false;

	const specials = Array.isArray(field.meta?.special) ? field.meta.special : [];

	if (specials.some((special) => DANGEROUS_SPECIALS.has(special) || RELATIONAL_SPECIALS.has(special))) {
		return false;
	}

	return true;
}

export function detectTranslationConfigs(
	collection: string,
	collectionFields: Field[],
	relations: Relation[],
): TranslationConfig[] {
	const translationFields = collectionFields.filter((field) => {
		const specials = Array.isArray(field.meta?.special) ? field.meta.special : [];
		return specials.includes('translations');
	});

	return translationFields.map((translationField): TranslationConfig => {
		const parentRelations = relations.filter(
			(relation) =>
				relation.collection !== collection &&
				relation.related_collection === collection &&
				relation.meta?.one_field === translationField.field &&
				(relation.meta?.one_collection === null || relation.meta?.one_collection === collection) &&
				(relation.meta?.many_collection === null || relation.meta?.many_collection === relation.collection) &&
				typeof relation.meta?.junction_field === 'string' &&
				relation.meta.junction_field.length > 0,
		);

		if (parentRelations.length !== 1) {
			return {
				translationField: translationField.field,
				translationsCollection: '',
				parentForeignKeyField: '',
				languageForeignKeyField: '',
				languagesCollection: null,
				valid: false,
			};
		}

		const parentRelation = parentRelations[0]!;
		const languageForeignKeyField = parentRelation.meta!.junction_field!;
		const parentForeignKeyField = parentRelation.field;

		const languageRelation = relations.find(
			(relation) =>
				relation.collection === parentRelation.collection &&
				relation.field === languageForeignKeyField &&
				relation.meta?.junction_field === parentForeignKeyField,
		);

		if (!languageRelation) {
			return {
				translationField: translationField.field,
				translationsCollection: parentRelation.collection,
				parentForeignKeyField,
				languageForeignKeyField,
				languagesCollection: null,
				valid: false,
			};
		}

		return {
			translationField: translationField.field,
			translationsCollection: parentRelation.collection,
			parentForeignKeyField,
			languageForeignKeyField,
			languagesCollection: languageRelation.related_collection ?? null,
			valid: true,
		};
	});
}
