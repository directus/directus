<template>
	<v-notice v-if="collection === null" class="full" type="warning">
		{{ t('interfaces.translations.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field half">
			<p class="type-label">{{ t('language_display_template') }}</p>
			<v-field-template
				v-model="languageTemplate"
				:collection="languageCollection"
				:depth="2"
				:placeholder="
					languageCollectionInfo && languageCollectionInfo.meta && languageCollectionInfo.meta.display_template
				"
			/>
		</div>

		<div class="field half">
			<p class="type-label">{{ t('translations_display_template') }}</p>
			<v-field-template
				v-model="translationsTemplate"
				:collection="translationsCollection"
				:depth="2"
				:placeholder="
					translationsCollectionInfo &&
					translationsCollectionInfo.meta &&
					translationsCollectionInfo.meta.display_template
				"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { Relation } from '@/types';
import { Field } from '@directus/shared/types';
import { defineComponent, PropType, computed } from 'vue';
import { useCollectionsStore } from '@/stores/';

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
			type: Object as PropType<any>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const collectionsStore = useCollectionsStore();

		const translationsTemplate = computed({
			get() {
				return props.value?.translationsTemplate;
			},
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					translationsTemplate: newTemplate,
				});
			},
		});

		const languageTemplate = computed({
			get() {
				return props.value?.languageTemplate;
			},
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					languageTemplate: newTemplate,
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

		const translationsCollection = computed(() => translationsRelation.value?.collection ?? null);
		const languageCollection = computed(() => languageRelation.value?.related_collection ?? null);

		const translationsCollectionInfo = computed(() => {
			if (!translationsCollection.value) return null;
			return collectionsStore.getCollection(translationsCollection.value);
		});

		const languageCollectionInfo = computed(() => {
			if (!languageCollection.value) return null;
			return collectionsStore.getCollection(languageCollection.value);
		});

		return {
			t,
			languageTemplate,
			translationsTemplate,
			translationsCollection,
			translationsCollectionInfo,
			languageCollection,
			languageCollectionInfo,
		};
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form-grid {
	@include form-grid;
}
</style>
