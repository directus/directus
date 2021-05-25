<template>
	<v-notice class="full" type="warning" v-if="collection === null">
		{{ $t('interfaces.translations.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field half">
			<p class="type-label">{{ $t('language_display_template') }}</p>
			<v-field-template
				:collection="languageCollection"
				v-model="languageTemplate"
				:depth="2"
				:placeholder="
					languageCollectionInfo && languageCollectionInfo.meta && languageCollectionInfo.meta.display_template
				"
			/>
		</div>

		<div class="field half">
			<p class="type-label">{{ $t('translations_display_template') }}</p>
			<v-field-template
				:collection="translationsCollection"
				v-model="translationsTemplate"
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
import { Field } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Relation } from '@/types/relations';
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
	setup(props, { emit }) {
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
