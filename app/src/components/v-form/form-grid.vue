<template>
	<div class="form-grid" ref="el" :class="gridClass">
		<template v-for="(field, index) in fields.filter((field) => isNil(field.meta?.group))">
			<component
				v-if="field.meta?.special?.includes('group')"
				:class="field.meta?.width || 'full'"
				:is="`interface-${field.meta?.interface || 'group-raw'}`"
				:key="field.field"
				:field="field"
				:fields="field.children"
				:values="values || {}"
				:initial-values="initialValues || {}"
				:disabled="disabled"
				:batch-mode="batchMode"
				:batch-active-fields="batchActiveFields"
				:primary-key="primaryKey"
				:loading="loading"
				:validation-errors="validationErrors"
				@input="$emit('apply', $event)"
			/>

			<form-field
				v-else
				:key="field.field"
				:field="field"
				:autofocus="index === firstEditableFieldIndex && autofocus"
				:model-value="(values || {})[field.field]"
				:initial-value="(initialValues || {})[field.field]"
				:disabled="disabled"
				:batch-mode="batchMode"
				:batch-active="batchActiveFields.includes(field.field)"
				:primary-key="primaryKey"
				:loading="loading"
				:validation-error="validationErrors.find((err) => err.field === field.field)"
				@update:model-value="$emit('apply', { [field.field]: $event })"
				@unset="$emit('unset', $event)"
				@toggle-batch="$emit('toggle-batch', field)"
			/>
		</template>
	</div>
</template>

<script lang="ts">
import { Field } from '@/types';
import { computed, defineComponent, PropType, ref } from 'vue';
import { ValidationError } from '@/types';
import { isNil } from 'lodash';
import FormField from './form-field.vue';
import { useElementSize } from '@/composables/use-element-size';

export default defineComponent({
	name: 'form-grid',
	components: { FormField },
	props: {
		fields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		values: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		initialValues: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		batchActiveFields: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		validationErrors: {
			type: Array as PropType<ValidationError[]>,
			default: () => [],
		},
		autofocus: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const el = ref<Element>();

		const firstEditableFieldIndex = computed(() => {
			for (let i = 0; i < props.fields.length; i++) {
				if (props.fields[i].meta && !props.fields[i].meta?.readonly) {
					return i;
				}
			}
			return null;
		});

		const { width } = useElementSize(el);

		const gridClass = computed<string | null>(() => {
			if (el.value === null) return null;

			if (width.value > 792) {
				return 'grid with-fill';
			} else {
				return 'grid';
			}
		});

		return { firstEditableFieldIndex, isNil, el, gridClass };
	},
});
</script>

<style scoped lang="scss">
@import '@/styles/mixins/form-grid';

.form-grid {
	@include form-grid;

	outline: 2px solid var(--primary);
}
</style>
