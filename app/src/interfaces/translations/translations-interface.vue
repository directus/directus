<template>
	<div class="translations">
		<div class="primary">
			<v-select
				:model-value="firstValue"
				item-text="code"
				item-value="code"
				:filled="true"
				:items="languages"
				@update:modelValue="firstValue = $event"
			>
				<template #prepend>
					<v-icon class="translate" name="translate" />
				</template>
				<template #append>
					<v-icon
						v-tooltip="t('interfaces.translations.multilang')"
						:name="sideBySide ? 'remove' : 'add'"
						@click.stop="sideBySide = !sideBySide"
					/>
				</template>
			</v-select>
			<v-form :fields="fields" :color="'primary'" :badge="firstValue" />
		</div>
		<div v-if="sideBySide" class="secondary">
			<v-select
				:model-value="secondValue"
				item-text="code"
				item-value="code"
				:filled="true"
				:items="languages"
				@update:modelValue="secondValue = $event"
			>
				<template #prepend>
					<v-icon class="translate" name="translate" />
				</template>
			</v-select>
			<v-form :fields="fields" :badge="secondValue" />
		</div>
	</div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, toRefs, watch } from 'vue';
import useCollection from '@/composables/use-collection';
import { useFieldsStore, useRelationsStore } from '@/stores/';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import { Relation } from '@/types';
import { unexpectedError } from '@/utils/unexpected-error';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';

export default defineComponent({
	name: 'ITranslations',
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
	setup(props) {
		const { collection } = toRefs(props);
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();
		const { t } = useI18n();

		let sideBySide = ref(false);
		const { info: collectionInfo } = useCollection(collection);
		let firstValue = ref('en-US');
		let secondValue = ref('en-US');

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

		const { languages, loading: languagesLoading, template: internalLanguageTemplate } = useLanguages();

		const fields = computed(() => {
			if (translationsCollection.value === null) return [];
			return fieldsStore.getFieldsForCollection(translationsCollection.value);
		});

		return {
			collectionInfo,
			sideBySide,
			firstValue,
			secondValue,
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
				if (!languagesCollection.value || !languagesPrimaryKeyField.value) return;

				const fields = getFieldsFromTemplate(template.value);

				if (fields.includes(languagesPrimaryKeyField.value) === false) {
					fields.push(languagesPrimaryKeyField.value);
				}

				loading.value = true;

				try {
					const response = await api.get(`/items/${languagesCollection.value}`, { params: { fields, limit: -1 } });
					languages.value = response.data.data;
				} catch (err: any) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}
	},
});
</script>
<style lang="scss" scoped>
.translations {
	display: flex;
	gap: 12px;

	& > div {
		flex: 1;
	}

	.primary :deep(.v-chip) {
		color: var(--primary);
		background-color: var(--primary-alt);
		border: 0px;
	}

	.secondary :deep(.v-chip) {
		color: var(--blue);
		background-color: var(--blue-alt);
		border: 0px;
	}
}
</style>
