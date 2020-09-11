<template>
	<v-notice type="warning" v-if="fieldData.meta.collection == null">
		{{ $t('interfaces.one-to-many.no_collection') }}
	</v-notice>
	<div v-else>
		<p class="type-label">{{ $t('select_fields') }}</p>
		<v-field-select :collection="fieldData.meta.collection" v-model="fields"></v-field-select>
	</div>
</template>

<script lang="ts">
import { Field } from '@/types';
import { defineComponent, PropType, computed } from '@vue/composition-api';

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
		return { fields };
	},
});
</script>

<style lang="scss" scoped>
.type-label {
	margin-bottom: 4px;
}
</style>
