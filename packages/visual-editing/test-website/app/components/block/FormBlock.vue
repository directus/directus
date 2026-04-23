<script setup lang="ts">
import { setAttr } from '@directus/visual-editing';

interface CustomFormData {
	id: string;
	tagline: string | null;
	headline: string | null;
	form: CustomForm;
}

interface CustomForm {
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

defineProps<{ data: CustomFormData }>();
</script>

<template>
	<section v-if="data.form" class="mx-auto">
		<div
			v-if="data.tagline || data.headline"
			:data-directus="
				setAttr({ collection: 'block_form', item: data.id, fields: ['tagline', 'headline'], mode: 'popover' })
			"
		>
			<Tagline v-if="data.tagline" :tagline="data.tagline" />
			<Headline v-if="data.headline" :headline="data.headline" />
		</div>

		<FormBuilder :form="data.form" class="mt-8" :data-directus="setAttr({ collection: 'forms', item: data.form.id })" />
	</section>
</template>
