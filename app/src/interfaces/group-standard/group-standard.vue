<template>
	<div class="group-standard">
		<v-divider
			v-if="showHeader"
			:style="{
				'--v-divider-label-color': headerColor,
			}"
			:inline-title="false"
			large
		>
			<template v-if="headerIcon" #icon><v-icon :name="headerIcon" /></template>
			<template v-if="field.name">
				<span class="title">{{ field.name }}</span>
			</template>
		</v-divider>

		<v-form
			:initial-values="initialValues"
			:fields="fields"
			:model-value="values"
			:primary-key="primaryKey"
			:group="field.meta.id"
			:validation-errors="validationErrors"
			:loading="loading"
			:batch-mode="batchMode"
			@update:model-value="$emit('apply', $event)"
		/>
	</div>
</template>

<script lang="ts">
import { Field } from '@directus/shared/types';
import { defineComponent, PropType } from 'vue';
import { ValidationError } from '@directus/shared/types';

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

		showHeader: {
			type: Boolean,
			default: false,
		},
		headerIcon: {
			type: String,
			default: null,
		},
		headerColor: {
			type: String,
			default: null,
		},
	},
	emits: ['apply'],
});
</script>

<style scoped>
.v-divider {
	margin-bottom: calc(var(--form-vertical-gap) / 2);
}
</style>
