<template>
	<v-notice type="warning" v-if="collection === null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<div v-else class="form-grid">
		<div class="field full">
			<p class="type-label">{{ $t('display_template') }}</p>
			<v-field-template :collection="relatedCollection" v-model="template" :depth="2" />
		</div>
	</div>
</template>

<script lang="ts">
import { Field } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { useRelationsStore } from '@/stores/';
import { Relation } from '@/types/relations';

export default defineComponent({
	props: {
		value: {
			type: Object as PropType<any | null>,
			default: null,
		},
		fieldData: {
			type: Object as PropType<Field>,
			default: null,
		},
		relations: {
			type: Array as PropType<Relation[]>,
			default: () => [],
		},
		collection: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();
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
			const m2o = props.relations.find(
				(relation) => relation.many_collection === props.collection && relation.many_field === field
			);
			const o2m = props.relations.find(
				(relation) => relation.one_collection === props.collection && relation.one_field === field
			);

			if (m2o !== undefined) {
				return m2o?.one_collection || null;
			}

			if (o2m !== undefined) {
				return o2m?.many_collection || null;
			}

			return null;
		});

		return { template, relatedCollection };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form-grid {
	@include form-grid;
}
</style>
