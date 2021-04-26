<template>
	<div v-if="languagesLoading">
		<v-skeleton-loader v-for="n in 5" :key="n" />
	</div>

	<v-list class="translations" v-else>
		<v-list-item
			v-for="languageItem in languages"
			:key="languageItem[languagesPrimaryKeyField]"
			@click="startEditing(languageItem[languagesPrimaryKeyField])"
			class="language-row"
			block
		>
			<v-icon class="translate" name="translate" left />
			<render-template :template="languagesTemplate" :collection="languagesCollection" :item="languageItem" />
			<div class="spacer" />
		</v-list-item>

		<drawer-item
			v-if="editing"
			active
			:collection="translationsCollection"
			:primary-key="editing"
			:edits="edits"
			:circular-field="translationsRelation.many_field"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch } from '@vue/composition-api';
import { useRelationsStore } from '@/stores/';
import api from '@/api';
import { Relation } from '@/types';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import DrawerItem from '@/views/private/components/drawer-item/drawer-item.vue';
import { useCollection } from '@/composables/use-collection';
import { unexpectedError } from '@/utils/unexpected-error';

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
		template: {
			type: String,
			default: null,
		},
		value: {
			type: Array as PropType<(string | number | Record<string, any>)[]>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
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

		const { languages, loading: languagesLoading, error: languagesError, template: languagesTemplate } = useLanguages();

		const { startEditing, editing, edits, stageEdits, cancelEdit } = useEdits();

		return {
			relationsForField,
			translationsRelation,
			translationsCollection,
			languagesRelation,
			languages,
			languagesTemplate,
			languagesCollection,
			languagesPrimaryKeyField,
			languagesLoading,
			startEditing,
			translationsLanguageField,
			editing,
			stageEdits,
			cancelEdit,
			edits,
		};

		function useRelations() {
			const relationsForField = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field);
			});

			const translationsRelation = computed(() => {
				if (!relationsForField.value) return null;
				return (
					relationsForField.value.find(
						(relation: Relation) => relation.one_collection === props.collection && relation.one_field === props.field
					) || null
				);
			});

			const translationsCollection = computed(() => {
				if (!translationsRelation.value) return null;
				return translationsRelation.value.many_collection;
			});

			const translationsPrimaryKeyField = computed(() => {
				if (!translationsRelation.value) return null;
				return translationsRelation.value.many_primary;
			});

			const languagesRelation = computed(() => {
				if (!relationsForField.value) return null;
				return relationsForField.value.find((relation: Relation) => relation !== translationsRelation.value) || null;
			});

			const languagesCollection = computed(() => {
				if (!languagesRelation.value) return null;
				return languagesRelation.value.one_collection;
			});

			const languagesPrimaryKeyField = computed(() => {
				if (!languagesRelation.value) return null;
				return languagesRelation.value.one_primary;
			});

			const translationsLanguageField = computed(() => {
				if (!languagesRelation.value) return null;
				return languagesRelation.value.many_field;
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
			const languages = ref();
			const loading = ref(false);
			const error = ref<any>(null);

			const { info: languagesCollectionInfo } = useCollection(languagesCollection);

			const template = computed(() => {
				if (!languagesPrimaryKeyField.value) return '';
				return (
					props.template ||
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
				edits.value = {
					[translationsLanguageField.value]: language,
				};

				const existingEdits = (props.value || []).find((val) => {
					if (typeof val === 'string' || typeof val === 'number') return false;
					return val[translationsLanguageField.value] === language;
				});

				if (existingEdits) {
					edits.value = {
						...edits.value,
						...(existingEdits as Record<string, any>),
					};
				}

				const primaryKey =
					keyMap.value?.find((record) => record[translationsLanguageField.value] === language)?.[
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

				const collection = translationsRelation.value.many_collection;
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
				const editedLanguage = edits[translationsLanguageField.value];

				const languageAlreadyEdited = !!(props.value || []).find((val) => {
					if (typeof val === 'string' || typeof val === 'number') return false;
					return val[translationsLanguageField.value] === editedLanguage;
				});

				if (languageAlreadyEdited === true) {
					emit(
						'input',
						props.value.map((val) => {
							if (typeof val === 'string' || typeof val === 'number') return val;

							if (val[translationsLanguageField.value] === editedLanguage) {
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
	},
});
</script>
