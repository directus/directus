<template>
	<div class="group-raw">
		<v-form
			:initial-values="initialValues"
			:fields="fields"
			:model-value="values"
			:primary-key="primaryKey"
			:group="field.meta.id"
			:validation-errors="validationErrors"
			:loading="loading"
			@update:model-value="$emit('apply', $event)"
		/>
	</div>
</template>

<script lang="ts">
import { Field } from '@/types';
import { defineComponent, PropType } from 'vue';
import { ValidationError } from '@/types';

export default defineComponent({
	emits: ['apply'],
	name: 'interface-group-raw',
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
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
	},
});
</script>
