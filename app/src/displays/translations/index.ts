import { defineDisplay } from '@directus/shared/utils';
import DisplayTranslations from './translations.vue';
import { useFieldsStore } from '@/stores';
import { ExtensionsOptionsContext } from '@directus/shared/types';

export default defineDisplay({
	id: 'translations',
	name: '$t:displays.translations.translations',
	description: '$t:displays.translations.description',
	icon: 'translate',
	component: DisplayTranslations,
	options: ({ relations }: ExtensionsOptionsContext) => {
		const fieldsStore = useFieldsStore();

		const junctionCollection = relations.o2m?.collection;
		const relatedCollection = relations.m2o?.related_collection;

		const languageFields = relatedCollection ? fieldsStore.getFieldsForCollection(relatedCollection) : [];

		return [
			{
				field: 'template',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: junctionCollection,
					},
					width: 'half',
				},
			},
			{
				field: 'languageField',
				name: '$t:displays.translations.language_field',
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: languageFields.map(({ field, name }) => ({ text: name, value: field })),
					},
					width: 'half',
				},
			},
			{
				field: 'defaultLanguage',
				name: '$t:displays.translations.default_language',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: '$t:primary_key',
					},
				},
			},
			{
				field: 'userLanguage',
				name: '$t:displays.translations.user_language',
				type: 'string',
				schema: {
					default_value: false,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:displays.translations.enable',
					},
					width: 'half',
				},
			},
		];
	},
	types: ['alias'],
	localTypes: ['translations'],
	fields: ['*.*'],
});
