import { defineDisplay } from '@/displays/define';
import DisplayRelatedValues from './related-values.vue';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import getRelatedCollection from '@/utils/get-related-collection';
import useCollection from '@/composables/use-collection';
import { ref } from '@vue/composition-api';

type Options = {
	template: string;
};

export default defineDisplay(({ i18n }) => ({
	id: 'related-values',
	name: i18n.t('displays.related-values.related-values'),
	description: i18n.t('displays.related-values.description'),
	icon: 'settings_ethernet',
	handler: DisplayRelatedValues,
	options: [
		/** @todo make this a component so we have dynamic collection for display template component */
		{
			field: 'template',
			name: i18n.t('display_template'),
			type: 'string',
			meta: {
				interface: 'text-input',
				width: 'full',
			},
		},
	],
	types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
	fields: (options: Options, { field, collection }) => {
		const relatedCollection = getRelatedCollection(collection, field);
		const { primaryKeyField } = useCollection(ref(relatedCollection as string));

		if (!relatedCollection) return [];

		const fields = adjustFieldsForDisplays(getFieldsFromTemplate(options.template), relatedCollection);

		if (fields.includes(primaryKeyField.value.field) === false) {
			fields.push(primaryKeyField.value.field);
		}

		return fields;
	},
}));
