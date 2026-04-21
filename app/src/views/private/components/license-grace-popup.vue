<script setup lang="ts">
import { useCookies } from '@vueuse/integrations/useCookies';
import { computed, ref } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import { useProposedLicenseChange } from '@/composables/use-proposed-license-change';
import { translateAPIError } from '@/lang';
import LicenseKeyInput from '@/modules/licensing/components/license-key-input.vue';
import { LICENSING_SESSION_COOKIES, setOnboardingGracePopupSkipped } from '@/modules/licensing/cookies';
import LicenseDeactivationWorkflow from '@/modules/settings/routes/license/components/license-deactivation-workflow.vue';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import type { LicenseDeactivationAssessment, ServerLicenseInfo } from '@/types/license';
import { notify } from '@/utils/notify';

const { t } = useI18n();
const cookies = useCookies(LICENSING_SESSION_COOKIES);
const serverStore = useServerStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();
const { applyProposedKey, checkProposedKey } = useProposedLicenseChange();

const dialogOpen = ref(true);
const editableLicenseKey = ref<string | null>(null);
const canSubmit = ref(false);
const loading = ref(false);
const error = ref<unknown>(null);
const remediationDialogOpen = ref(false);
const proposedKey = ref<string | null>(null);
const changeAssessment = ref<LicenseDeactivationAssessment | null>(null);
const remediationLicense = ref<ServerLicenseInfo | null>(null);

const hasEnteredLicenseKey = computed(() => Boolean(editableLicenseKey.value?.trim()));

const licenseRequestUrl = computed(() => {
	return `https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${serverStore.info.version ?? ''}&utm_content=onboarding_grace_popup_get_license_key`;
});

const secondaryLabel = computed(() => {
	return hasEnteredLicenseKey.value ? t('cancel') : t('skip');
});

const applyDisabled = computed(() => {
	return !canSubmit.value || loading.value;
});

const errorCode = computed(() => {
	return error.value ? translateAPIError(error.value as any) : null;
});

const errorMessage = computed(() => {
	const typedError = error.value as any;
	return typedError?.response?.data?.errors?.[0]?.message ?? typedError?.message ?? null;
});

function clearPopupState() {
	editableLicenseKey.value = null;
	canSubmit.value = false;
	error.value = null;
}

function clearRemediationState() {
	proposedKey.value = null;
	changeAssessment.value = null;
	remediationLicense.value = null;
}

function dismissPopup() {
	dialogOpen.value = false;
	clearPopupState();
}

function skipForSession() {
	setOnboardingGracePopupSkipped(cookies);
	dismissPopup();
}

function handleDialogUpdate(active: boolean) {
	dialogOpen.value = active;

	if (!active) {
		clearPopupState();
	}
}

function handleRemediationDialogUpdate(active: boolean) {
	remediationDialogOpen.value = active;

	if (!active) {
		clearRemediationState();
	}
}

async function loadCurrentLicense() {
	const { data } = await api.get('/server/license');
	remediationLicense.value = data.data;
}

async function openRemediationFlow(licenseKey: string, assessment: LicenseDeactivationAssessment) {
	await loadCurrentLicense();
	proposedKey.value = licenseKey;
	changeAssessment.value = assessment;
	remediationDialogOpen.value = true;
}

async function completeLicenseApply(licenseKey: string) {
	const result = await applyProposedKey(licenseKey);

	if (result.status === 'blocked') {
		await openRemediationFlow(licenseKey, result.assessment);
		return;
	}

	await Promise.all([serverStore.hydrateInfo(), settingsStore.hydrate()]);
	clearRemediationState();
	dismissPopup();
	notify({ title: t('license.save_success') });
}

async function applyLicense() {
	const licenseKey = editableLicenseKey.value?.trim() || null;
	if (!licenseKey) return;

	loading.value = true;
	error.value = null;

	try {
		const assessment = await checkProposedKey(licenseKey);

		if (!assessment.compliant) {
			await openRemediationFlow(licenseKey, assessment);
			return;
		}

		await completeLicenseApply(licenseKey);
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
}

async function applyRemediatedLicense() {
	if (!proposedKey.value) return;

	loading.value = true;
	error.value = null;

	try {
		await completeLicenseApply(proposedKey.value);
	} catch (err) {
		error.value = err;
		remediationDialogOpen.value = false;
		clearRemediationState();
	} finally {
		loading.value = false;
	}
}

function handleSecondaryAction() {
	if (hasEnteredLicenseKey.value) {
		dismissPopup();
		return;
	}

	skipForSession();
}
</script>

<template>
	<VDialog
		:model-value="dialogOpen"
		persistent
		:keep-behind="remediationDialogOpen"
		@update:model-value="handleDialogUpdate"
	>
		<VCard>
			<div class="inner">
				<VCardTitle>{{ $t('license.grace_popup.title') }}</VCardTitle>

				<VCardText>
					<p class="description">
						<I18nT keypath="license.grace_popup.copy" tag="span">
							<template #openInnovationGrant>
								<a
									:href="`https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${serverStore.info.version ?? ''}&utm_content=onboarding_grace_popup_open_innovation_grant_link`"
									target="_blank"
								>
									{{ $t('license.open_innovation_grant') }}
								</a>
							</template>
						</I18nT>
					</p>

					<LicenseKeyInput
						v-model="editableLicenseKey"
						variant="drawer"
						:show-notice="false"
						show-optional
						:utm-term="serverStore.info.version"
						utm-content="onboarding_grace_popup"
						@can-submit-change="canSubmit = $event"
					/>

					<VNotice v-if="errorMessage" class="error-notice" type="danger">
						<p v-if="errorCode" class="error-code">{{ errorCode }}</p>
						<p>{{ errorMessage }}</p>
					</VNotice>
				</VCardText>

				<VCardActions class="popup-actions">
					<VButton secondary :href="licenseRequestUrl" target="_blank">
						<VIcon name="vpn_key" class="button-icon" />
						{{ $t('license.get_license_key') }}
					</VButton>

					<VButton v-if="hasEnteredLicenseKey" :disabled="applyDisabled" :loading="loading" @click="applyLicense">
						{{ $t('license.apply_license') }}
					</VButton>

					<VButton v-else secondary @click="handleSecondaryAction">
						{{ secondaryLabel }}
					</VButton>
				</VCardActions>
			</div>
		</VCard>
	</VDialog>

	<VDialog
		:model-value="remediationDialogOpen"
		@update:model-value="handleRemediationDialogUpdate"
		@esc="handleRemediationDialogUpdate(false)"
	>
		<div class="recovery-dialog">
			<LicenseDeactivationWorkflow
				mode="license_change"
				:title="$t('license.change_license_title')"
				:license="remediationLicense"
				:initial-assessment="changeAssessment"
				:license-key="proposedKey"
				:current-user-email="
					userStore.currentUser && !('share' in userStore.currentUser) ? userStore.currentUser.email : null
				"
				:deactivating-license="loading"
				@apply-license-change="applyRemediatedLicense"
			/>
		</div>
	</VDialog>
</template>

<style scoped>
.v-card {
	max-inline-size: unset;
	inline-size: 36rem;
}

.inner {
	display: grid;
}

.description {
	margin: 0 0 1.5rem;
	color: var(--theme--foreground-subdued);
	font-size: 0.9375rem;
	line-height: 1.5rem;
}

.description :deep(a) {
	color: var(--theme--primary);
	text-decoration: underline;
}

.error-notice {
	margin-block-start: 1rem;
}

.error-code {
	margin: 0 0 0.25rem;
	font-weight: 700;
}

.popup-actions {
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	gap: 0.75rem;
}

.popup-actions :deep(.v-button) {
	inline-size: auto;
	min-inline-size: 7.5rem;
}

.button-icon {
	margin-inline-end: 0.375rem;
}
</style>
