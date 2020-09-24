<template>
	<v-notice type="warning" v-if="relatedCollection === null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<div v-else class="grid">
		<div class="full">
			<p class="type-label">{{ $t('select_fields') }}</p>
			<v-field-select :collection="relatedCollection" v-model="fields" />
		</div>
	</div>
</template>

<script lang="ts">
import { Field, Relation } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { useRelationsStore } from '@/stores/';

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
		const relationsStore = useRelationsStore();

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

		return { fields, relatedCollection };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid.scss';

.grid {
	@include form-grid;
}
</style>
