import { defineDisplay } from '@/displays/define';
import DisplayRelatedValues from './related-values.vue';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import getRelatedCollection from '@/utils/get-related-collection';
import useCollection from '@/composables/use-collection';
import { ref } from '@vue/composition-api';
import options from './options.vue';

type Options = {
	template: string;
};

export default defineDisplay(() => ({
	id: 'related-values',
	name: '$t:displays.related-values.related-values',
	description: '$t:displays.related-values.description',
	icon: 'settings_ethernet',
	handler: DisplayRelatedValues,
	options: options,
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	groups: ['m2m', 'm2o', 'o2m'],
	fields: (options: Options | null, { field, collection }) => {
		const relatedCollection = getRelatedCollection(collection, field);
		const { primaryKeyField } = useCollection(ref(relatedCollection as string));

		if (!relatedCollection) return [];

		const fields = options?.template
			? adjustFieldsForDisplays(getFieldsFromTemplate(options.template), relatedCollection)
			: [];

		if (primaryKeyField.value && !fields.includes(primaryKeyField.value.field)) {
			fields.push(primaryKeyField.value.field);
		}

		return fields;
	},
}));
