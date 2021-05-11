<template>
	<v-notice class="full" type="warning" v-if="collection === null">
		{{ $t('interfaces.translations.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field full">
			<p class="type-label">{{ $t('display_template') }}</p>
			<v-field-template
				:collection="relatedCollection"
				v-model="template"
				:depth="2"
				:placeholder="
					relatedCollectionInfo && relatedCollectionInfo.meta && relatedCollectionInfo.meta.display_template
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

		const template = computed({
			get() {
				return props.value?.template;
			},
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					template: newTemplate,
				});
			},
		});

		const relatedCollection = computed(() => {
			if (!props.fieldData || !props.relations || props.relations.length === 0) return null;
			const { field } = props.fieldData;
			const relation = props.relations.find(
				(relation) => relation.one_collection === props.collection && relation.one_field === field
			);
			return relation?.many_collection || null;
		});

		const relatedCollectionInfo = computed(() => {
			if (!relatedCollection.value) return null;
			return collectionsStore.getCollection(relatedCollection.value);
		});

		return { template, relatedCollection, relatedCollectionInfo };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form-grid {
	@include form-grid;
}
</style>
