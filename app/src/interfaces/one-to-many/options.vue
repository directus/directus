<template>
	<v-notice type="warning" v-if="collection == null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<div v-else class="grid">
		<div class="full">
			<p class="type-label">{{ $t('select_fields') }}</p>
			<v-field-select :collection="collection" v-model="fields"></v-field-select>
		</div>
	</div>
</template>

<script lang="ts">
import { Field, Relation } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { useRelationsStore } from '@/stores/';

export default defineComponent({
	props: {
		fieldData: {
			type: Object as PropType<Field>,
			default: null,
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
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					fields: newTemplate,
				});
			},
		});

		const collection = computed(() => {
			const collection = props.fieldData.meta?.collection;
			const field = props.fieldData.field;

			if (collection == null || field == null) return null;

			const relationData: Relation[] = relationsStore.getRelationsForField(collection, field);

			return relationData.find((r) => r.one_collection === collection && r.one_field === field)?.many_collection;
		});

		return { fields, collection };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid.scss';

.grid {
	@include form-grid;
}
</style>
