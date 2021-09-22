<template>
	<div class="translations" :class="{ split: splitViewEnabled }">
		<div class="primary" :class="splitViewEnabled ? 'half' : 'full'">
			<language-select v-model="firstLang" :items="languageOptions">
				<template #append>
					<v-icon
						v-if="splitViewAvailable && !splitViewEnabled"
						v-tooltip="t('interfaces.translations.toggle_split_view')"
						name="flip"
						clickable
						@click.stop="splitView = true"
					/>
				</template>
			</language-select>
			<v-form
				:loading="valuesLoading"
				:fields="fields"
				:model-value="firstItem"
				:initial-values="firstItemInitial"
				:badge="languageOptions.find((lang) => lang.value === firstLang)?.text"
				@update:modelValue="updateValue($event, firstLang)"
			/>
			<v-divider />
		</div>
		<div v-if="splitViewEnabled" class="secondary" :class="splitViewEnabled ? 'half' : 'full'">
			<language-select v-model="secondLang" :items="languageOptions" secondary>
				<template #append>
					<v-icon
						v-tooltip="t('interfaces.translations.toggle_split_view')"
						name="close"
						clickable
						@click.stop="splitView = !splitView"
					/>
				</template>
			</language-select>
			<v-form
				:loading="valuesLoading"
				:initial-values="secondItemInitial"
				:fields="fields"
				:badge="languageOptions.find((lang) => lang.value === secondLang)?.text"
				:model-value="secondItem"
				@update:modelValue="updateValue($event, secondLang)"
			/>
			<v-divider />
		</div>
	</div>
</template>

<script lang="ts">
import LanguageSelect from './language-select.vue';
import { computed, defineComponent, PropType, Ref, ref, toRefs, watch, unref } from 'vue';
import { useFieldsStore, useRelationsStore } from '@/stores/';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import { Relation } from '@directus/shared/types';
import { useCollection } from '@directus/shared/composables';
import { unexpectedError } from '@/utils/unexpected-error';
import { cloneDeep, isEqual, assign } from 'lodash';
import { notEmpty } from '@/utils/is-empty';
import { useWindowSize } from '@/composables/use-window-size';

export default defineComponent({
	components: { LanguageSelect },
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
			type: [Number, String],
			required: true,
		},
		languageField: {
			type: String,
			default: null,
		},
		value: {
			type: Array as PropType<(string | number | Record<string, any>)[] | null>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { collection } = toRefs(props);
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();
		const { t } = useI18n();

		const { width } = useWindowSize();

		const splitView = ref(false);
		const firstLang = ref<string | number>();
		const secondLang = ref<string | number>();

		const { info: collectionInfo } = useCollection(collection);

		watch(splitView, (splitViewEnabled) => {
			const lang = languageOptions.value;

			if (splitViewEnabled && secondLang.value === firstLang.value) {
				secondLang.value = lang[0].value === firstLang.value ? lang[1].value : lang[0].value;
			}
		});

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

		const { languageOptions, loading: languagesLoading } = useLanguages();
		const {
			items,
			firstItem,
			loading: valuesLoading,
			updateValue,
			secondItem,
			firstItemInitial,
			secondItemInitial,
		} = useEdits();

		const fields = computed(() => {
			if (translationsCollection.value === null) return [];
			return fieldsStore.getFieldsForCollection(translationsCollection.value);
		});

		const splitViewAvailable = computed(() => {
			return width.value > 960 && languageOptions.value.length > 1;
		});

		const splitViewEnabled = computed(() => {
			return splitViewAvailable.value && splitView.value;
		});

		return {
			collectionInfo,
			splitView,
			firstLang,
			secondLang,
			t,
			languageOptions,
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
			firstItemInitial,
			secondItemInitial,
			splitViewAvailable,
			splitViewEnabled,
			languagesLoading,
			valuesLoading,
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

			const languageOptions = computed(() => {
				const langField = translationsLanguageField.value;

				if (langField === null) return [];

				const writableFields = fields.value.filter(
					(field) => field.type !== 'alias' && field.meta?.hidden === false && field.meta.readonly === false
				);

				const totalFields = writableFields.length;

				return languages.value.map((language) => {
					if (languagesPrimaryKeyField.value === null) return language;

					const langCode = language[languagesPrimaryKeyField.value];

					const initialValue = items.value.find((item) => item[langField] === langCode) ?? {};

					const edits = props.value?.find((val) => typeof val === 'object' && val[langField] === langCode) as
						| Record<string, any>
						| undefined;

					const item = { ...initialValue, ...(edits ?? {}) };

					const filledFields = writableFields.filter((field) => {
						return field.field in item && notEmpty(item[field.field]);
					}).length;

					return {
						text: language[props.languageField ?? languagesPrimaryKeyField.value],
						value: langCode,
						edited: edits !== undefined,
						progress: (filledFields / totalFields) * 100,
						max: totalFields,
						current: filledFields,
					};
				});
			});

			return { languageOptions, loading, error };

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
						params: {
							fields: Array.from(fields),
							limit: -1,
							sort: props.languageField ?? languagesPrimaryKeyField.value,
						},
					});

					languages.value = response.data.data;

					if (!firstLang.value) {
						firstLang.value = response.data.data?.[0]?.[languagesPrimaryKeyField.value];
					}

					if (!secondLang.value) {
						secondLang.value = response.data.data?.[1]?.[languagesPrimaryKeyField.value];
					}
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function useEdits() {
			const items = ref<Record<string, any>[]>([]);
			const loading = ref(false);
			const error = ref(null);

			const firstItem = computed(() => getEditedValue(firstLang));
			const secondItem = computed(() => getEditedValue(secondLang));

			const firstItemInitial = computed<Record<string, any>>(() => getExistingValue(firstLang));
			const secondItemInitial = computed<Record<string, any>>(() => getExistingValue(secondLang));

			watch(
				() => props.value,
				(newVal, oldVal) => {
					if (
						newVal &&
						newVal !== oldVal &&
						newVal?.every((item) => typeof item === 'string' || typeof item === 'number')
					) {
						loadItems();
					}

					if (newVal === null || newVal.length === 0) {
						items.value = [];
					}
				},
				{ immediate: true }
			);

			const value = computed(() => {
				const pkField = translationsPrimaryKeyField.value;

				if (pkField === null) return [];

				const value = [...items.value.map((item) => item[pkField])] as (number | string | Record<string, any>)[];

				props.value?.forEach((val) => {
					if (typeof val !== 'object') return;
					if (pkField in val) {
						const index = value.findIndex((v) => v === val[pkField]);
						value[index] = val;
					} else {
						value.push(val);
					}
				});

				return value;
			});

			return { items, firstItem, updateValue, secondItem, firstItemInitial, secondItemInitial, loading, error };

			function getExistingValue(langRef: string | number | undefined | Ref<string | number | undefined>) {
				const lang = unref(langRef);

				const langField = translationsLanguageField.value;
				if (langField === null) return {};

				return (items.value.find((item) => item[langField] === lang) as Record<string, any>) ?? {};
			}

			function getEditedValue(langRef: string | number | undefined | Ref<string | number | undefined>) {
				const lang = unref(langRef);

				const langField = translationsLanguageField.value;
				if (langField === null) return {};

				return (
					(props.value?.find((item) => typeof item === 'object' && item[langField] === lang) as Record<string, any>) ??
					{}
				);
			}

			async function loadItems() {
				if (!translationsRelation.value?.field || props.primaryKey === '+') return;

				loading.value = true;

				try {
					const response = await api.get(`/items/${translationsCollection.value}`, {
						params: {
							fields: '*',
							limit: -1,
							filter: {
								[translationsRelation.value.field]: {
									_eq: props.primaryKey,
								},
							},
						},
					});

					items.value = response.data.data;
				} catch (err) {
					error.value = err;
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}

			function updateValue(edits: Record<string, any>, lang: string) {
				const pkField = translationsPrimaryKeyField.value;
				const langField = translationsLanguageField.value;

				const existing = getExistingValue(lang);

				const values = assign({}, existing, edits);

				if (pkField === null || langField === null) return;

				let copyValue = cloneDeep(value.value ?? []);

				if (pkField in values === false) {
					const newIndex = copyValue.findIndex((item) => typeof item === 'object' && item[langField] === lang);

					if (newIndex !== -1) {
						if (Object.keys(values).length === 1 && langField in values) {
							copyValue.splice(newIndex, 1);
						} else {
							copyValue[newIndex] = values;
						}
					} else {
						copyValue.push({
							...values,
							[langField]: lang,
						});
					}
				} else {
					const initialValues = items.value.find((item) => item[langField] === lang);

					copyValue = copyValue.map((item) => {
						if (typeof item === 'number' || typeof item === 'string') {
							if (values[pkField] === item) {
								return values;
							} else {
								return item;
							}
						} else {
							if (values[pkField] === item[pkField]) {
								if (isEqual(initialValues, { ...initialValues, ...values })) {
									return values[pkField];
								} else {
									return values;
								}
							} else {
								return item;
							}
						}
					});
				}

				emit('input', copyValue);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.translations {
	@include form-grid;

	.v-form {
		--form-vertical-gap: 32px;
		--v-chip-color: var(--primary);
		--v-chip-background-color: var(--primary-alt);

		margin-top: 32px;
	}

	.v-divider {
		margin-top: var(--form-vertical-gap);
	}

	.primary {
		--v-divider-color: var(--primary-50);
	}

	.secondary {
		--v-divider-color: var(--blue-50);

		.v-form {
			--primary: var(--blue);
			--v-chip-color: var(--blue);
			--v-chip-background-color: var(--blue-alt);
		}
	}
}
</style>
