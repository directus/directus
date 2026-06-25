<script setup lang="ts">
import { DIRECTUS_LICENSING_DOCS_URL, DIRECTUS_OIG_URL, LICENSING_EMAIL } from '@directus/constants';
import { useCookies } from '@vueuse/integrations/useCookies';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { I18nT } from 'vue-i18n';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import SystemLicenseKey from '@/interfaces/_system/system-license-key/system-license-key.vue';
import { useLicenseStore } from '@/stores/license';
import { useServerStore } from '@/stores/server';
import { getDirectusUrlWithUtm } from '@/utils/directus-url';
import { unexpectedError } from '@/utils/unexpected-error';

const model = defineModel<boolean>();

const cookies = useCookies(['license-login-modal-dismissed']);
const licenseStore = useLicenseStore();
const serverStore = useServerStore();

const licenseKey = ref<string | null>(null);
const licenseKeyValidity = ref({ valid: false, validating: false });
const isSaving = ref(false);

const isOverLimit = computed(() =>
	Object.values(licenseStore.limits).some((l) => l.remaining !== null && !l.hasRemaining),
);

const { formattedGraceDeadline } = storeToRefs(licenseStore);

async function save() {
	if (!licenseKeyValidity.value.valid || isSaving.value) return;

	isSaving.value = true;

	try {
		await licenseStore.activate(licenseKey.value!);
		await serverStore.hydrate();
		model.value = false;
	} catch (err) {
		unexpectedError(err);
	} finally {
		isSaving.value = false;
	}
}

function dismiss() {
	cookies.set('license-login-modal-dismissed', 'true', {
		path: '/',
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
	});

	model.value = false;
}

function openGetLicenseKey() {
	window.open(
		getDirectusUrlWithUtm(DIRECTUS_LICENSING_DOCS_URL, serverStore.info.version, 'upgrade_modal_open_get_license'),
		'_blank',
		'noopener,noreferrer',
	);
}
</script>

<template>
	<VDialog v-model="model">
		<VCard>
			<div class="inner">
				<VCardTitle>{{ $t('license_onboarding_title') }}</VCardTitle>

				<VCardText>
					<I18nT keypath="license_onboarding_desc" tag="p">
						<template #oig>
							<a
								:href="
									getDirectusUrlWithUtm(
										DIRECTUS_OIG_URL,
										serverStore.info.version,
										'upgrade_modal_open_innovation_grant_link',
									)
								"
								target="_blank"
								rel="noopener noreferrer"
							>
								{{ $t('open_innovation_grant') }}
							</a>
						</template>
					</I18nT>

					<div class="field-group">
						<label class="field-label">
							{{ $t('license_key') }}
							<span class="optional">({{ $t('license_grace_key_modal.optional') }})</span>
						</label>

						<SystemLicenseKey
							:value="licenseKey"
							@input="licenseKey = $event"
							@validity="licenseKeyValidity = $event"
						/>
					</div>

					<VNotice v-if="isOverLimit" type="warning">
						<p>
							<I18nT keypath="license_grace_key_modal.over_limit_warning_tail" tag="span">
								<template #lead>
									<strong>{{ $t('license_grace_key_modal.over_limit_warning_lead') }}</strong>
								</template>
								<template #licenseKey>
									<a :href="DIRECTUS_LICENSING_DOCS_URL" target="_blank" rel="noopener noreferrer">
										{{ $t('license_grace_key_modal.license_key_link_label') }}
									</a>
								</template>
								<template #date>
									<strong>{{ formattedGraceDeadline }}</strong>
								</template>
								<template #days>{{ licenseStore.gracePeriodDaysRemaining ?? 0 }}</template>
							</I18nT>
						</p>
						<p>
							<I18nT keypath="license_grace_key_modal.over_limit_customer_help" tag="span">
								<template #email>
									<a :href="`mailto:${LICENSING_EMAIL}`">{{ LICENSING_EMAIL }}</a>
								</template>
							</I18nT>
						</p>
					</VNotice>
				</VCardText>

				<VCardActions>
					<template v-if="licenseKeyValidity.valid">
						<VButton :loading="isSaving" @click="save">
							{{ $t('save') }}
						</VButton>
					</template>
					<template v-else>
						<VButton @click="openGetLicenseKey">
							<VIcon name="vpn_key" left />
							{{ $t('license_grace_key_modal.get_license_key') }}
						</VButton>
						<VButton secondary @click="dismiss">
							{{ isOverLimit ? $t('remind_later') : $t('skip') }}
						</VButton>
					</template>
				</VCardActions>
			</div>
		</VCard>
	</VDialog>
</template>

<style scoped>
.v-card {
	--v-card-padding: 1.75rem;
	max-inline-size: unset;
	inline-size: 39rem;
}

:deep(.v-card-title) {
	padding-block-end: 0.5rem;
}

:deep(.v-card-text) {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	padding-block-end: 0.75rem;
}

:deep(.v-card-actions) {
	padding: 1.25rem;
	gap: 0.625rem;
}

p {
	font-size: 0.8125rem;
	line-height: 1.4375rem;
	margin: 0;

	a {
		color: var(--theme--primary);
		text-decoration: underline;
	}
}

.field-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.field-label {
	font-size: 0.9375rem;
	font-weight: 600;
}

.optional {
	font-size: 0.6875rem;
	font-weight: 400;
	color: var(--theme--foreground-subdued);
	margin-inline-start: 0.25rem;
}
</style>
