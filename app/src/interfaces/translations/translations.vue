<template>
	<div v-if="itemsLoading || languagesLoading" class="loader">
		<v-skeleton-loader v-for="n in 5" :key="n" />
	</div>

	<v-item-group v-else scope="translations" class="translations">
		<v-item
			scope="translations"
			class="row"
			v-for="(item, index) in languages"
			:key="item[languagesPrimaryKeyField.field]"
			#default="{ active, toggle }"
		>
			<div class="header" @click="toggle">
				<render-template :template="rowTemplate" :collection="languagesCollection" :item="item" />
			</div>
			<transition-expand>
				<div v-if="active">
					<div class="form">
						<v-divider />
						<v-form
							:initial-values="existing[index]"
							:collection="translationsCollection"
							:primary-key="existing[index][translationsPrimaryKeyField.field] || '+'"
							:edits="edits[index]"
							@input="emitValue($event, existing[index][translationsPrimaryKeyField.field])"
						/>
					</div>
				</div>
			</transition-expand>
		</v-item>
	</v-item-group>
</template>

<script lang="ts">
import { defineComponent, computed, ref, toRefs, watch, PropType } from '@vue/composition-api';
import { useCollectionsStore, useRelationsStore, useFieldsStore } from '@/stores/';
import useCollection from '@/composables/use-collection';
import api from '@/api';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import { Relation } from '@/types';

export default defineComponent({
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
			type: Array as PropType<Record<string, any>[]>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();

		const { relations, translationsCollection, languagesCollection, languageField, translationsPrimaryKeyField } = useRelation();

		const {
			languages,
			loading: languagesLoading,
			error: languagesError,
			primaryKeyField: languagesPrimaryKeyField,
		} = useLanguages();

		const { items, loading: itemsLoading, error: itemsError } = useCurrent();
		const { existing, edits, emitValue } = useValues();

		const rowTemplate = computed(() => {
			const { info, primaryKeyField } = useCollection(languagesCollection);
			const defaultTemplate = info.value?.meta?.display_template;

			return defaultTemplate || props.template || `{{ $${primaryKeyField.value.field} }}`;
		});

		return {
			relations,
			translationsCollection,
			languagesCollection,
			languages,
			languagesLoading,
			languagesError,
			languagesPrimaryKeyField,
			items,
			itemsLoading,
			itemsError,
			existing,
			edits,
			emitValue,
			rowTemplate,
			translationsPrimaryKeyField,
		};

		function useRelation() {
			const relations = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field);
			});

			const translationsRelation = computed(() => {
				if (!relations.value || relations.value.length === 0) return null;

				return relations.value.find((relation: Relation) => {
					return relation.one_collection === props.collection && relation.one_field === props.field;
				}) || null;
			})

			const translationsCollection = computed(() => {
				if (!translationsRelation.value) return null;
				return translationsRelation.value.many_collection;
			});

			const translationsPrimaryKeyField = computed(() => {
				return fieldsStore.getPrimaryKeyFieldForCollection(translationsCollection.value);
			});

			const languagesRelation = computed(() => {
				if (!relations.value || relations.value.length === 0) return null;

				return relations.value.find((relation: Relation) => {
					return relation.one_collection !== props.collection && relation.one_field !== props.field;
				}) || null;
			});

			const languagesCollection = computed(() => {
				if (!languagesRelation.value) return null;
				return languagesRelation.value.one_collection;
			});

			const languageField = computed(() => {
				if (!languagesRelation.value) return null;
				return languagesRelation.value.many_field;
			})

			return { relations, translationsCollection, languagesCollection, languageField, translationsPrimaryKeyField };
		}

		function useLanguages() {
			const languages = ref<Record<string, any> | null>(null);
			const loading = ref(false);
			const error = ref(null);

			const { primaryKeyField } = useCollection(languagesCollection);

			watch(languagesCollection, fetchLanguages, { immediate: true });

			return { languages, loading, error, primaryKeyField };

			async function fetchLanguages() {
				loading.value = true;

				// const fields = getFieldsFromTemplate(props.template);
				const fields = ['*'];

				if (fields.includes(primaryKeyField.value.field) === false) {
					fields.push(primaryKeyField.value.field);
				}

				try {
					const response = await api.get(`/items/${languagesCollection.value}`, {
						params: {
							fields: fields,
							limit: -1,
						},
					});

					languages.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}
		}

		function useCurrent() {
			const loading = ref(false);
			const items = ref<any[]>([]);
			const error = ref(null);

			watch(
				() => props.primaryKey,
				(newKey) => {
					if (newKey !== null && newKey !== '+') {
						fetchCurrent();
					}
				},
				{
					immediate: true,
				}
			);

			return { loading, items, error };

			async function fetchCurrent() {
				loading.value = true;

				try {
					const response = await api.get(`/items/${props.collection}/${props.primaryKey}`, {
						params: {
							fields: props.field + '.*',
						},
					});

					items.value = response.data.data[props.field];
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}
		}

		function useValues() {
			const existing = computed(() => {
				if (!languages.value) return [];

				return languages.value.map((language: any) => {
					const existing =
						items.value.find(
							(item) => item[languageField.value] === language[languagesPrimaryKeyField.value.field]
						) || {};

					return existing;
				});
			});

			const edits = computed(() => {
				if (!languages.value) return [];

				return languages.value.map((language: any) => {
					const edits =
						(props.value || []).find(
							(edit) => edit[languageField.value] === language[languagesPrimaryKeyField.value.field]
						) || {};

					edits[languageField.value] = language[languagesPrimaryKeyField.value.field];

					return edits;
				});
			});

			return { existing, edits, emitValue };

			function emitValue(newEdit: any, existingPrimaryKey: undefined | string | number) {
				const currentEdits = [...(props.value || [])];

				if (existingPrimaryKey) {
					newEdit = {
						...newEdit,
						[translationsPrimaryKeyField.value.field]: existingPrimaryKey,
					};
				}

				if (currentEdits.some((edit) => edit[languageField.value] === newEdit[languageField.value])) {
					emit(
						'input',
						currentEdits.map((edit) => {
							if (edit[languageField.value] === newEdit[languageField.value]) {
								return newEdit;
							}

							return edit;
						})
					);
				} else {
					currentEdits.push(newEdit);
					emit('input', currentEdits);
				}
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/type-styles.scss';

.loader .v-skeleton-loader + .v-skeleton-loader {
	margin-top: 8px;
}

.header {
	display: flex;
	align-items: center;
	padding: 12px;
	cursor: pointer;
}

.row {
	background-color: var(--background-subdued);
	border-radius: var(--border-radius);

	& + .row {
		margin-top: 8px;
	}
}

.v-divider {
	margin-bottom: 12px;
}

.form {
	--v-form-vertical-gap: 24px;
	--v-form-horizontal-gap: 12px;

	padding: 12px;
	padding-top: 0;

	::v-deep .type-label {
		@include type-text;
	}
}
</style>
