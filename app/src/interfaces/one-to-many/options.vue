<template>
	<v-notice type="warning" v-if="relatedCollection === null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field full">
			<p class="type-label">{{ $t('select_fields') }}</p>
			<v-field-select
				:collection="relatedCollection"
				v-model="fields"
				:inject="relatedCollectionExists ? null : { fields: newFields, collections: newCollections, relations }"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { Field, Relation, Collection } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';
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
		newCollections: {
			type: Array as PropType<Collection[]>,
			default: () => [],
		},
		newFields: {
			type: Array as PropType<Field[]>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const collectionsStore = useCollectionsStore();

		const fields = computed({
			get() {
				return props.value?.fields;
			},
			set(newFields: string) {
				emit('input', {
					...(props.value || {}),
					fields: newFields,
				});
			},
		});

		const relatedCollection = computed(() => {
			if (!props.fieldData || !props.relations || props.relations.length === 0) return null;
			const { field } = props.fieldData;
			const relatedRelation = props.relations.find(
				(relation) => relation.one_collection === props.collection && relation.one_field === field
			);
			return relatedRelation?.many_collection || null;
		});

		const relatedCollectionExists = computed(() => {
			return !!collectionsStore.state.collections.find(
				(collection) => collection.collection === relatedCollection.value
			);
		});

		return { fields, relatedCollection, relatedCollectionExists };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid.scss';

.form-grid {
	@include form-grid;
}
</style>
