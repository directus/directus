<template>
	<v-item>
		<div class="label">{{ field.field }}</div>
		<v-form
			:initial-values="initialValues"
			:fields="fieldsInSection"
			:model-value="values"
			:primary-key="primaryKey"
			:group="group"
			:validation-errors="validationErrors"
			:loading="loading"
			:batch-mode="batchMode"
			@update:model-value="$emit('apply', $event)"
		/>
	</v-item>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { merge } from 'lodash';
import { Field } from '@directus/shared/types';
import { ValidationError } from '@directus/shared/types';

export default defineComponent({
	name: 'AccordionSection',
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
		group: {
			type: Number,
			required: true,
		},
	},
	emits: ['apply'],
	setup(props) {
		const fieldsInSection = computed(() => {
			return props.fields
				.filter((field) => {
					if (field.meta?.group === props.group && field.meta?.id !== props.field.meta?.id) return false;
					return true;
				})
				.map((field) => {
					if (field.meta?.id === props.field.meta?.id) {
						return merge({}, field, {
							hideLabel: true,
						});
					}

					return field;
				});
		});

		return { fieldsInSection };
	},
});
</script>

<style scoped>
.label {
	margin-top: 40px;
	margin-bottom: 8px;
	font-size: 40px;
}
</style>
