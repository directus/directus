<script setup lang="ts">
import { SetupForm as Form } from '@directus/types';
import { useHead } from '@unhead/vue';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { defaultValues, FormValidator, useFormFields, validate, ValidationError } from './form';
import SetupForm from './form.vue';
import api from '@/api';
import { login } from '@/auth';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import { translateAPIError } from '@/lang';
import LicenseKeyInput from '@/modules/licensing/components/license-key-input.vue';
import { useServerStore } from '@/stores/server';
import PublicView from '@/views/public';

const { t } = useI18n();
const { info } = storeToRefs(useServerStore());

useHead({
	title: t('setup_project'),
});

const step = ref<1 | 2>(1);
const form = ref<Form>(defaultValues);
const router = useRouter();

const fields = useFormFields(true, form);
const errors = ref<ValidationError[]>([]);
const error = ref<any>(null);
const isSaving = ref(false);
const showLicenseKeyField = computed(() => info.value.show_license_key_field ?? true);

const formStep1Complete = computed(() => FormValidator.safeParse({ ...form.value, license_key: null }).success);

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

function goToStep2() {
	errors.value = validate(form.value, fields, true);

	if (errors.value.length > 0) return;

	if (!showLicenseKeyField.value) {
		void launch();
		return;
	}

	step.value = 2;
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
	<PublicView wide>
		<template v-if="step === 1">
			<SetupForm v-model="form" :errors="errors" utm-location="onboarding"></SetupForm>

			<VNotice v-if="error" type="danger">
				<p class="error-code">
					{{ translateAPIError(error) }}
				</p>
				<p>
					{{ errorMessage }}
				</p>
			</VNotice>

			<VButton full-width :disabled="!formStep1Complete" :loading="isSaving" @click="goToStep2()">
				<VIcon :name="showLicenseKeyField ? 'arrow_forward' : 'rocket_launch'" />
				{{ showLicenseKeyField ? $t('setup_continue') : $t('setup_launch') }}
			</VButton>
		</template>

		<template v-else>
			<div class="license-step">
				<h1>{{ $t('setup_welcome') }}</h1>
				<p>{{ $t('setup_license_key_info') }}</p>

				<LicenseKeyInput v-model="form.license_key" :utm-term="info.version" utm-content="onboarding" />
			</div>

			<VNotice v-if="error" type="danger">
				<p class="error-code">{{ translateAPIError(error) }}</p>
				<p>{{ errorMessage }}</p>
			</VNotice>

			<div class="step2-actions">
				<VButton secondary @click="step = 1">
					{{ $t('back') }}
				</VButton>

				<VButton :disabled="!formComplete" :loading="isSaving" @click="launch()">
					<VIcon name="rocket_launch" />
					{{ $t('setup_launch') }}
				</VButton>
			</div>
		</template>
	</PublicView>
</template>

<style scoped>
.setup-form {
	margin-block-start: 5.625rem;
}

.v-button:not(.secondary) {
	margin-block-start: 1.8125rem;

	.v-icon {
		margin-inline-end: 0.6875rem;
	}
}

.v-notice {
	margin-block-start: 1.375rem;
}

.error-code {
	font-weight: 700;
	margin-block-end: 0.25rem;
}

.license-step {
	display: grid;
	gap: 0.75rem;
	margin-block-start: 0.5rem;
}

.license-step h1 {
	font-size: 2rem;
	font-weight: 600;
	line-height: 2.5rem;
	margin: 0;
}

.license-step p {
	color: var(--theme--foreground-subdued);
	font-size: 0.9375rem;
	line-height: 1.375rem;
	margin: 0;
}

.step2-actions {
	display: flex;
	gap: 0.75rem;
	margin-block-start: 2rem;

	.v-button {
		flex: 1;
		margin-block-start: 0;
	}
}
</style>
