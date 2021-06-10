import useCollection from '@/composables/use-collection';
import { defineDisplay } from '@/displays/define';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import getRelatedCollection from '@/utils/get-related-collection';
import { ref } from 'vue';
import options from './options.vue';
import DisplayRelatedValues from './related-values.vue';

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
		const { primaryKeyField } = useCollection(ref(relatedCollection as unknown as string));

		if (!relatedCollection) return [];

		const fields = options?.template
			? adjustFieldsForDisplays(getFieldsFromTemplate(options.template), relatedCollection as unknown as string)
			: [];

		if (primaryKeyField.value && !fields.includes(primaryKeyField.value.field)) {
			fields.push(primaryKeyField.value.field);
		}

		return fields;
	},
}));
