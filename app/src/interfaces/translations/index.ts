import { defineInterface } from '@directus/shared/utils';
import InterfaceTranslations from './translations.vue';
import { useFieldsStore } from '@/stores';

export default defineInterface({
	id: 'translations',
	name: '$t:translations',
	icon: 'translate',
	types: ['alias'],
	localTypes: ['translations'],
	group: 'relational',
	relational: true,
	component: InterfaceTranslations,
	options: ({ relations }) => {
		const fieldsStore = useFieldsStore();

		const languagesCollection = relations.m2o?.related_collection;

		let choices: { text: string; value: string }[] = [];

		if (languagesCollection) {
			choices = fieldsStore.getFieldsForCollection(languagesCollection).map((field) => ({
				text: field.name,
				value: field.field,
			}));
		}
		return [
			{
				field: 'languageField',
				type: 'string',
				name: '$t:interfaces.translations.language_field',
				meta: {
					interface: 'select-dropdown',
					options: {
						placeholder: '$t:primary_key',
						choices,
					},
				},
			},
		];
	},
});
