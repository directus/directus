import { useFieldsStore } from '@/stores/fields';
import { defineInterface } from '@directus/utils';
import PreviewSVG from './preview.svg?raw';
import InterfaceTranslations from './translations.vue';

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
			{
				field: 'languageDirectionField',
				type: 'string',
				name: '$t:interfaces.translations.language_direction_field',
				schema: {
					data_type: 'string',
					default_value: choices.some((choice) => choice.value === 'direction') ? 'direction' : null,
				},
				meta: {
					interface: 'select-dropdown',
					options: {
						choices,
					},
				},
			},
			{
				field: 'defaultLanguage',
				name: '$t:interfaces.translations.default_language',
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
				name: '$t:interfaces.translations.user_language',
				type: 'string',
				schema: {
					default_value: false,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:interfaces.translations.enable',
					},
					width: 'half',
				},
			},
		];
	},
	preview: PreviewSVG,
});
