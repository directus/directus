<script setup lang="ts">
import { ref } from 'vue';
import DynamicForm from './DynamicForm.vue';
import type { FormField } from '@@/shared/types/schema';
import { CheckCircle } from 'lucide-vue-next';

interface CustomFormData {
	id: string;
	on_success?: 'redirect' | 'message' | null;
	sort?: number | null;
	submit_label?: string | null;
	success_message?: string | null;
	title?: string | null;
	success_redirect_url?: string | null;
	is_active?: boolean | null;
	fields: FormField[];
}

const props = defineProps<{
	form: CustomFormData;
	className?: string;
}>();

const isSubmitted = ref(false);
const error = ref<string | null>(null);

const handleSubmit = async (data: Record<string, any>) => {
	error.value = null;
	try {
		const fieldsWithNames = props.form.fields.map((field) => ({
			id: field.id,
			name: field.name || '',
			type: field.type || '',
		}));

		const formData = new FormData();
		formData.append('formId', props.form.id);
		formData.append('fields', JSON.stringify(fieldsWithNames));

		for (const key in data) {
			if (data[key] instanceof File) {
				formData.append(key, data[key]);
			} else {
				formData.append(key, data[key]?.toString() || '');
			}
		}

		await $fetch('/api/forms/submit', {
			method: 'POST',
			body: formData,
		});

		if (props.form.on_success === 'redirect' && props.form.success_redirect_url) {
			window.location.href = props.form.success_redirect_url;
		} else {
			isSubmitted.value = true;
		}
	} catch {
		error.value = 'Failed to submit the form. Please try again later.';
	}
};
</script>

<template>
	<div v-if="form.is_active" :class="['space-y-6 border border-input p-8 rounded-lg', className]">
		<div v-if="error" class="p-4 text-red-500 bg-red-100 rounded-md">
			<strong>Error:</strong>
			{{ error }}
		</div>
		<div v-if="isSubmitted" class="flex flex-col items-center justify-center space-y-4 p-6 text-center">
			<CheckCircle className="size-12 text-green-500" />
			<p class="text-gray-600">
				{{ form.success_message || 'Your form has been submitted successfully.' }}
			</p>
		</div>
		<DynamicForm v-else :fields="form.fields" :onSubmit="handleSubmit" :submitLabel="form.submit_label || 'Submit'" />
	</div>
</template>
