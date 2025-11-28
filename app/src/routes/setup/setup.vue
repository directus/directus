<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { useI18n } from 'vue-i18n';
import SetupForm from './form.vue';

import api from '@/api';
import { login } from '@/auth';
import { translateAPIError } from '@/lang';
import { SetupForm as Form } from '@directus/types';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { FormValidator, defaultValues, useFormFields, validate, ValidationError } from './form';
import { watch } from 'vue';

const { t } = useI18n();

useHead({
	title: t('setup_project'),
});

const form = ref<Form>(defaultValues);
const router = useRouter();

const fields = useFormFields(true, form);
const errors = ref<ValidationError[]>([]);
const error = ref<any>(null);
const isSaving = ref(false);

async function launch() {
	errors.value = validate(form.value, fields, true);

	if (errors.value.length > 0) return;

	try {
		isSaving.value = true;
		await api.post('server/setup', form.value);

		await login({
			credentials: {
				email: form.value.project_owner!,
				password: form.value.password!,
			},
		});

		router.push('/content');
	} catch (err: any) {
		error.value = err;
	} finally {
		isSaving.value = false;
	}
}

const errorMessage = computed(() => {
	return error.value?.response?.data?.errors?.[0]?.message || error.value?.message || t('unexpected_error');
});

const formComplete = computed(() => FormValidator.safeParse(form.value).success);

watch(form, () => {
	if (form.value.project_usage !== 'commercial') {
		form.value.org_name = null;
	}
});
</script>

<template>
	<public-view wide>
		<setup-form v-model="form" :errors="errors" utm-location="onboarding"></setup-form>
		<v-button full-width :disabled="!formComplete" :loading="isSaving" @click="launch()">
			<v-icon name="rocket_launch" />
			{{ $t('setup_launch') }}
		</v-button>

		<v-notice v-if="error" type="danger">
			<p class="error-code">
				{{ translateAPIError(error) }}
			</p>
			<p>
				{{ errorMessage }}
			</p>
		</v-notice>
	</public-view>
</template>

<style scoped>
.setup-form {
	margin-block-start: 100px;
}

.v-button {
	margin-block-start: 32px;

	.v-icon {
		margin-inline-end: 12px;
	}
}

.v-notice {
	margin-block-start: 24px;
}

.error-code {
	font-weight: 700;
	margin-block-end: 4px;
}
</style>
