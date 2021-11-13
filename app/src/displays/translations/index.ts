import { defineDisplay, getFieldsFromTemplate } from '@directus/shared/utils';
import { Collection } from '@directus/shared/types';
import { useCollectionsStore, useFieldsStore, useRelationsStore } from '@/stores';
import getRelatedCollection from '@/utils/get-related-collection';
import findLanguagesCollection from '@/utils/find-languages-collection';
import DisplayTranslations from './translations.vue';

type Options = {
	template: string;
	languageField: string;
};

export default defineDisplay({
	id: 'translations',
	name: '$t:displays.translations.translations',
	description: '$t:displays.translations.description',
	icon: 'translate',
	types: ['alias', 'uuid', 'integer', 'bigInteger'],
	localTypes: ['translations', 'm2o', 'm2m', 'o2m', 'm2a'],
	component: DisplayTranslations,
	options: ({ relations, field }) => {
		const fieldsStore = useFieldsStore();
		const templateCollection = relations.o2m?.collection ?? relations.m2o?.related_collection;
		const languagesCollection = findLanguagesCollection(field.collection);
		const languageFields = languagesCollection ? fieldsStore.getFieldsForCollection(languagesCollection) : [];

		return [
			{
				field: 'template',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: templateCollection,
					},
					width: 'half',
				},
			},
			{
				field: 'languageField',
				name: '$t:displays.translations.language_field',
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: languageFields.map(({ field, name }) => ({ text: name, value: field })),
					},
					width: 'half',
				},
			},
			{
				field: 'defaultLanguage',
				name: '$t:displays.translations.default_language',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: '$t:primary_key',
					},
				},
			},
			{
				field: 'userLanguage',
				name: '$t:displays.translations.user_language',
				type: 'string',
				schema: {
					default_value: false,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:displays.translations.enable',
					},
					width: 'half',
				},
			},
		];
	},
	fields: (options: Options | null, { field, collection }) => {
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();
		const relatedCollection = getRelatedCollection(collection, field);
		const relatedCollectionFields = fieldsStore.getFieldsForCollection(relatedCollection);
		const relatedCollectionInfo =
			(collectionsStore.collections as Collection[]).find(({ collection: key }) => key === collection) || null;
		const relatedCollectionPrimaryKeyField = relatedCollectionFields.find(
			(field) => field.collection === collection && field.schema?.is_primary_key === true
		);

		const fieldData = fieldsStore.getField(collection, field);
		const internalTemplate =
			options?.template ||
			relatedCollectionInfo?.meta?.display_template ||
			`{{ ${relatedCollectionPrimaryKeyField!.field} }}`;
		const templateFields = getFieldsFromTemplate(internalTemplate);
		const extraFields: string[] = [];

		if (fieldData?.meta?.special?.includes('m2a')) {
			const relations = relationsStore.getRelationsForField(collection, field);
			const m2aRelation = relations.find((relation) => relation.meta?.one_allowed_collections?.length);
			extraFields.push(m2aRelation?.meta?.one_collection_field ?? 'collection');
		}

		templateFields.forEach((templateField) => {
			const fieldComponents = templateField.split('.');
			let currentCollection = collection;
			let fieldPathPrefix = '';

			const isM2a = fieldComponents[0]?.startsWith('item:');
			if (isM2a) {
				// in case of m2a start collection from item collection
				fieldPathPrefix = fieldComponents[0] + '.';
				currentCollection = fieldPathPrefix.split(/:|\./)[1];
				fieldComponents.splice(0, 1);
			}

			[!isM2a && field, ...fieldComponents].forEach((fieldComponent, i) => {
				if (!fieldComponent) return;

				const fieldData = fieldsStore.getField(currentCollection, fieldComponent);
				const relations = relationsStore.getRelationsForField(currentCollection, fieldComponent);

				if (fieldData?.meta?.special?.includes('translations')) {
					const translationsRelation = relations.find(
						(relation) =>
							relation.related_collection === currentCollection && relation.meta?.one_field === fieldComponent
					);
					const languagesRelation = relations.find((relation) => relation !== translationsRelation);
					const languagesCollection = languagesRelation?.related_collection;

					if (!languagesRelation || !languagesCollection) return;

					const basePath =
						fieldPathPrefix + (fieldComponent !== field ? fieldComponents.slice(0, i).join('.') + '.' : '');
					const writableFields = fieldsStore
						.getFieldsForCollection(languagesRelation.collection)
						.filter((field) => field.type !== 'alias' && field.meta?.hidden === false && field.meta.readonly === false);

					// add writable fields for the progress indicator
					writableFields.forEach((field) => {
						extraFields.push(`${basePath}${field.field}`);
					});

					const languagesPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(languagesCollection);

					if (languagesRelation?.field && !templateFields.includes(languagesRelation.field)) {
						extraFields.push(`${basePath}${languagesRelation.field}.${languagesPrimaryKeyField!.field}`);

						if (options?.languageField) {
							extraFields.push(`${basePath}${languagesRelation.field}.${options.languageField}`);
						}
					}
				}

				currentCollection = relations.length
					? getRelatedCollection(currentCollection, fieldComponent)
					: currentCollection;
			});
		});

		const fields = [...templateFields, ...extraFields].filter((val, i, self) => self.indexOf(val) === i);
		return fields;
	},
});
