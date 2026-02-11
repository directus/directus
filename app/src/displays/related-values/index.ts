import { RELATIONAL_TYPES } from '@directus/constants';
import { defineDisplay } from '@directus/extensions';
import type { Field } from '@directus/types';
import { getFieldsFromTemplate } from '@directus/utils';
import { get, set } from 'lodash';
import DisplayRelatedValues from './related-values.vue';
import { useExtension } from '@/composables/use-extension';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { getLocalTypeForField } from '@/utils/get-local-type';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { renderPlainStringTemplate } from '@/utils/render-string-template';

type Options = {
	template: string;
};

export default defineDisplay({
	id: 'related-values',
	name: '$t:displays.related-values.related-values',
	description: '$t:displays.related-values.description',
	icon: 'settings_ethernet',
	component: DisplayRelatedValues,
	options: ({ editing, relations }) => {
		const relatedCollection = relations.o2m?.collection ?? relations.m2o?.related_collection;

		const displayTemplateMeta: Partial<Field['meta']> =
			editing === '+'
				? {
						interface: 'presentation-notice',
						options: {
							text: '$t:displays.related-values.display_template_configure_notice',
						},
						width: 'full',
					}
				: {
						interface: 'system-display-template',
						options: {
							collectionName: relatedCollection,
						},
						width: 'full',
					};

		return [
			{
				field: 'template',
				name: '$t:display_template',
				meta: displayTemplateMeta,
			},
		];
	},
	handler: (value, options, { collection, field }) => {
		if (!field || !collection) return value;

		const relatedCollections = getRelatedCollection(collection, field.field);

		if (!relatedCollections) return value;

		const fieldsStore = useFieldsStore();

		const fieldKeys = getFieldsFromTemplate(options.template);

		const fields = fieldKeys.map((fieldKey) => {
			return {
				key: fieldKey,
				field: fieldsStore.getField(
					relatedCollections.junctionCollection ?? relatedCollections.relatedCollection,
					fieldKey,
				),
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

			const display = useExtension('display', field.meta.display);

			const stringValue = display.value?.handler
				? display.value.handler(fieldValue, field?.meta?.display_options ?? {}, {
						interfaceOptions: field?.meta?.options ?? {},
						field: field ?? undefined,
						collection: collection,
					})
				: fieldValue;

			set(stringValues, key, stringValue);
		}

		return renderPlainStringTemplate(options.template, stringValues);
	},
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	localTypes: RELATIONAL_TYPES,
	fields: (options: Options | null, { field, collection }) => {
		const relatedCollectionData = getRelatedCollection(collection, field);

		if (!relatedCollectionData) return [];

		const fieldsStore = useFieldsStore();
		const collectionsStore = useCollectionsStore();

		const { junctionCollection, relatedCollection, path } = relatedCollectionData;

		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection);

		let template = options?.template;
		let shouldPrefixWithPath = false;

		// If no explicit template in options, try junction collection display_template
		if (!template && junctionCollection) {
			const junctionInfo = collectionsStore.getCollection(junctionCollection);
			template = junctionInfo?.meta?.display_template ?? undefined;
		}

		// If still no template, use the related collection's display_template
		if (!template) {
			const collectionInfo = collectionsStore.getCollection(relatedCollection);
			template = collectionInfo?.meta?.display_template ?? undefined;

			if (template) {
				shouldPrefixWithPath = true;
			}
		}

		const fields = new Set<string>();

		const localType = getLocalTypeForField(collection, field);

		if (localType === 'm2a') {
			const relationsStore = useRelationsStore();
			const relations = relationsStore.getRelationsForField(collection, field);

			const m2aAllowedCollections =
				relations.find(
					(relation) =>
						relation.collection === relatedCollection &&
						relation.meta?.one_allowed_collections &&
						relation.meta.one_allowed_collections.length > 0,
				)?.meta?.one_allowed_collections ?? [];

			// Always include the collection field for M2A
			const collectionField = relations.find((relation) => relation.meta?.one_collection_field)?.meta
				?.one_collection_field;

			if (collectionField) {
				fields.add(collectionField);
			}

			if (template) {
				// Check if template uses M2A conditional syntax: {{item:CollectionName.field}}
				const m2aRegex = /{{item:([^.]+)\.([^}]+)}}/g;
				const matches = [...template.matchAll(m2aRegex)];

				if (matches.length > 0) {
					// Group fields by collection to apply adjustFieldsForDisplays per collection
					const fieldsByCollection = new Map<string, string[]>();

					for (const match of matches) {
						const collectionName = match[1]!;
						const fieldName = match[2]!;

						if (!fieldsByCollection.has(collectionName)) {
							fieldsByCollection.set(collectionName, []);
						}

						fieldsByCollection.get(collectionName)!.push(fieldName);
					}

					for (const [collectionName, collectionFields] of fieldsByCollection) {
						const adjustedFields = adjustFieldsForDisplays(collectionFields, collectionName);

						for (const adjustedField of adjustedFields) {
							fields.add(`item:${collectionName}.${adjustedField}`);
						}
					}
				}

				const adjustedJunctionFields = adjustFieldsForDisplays(getFieldsFromTemplate(template), relatedCollection);

				for (const field of adjustedJunctionFields) {
					if (!field.startsWith('item:')) {
						fields.add(field);
					}
				}
			} else {
				// Fetch fields from each related collection's display_template
				for (const m2aCollection of m2aAllowedCollections) {
					const collectionInfo = collectionsStore.getCollection(m2aCollection);
					const m2aTemplate = collectionInfo?.meta?.display_template;

					if (m2aTemplate) {
						const m2aFields = adjustFieldsForDisplays(getFieldsFromTemplate(m2aTemplate), m2aCollection);

						for (const m2aField of m2aFields) {
							fields.add(`item:${m2aCollection}.${m2aField}`);
						}
					} else {
						// fallback to primary key only
						const collectionPKField = fieldsStore.getPrimaryKeyFieldForCollection(m2aCollection);

						if (collectionPKField) {
							fields.add(`item:${m2aCollection}.${collectionPKField.field}`);
						}
					}
				}
			}
		} else {
			if (template) {
				const templateFields = adjustFieldsForDisplays(
					getFieldsFromTemplate(template),
					junctionCollection ?? relatedCollection,
				);

				// Only prefix with path if using related collection template
				// Options template and junction template are written from junction perspective
				templateFields.forEach((fieldKey) => {
					const field = shouldPrefixWithPath && path && path.length > 0 ? [...path, fieldKey].join('.') : fieldKey;

					fields.add(field);
				});
			}

			if (primaryKeyField) {
				const primaryKeyFieldValue = path ? [...path, primaryKeyField.field].join('.') : primaryKeyField.field;

				fields.add(primaryKeyFieldValue);
			}
		}

		return Array.from(fields);
	},
});
