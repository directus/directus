<script setup lang="ts">
import { SetupForm as Form } from '@directus/types';
import { useHead } from '@unhead/vue';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { buildSetupPayload, defaultValues, SetupValidator, useSetupFields, validate, ValidationError } from './form';
import SetupForm from './form.vue';
import LicenseForm from './license.vue';
import api from '@/api';
import { login } from '@/auth';
import VButton from '@/components/v-button.vue';
import VNotice from '@/components/v-notice.vue';
import { translateAPIError } from '@/lang';
import { useServerStore } from '@/stores/server';
import PublicView from '@/views/public';

const { t } = useI18n();

useHead({
	title: t('setup_project'),
});

const { info } = storeToRefs(useServerStore());

const form = ref<Form>(defaultValues);
const licenseFormRef = ref<InstanceType<typeof LicenseForm> | null>(null);
const router = useRouter();

const fields = useSetupFields(true);
const errors = ref<ValidationError[]>([]);
const error = ref<any>(null);
const isSaving = ref(false);
const page = ref<'setup' | 'license'>('setup');

const showAdminStep = computed(() => !info.value.onboarding?.adminInEnv);

const showLicenseStep = computed(() => !info.value.onboarding?.licenseInEnv);

onMounted(() => {
	if (!showAdminStep.value && !showLicenseStep.value) {
		router.replace('/content');
	} else if (!showAdminStep.value && showLicenseStep.value) {
		page.value = 'license';
	}
});

async function launch() {
	if (showAdminStep.value) {
		if (!form.value.license) return;

		errors.value = validate(form.value, fields, true);
		if (errors.value.length > 0) return;
	}

	if (showLicenseStep.value && !licenseFormRef.value?.canProceed) return;

	try {
		isSaving.value = true;
		await api.post('server/setup', buildSetupPayload(form.value, showAdminStep.value));

		if (showAdminStep.value) {
			await login({
				credentials: {
					email: form.value.project_owner!,
					password: form.value.password!,
				},
			});

			router.push('/content');
		} else {
			router.push('/login');
		}
	} catch (err: any) {
		error.value = err;
	} finally {
		isSaving.value = false;
	}
}

const errorMessage = computed(() => {
	return error.value?.response?.data?.errors?.[0]?.message || error.value?.message || t('unexpected_error');
});

const setupComplete = computed(() => SetupValidator.safeParse(form.value).success);
</script>

<template>
	<PublicView wide>
		<h1>{{ $t('setup_welcome') }}</h1>

		<template v-if="page === 'setup' && showAdminStep">
			<p>{{ $t('setup_info') }}</p>
			<SetupForm v-model="form" :errors="errors" utm-location="onboarding"></SetupForm>
			<VButton full-width secondary :disabled="!setupComplete" @click="showLicenseStep ? (page = 'license') : launch()">
				{{ showLicenseStep ? $t('continue') : $t('setup_launch') }}
			</VButton>
		</template>
		<template v-if="page === 'license' && showLicenseStep">
			<I18nT keypath="setup_license_key_notice" tag="p">
				<template #oig>
					<a
						:href="`https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${info.version}&utm_content=onboarding_contact_our_team_link`"
						target="_blank"
					>
						{{ $t('open_innovation_grant') }}
					</a>
				</template>
			</I18nT>

			<LicenseForm ref="licenseFormRef" v-model="form" :errors="errors"></LicenseForm>
			<div class="actions">
				<VButton v-if="showAdminStep" secondary @click="page = 'setup'">
					{{ $t('back') }}
				</VButton>
				<VButton :disabled="!licenseFormRef?.canProceed" :loading="isSaving" @click="launch()">
					{{ $t('setup_launch') }}
				</VButton>
			</div>
		</template>

		<VNotice v-if="error" type="danger">
			<p class="error-code">
				{{ translateAPIError(error) }}
			</p>
			<p>
				{{ errorMessage }}
			</p>
		</VNotice>
	</PublicView>
</template>

<style scoped>
h1 {
	color: var(--theme--foreground-accent);
	font-size: 2.25rem;
	font-weight: 600;
	line-height: 1.1944;

	margin-block: 5.625rem 1.375rem;
}

p {
	font-size: 0.8125rem;
	font-weight: 500;
	line-height: 1.3846;
	margin-block-end: 1.8125rem;
}

.v-button {
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

.actions {
	display: flex;
	justify-content: flex-end;
	gap: 1.8125rem;
}

:deep(p a) {
	color: var(--theme--primary);
	text-decoration: underline;
}
</style>
