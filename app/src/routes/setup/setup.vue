<script setup lang="ts">
import { DIRECTUS_SUPPORT_URL } from '@directus/constants';
import { SetupForm as Form } from '@directus/types';
import { useHead } from '@unhead/vue';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { buildSetupPayload, defaultValues, SetupValidator, useSetupFields, validate, ValidationError } from './form';
import SetupForm from './form.vue';
import LicenseForm from './license.vue';
import api from '@/api';
import { login } from '@/auth';
import VButton from '@/components/v-button.vue';
import VNotice from '@/components/v-notice.vue';
import { useServerStore } from '@/stores/server';
import { getDirectusUrlWithUtm } from '@/utils/directus-url';
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

watch(
	form,
	() => {
		// Clear error on any form change
		error.value = null;
	},
	{ deep: true },
);

const showAdminStep = computed(() => !info.value.setupCompleted);

const showLicenseStep = computed(() => info.value.setup?.license_complete === false);

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

		errors.value = validate(
			{
				first_name: form.value.admin.first_name,
				last_name: form.value.admin.last_name,
				project_owner: form.value.admin.email,
				password: form.value.admin.password,
				password_confirm: form.value.password_confirm,
			},
			fields,
			true,
		);

		if (errors.value.length > 0) return;
	}

	if (showLicenseStep.value && !licenseFormRef.value?.canProceed) return;

	try {
		isSaving.value = true;
		await api.post('server/setup', buildSetupPayload(form.value, showAdminStep.value));

		if (showAdminStep.value) {
			await login({
				credentials: {
					email: form.value.admin.email!,
					password: form.value.admin.password!,
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

const errorFormatted = computed(() => {
	let message = error.value?.response?.data?.errors?.[0]?.message || error.value?.message || t('unexpected_error');

	if (message.length > 200) {
		message = message.substring(0, 197) + '...';
	}

	return message;
});

const setupComplete = computed(() => SetupValidator.safeParse(form.value).success);
</script>

<template>
	<PublicView wide>
		<h1 class="type-display type-display-public">{{ $t('setup_welcome') }}</h1>

		<template v-if="page === 'setup' && showAdminStep">
			<p>{{ $t('setup_info') }}</p>
			<SetupForm v-model="form" :errors="errors" utm-location="onboarding"></SetupForm>
			<VButton full-width :disabled="!setupComplete" @click="showLicenseStep ? (page = 'license') : launch()">
				{{ showLicenseStep ? $t('continue') : $t('setup_launch') }}
			</VButton>
		</template>
		<template v-if="page === 'license' && showLicenseStep">
			<I18nT keypath="setup_license_key_notice" tag="p">
				<template #oig>
					<a
						:href="getDirectusUrlWithUtm(DIRECTUS_SUPPORT_URL, info.version, 'onboarding_contact_our_team_link')"
						target="_blank"
					>
						{{ $t('open_innovation_grant') }}
					</a>
				</template>
			</I18nT>

			<LicenseForm ref="licenseFormRef" v-model="form" :errors="errors"></LicenseForm>
			<VNotice v-if="error" type="danger">
				{{ errorFormatted }}
			</VNotice>
			<div class="actions">
				<VButton v-if="showAdminStep" secondary @click="page = 'setup'">
					{{ $t('back') }}
				</VButton>
				<VButton :disabled="!licenseFormRef?.canProceed" :loading="isSaving" @click="launch()">
					{{ $t('setup_launch') }}
				</VButton>
			</div>
		</template>
	</PublicView>
</template>

<style scoped>
h1 {
	margin-block: 5.625rem 1.375rem;
}

p {
	margin-block-end: 2rem;
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

.actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.625rem;
}

:deep(p a) {
	color: var(--theme--primary);
	text-decoration: underline;
}
</style>
