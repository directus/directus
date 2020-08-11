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
				<render-template :template="template" :collection="languagesCollection" :item="item" />
			</div>
			<transition-expand>
				<div v-if="active">
					<div class="form">
						<v-divider />
						<v-form
							:initial-values="existing[index]"
							:collection="relatedCollection.collection"
							:primary-key="existing[index][relatedPrimaryKeyField.field] || '+'"
							:edits="edits[index]"
							@input="emitValue($event, existing[index][relatedPrimaryKeyField.field])"
						/>
					</div>
				</div>
			</transition-expand>
		</v-item>
	</v-item-group>
</template>

<script lang="ts">
import { defineComponent, computed, ref, toRefs, watch, PropType } from '@vue/composition-api';
import { useCollectionsStore, useRelationsStore } from '@/stores/';
import useCollection from '@/composables/use-collection';
import api from '@/api';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';

export default defineComponent({
	props: {
		languagesCollection: {
			type: String,
			required: true,
		},
		languageField: {
			type: String,
			required: true,
		},
		template: {
			type: String,
			required: true,
		},
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
		value: {
			type: Array as PropType<Record<string, any>[]>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const collectionsStore = useCollectionsStore();
		const relationsStore = useRelationsStore();

		const {
			languages,
			loading: languagesLoading,
			error: languagesError,
			primaryKeyField: languagesPrimaryKeyField,
		} = useLanguages();

		const { relation, relatedCollection, relatedPrimaryKeyField } = useRelation();

		const { items, loading: itemsLoading, error: itemsError } = useCurrent();

		const { existing, edits, emitValue } = useValues();

		return {
			relation,
			relatedCollection,
			relatedPrimaryKeyField,
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
		};

		function useRelation() {
			const relation = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
			});

			const relatedCollection = computed(() => {
				return collectionsStore.getCollection(relation.value.many_collection)!;
			});

			const { primaryKeyField: relatedPrimaryKeyField } = useCollection(relatedCollection.value.collection);

			return { relation, relatedCollection, relatedPrimaryKeyField };
		}

		function useLanguages() {
			const languages = ref<Record<string, any> | null>(null);
			const loading = ref(false);
			const error = ref(null);

			const { languagesCollection } = toRefs(props);

			const { primaryKeyField } = useCollection(languagesCollection);

			watch(() => props.languagesCollection, fetchLanguages);

			return { languages, loading, error, primaryKeyField };

			async function fetchLanguages() {
				loading.value = true;

				const fields = getFieldsFromTemplate(props.template);

				if (fields.includes(primaryKeyField.value.field) === false) {
					fields.push(primaryKeyField.value.field);
				}

				try {
					const response = await api.get(`/items/${props.languagesCollection}`, {
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
							(item) => item[props.languageField] === language[languagesPrimaryKeyField.value.field]
						) || {};

					return existing;
				});
			});

			const edits = computed(() => {
				if (!languages.value) return [];

				return languages.value.map((language: any) => {
					const edits =
						(props.value || []).find(
							(edit) => edit[props.languageField] === language[languagesPrimaryKeyField.value.field]
						) || {};

					edits[props.languageField] = language[languagesPrimaryKeyField.value.field];

					return edits;
				});
			});

			return { existing, edits, emitValue };

			function emitValue(newEdit: any, existingPrimaryKey: undefined | string | number) {
				const currentEdits = [...(props.value || [])];

				if (existingPrimaryKey) {
					newEdit = {
						...newEdit,
						[relatedPrimaryKeyField.value.field]: existingPrimaryKey,
					};
				}

				if (currentEdits.some((edit) => edit[props.languageField] === newEdit[props.languageField])) {
					emit(
						'input',
						currentEdits.map((edit) => {
							if (edit[props.languageField] === newEdit[props.languageField]) {
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
