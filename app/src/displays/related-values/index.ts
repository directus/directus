import { defineDisplay } from '@directus/shared/utils';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import getRelatedCollection from '@/utils/get-related-collection';
import DisplayRelatedValues from './related-values.vue';
import { useFieldsStore } from '@/stores';

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

		const displayTemplateMeta =
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
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	localTypes: ['m2m', 'm2o', 'o2m', 'translations', 'm2a', 'file', 'files'],
	fields: (options: Options | null, { field, collection }) => {
		const { relatedCollection, path } = getRelatedCollection(collection, field);
		const fieldsStore = useFieldsStore();
		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection);

		if (!relatedCollection) return [];

		const fields = options?.template
			? adjustFieldsForDisplays(getFieldsFromTemplate(options.template), relatedCollection)
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
