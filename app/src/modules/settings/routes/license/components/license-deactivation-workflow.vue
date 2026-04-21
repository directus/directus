<script setup lang="ts">
import { User } from '@directus/types';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import VAvatar from '@/components/v-avatar.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VChip from '@/components/v-chip.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VImage from '@/components/v-image.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import InterfaceSystemInputPassword from '@/interfaces/_system/system-input-password/input-password.vue';
import { translateAPIError } from '@/lang';
import type {
	LicenseDeactivationApplyPayload,
	LicenseDeactivationAssessment,
	LicenseDeactivationSeatCandidate,
	LicenseDeactivationSSOSection,
	ServerLicenseInfo,
} from '@/types/license';
import { getAssetUrl } from '@/utils/get-asset-url';
import { notify } from '@/utils/notify';
import { userName } from '@/utils/user-name';
import DrawerItem from '@/views/private/components/drawer-item.vue';

const props = withDefaults(
	defineProps<{
		mode: 'locked_recovery' | 'manual_deactivation' | 'license_change';
		title?: string;
		license: ServerLicenseInfo | null;
		initialAssessment?: LicenseDeactivationAssessment | null;
		licenseKey?: string | null;
		currentUserEmail?: string | null;
		canManageLicense?: boolean;
		canDeactivateLicense?: boolean;
		deactivatingLicense?: boolean;
	}>(),
	{
		title: '',
		initialAssessment: null,
		licenseKey: null,
		currentUserEmail: null,
		canManageLicense: false,
		canDeactivateLicense: false,
		deactivatingLicense: false,
	},
);

const emit = defineEmits<{
	'manage-license': [];
	'deactivate-license': [];
	'deactivate-anyway': [];
	'apply-license-change': [];
	'remediation-applied': [assessment: LicenseDeactivationAssessment];
}>();

const { t } = useI18n();

const loading = ref(false);
const applying = ref(false);
const error = ref<unknown>(null);
const assessment = ref<LicenseDeactivationAssessment | null>(null);

const selectedCollections = ref<string[]>([]);
const selectedAdminSeats = ref<string[]>([]);
const selectedUserSeats = ref<string[]>([]);

const collectionsExpanded = ref(false);
const adminSeatsExpanded = ref(false);
const userSeatsExpanded = ref(false);

const userDrawerOpen = ref(false);
const selectedSeatCandidateId = ref<string | null>(null);

const ssoDialogOpen = ref(false);
const ssoConfirmed = ref(false);
const ssoEmail = ref(props.currentUserEmail ?? '');
const ssoPassword = ref<string | null>(null);

const collectionsSection = computed(
	() => assessment.value?.sections.find((section) => section.key === 'collections') ?? null,
);

const seatsSection = computed(() => assessment.value?.sections.find((section) => section.key === 'seats') ?? null);

const ssoSection = computed(
	() => assessment.value?.sections.find((section) => section.key === 'sso') as LicenseDeactivationSSOSection | null,
);

const compliant = computed(() => assessment.value?.compliant === true);
const lockedRecoveryMode = computed(() => props.mode === 'locked_recovery');
const manualDeactivationMode = computed(() => props.mode === 'manual_deactivation');
const licenseChangeMode = computed(() => props.mode === 'license_change');

const canContinueInFallbackMode = computed(
	() =>
		lockedRecoveryMode.value && compliant.value === true && props.license !== null && props.license.source !== 'env',
);

const modeConfig = computed(() => {
	let noticeScopeKey: 'locked_recovery' | 'manual_deactivation' | 'license_change' = 'locked_recovery';

	if (licenseChangeMode.value) {
		noticeScopeKey = 'license_change';
	} else if (manualDeactivationMode.value) {
		noticeScopeKey = 'manual_deactivation';
	}

	const assessmentRequest = async () => {
		if (licenseChangeMode.value) {
			if (!props.licenseKey) throw new Error('License key is required');
			return api.post('/server/license/change-assessment', { license_key: props.licenseKey });
		}

		return api.get('/server/license/deactivation');
	};

	const remediationRequest = async (payload: LicenseDeactivationApplyPayload) => {
		if (licenseChangeMode.value) {
			if (!props.licenseKey) throw new Error('License key is required');
			return api.post('/server/license/change-remediation', {
				license_key: props.licenseKey,
				...payload,
			});
		}

		return api.post('/server/license/deactivation', payload);
	};

	return {
		noticeScopeKey,
		assessmentRequest,
		remediationRequest,
		applyButtonLabel: licenseChangeMode.value
			? t('license.deactivation.apply_remediation')
			: t('license.deactivation.apply'),
		successText: licenseChangeMode.value
			? t('license.deactivation.apply_success_text_license_change')
			: t('license.deactivation.apply_success_text'),
	};
});

const errorMessage = computed(() => {
	if (!error.value) return null;
	return translateAPIError(error.value as any);
});

function formatTargetLimit(limit: number | null): string {
	return limit === null ? t('unlimited') : String(limit);
}

const remediationNotice = computed(() => {
	const collectionTarget = formatTargetLimit(assessment.value?.target_entitlements.collections.limit ?? null);
	const seatsTarget = formatTargetLimit(assessment.value?.target_entitlements.seats.limit ?? null);
	const scopeKey = modeConfig.value.noticeScopeKey;

	if (compliant.value) {
		return {
			key: `license.deactivation.notice.${scopeKey}.compliant`,
			params: { collections: collectionTarget, seats: seatsTarget },
		};
	}

	return {
		key: `license.deactivation.notice.${scopeKey}.general`,
		params: {},
	};
});

const collectionsSatisfied = computed(() => {
	if (!collectionsSection.value) return true;
	return selectedCollections.value.length >= collectionsSection.value.needed_reduction;
});

const collectionsRemaining = computed(() => {
	if (!collectionsSection.value) return 0;
	return Math.max(collectionsSection.value.needed_reduction - selectedCollections.value.length, 0);
});

const selectedSeatCount = computed(() => new Set([...selectedAdminSeats.value, ...selectedUserSeats.value]).size);

const seatsSatisfied = computed(() => {
	if (!seatsSection.value) return true;
	return selectedSeatCount.value >= seatsSection.value.needed_reduction;
});

const seatsRemaining = computed(() => {
	if (!seatsSection.value) return 0;
	return Math.max(seatsSection.value.needed_reduction - selectedSeatCount.value, 0);
});

const ssoReadinessSatisfied = computed(() => {
	if (!ssoSection.value) return true;

	return (
		ssoConfirmed.value &&
		ssoSection.value.blockers.length === 0 &&
		(ssoSection.value.readiness.email_set || Boolean(ssoEmail.value?.trim())) &&
		(ssoSection.value.readiness.password_set || Boolean(ssoPassword.value))
	);
});

const canApply = computed(() => {
	return (
		loading.value === false &&
		applying.value === false &&
		compliant.value === false &&
		collectionsSatisfied.value &&
		seatsSatisfied.value &&
		ssoReadinessSatisfied.value
	);
});

const displayedCollections = computed(() =>
	sliceCandidates(collectionsSection.value?.candidates ?? [], collectionsExpanded.value),
);

const displayedAdminSeats = computed(() =>
	sliceCandidates(seatsSection.value?.candidates.admin_seats ?? [], adminSeatsExpanded.value),
);

const displayedUserSeats = computed(() =>
	sliceCandidates(seatsSection.value?.candidates.user_seats ?? [], userSeatsExpanded.value),
);

const hiddenCollectionsCount = computed(() => Math.max((collectionsSection.value?.candidates.length ?? 0) - 8, 0));
const hiddenAdminSeatsCount = computed(() => Math.max((seatsSection.value?.candidates.admin_seats.length ?? 0) - 8, 0));
const hiddenUserSeatsCount = computed(() => Math.max((seatsSection.value?.candidates.user_seats.length ?? 0) - 8, 0));

watch(
	() => props.currentUserEmail,
	(email) => {
		if (email) ssoEmail.value = email;
	},
);

watch(
	() => props.initialAssessment,
	(value) => {
		if (!value) return;
		setAssessment(value);
	},
);

async function loadAssessment() {
	loading.value = true;
	error.value = null;

	try {
		const { data } = await modeConfig.value.assessmentRequest();
		setAssessment(data.data);
	} catch (err) {
		error.value = err;
	} finally {
		loading.value = false;
	}
}

async function applyRemediation() {
	if (!canApply.value) return;

	const payload: LicenseDeactivationApplyPayload = {
		...(collectionsSection.value ? { collections: selectedCollections.value } : {}),
		...(seatsSection.value
			? {
					seats: {
						admin_seats: selectedAdminSeats.value,
						user_seats: selectedUserSeats.value,
					},
				}
			: {}),
		...(ssoSection.value
			? {
					sso: {
						enabled: ssoConfirmed.value,
						email: ssoSection.value.readiness.email_set ? undefined : ssoEmail.value.trim() || null,
						password: ssoSection.value.readiness.password_set ? undefined : ssoPassword.value,
					},
				}
			: {}),
	};

	await submitRemediation(payload);
}

async function continueInFallbackMode() {
	if (!lockedRecoveryMode.value || compliant.value !== true || loading.value || applying.value) return;

	await submitRemediation({});
}

async function submitRemediation(payload: LicenseDeactivationApplyPayload) {
	applying.value = true;
	error.value = null;

	try {
		const { data } = await modeConfig.value.remediationRequest(payload);
		setAssessment(data.data);
		emit('remediation-applied', data.data);

		notify({
			title: t('license.deactivation.apply_success_title'),
			text: modeConfig.value.successText,
		});
	} catch (err) {
		error.value = err;
	} finally {
		applying.value = false;
	}
}

function resetSelections() {
	selectedCollections.value = [];
	selectedAdminSeats.value = [];
	selectedUserSeats.value = [];
	collectionsExpanded.value = false;
	adminSeatsExpanded.value = false;
	userSeatsExpanded.value = false;
	ssoConfirmed.value = false;
	ssoPassword.value = null;
}

function setAssessment(value: LicenseDeactivationAssessment | null) {
	assessment.value = value;
	resetSelections();
}

function toggleSelection(list: 'collections' | 'admin_seats' | 'user_seats', id: string) {
	if (list === 'collections') {
		toggleRefSelection(selectedCollections, id);
		return;
	}

	if (list === 'admin_seats') {
		toggleRefSelection(selectedAdminSeats, id);
		return;
	}

	toggleRefSelection(selectedUserSeats, id);
}

async function openSeatDrawer(candidate: LicenseDeactivationSeatCandidate) {
	selectedSeatCandidateId.value = candidate.id;
	await nextTick();
	userDrawerOpen.value = true;
}

function toggleSSOConfirmation() {
	if (ssoConfirmed.value) {
		ssoConfirmed.value = false;
		return;
	}

	ssoDialogOpen.value = true;
}

function confirmSSO() {
	ssoConfirmed.value = true;
	ssoDialogOpen.value = false;
}

function sectionChipClass(kind: 'required' | 'success') {
	return kind === 'success' ? 'chip chip--success' : 'chip chip--danger';
}

function seatLabel(candidate: LicenseDeactivationSeatCandidate): string {
	return userName(candidate as Partial<User>);
}

function seatAvatar(candidate: LicenseDeactivationSeatCandidate): string | null {
	if (!candidate.avatar) return null;

	return getAssetUrl(candidate.avatar, {
		imageKey: 'system-small-contain',
	});
}

function sliceCandidates<T>(candidates: T[], expanded: boolean): T[] {
	return expanded ? candidates : candidates.slice(0, 8);
}

function toggleRefSelection(selection: { value: string[] }, id: string) {
	if (selection.value.includes(id)) {
		selection.value = selection.value.filter((item) => item !== id);
	} else {
		selection.value = [...selection.value, id];
	}
}

defineExpose({
	refresh: loadAssessment,
});

onMounted(() => {
	if (props.initialAssessment) {
		setAssessment(props.initialAssessment);
		return;
	}

	void loadAssessment();
});
</script>

<template>
	<section class="workflow">
		<header v-if="props.title || props.canManageLicense" class="workflow-header">
			<div>
				<h1 v-if="props.title" class="workflow-title">{{ props.title }}</h1>
			</div>

			<VButton v-if="props.canManageLicense" secondary @click="$emit('manage-license')">
				{{ $t('license.manage_license') }}
			</VButton>
		</header>

		<VNotice v-if="errorMessage" type="warning">
			{{ errorMessage }}
		</VNotice>

		<div v-if="loading" class="loading">
			<VProgressCircular indeterminate />
		</div>

		<template v-else-if="assessment">
			<VNotice v-if="compliant" type="success">
				{{ $t(remediationNotice.key, remediationNotice.params) }}
			</VNotice>

			<VNotice v-else type="warning">
				{{ $t(remediationNotice.key, remediationNotice.params) }}
			</VNotice>

			<section v-if="ssoSection" class="section">
				<div class="section-header">
					<div class="section-heading">
						<VIcon name="cloud_lock" small />
						<h2>{{ $t('license.deactivation.sso.title') }}</h2>
					</div>
					<VChip small :class="sectionChipClass(ssoReadinessSatisfied ? 'success' : 'required')">
						{{ ssoReadinessSatisfied ? $t('license.deactivation.all_set') : $t('license.deactivation.required') }}
					</VChip>
				</div>

				<div class="selection-grid">
					<VCheckbox
						:model-value="ssoConfirmed"
						block
						:label="$t('license.deactivation.sso.confirm')"
						@click.prevent.stop="toggleSSOConfirmation"
					/>
				</div>

				<p class="hint">
					{{ $t('license.deactivation.sso.hint') }}
				</p>

				<ul v-if="ssoSection.blockers.length > 0" class="blockers">
					<li v-for="blocker in ssoSection.blockers" :key="`${blocker.code}:${blocker.resource_id ?? 'global'}`">
						<strong>{{ blocker.code }}</strong>
						<span v-if="blocker.next_action">{{ blocker.next_action }}</span>
					</li>
				</ul>
			</section>

			<section v-if="collectionsSection" class="section">
				<div class="section-header">
					<div class="section-heading">
						<VIcon name="database" small />
						<h2>{{ $t('license.deactivation.collections.title') }}</h2>
					</div>
					<VChip small :class="sectionChipClass(collectionsSatisfied ? 'success' : 'required')">
						{{
							collectionsSatisfied
								? $t('license.deactivation.all_set')
								: $t('license.deactivation.select_items', { count: collectionsRemaining })
						}}
					</VChip>
				</div>

				<p class="section-copy">{{ $t('license.deactivation.collections.copy') }}</p>

				<div class="selection-grid">
					<VCheckbox
						v-for="candidate in displayedCollections"
						:key="candidate.id"
						:model-value="selectedCollections.includes(candidate.id)"
						block
						:label="candidate.label"
						@click.prevent.stop="toggleSelection('collections', candidate.id)"
					/>
				</div>

				<button
					v-if="hiddenCollectionsCount > 0 && !collectionsExpanded"
					class="show-more"
					type="button"
					@click="collectionsExpanded = true"
				>
					{{ $t('license.deactivation.show_more', { count: hiddenCollectionsCount }) }}
				</button>
			</section>

			<section v-if="seatsSection" class="section">
				<div class="section-header">
					<div class="section-heading">
						<VIcon name="group" small />
						<h2>{{ $t('license.deactivation.seats.title') }}</h2>
					</div>
					<VChip small :class="sectionChipClass(seatsSatisfied ? 'success' : 'required')">
						{{
							seatsSatisfied
								? $t('license.deactivation.all_set')
								: $t('license.deactivation.select_items', { count: seatsRemaining })
						}}
					</VChip>
				</div>

				<div v-if="seatsSection.candidates.user_seats.length > 0" class="subsection">
					<h3>{{ $t('license.deactivation.seats.user_title') }}</h3>
					<div class="selection-grid">
						<VCheckbox
							v-for="candidate in displayedUserSeats"
							:key="candidate.id"
							:model-value="selectedUserSeats.includes(candidate.id)"
							block
							@click.prevent.stop="toggleSelection('user_seats', candidate.id)"
						>
							<div class="seat-option">
								<VAvatar x-small class="avatar">
									<VIcon v-if="!seatAvatar(candidate)" name="person" />
									<VImage v-else :src="seatAvatar(candidate)!" :alt="seatLabel(candidate)" />
								</VAvatar>
								<span class="seat-option__label">{{ seatLabel(candidate) }}</span>
							</div>
							<template #append>
								<button class="drawer-trigger" type="button" @click.stop="openSeatDrawer(candidate)">
									<VIcon name="open_in_new" small />
								</button>
							</template>
						</VCheckbox>
					</div>

					<button
						v-if="hiddenUserSeatsCount > 0 && !userSeatsExpanded"
						class="show-more"
						type="button"
						@click="userSeatsExpanded = true"
					>
						{{ $t('license.deactivation.show_more', { count: hiddenUserSeatsCount }) }}
					</button>
				</div>

				<div v-if="seatsSection.candidates.admin_seats.length > 0" class="subsection">
					<h3>{{ $t('license.deactivation.seats.admin_title') }}</h3>
					<div class="selection-grid">
						<VCheckbox
							v-for="candidate in displayedAdminSeats"
							:key="candidate.id"
							:model-value="selectedAdminSeats.includes(candidate.id)"
							block
							@click.prevent.stop="toggleSelection('admin_seats', candidate.id)"
						>
							<div class="seat-option">
								<VAvatar x-small class="avatar">
									<VIcon v-if="!seatAvatar(candidate)" name="person" />
									<VImage v-else :src="seatAvatar(candidate)!" :alt="seatLabel(candidate)" />
								</VAvatar>
								<span class="seat-option__label">{{ seatLabel(candidate) }}</span>
							</div>
							<template #append>
								<button class="drawer-trigger" type="button" @click.stop="openSeatDrawer(candidate)">
									<VIcon name="open_in_new" small />
								</button>
							</template>
						</VCheckbox>
					</div>

					<button
						v-if="hiddenAdminSeatsCount > 0 && !adminSeatsExpanded"
						class="show-more"
						type="button"
						@click="adminSeatsExpanded = true"
					>
						{{ $t('license.deactivation.show_more', { count: hiddenAdminSeatsCount }) }}
					</button>
				</div>
			</section>

			<footer class="workflow-footer">
				<VButton
					v-if="manualDeactivationMode && props.canDeactivateLicense && compliant"
					kind="danger"
					:loading="props.deactivatingLicense"
					@click="$emit('deactivate-license')"
				>
					{{ $t('license.deactivate') }}
				</VButton>

				<template v-else>
					<VButton
						v-if="canContinueInFallbackMode"
						:loading="applying"
						:disabled="applying || loading"
						@click="continueInFallbackMode"
					>
						{{ $t('license.deactivation.continue_fallback_mode') }}
					</VButton>

					<VButton
						v-if="licenseChangeMode && compliant"
						:loading="props.deactivatingLicense"
						:disabled="props.deactivatingLicense"
						@click="$emit('apply-license-change')"
					>
						{{ $t('license.apply_license_key') }}
					</VButton>

					<VButton v-else kind="danger" :loading="applying" :disabled="!canApply" @click="applyRemediation">
						{{ modeConfig.applyButtonLabel }}
					</VButton>

					<VButton
						v-if="manualDeactivationMode && props.canDeactivateLicense"
						secondary
						:disabled="props.deactivatingLicense || applying || loading"
						@click="$emit('deactivate-anyway')"
					>
						{{ $t('license.deactivation.deactivate_anyway') }}
					</VButton>
				</template>
			</footer>
		</template>

		<VDialog v-model="ssoDialogOpen" @esc="ssoDialogOpen = false">
			<VCard>
				<VCardTitle>{{ $t('license.deactivation.sso.dialog_title') }}</VCardTitle>
				<VCardText class="dialog-content">
					<VNotice type="info">
						{{ $t('license.deactivation.sso.dialog_copy') }}
					</VNotice>

					<p class="readiness">
						{{ $t('license.deactivation.sso.email_status') }}:
						<strong>{{ ssoSection?.readiness.email_set ? $t('set') : $t('not_set') }}</strong>
					</p>
					<p class="readiness">
						{{ $t('license.deactivation.sso.password_status') }}:
						<strong>{{ ssoSection?.readiness.password_set ? $t('set') : $t('not_set') }}</strong>
					</p>

					<VInput
						v-if="ssoSection && !ssoSection.readiness.email_set"
						v-model="ssoEmail"
						type="email"
						:placeholder="$t('email')"
					/>

					<InterfaceSystemInputPassword
						v-if="ssoSection && !ssoSection.readiness.password_set"
						:value="ssoPassword"
						:placeholder="$t('password')"
						@input="ssoPassword = $event"
					/>
				</VCardText>
				<VCardActions>
					<VButton secondary @click="ssoDialogOpen = false">{{ $t('cancel') }}</VButton>
					<VButton
						:disabled="
							!!ssoSection &&
							((!ssoSection.readiness.email_set && !ssoEmail?.trim()) ||
								(!ssoSection.readiness.password_set && !ssoPassword))
						"
						@click="confirmSSO"
					>
						{{ $t('confirm') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>

		<DrawerItem
			v-if="selectedSeatCandidateId"
			v-model:active="userDrawerOpen"
			collection="directus_users"
			:primary-key="selectedSeatCandidateId || undefined"
			disabled
		/>
	</section>
</template>

<style scoped lang="scss">
.workflow {
	display: grid;
	gap: 1rem;
}

.workflow-header,
.section-header,
.section-heading,
.workflow-footer {
	display: flex;
	align-items: center;
}

.workflow-header,
.section-header,
.workflow-footer {
	justify-content: space-between;
	gap: 1rem;
}

.workflow-title {
	font-size: 1.5rem;
	line-height: 1.2;
}

.loading {
	display: flex;
	justify-content: center;
	padding: 2rem 0;
}

.section {
	display: grid;
	gap: 0.875rem;
	padding-block-start: 0.5rem;
	border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.section-heading {
	gap: 0.5rem;
}

.section-copy,
.hint {
	color: var(--theme--foreground-subdued);
}

.subsection {
	display: grid;
	gap: 0.75rem;
}

.selection-grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 0.75rem;
}

@media (width < 72rem) {
	.selection-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@media (width < 48rem) {
	.selection-grid {
		grid-template-columns: minmax(0, 1fr);
	}
}

.seat-option {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-inline-size: 0;
}

.seat-option__label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.avatar {
	flex-shrink: 0;
}

.show-more {
	inline-size: fit-content;
	color: var(--theme--primary);
	background: none;
	border: none;
}

.drawer-trigger {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: var(--theme--foreground-subdued);
	background: none;
	border: none;
}

.blockers {
	display: grid;
	gap: 0.5rem;
	padding-inline-start: 1.125rem;
	color: var(--theme--danger);
}

.chip {
	--v-chip-padding: 0 0.5rem;
}

.chip--danger {
	--v-chip-color: var(--theme--danger);
	--v-chip-background-color: var(--theme--danger-background);
	--v-chip-border-color: var(--theme--danger-background);
}

.chip--success {
	--v-chip-color: var(--theme--success);
	--v-chip-background-color: var(--theme--success-background);
	--v-chip-border-color: var(--theme--success-background);
}

.dialog-content {
	display: grid;
	gap: 1rem;
}

.readiness strong {
	text-transform: capitalize;
}
</style>
