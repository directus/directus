<template>
	<div class="grid">
		<v-notice type="warning" v-if="collection == null">
			{{ $t('interfaces.one-to-many.no_collection') }}
		</v-notice>
		<div v-else class="full">
			<p class="type-label">{{ $t('interfaces.many-to-one.display_template') }}</p>
			<v-field-template :collection="collection" v-model="template" :depth="1"></v-field-template>
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
		const collection = computed(() => {
			if (props.fieldData.field === null || props.fieldData.meta?.collection === undefined) return null;
			const relationData: Relation[] = relationsStore.getRelationsForField(
				props.fieldData.meta?.collection,
				props.fieldData.field
			);

			return relationData[0]?.one_collection;
		});
		return { template, collection };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.grid {
	@include form-grid;
}
</style>
