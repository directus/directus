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
	options: ({ relations }) => {
		const relatedCollection = relations.o2m?.collection ?? relations.m2o?.related_collection;

		return [
			{
				field: 'template',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: relatedCollection,
					},
					width: 'full',
				},
			},
		];
	},
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	localTypes: ['m2m', 'm2o', 'o2m', 'translations', 'm2a'],
	fields: (options: Options | null, { field, collection }) => {
		const relatedCollection = getRelatedCollection(collection, field);
		const fieldsStore = useFieldsStore();
		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection);

		if (!relatedCollection) return [];

		const fields = options?.template
			? adjustFieldsForDisplays(getFieldsFromTemplate(options.template), relatedCollection as unknown as string)
			: [];

		if (primaryKeyField && !fields.includes(primaryKeyField.field)) {
			fields.push(primaryKeyField.field);
		}

		return fields;
	},
});
