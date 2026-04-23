<script setup lang="ts">
import { computed, ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { buildZodSchema } from '~/lib/zodSchemaBuilder';
import type { FormField as FormFieldType } from '@@/shared/types/schema';
import FormField from './BaseFormField.vue';
import BaseButton from '../base/BaseButton.vue';

interface Props {
	fields: FormFieldType[];
	onSubmit: (data: Record<string, any>) => Promise<void> | void;
	submitLabel: string;
}

const props = defineProps<Props>();
const isSubmitting = ref(false);

const sortedFields = computed(() => {
	return [...props.fields].sort((a, b) => (a.sort || 0) - (b.sort || 0));
});

const validFields = computed(() =>
	sortedFields.value.filter(
		(field): field is FormFieldType & { name: string } => field.name != null && field.name !== '',
	),
);

const schema = computed(() => {
	if (!validFields.value.length) return null;
	try {
		const zodSchema = buildZodSchema(validFields.value);
		return toTypedSchema(zodSchema);
	} catch {
		return null;
	}
});

const initialValues = computed(() => {
	if (!validFields.value.length) return {};

	return validFields.value.reduce(
		(defaults, field) => {
			const name = field.name;

			switch (field.type) {
				case 'checkbox':
					defaults[name] = false;
					break;
				case 'checkbox_group':
					defaults[name] = [];
					break;
				case 'select':
				case 'radio':
					defaults[name] = '';
					break;
				case 'file':
					defaults[name] = null;
					break;
				case 'textarea':
				case 'text':
				default:
					defaults[name] = '';
			}

			return defaults;
		},
		{} as Record<string, any>,
	);
});

const { handleSubmit, values } = useForm({
	validationSchema: schema,
	initialValues: initialValues.value,
});

const onSubmitForm = handleSubmit(async (formValues) => {
	if (isSubmitting.value) return;

	try {
		isSubmitting.value = true;
		await props.onSubmit(formValues);
	} finally {
		isSubmitting.value = false;
	}
});
</script>

<template>
	<form v-if="schema" :validation-schema="schema" :initial-values="initialValues" @submit.prevent="onSubmitForm">
		<div class="flex flex-wrap gap-4">
			<FormField v-for="field in validFields" :key="field.id" :field="field" :model-value="values[field.name]" />
			<div class="w-full">
				<BaseButton
					:id="`submit-${submitLabel.replace(/\s+/g, '-').toLowerCase()}`"
					type="submit"
					:label="submitLabel"
					:disabled="isSubmitting"
					icon="arrow"
					icon-position="right"
				/>
			</div>
		</div>
	</form>
</template>
