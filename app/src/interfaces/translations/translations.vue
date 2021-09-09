<template>
	<div class="translations">
		<div class="primary">
			<v-select
				:model-value="firstLang"
				:item-text="languageField ?? languagesPrimaryKeyField"
				:item-value="languagesPrimaryKeyField"
				:filled="true"
				:items="languages"
				@update:modelValue="firstLang = $event"
			>
				<template #prepend>
					<v-icon class="translate" name="translate" />
				</template>
				<template #append>
					<v-icon
						v-if="!sideBySide"
						v-tooltip="t('interfaces.translations.multilang')"
						name="add"
						@click.stop="sideBySide = !sideBySide"
					/>
				</template>
			</v-select>
			<v-form
				:fields="fields"
				:model-value="firstItem"
				:color="'primary'"
				@update:modelValue="updateValue($event, firstLang)"
			/>
		</div>
		<div v-if="sideBySide" class="secondary">
			<v-select
				:model-value="secondLang"
				:item-text="languageField ?? languagesPrimaryKeyField"
				:item-value="languagesPrimaryKeyField"
				:filled="true"
				:items="languages"
				@update:modelValue="secondLang = $event"
			>
				<template #prepend>
					<v-icon class="translate" name="translate" />
				</template>
				<template #append>
					<v-icon
						v-if="sideBySide"
						v-tooltip="t('interfaces.translations.multilang')"
						name="close"
						@click.stop="sideBySide = !sideBySide"
					/>
				</template>
			</v-select>
			<v-form :fields="fields" :model-value="secondItem" @update:modelValue="updateValue($event, secondLang)" />
		</div>
	</div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, Ref, ref, toRefs, watch } from 'vue';
import useCollection from '@/composables/use-collection';
import { useFieldsStore, useRelationsStore } from '@/stores/';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import { Relation } from '@/types';
import { unexpectedError } from '@/utils/unexpected-error';
import { cloneDeep } from 'lodash';

export default defineComponent({
	components: {},
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
		languageField: {
			type: String,
			default: null,
		},
		value: {
			type: Array as PropType<(string | number | Record<string, any>)[]>,
			default: () => [],
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { collection } = toRefs(props);
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();
		const { t } = useI18n();

		let sideBySide = ref(false);
		const { info: collectionInfo } = useCollection(collection);
		let firstLang = ref('en-US');
		let secondLang = ref('en-US');

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

		const { languages } = useLanguages();
		const { items, firstItem, updateValue, secondItem } = useEdits();

		const fields = computed(() => {
			if (translationsCollection.value === null) return [];
			return fieldsStore.getFieldsForCollection(translationsCollection.value);
		});

		return {
			collectionInfo,
			sideBySide,
			firstLang,
			secondLang,
			t,
			languages,
			fields,
			relationsForField,
			translationsRelation,
			translationsCollection,
			translationsPrimaryKeyField,
			languagesRelation,
			languagesCollection,
			languagesPrimaryKeyField,
			translationsLanguageField,
			items,
			firstItem,
			secondItem,
			updateValue,
			relationsStore,
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

			const translationsPrimaryKeyField = computed<string | null>(() => {
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

			const languagesPrimaryKeyField = computed<string | null>(() => {
				if (!languagesRelation.value || !languagesRelation.value.related_collection) return null;
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
			const languages = ref<Record<string, any>[]>([]);
			const loading = ref(false);
			const error = ref<any>(null);

			watch(languagesCollection, fetchLanguages, { immediate: true });

			return { languages, loading, error };

			async function fetchLanguages() {
				if (!languagesCollection.value || !languagesPrimaryKeyField.value) return;

				const fields = new Set<string>();

				if (props.languageField !== null) {
					fields.add(props.languageField);
				}
				fields.add(languagesPrimaryKeyField.value);

				loading.value = true;

				try {
					const response = await api.get(`/items/${languagesCollection.value}`, {
						params: { field: Array.of(fields), limit: -1 },
					});
					languages.value = response.data.data;
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function useEdits() {
			const items = ref<Record<string, any>[]>([]);

			const firstItem = computed<Record<string, any>>(computedItem(firstLang));
			const secondItem = computed<Record<string, any>>(computedItem(secondLang));

			watch(
				() => props.value,
				(newVal, oldVal) => {
					if (newVal.length > 0 && (oldVal === undefined || oldVal.length === 0)) {
						loadItems();
					}
				},
				{ immediate: true }
			);

			function computedItem(val: Ref<string>) {
				return () => {
					const langField = translationsLanguageField.value;

					if (langField === null) return {};

					const existingItem = items.value.find((item) => item[langField] === val.value);
					const editedItem = props.value.find(
						(item) => typeof item === 'object' && item[langField] === val.value
					) as Record<string, any>;
					return editedItem ?? existingItem ?? {};
				};
			}

			async function loadItems() {
				const pkField = translationsPrimaryKeyField.value;

				if (pkField === null) return;

				const response = await api.get(`/items/${translationsCollection.value}`, {
					params: {
						fields: '*',
						filter: {
							[pkField]: {
								_in: props.value,
							},
						},
					},
				});
				items.value = response.data.data;
			}

			function updateValue(edits: Record<string, any>, lang: string) {
				const pkField = translationsPrimaryKeyField.value;
				const langField = translationsLanguageField.value;

				if (pkField === null || langField === null) return;

				let copyValue = cloneDeep(props.value);

				if (pkField in edits === false) {
					const newIndex = copyValue.findIndex((item) => typeof item === 'object' && item[langField] === lang);

					if (newIndex !== -1) {
						copyValue[newIndex] = edits;
					} else {
						copyValue.push({
							...edits,
							[langField]: lang,
						});
					}
				} else {
					copyValue = copyValue.map((item) => {
						if (typeof item === 'number' || typeof item === 'string') {
							if (edits[pkField] === item) {
								return edits;
							} else {
								return item;
							}
						} else {
							if (edits[pkField] === item[pkField]) {
								return edits;
							} else {
								return item;
							}
						}
					});
				}

				emit('input', copyValue);
			}

			return { items, firstItem, updateValue, secondItem };
		}
	},
});
</script>
<style lang="scss" scoped>
.translations {
	display: flex;
	gap: 24px;

	& > div {
		flex: 1;
	}

	.v-form {
		margin-top: 52px;
	}

	:deep(.v-select) {
		.v-input .input {
			background-color: var(--background-normal);
			border: 0px;
		}

		.v-icon {
			margin-left: 6px;
		}
	}

	.secondary {
		:deep(.v-select) {
			.v-input .input {
				color: var(--primary);
				background-color: var(--primary-alt);
				border: 0px;
			}

			.v-icon {
				color: var(--primary);
			}
		}

		:deep(.v-form) {
			.field .label {
				color: var(--primary);
			}
		}
	}
}
</style>
