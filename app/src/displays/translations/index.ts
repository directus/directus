import { defineDisplay } from '@directus/shared/utils';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import options from './options.vue';
import DisplayTranslations from './translations.vue';
import { useFieldsStore, useRelationsStore } from '@/stores';

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
	options: options,
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

		if (languagesRelation?.field && !fields.includes(languagesRelation.field)) {
			fields.push(`${languagesRelation.field}.${languagesPrimaryKeyField.field}`);

			if (options?.languageField) {
				fields.push(`${languagesRelation.field}.${options.languageField}`);
			}
		}

		return fields;
	},
});
