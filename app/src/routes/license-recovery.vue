<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VDialog from '@/components/v-dialog.vue';
import VDrawer from '@/components/v-drawer.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { useProposedLicenseChange } from '@/composables/use-proposed-license-change';
import { translateAPIError } from '@/lang';
import LicenseKeyInput from '@/modules/licensing/components/license-key-input.vue';
import LicenseDeactivationWorkflow from '@/modules/settings/routes/license/components/license-deactivation-workflow.vue';
import { canManageLicense as canManageLicenseInfo } from '@/modules/settings/routes/license/utils';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import type { LicenseDeactivationAssessment, ServerLicenseInfo } from '@/types/license';
import { notify } from '@/utils/notify';
import { PrivateViewHeaderBarActionButton } from '@/views/private';

const { t } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const serverStore = useServerStore();
const { applyProposedKey: applyCheckedProposedKey, checkProposedKey } = useProposedLicenseChange();

useHead({
	title: t('license.recovery.title'),
});

const license = ref<ServerLicenseInfo | null>(null);
const loading = ref(false);
const error = ref<unknown>(null);
const drawerOpen = ref(false);
const licenseDrawerCanSubmit = ref(false);
const saving = ref(false);
const editableLicenseKey = ref<string | null>(null);
const applyingProposedLicense = ref(false);
const licenseChangeDialogOpen = ref(false);
const proposedKey = ref<string | null>(null);
const changeAssessment = ref<LicenseDeactivationAssessment | null>(null);
const workflow = ref<InstanceType<typeof LicenseDeactivationWorkflow> | null>(null);

const errorCode = computed(() => {
	return (error.value as any)?.response?.data?.errors?.[0]?.extensions?.code ?? null;
});

const errorMessage = computed(() => {
	if (!error.value) return null;

	const typedError = error.value as any;
	return typedError?.response?.data?.errors?.[0]?.message ?? typedError?.message ?? translateAPIError(typedError);
});

const canManageLicense = computed(() => canManageLicenseInfo(license.value));
const hasStoredLicenseValue = computed(() => license.value?.source === 'settings');
const canSaveLicenseKey = computed(() => licenseDrawerCanSubmit.value && !saving.value);

async function loadLicense() {
	loading.value = true;
	error.value = null;

	try {
		const { data } = await api.get('/server/license');
		license.value = data.data;
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
}

async function handleRemediationApplied() {
	await Promise.all([serverStore.hydrateInfo(), loadLicense()]);

	if (serverStore.info.license_locked !== true) {
		await router.push('/settings/license');
	}
}

function clearPendingLicenseChange() {
	proposedKey.value = null;
	changeAssessment.value = null;
}

function closeLicenseDrawer() {
	drawerOpen.value = false;
	editableLicenseKey.value = null;
	licenseDrawerCanSubmit.value = false;
	error.value = null;
}

function closeLicenseChangeDialog() {
	licenseChangeDialogOpen.value = false;
	clearPendingLicenseChange();
}

function handleLicenseChangeDialogUpdate(active: boolean) {
	licenseChangeDialogOpen.value = active;

	if (!active) {
		clearPendingLicenseChange();
	}
}

async function persistProposedLicenseKey(licenseKey: string) {
	const result = await applyCheckedProposedKey(licenseKey);

	if (result.status === 'blocked') {
		proposedKey.value = licenseKey;
		changeAssessment.value = result.assessment;
		closeLicenseDrawer();
		licenseChangeDialogOpen.value = true;
		return;
	}

	closeLicenseDrawer();
	closeLicenseChangeDialog();
	await Promise.all([serverStore.hydrateInfo(), loadLicense()]);

	if (serverStore.info.license_locked === true) {
		await workflow.value?.refresh();
	} else {
		await router.push('/settings/license');
	}

	notify({
		title: t('license.save_success'),
	});
}

async function saveLicenseKey() {
	const nextLicenseKey = editableLicenseKey.value?.trim() || null;
	if (!nextLicenseKey) return;

	saving.value = true;
	error.value = null;

	try {
		const assessment = await checkProposedKey(nextLicenseKey);

		if (!assessment.compliant) {
			proposedKey.value = nextLicenseKey;
			changeAssessment.value = assessment;
			closeLicenseDrawer();
			licenseChangeDialogOpen.value = true;
			return;
		}

		await persistProposedLicenseKey(nextLicenseKey);
	} catch (err) {
		error.value = err;
		clearPendingLicenseChange();
	} finally {
		saving.value = false;
	}
}

async function applyProposedKey() {
	if (!proposedKey.value) return;

	applyingProposedLicense.value = true;
	error.value = null;

	try {
		await persistProposedLicenseKey(proposedKey.value);
	} catch (err) {
		error.value = err;
		closeLicenseChangeDialog();
	} finally {
		applyingProposedLicense.value = false;
	}
}

function openLicenseDrawer() {
	editableLicenseKey.value = null;
	licenseDrawerCanSubmit.value = false;
	drawerOpen.value = true;
}

onMounted(loadLicense);
</script>

<template>
	<div class="license-recovery-page">
		<div class="license-recovery-shell">
			<header class="license-recovery-header">
				<div class="license-recovery-copy">
					<p class="license-recovery-eyebrow">{{ $t('license.recovery.title') }}</p>
					<h1>{{ $t('license.recovery.title') }}</h1>
					<p class="license-recovery-headline">{{ $t('license.recovery.headline') }}</p>
				</div>

				<VButton v-if="canManageLicense" @click="openLicenseDrawer">
					{{ $t('license.manage_license') }}
				</VButton>
			</header>

			<VNotice v-if="errorMessage && !drawerOpen" type="warning">
				{{ errorMessage }}
			</VNotice>

			<div v-if="loading" class="loading">
				<VProgressCircular indeterminate />
			</div>

			<LicenseDeactivationWorkflow
				v-else
				ref="workflow"
				mode="locked_recovery"
				:title="$t('license.deactivation.title')"
				:license="license"
				:current-user-email="
					userStore.currentUser && !('share' in userStore.currentUser) ? userStore.currentUser.email : null
				"
				:can-manage-license="false"
				:can-deactivate-license="false"
				:deactivating-license="false"
				@remediation-applied="handleRemediationApplied"
			/>
		</div>

		<VDrawer
			v-model="drawerOpen"
			:title="$t('license.manage_license_title')"
			icon="vpn_key"
			@cancel="closeLicenseDrawer"
			@apply="saveLicenseKey"
		>
			<template #actions>
				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('save')"
					:disabled="!canSaveLicenseKey"
					:loading="saving"
					icon="check"
					@click="saveLicenseKey"
				/>
			</template>

			<div class="drawer-content">
				<VNotice v-if="error && drawerOpen" type="danger">
					<p v-if="errorCode" class="error-code">{{ errorCode }}</p>
					<p>{{ errorMessage }}</p>
				</VNotice>

				<LicenseKeyInput
					v-if="drawerOpen"
					v-model="editableLicenseKey"
					variant="drawer"
					:has-stored-value="hasStoredLicenseValue && editableLicenseKey === null"
					:utm-term="serverStore.info.version"
					utm-content="license_recovery_drawer"
					@can-submit-change="licenseDrawerCanSubmit = $event"
				/>
			</div>
		</VDrawer>

		<VDialog
			:model-value="licenseChangeDialogOpen"
			keep-behind
			@update:model-value="handleLicenseChangeDialogUpdate"
			@esc="closeLicenseChangeDialog"
		>
			<LicenseDeactivationWorkflow
				mode="license_change"
				:title="$t('license.change_license_title')"
				:license="license"
				:initial-assessment="changeAssessment"
				:license-key="proposedKey"
				:current-user-email="
					userStore.currentUser && !('share' in userStore.currentUser) ? userStore.currentUser.email : null
				"
				:deactivating-license="applyingProposedLicense"
				@apply-license-change="applyProposedKey"
				@remediation-applied="handleRemediationApplied"
			/>
		</VDialog>
	</div>
</template>

<style scoped lang="scss">
.license-recovery-page {
	min-block-size: 100%;
	padding: 2rem;
	background: var(--theme--background-page);
}

.license-recovery-shell {
	inline-size: min(100%, 90rem);
	margin: 0 auto;
}

.license-recovery-header {
	display: flex;
	align-items: start;
	justify-content: space-between;
	gap: 1rem;
	margin-block-end: 1.5rem;
}

.license-recovery-copy {
	display: grid;
	gap: 0.375rem;
}

.license-recovery-eyebrow,
.license-recovery-headline,
.license-recovery-copy h1 {
	margin: 0;
}

.license-recovery-eyebrow {
	font-size: 0.75rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: var(--theme--primary);
}

.license-recovery-copy h1 {
	font-size: 2rem;
	line-height: 1.2;
}

.license-recovery-headline {
	max-inline-size: 52rem;
	color: var(--theme--foreground-subdued);
}

.drawer-content {
	display: grid;
	gap: 1rem;
	padding: var(--content-padding);
}

.error-code {
	margin: 0 0 0.25rem;
	font-weight: 600;
}

.loading {
	display: flex;
	justify-content: center;
	padding: 2rem 0;
}

@media (width <= 50rem) {
	.license-recovery-page {
		padding: 1rem;
	}

	.license-recovery-header {
		flex-direction: column;
		align-items: stretch;
	}
}
</style>
