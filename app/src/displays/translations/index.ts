import { defineDisplay } from '@directus/shared/utils';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import getRelatedCollection from '@/utils/get-related-collection';
import options from './options.vue';
import DisplayTranslations from './translations.vue';
import { useFieldsStore, useRelationsStore } from '@/stores';

type Options = {
	template: string;
};

export default defineDisplay({
	id: 'translations',
	name: '$t:displays.translations.translations',
	description: '$t:displays.translations.description',
	icon: 'translate',
	handler: DisplayTranslations,
	options: options,
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	groups: ['m2m'],
	fields: (options: Options | null, { field, collection }) => {
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore()
		const relations = relationsStore.getRelationsForField(collection, field)

		const translationsRelation = relations.find(
			(relation) =>
				relation.related_collection === collection &&
				relation.meta?.one_field === field
		)

		const languagesRelation = relations.find((relation) => relation !== translationsRelation);

		const relatedCollection = translationsRelation?.related_collection

		if (!relatedCollection) return [];

		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection);

		const fields = options?.template
			? adjustFieldsForDisplays(getFieldsFromTemplate(options.template), relatedCollection as unknown as string)
			: [];

		if (primaryKeyField && !fields.includes(primaryKeyField.field)) {
			fields.push(primaryKeyField.field);
		}

		if(languagesRelation?.field && !fields.includes(languagesRelation.field))
			fields.push(languagesRelation.field)

		return fields;
	},
});
