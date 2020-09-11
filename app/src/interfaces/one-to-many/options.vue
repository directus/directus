<template>
	<v-notice type="warning" v-if="collection == null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<div v-else>
		<p class="type-label">{{ $t('select_fields') }}</p>
		<v-field-select :collection="collection" v-model="fields"></v-field-select>
	</div>
</template>

<script lang="ts">
import { Field } from '@/types';
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
			if (props.fieldData.field == null || props.fieldData.meta?.collection == null) return null;
			const relationData = relationsStore.getRelationsForField(
				props.fieldData.meta.collection,
				props.fieldData.field
			)?.[0];
			return relationData.many_collection;
		});

		return { fields, collection };
	},
});
</script>

<style lang="scss" scoped>
.type-label {
	margin-bottom: 4px;
}
</style>
