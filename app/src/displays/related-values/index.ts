import { defineDisplay } from '@directus/shared/utils';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { getRelatedCollection } from '@/utils/get-related-collection';
import DisplayRelatedValues from './related-values.vue';
import { useFieldsStore } from '@/stores/fields';
import { flatten, get, set } from 'lodash';
import { renderPlainStringTemplate } from '@/utils/render-string-template';
import { useExtension } from '@/composables/use-extension';
import { Field, Width } from '@directus/shared/types';

type Options = {
	template: string | Record<string, string>;
};

export default defineDisplay({
	id: 'related-values',
	name: '$t:displays.related-values.related-values',
	description: '$t:displays.related-values.description',
	icon: 'settings_ethernet',
	component: DisplayRelatedValues,
	options: ({ editing, relations }) => {
		const relatedCollection = relations.o2m?.collection ?? relations.m2o?.related_collection;
		const isM2A: boolean =
			relations.m2o?.meta?.one_collection_field != null && relations.m2o?.meta?.one_allowed_collections != null;
		// will be junction collection for m2m/m2a

		const displayTemplateMeta =
			editing === '+'
				? {
						interface: 'presentation-notice',
						options: {
							text: '$t:displays.related-values.display_template_configure_notice',
						},
						width: 'full' as Width,
				  }
				: isM2A
				? {
						interface: 'system-display-template-m2a',
						options: {
							collectionName: relatedCollection,
							collectionField: relations.m2o?.meta?.one_collection_field,
							allowedCollections: relations.m2o?.meta?.one_allowed_collections,
						},
						width: 'full' as Width,
				  }
				: {
						interface: 'system-display-template',
						options: {
							collectionName: relatedCollection,
						},
						width: 'full' as Width,
				  };

		return [
			{
				field: 'template',
				name: '$t:display_template',
				meta: displayTemplateMeta,
			},
		];
	},
	handler: (value, options: Partial<Options>, { collection, field }) => {
		if (!field || !collection || !options.template) return value;

		const relatedCollectionInfo = getRelatedCollection(collection, field.field);

		if (!relatedCollectionInfo) return value;

		const fieldsStore = useFieldsStore();

		const fieldKeys =
			typeof options.template === 'string'
				? getFieldsFromTemplate(options.template)
				: flatten(
						Object.entries(options.template as Record<string, string>).map(([col, templ]) =>
							getFieldsFromTemplate(templ)
						)
				  );

		const fields = fieldKeys.map((fieldKey) => {
			return {
				key: fieldKey,
				field: fieldsStore.getField(
					relatedCollectionInfo.junctionCollection ?? (relatedCollectionInfo.relatedCollection as string),
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
		if (typeof options.template === 'string') {
			return renderPlainStringTemplate(options.template, stringValues);
		} else {
			return renderPlainStringTemplate(options.template[collection], stringValues);
		}
	},
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	localTypes: ['m2m', 'm2o', 'o2m', 'translations', 'm2a', 'file', 'files'],
	fields: (options: Options | null, { field, collection }) => {
		const relatedCollectionData = getRelatedCollection(collection, field);

		if (!relatedCollectionData) return [];

		const fieldsStore = useFieldsStore();

		const { junctionCollection, relatedCollection, collectionField, path } = relatedCollectionData;

		const primaryKeyFields = Array.isArray(relatedCollection)
			? (relatedCollection
					.map((collection) => fieldsStore.getPrimaryKeyFieldForCollection(collection))
					.filter((f) => f != null) as Field[])
			: ([fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection)] as Field[]);

		const fields =
			options?.template == null
				? []
				: typeof options?.template === 'string'
				? adjustFieldsForDisplays(
						getFieldsFromTemplate(options.template),
						junctionCollection ?? (relatedCollection as string)
				  )
				: flatten(
						Object.entries(options?.template as Record<string, string>).map(([col, templ]) =>
							adjustFieldsForDisplays(getFieldsFromTemplate(templ), junctionCollection ?? (relatedCollection as string))
						)
				  );

		if (primaryKeyFields && primaryKeyFields.length > 0) {
			const primaryKeyFieldValues = path
				? primaryKeyFields.map((pkField) => [path, pkField?.field].join('.'))
				: primaryKeyFields.map((pkField) => pkField?.field);

			for (const pkFieldValue of primaryKeyFieldValues) {
				if (pkFieldValue && !fields.includes(pkFieldValue)) {
					fields.push(pkFieldValue);
				}
			}
		}

		if (collectionField) {
			fields.push(collectionField);
		}

		return fields;
	},
});
