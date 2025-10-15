<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { useI18n } from 'vue-i18n';
import SetupForm from './form.vue';

import { computed, ref, unref } from 'vue';
import { validateItem } from '@/utils/validate-item';
import { Form, initialValues, useFormFields } from './form';
import api from '@/api';
import { login } from '@/auth';
import { useRouter } from 'vue-router';
import { translateAPIError } from '@/lang';

const { t } = useI18n();

useHead({
	title: t('setup_project'),
});

const form = ref<Form>(initialValues)
const router = useRouter()

const fields = useFormFields(true, form)
const errors = ref<Record<string, any>[]>([])
const error = ref<any>(null)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function launch() {
	errors.value = validateItem(form.value, unref(fields), true)

	if (!emailRegex.test(form.value.email ?? '')) {
		errors.value.push({
			"field": "email",
			"path": [],
			"type": "email",
		})
	}

	if (form.value.password !== form.value.password_confirm) {
		errors.value.push({
			"field": "password_confirm",
			"path": [],
			"type": "confirm_password",
		})
	}

	try {
		await api.post('server/setup', form.value)

		await login({
			credentials: {
				email: form.value.email!,
				password: form.value.password!,
			}
		})

		router.push('/content')
	} catch (err: any) {
		error.value = err
	}


}

const errorMessage = computed(() => {
	return error.value?.response?.data?.errors?.[0]?.message ||
		error.value?.message ||
		t('unexpected_error');
})

const formComplete = computed(() => {
	return (['first_name', 'last_name', 'email', 'password', 'password_confirm', 'license'] as const).every((key) => {
		return Boolean(form.value?.[key]);
	});
});

</script>

<template>
	<div class="main">
		<setup-form v-model="form" :errors="errors"></setup-form>
		<v-button full-width :disabled="!formComplete" @click="launch()"><v-icon name="rocket_launch" />{{
			t('setup_launch') }}</v-button>

		<v-notice v-if="error" type="danger">
			<p class="error-code">
				{{ translateAPIError(error) }}
			</p>
			<p>
				{{ errorMessage }}
			</p>
		</v-notice>
	</div>
</template>

<style lang="scss" scoped>
.main {
	padding-block: 100px;
	margin: 0 auto;
	align-items: center;
	inline-size: 540px;
	max-inline-size: 90%;
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
