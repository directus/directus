<template>
	<v-notice v-if="collection === null" class="full" type="warning">
		{{ t('interfaces.translations.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field half">
			<p class="type-label">{{ t('interfaces.translations.language_field') }}</p>
			<v-select v-model="languageField" :items="languageCollectionFields" item-text="name" item-value="field" />
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { Field, Relation } from '@directus/shared/types';
import { defineComponent, PropType, computed } from 'vue';
import { useFieldsStore } from '@/stores/';

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

		const fieldsStore = useFieldsStore();

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

		const languageCollectionFields = computed(() => {
			if (!languageCollection.value) return [];
			return fieldsStore.getFieldsForCollection(languageCollection.value);
		});

		return {
			t,
			languageField,
			languageCollection,
			languageCollectionFields,
		};
	},
});
</script>
