import { defineDisplay } from '@/displays/define';
import DisplayTranslations from './translations.vue';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import getRelatedCollection from '@/utils/get-related-collection';
import useCollection from '@/composables/use-collection';
import { ref, computed } from '@vue/composition-api';
import options from './options.vue';
import useLanguagesCodeField from './use-languages-code-field';

type Options = {
	template: string;
};

export default defineDisplay(({ i18n }) => ({
	id: 'translations',
	name: i18n.t('displays.translations.translations'),
	description: i18n.t('displays.translations.description'),
	icon: 'translate',
	handler: DisplayTranslations,
	options: options,
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	groups: ['m2m', 'm2o', 'o2m'],
	fields: (options: Options, { field, collection }) => {
		const relatedCollection = getRelatedCollection(collection, field);
		const { primaryKeyField } = useCollection(ref(relatedCollection as string));

		if (!relatedCollection) return [];

		const fields = adjustFieldsForDisplays(getFieldsFromTemplate(options.template), relatedCollection);

		const languagesCodeField = useLanguagesCodeField(collection, field);

		if (fields.includes(languagesCodeField.value) === false) {
			fields.push(languagesCodeField.value);
		}

		if (fields.includes(primaryKeyField.value.field) === false) {
			fields.push(primaryKeyField.value.field);
		}

		return fields;
	},
}));
