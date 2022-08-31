<template>
	<div class="group-raw">
		<v-form
			:initial-values="initialValues"
			:fields="fields"
			:model-value="values"
			:primary-key="primaryKey"
			:group="field.meta.field"
			:validation-errors="validationErrors"
			:loading="loading"
			:disabled="disabled"
			:badge="badge"
			:raw-editor-enabled="rawEditorEnabled"
			:direction="direction"
			nested
			@update:model-value="$emit('apply', $event)"
		/>
	</div>
</template>

<script lang="ts">
import { Field, ValidationError } from '@directus/shared/types';
import { defineComponent, PropType } from 'vue';
export default defineComponent({
	name: 'InterfaceGroupRaw',
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
		badge: {
			type: String,
			default: null,
		},
		rawEditorEnabled: {
			type: Boolean,
			default: false,
		},
		direction: {
			type: String,
			default: undefined,
		},
	},
	emits: ['apply'],
});
</script>
