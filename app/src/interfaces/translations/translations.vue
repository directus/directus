<template>
	<div v-if="languagesLoading">
		<v-skeleton-loader v-for="n in 5" :key="n" />
	</div>

	<v-list class="translations" v-else>
		<v-list-item
			v-for="(languageItem, i) in languages"
			:key="languageItem[languagesPrimaryKeyField]"
			@click="startEditing(languageItem[languagesPrimaryKeyField])"
			class="language-row"
			block
		>
			<v-icon class="translate" name="translate" left />
			<render-template :template="_languageTemplate" :collection="languagesCollection" :item="languageItem" />
			<render-template
				class="preview"
				:template="_translationsTemplate"
				:collection="translationsCollection"
				:item="previewItems[i]"
			/>
			<div class="spacer" />
		</v-list-item>

		<drawer-item
			v-if="editing"
			active
			:collection="translationsCollection"
			:primary-key="editing"
			:edits="edits"
			:circular-field="translationsRelation.field"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch } from '@vue/composition-api';
import { useRelationsStore, useFieldsStore } from '@/stores/';
import api from '@/api';
import { Relation } from '@/types';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import DrawerItem from '@/views/private/components/drawer-item/drawer-item.vue';
import { useCollection } from '@/composables/use-collection';
import { unexpectedError } from '@/utils/unexpected-error';
import { isPlainObject } from 'lodash';

export default defineComponent({
	components: { DrawerItem },
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: String,
			required: true,
		},
		languageTemplate: {
			type: String,
			default: null,
		},
		translationsTemplate: {
			type: String,
			default: null,
		},
		value: {
			type: Array as PropType<(string | number | Record<string, any>)[]>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		const {
			relationsForField,
			translationsRelation,
			translationsCollection,
			translationsPrimaryKeyField,
			languagesRelation,
			languagesCollection,
			languagesPrimaryKeyField,
			translationsLanguageField,
		} = useRelations();

		const { languages, loading: languagesLoading, template: _languageTemplate } = useLanguages();
		const { startEditing, editing, edits, stageEdits, cancelEdit } = useEdits();
		const { previewItems, template: _translationsTemplate } = usePreview();

		return {
			relationsForField,
			translationsRelation,
			translationsCollection,
			languagesRelation,
			languages,
			_languageTemplate,
			_translationsTemplate,
			languagesCollection,
			languagesPrimaryKeyField,
			languagesLoading,
			startEditing,
			translationsLanguageField,
			editing,
			stageEdits,
			cancelEdit,
			edits,
			previewItems,
		};

		function useRelations() {
			const relationsForField = computed<Relation[]>(() => {
				return relationsStore.getRelationsForField(props.collection, props.field);
			});

			const translationsRelation = computed(() => {
				if (!relationsForField.value) return null;
				return (
					relationsForField.value.find(
						(relation: Relation) =>
							relation.related_collection === props.collection && relation.meta?.one_field === props.field
					) || null
				);
			});

			const translationsCollection = computed(() => {
				if (!translationsRelation.value) return null;
				return translationsRelation.value.collection;
			});

			const translationsPrimaryKeyField = computed<string>(() => {
				if (!translationsRelation.value) return null;
				return fieldsStore.getPrimaryKeyFieldForCollection(translationsRelation.value.collection).field;
			});

			const languagesRelation = computed(() => {
				if (!relationsForField.value) return null;
				return relationsForField.value.find((relation: Relation) => relation !== translationsRelation.value) || null;
			});

			const languagesCollection = computed(() => {
				if (!languagesRelation.value) return null;
				return languagesRelation.value.related_collection;
			});

			const languagesPrimaryKeyField = computed<string>(() => {
				if (!languagesRelation.value) return null;
				return fieldsStore.getPrimaryKeyFieldForCollection(languagesRelation.value.related_collection).field;
			});

			const translationsLanguageField = computed(() => {
				if (!languagesRelation.value) return null;
				return languagesRelation.value.field;
			});

			return {
				relationsForField,
				translationsRelation,
				translationsCollection,
				translationsPrimaryKeyField,
				languagesRelation,
				languagesCollection,
				languagesPrimaryKeyField,
				translationsLanguageField,
			};
		}

		function useLanguages() {
			const languages = ref<Record<string, any>[]>();
			const loading = ref(false);
			const error = ref<any>(null);

			const { info: languagesCollectionInfo } = useCollection(languagesCollection);

			const template = computed(() => {
				if (!languagesPrimaryKeyField.value) return '';

				return (
					props.languageTemplate ||
					languagesCollectionInfo.value?.meta?.display_template ||
					`{{ ${languagesPrimaryKeyField.value} }}`
				);
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

		function useEdits() {
			const keyMap = ref<Record<string, string | number>[]>();

			const loading = ref(false);
			const error = ref<any>(null);

			const editing = ref<boolean | string | number>(false);
			const edits = ref<Record<string, any>>();

			const existingPrimaryKeys = computed(() => {
				return (props.value || [])
					.map((value) => {
						if (typeof value === 'string' || typeof value === 'number') return value;
						return value[translationsPrimaryKeyField.value];
					})
					.filter((key) => key);
			});

			watch(() => props.value, fetchKeyMap, { immediate: true });

			return { startEditing, editing, edits, stageEdits, cancelEdit };

			function startEditing(language: string | number) {
				if (!translationsLanguageField.value) return;

				edits.value = {
					[translationsLanguageField.value]: language,
				};

				const existingEdits = (props.value || []).find((val) => {
					if (typeof val === 'string' || typeof val === 'number') return false;
					return val[translationsLanguageField.value!] === language;
				});

				if (existingEdits) {
					edits.value = {
						...edits.value,
						...(existingEdits as Record<string, any>),
					};
				}

				const primaryKey =
					keyMap.value?.find((record) => record[translationsLanguageField.value!] === language)?.[
						translationsPrimaryKeyField.value
					] || '+';

				if (primaryKey !== '+') {
					edits.value = {
						...edits.value,
						[translationsPrimaryKeyField.value]: primaryKey,
					};
				}

				editing.value = primaryKey;
			}

			async function fetchKeyMap() {
				if (!props.value) return;
				if (keyMap.value) return;

				const collection = translationsRelation.value?.collection;

				if (!collection) return;

				const fields = [translationsPrimaryKeyField.value, translationsLanguageField.value];

				loading.value = true;

				try {
					const response = await api.get(`/items/${collection}`, {
						params: {
							fields,
							filter: {
								[translationsPrimaryKeyField.value]: {
									_in: existingPrimaryKeys.value,
								},
							},
						},
					});

					keyMap.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}

			function stageEdits(edits: any) {
				if (!translationsLanguageField.value) return;

				const editedLanguage = edits[translationsLanguageField.value];

				const languageAlreadyEdited = !!(props.value || []).find((val) => {
					if (typeof val === 'string' || typeof val === 'number') return false;
					return val[translationsLanguageField.value!] === editedLanguage;
				});

				if (languageAlreadyEdited === true) {
					emit(
						'input',
						props.value.map((val) => {
							if (typeof val === 'string' || typeof val === 'number') return val;

							if (val[translationsLanguageField.value!] === editedLanguage) {
								return edits;
							}

							return val;
						})
					);
				} else {
					if (editing.value === '+') {
						emit('input', [...(props.value || []), edits]);
					} else {
						emit(
							'input',
							props.value.map((val) => {
								if (typeof val === 'string' || typeof val === 'number') {
									if (val === editing.value) return edits;
								} else {
									if (val[translationsPrimaryKeyField.value] === editing.value) return edits;
								}

								return val;
							})
						);
					}
				}

				editing.value = false;
			}

			function cancelEdit() {
				edits.value = {};
				editing.value = false;
			}
		}

		function usePreview() {
			const loading = ref(false);
			const error = ref(null);
			const previewItems = ref<Record<string, any>[]>([]);

			const { info: translationsCollectionInfo } = useCollection(translationsCollection);

			const template = computed(() => {
				if (!translationsPrimaryKeyField.value) return '';

				return (
					props.translationsTemplate ||
					translationsCollectionInfo.value?.meta?.display_template ||
					`{{ ${translationsPrimaryKeyField.value} }}`
				);
			});

			watch(() => props.value, fetchPreviews, { immediate: true });
			watch(languages, fetchPreviews, { immediate: true });

			return { loading, error, previewItems, fetchPreviews, template };

			async function fetchPreviews() {
				if (!translationsRelation.value || !languagesRelation.value || !languages.value) return;

				loading.value = true;

				try {
					const fields = getFieldsFromTemplate(template.value);

					if (fields.includes(languagesRelation.value.field) === false) {
						fields.push(languagesRelation.value.field);
					}

					const existing = await api.get(`/items/${translationsCollection.value}`, {
						params: {
							fields,
							filter: {
								[translationsRelation.value.field]: {
									_eq: props.primaryKey,
								},
							},
						},
					});

					previewItems.value = languages.value.map((language) => {
						const existingEdit =
							props.value && Array.isArray(props.value)
								? (props.value.find(
										(edit) =>
											isPlainObject(edit) &&
											(edit as Record<string, any>)[languagesRelation.value!.field] ===
												language[languagesPrimaryKeyField.value]
								  ) as Record<string, any>)
								: {};

						return {
							...(existing.data.data?.find(
								(item: Record<string, any>) =>
									item[languagesRelation.value!.field] === language[languagesPrimaryKeyField.value]
							) ?? {}),
							...existingEdit,
						};
					});
				} catch (err) {
					console.log(err);
					error.value = err;
					previewItems.value = [];
				} finally {
					loading.value = false;
				}
			}
		}
	},
});
</script>

<style scoped>
.preview {
	color: var(--foreground-subdued);
}
</style>
