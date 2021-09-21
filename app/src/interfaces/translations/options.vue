<template>
	<v-notice v-if="collection === null" class="full" type="warning">
		{{ t('interfaces.translations.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field half">
			<p class="type-label">{{ t('interfaces.translations.language_field') }}</p>
			<v-select v-model="languageField" :items="languageCollectionFields" item-text="name" item-value="field" />
		</div>
		<div class="field half">
			<p class="type-label">{{ t('interfaces.translations.default_language') }}</p>
			<v-select
				v-model="defaultLanguage"
				show-deselect
				:items="languages"
				:item-text="languageField ?? langCode.field"
				:item-value="langCode.field"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { Field, Relation } from '@directus/shared/types';
import { defineComponent, PropType, computed, ref, watch } from 'vue';
import { useFieldsStore } from '@/stores/';
import api from '@/api';
import { useCollection } from '@directus/shared/composables';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		fieldData: {
			type: Object as PropType<Field>,
			default: null,
		},
		relations: {
			type: Array as PropType<Relation[]>,
			default: () => [],
		},
		value: {
			type: Object as PropType<Record<string, any>>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const languageField = computed({
			get() {
				return props.value?.languageField;
			},
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					languageField: newTemplate,
				});
			},
		});

		const defaultLanguage = computed({
			get() {
				return props.value?.defaultLanguage;
			},
			set(newValue: string) {
				emit('input', {
					...(props.value || {}),
					defaultLanguage: newValue,
				});
			},
		});

		const translationsRelation = computed(() => {
			if (!props.fieldData || !props.relations || props.relations.length === 0) return null;
			const { field } = props.fieldData;
			return (
				props.relations.find(
					(relation) => relation.related_collection === props.collection && relation.meta?.one_field === field
				) ?? null
			);
		});

		const languageRelation = computed(() => {
			if (!props.fieldData || !props.relations || props.relations.length === 0) return null;
			if (!translationsRelation.value) return null;
			return (
				props.relations.find(
					(relation) =>
						relation.collection === translationsRelation.value?.collection &&
						relation.meta?.junction_field === translationsRelation.value?.field
				) ?? null
			);
		});

		const languageCollection = computed(() => languageRelation.value?.related_collection ?? null);

		const { fields: languageCollectionFields, primaryKeyField: langCode } = useCollection(languageCollection);

		const languages = ref<Record<string, any>[]>([]);

		watch(
			languageCollection,
			async (newCollection) => {
				const response = await api.get(`items/${newCollection}`, {
					params: {
						limit: -1,
					},
				});
				languages.value = response.data.data;
			},
			{ immediate: true }
		);

		return {
			t,
			languageField,
			languageCollection,
			languageCollectionFields,
			defaultLanguage,
			languages,
			langCode,
		};
	},
});
</script>
