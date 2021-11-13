import { ref } from 'vue';
import { useFieldsStore, useRelationsStore } from '@/stores';
import useRelation from './use-m2m';
import { Field } from '@directus/shared/types';
import { notEmpty } from '@/utils/is-empty';
import getRelatedCollection from '@/utils/get-related-collection';

const LANG_KEY = '__lang';
const FIELDS_COUNT_KEY = '__fieldsCount';
const FILLED_FIELDS_KEY = '__filledFields';

export default function useTranslationsValue(
	value: object | any[],
	field: string,
	collection: string,
	languageField: string | undefined,
	defaultLanguage: string | undefined,
	fallbackLanguage: string
) {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();
	const langs: string[] = [];

	function deepResolveValues(val: object | any[] | any, field: string, collection: string): any {
		const fieldData = fieldsStore.getField(collection, field);

		if (Array.isArray(val)) {
			if (fieldData?.meta?.special?.includes('translations')) {
				// resolve translations
				const { relationPrimaryKeyField: langCode, relation } = useRelation(ref(collection), ref(field));

				return val.map((el: any) => {
					let item = JSON.parse(JSON.stringify(el));
					const lang = item?.[relation.value.field]?.[languageField ?? langCode.value!.field] ?? defaultLanguage;
					lang && !langs.includes(lang) && langs.push(lang);
					// remove unneccessary lang relation
					delete item[relation.value.field];
					// deep resolve fields
					item = deepResolveValues(item, field, collection);
					const junctionFields = fieldsStore.getFieldsForCollection(relation.value.collection);
					const writableFields = junctionFields.filter(
						(field: Field) => field.type !== 'alias' && field.meta?.hidden === false && field.meta.readonly === false
					);
					item[LANG_KEY] = lang;
					item[FIELDS_COUNT_KEY] = writableFields.length;
					item[FILLED_FIELDS_KEY] = writableFields.filter((field) => {
						return field.field in item && notEmpty(item[field.field]);
					}).length;
					return item;
				});
			}

			if (fieldData?.meta?.special?.includes('m2a')) {
				const relations = relationsStore.getRelationsForField(collection, field);
				const m2aRelation = relations.find((relation) => relation.meta?.one_allowed_collections?.length);
				const collectionKey = m2aRelation?.meta?.one_collection_field ?? 'collection';
				return val.map((el) => ({
					[`item:${el[collectionKey]}`]: deepResolveValues(el.item, 'item', el[collectionKey]),
				}));
			}
			return val.map((el) => deepResolveValues(el, field, collection));
		}
		if (val && typeof val === 'object') {
			return Object.keys(val).reduce((res, key) => {
				const relatedCollection = fieldData ? getRelatedCollection(collection, field) : collection;
				res[key] = deepResolveValues(val[key], key, relatedCollection);
				return res;
			}, {} as Record<string, any>);
		}
		return val;
	}

	function deepMapTranslations(val: any, lang: string): any {
		if (Array.isArray(val) && val.every((el) => LANG_KEY in el)) {
			return val.find((el) => el[LANG_KEY] === lang) ?? val[0];
		}
		if (Array.isArray(val)) {
			return val.map((el) => deepMapTranslations(el, lang));
		}
		if (val && typeof val === 'object') {
			return Object.keys(val).reduce((res, key) => {
				res[key] = deepMapTranslations(val[key], lang);
				return res;
			}, {} as Record<string, any>);
		}
		return val;
	}

	function deepCalcProgress(item: any, totalFieldsCount = 0, totalFilledFields = 0) {
		if (!item) return { totalFilledFields, totalFieldsCount };

		if (LANG_KEY in item) {
			totalFieldsCount += item[FIELDS_COUNT_KEY];
			totalFilledFields += item[FILLED_FIELDS_KEY];
		}

		for (const key in item) {
			if (typeof item[key] === 'object') {
				const addedProgress = deepCalcProgress(item[key], totalFieldsCount, totalFilledFields);
				totalFieldsCount += addedProgress.totalFieldsCount;
				totalFilledFields += addedProgress.totalFilledFields;
			}
		}

		return { totalFilledFields, totalFieldsCount };
	}

	const resolvedValues = deepResolveValues(value, field, collection);
	const translations = (langs.length === 0 ? [fallbackLanguage] : langs).map((lang) => {
		const item = deepMapTranslations(resolvedValues, lang);
		const { totalFieldsCount, totalFilledFields } = deepCalcProgress(item);
		const progress = totalFieldsCount > 0 ? Math.round((totalFilledFields / totalFieldsCount) * 100) : 0;
		return {
			lang,
			progress,
			item,
		};
	});
	return ref(translations);
}
