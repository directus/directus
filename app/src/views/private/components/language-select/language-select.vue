<template>
	<v-select
		@update:model-value="$emit('select', $event)"
		item-text="text"
		item-value="value"
		v-model="language"
		:items="items"
		:disabled="disabled"
	/>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue';
import { useRelationsStore } from '@/stores/';
import api from '@/api';
import { Relation } from '@/types';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import { useCollection } from '@/composables/use-collection';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
	},
	watch: {
		languages: function () {
			const language = this.language;
			this.items = this.languages.map((language: any) => {
				return {
					text: this.applyTemplate(this.template, language),
					value: language[this.languagesPrimaryKeyField],
				};
			});
			const [item] = this.items;
			this.language = item?.value || null;
			if (this.language !== language) {
				this.$emit('select', this.language);
			}
		},
	},
	setup(props) {
		const items = ref<any[]>([]);
		const language = ref<any>(null);
		const relationsStore = useRelationsStore();
		const { languagesCollection, languagesPrimaryKeyField } = useRelations();
		const { languages, template } = useLanguages();
		const { applyTemplate } = useTemplate();
		return { languages, language, items, languagesPrimaryKeyField, template, applyTemplate };

		function useTemplate() {
			const regex = /\{\{(.*?)\}\}/g;

			const applyTemplate = (template: string, item: any) => {
				const result = template.replace(regex, (_, token) => {
					const fieldKey = token.replace(/{{/g, '').replace(/}}/g, '').trim();
					return item[fieldKey];
				});
				return result;
			};
			return { applyTemplate };
		}

		function useRelations() {
			const relationsForField = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field);
			});

			const translationsRelation = computed(() => {
				if (!relationsForField.value) return null;
				return (
					relationsForField.value.find(
						(relation: Relation) =>
							relation.meta?.one_collection === props.collection && relation.meta?.one_field === props.field
					) || null
				);
			});

			const translationsCollection = computed<string>(() => {
				if (!translationsRelation.value) return null;
				return translationsRelation.value.meta?.many_collection;
			});

			const languagesRelation = computed(() => {
				if (!relationsForField.value) return null;
				return relationsForField.value.find((relation: Relation) => relation !== translationsRelation.value) || null;
			});

			const languagesCollection = computed<string>(() => {
				if (!languagesRelation.value) return null;
				return languagesRelation.value.meta?.one_collection;
			});

			const languagesPrimaryKeyField = computed<string>(() => {
				if (!languagesRelation.value) return null;
				return languagesRelation.value.schema?.foreign_key_column;
			});

			return {
				relationsForField,
				translationsRelation,
				translationsCollection,
				languagesRelation,
				languagesCollection,
				languagesPrimaryKeyField,
			};
		}

		function useLanguages() {
			const languages = ref();
			const loading = ref(false);
			const error = ref<any>(null);

			const { info: languagesCollectionInfo } = useCollection(languagesCollection);

			const template = computed(() => {
				if (!languagesPrimaryKeyField.value) return '';
				return languagesCollectionInfo.value?.meta?.display_template || `{{ ${languagesPrimaryKeyField.value} }}`;
			});

			watch(languagesCollection, fetchLanguages, { immediate: true });

			return { languages, loading, error, template };

			async function fetchLanguages() {
				if (!languagesCollection.value) return;

				const fields = getFieldsFromTemplate(template.value);

				if (fields.includes(languagesPrimaryKeyField.value) === false) {
					fields.push(languagesPrimaryKeyField.value);
				}

				loading.value = true;

				try {
					const response = await api.get(`/items/${languagesCollection.value}`, { params: { fields } });
					languages.value = response.data.data;
				} catch (err) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}
	},
});
</script>
