import { getDisplay } from '@/displays';
import { useFieldsStore, useRelationsStore } from '@/stores';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { renderPlainStringTemplate } from '@/utils/render-string-template';
import { defineDisplay, getFieldsFromTemplate } from '@directus/shared/utils';
import { get, set } from 'lodash';
import DisplayTranslations from './translations.vue';
import { i18n } from '@/lang';

type Options = {
	template: string;
	languageField: string;
};

export default defineDisplay({
	id: 'translations',
	name: '$t:displays.translations.translations',
	description: '$t:displays.translations.description',
	icon: 'translate',
	component: DisplayTranslations,
	handler: async (values, options, { collection, field }) => {
		if (!field || !collection || !Array.isArray(values)) return values;

		const relatedCollections = getRelatedCollection(collection, field.field);

		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		const relations = relationsStore.getRelationsForField(collection, field.field);

		const junction = relations.find(
			(relation) => relation.related_collection === collection && relation.meta?.one_field === field.field
		);

		if (!junction) return values;

		const relation = relations.find(
			(relation) => relation.collection === junction.collection && relation.field === junction.meta?.junction_field
		);

		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollections.relatedCollection);

		if (!relatedCollections || !primaryKeyField || !relation?.related_collection) return values;

		const relatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relation.related_collection);

		if (!relatedPrimaryKeyField) return values;

		const value =
			values.find((translatedItem: Record<string, any>) => {
				const lang = translatedItem[relation!.field][relatedPrimaryKeyField.field];

				// Default to first item if lang can't be found
				if (!lang) return true;

				if (options.userLanguage) {
					return lang === i18n.global.locale.value;
				}

				return lang === options.defaultLanguage;
			}) ?? values[0];

		const fieldKeys = getFieldsFromTemplate(options.template);

		const fields = fieldKeys.map((fieldKey) => {
			return {
				key: fieldKey,
				field: fieldsStore.getField(relatedCollections.relatedCollection, fieldKey),
			};
		});

		const stringValues: Record<string, string> = {};

		for (const { key, field } of fields) {
			const fieldValue = get(value, key);

			if (fieldValue === null || fieldValue === undefined) continue;

			if (!field?.meta?.display) {
				set(stringValues, key, fieldValue);
				continue;
			}

			const display = getDisplay(field.meta.display);

			const stringValue = display?.handler
				? await display.handler(fieldValue, field?.meta?.display_options ?? {}, {
						interfaceOptions: field?.meta?.options ?? {},
						field: field ?? undefined,
						collection: collection,
				  })
				: fieldValue;

			set(stringValues, key, stringValue);
		}

		return renderPlainStringTemplate(options.template, stringValues);
	},
	options: ({ relations }) => {
		const fieldsStore = useFieldsStore();

		const junctionCollection = relations.o2m?.collection;
		const relatedCollection = relations.m2o?.related_collection;

		const languageFields = relatedCollection ? fieldsStore.getFieldsForCollection(relatedCollection) : [];

		return [
			{
				field: 'template',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: junctionCollection,
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
	types: ['alias'],
	localTypes: ['translations'],
	fields: (options: Options | null, { field, collection }) => {
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();
		const relations = relationsStore.getRelationsForField(collection, field);

		const translationsRelation = relations.find(
			(relation) => relation.related_collection === collection && relation.meta?.one_field === field
		);

		const languagesRelation = relations.find((relation) => relation !== translationsRelation);

		const translationCollection = translationsRelation?.related_collection;
		const languagesCollection = languagesRelation?.related_collection;

		if (!translationCollection || !languagesCollection) return [];

		const translationsPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(translationCollection);
		const languagesPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(languagesCollection);

		const fields = options?.template
			? adjustFieldsForDisplays(getFieldsFromTemplate(options.template), translationCollection)
			: [];

		if (translationsPrimaryKeyField && !fields.includes(translationsPrimaryKeyField.field)) {
			fields.push(translationsPrimaryKeyField.field);
		}

		if (languagesRelation && languagesPrimaryKeyField && !fields.includes(languagesRelation.field)) {
			fields.push(`${languagesRelation.field}.${languagesPrimaryKeyField.field}`);

			if (options?.languageField) {
				fields.push(`${languagesRelation.field}.${options.languageField}`);
			}
		}

		return fields;
	},
});
