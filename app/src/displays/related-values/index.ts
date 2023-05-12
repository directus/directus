import { useExtension } from '@/composables/use-extension';
import { useFieldsStore } from '@/stores/fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { getRelatedCollection } from '@/utils/get-related-collection';
import { renderPlainStringTemplate } from '@/utils/render-string-template';
import type { Field } from '@directus/types';
import { defineDisplay, getFieldsFromTemplate } from '@directus/utils';
import { get, set } from 'lodash';
import DisplayRelatedValues from './related-values.vue';

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
					fieldKey
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
	localTypes: ['m2m', 'm2o', 'o2m', 'translations', 'm2a', 'file', 'files'],
	fields: (options: Options | null, { field, collection }) => {
		const relatedCollectionData = getRelatedCollection(collection, field);

		if (!relatedCollectionData) return [];

		const fieldsStore = useFieldsStore();

		const { junctionCollection, relatedCollection, path } = relatedCollectionData;

		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection);

		const fields = options?.template
			? adjustFieldsForDisplays(getFieldsFromTemplate(options.template), junctionCollection ?? relatedCollection)
			: [];

		if (primaryKeyField) {
			const primaryKeyFieldValue = path ? [...path, primaryKeyField.field].join('.') : primaryKeyField.field;

			if (!fields.includes(primaryKeyFieldValue)) {
				fields.push(primaryKeyFieldValue);
			}
		}

		return fields;
	},
});
