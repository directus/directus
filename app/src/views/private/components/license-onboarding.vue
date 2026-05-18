<script setup lang="ts">
import { LICENSE_KEY } from '@directus/license';
import { useCookies } from '@vueuse/integrations/useCookies';
import { computed, ref, watch } from 'vue';
import { I18nT, useI18n } from 'vue-i18n';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VInput from '@/components/v-input.vue';
import VRadioCards from '@/components/v-radio-cards.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useLicenseForm } from '@/composables/use-license-form';
import SystemLicenseKey from '@/interfaces/_system/system-license-key/system-license-key.vue';
import { useLicenseStore } from '@/stores/license';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { unexpectedError } from '@/utils/unexpected-error';

const model = defineModel<boolean>();

const cookies = useCookies(['license-onboarding-dismissed']);
const { t } = useI18n();
const serverStore = useServerStore();
const settingsStore = useSettingsStore();
const licenseStore = useLicenseStore();

const licenseKey = ref<string | null>(null);
const projectUsage = ref<string | null>(null);
const orgName = ref<string | null>(null);
const isSaving = ref(false);

const isKeyValid = computed(
	() => !!licenseKey.value && licenseKey.value.length >= 29 && LICENSE_KEY.safeParse(licenseKey.value).success,
);

const {
	licenseChoice,
	showOrgName,
	licenseChoices,
	canProceed: canSave,
} = useLicenseForm({
	projectUsage,
	orgName,
	isLicenseKeyValid: isKeyValid,
});

watch(licenseChoice, () => {
	licenseKey.value = null;
	projectUsage.value = null;
	orgName.value = null;
});

watch(projectUsage, () => {
	orgName.value = null;
});

const projectUsageChoices = computed(() => [
	{ text: t('project_usage_personal'), value: 'personal' },
	{ text: t('project_usage_commercial'), value: 'commercial' },
	{ text: t('project_usage_community'), value: 'community' },
]);

async function save() {
	if (!canSave.value) return;

	isSaving.value = true;

	try {
		if (licenseChoice.value === 'key') {
			await licenseStore.activate(licenseKey.value!);
			await serverStore.hydrate();
		} else {
			const payload: Record<string, any> = { project_usage: projectUsage.value };
			if (showOrgName.value) payload.org_name = orgName.value;

			await api.patch('/settings', payload);
			await Promise.all([serverStore.hydrate(), settingsStore.hydrate()]);
		}

		model.value = false;
	} catch (err) {
		unexpectedError(err);
	} finally {
		isSaving.value = false;
	}
}

function dismiss() {
	cookies.set('license-onboarding-dismissed', 'true', {
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10),
	});

	model.value = false;
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
								:href="`https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2026_05_licensing&utm_term=${serverStore.info.version}&utm_content=license_onboarding_open_innovation_grant_link`"
								target="_blank"
							>{{ $t('open_innovation_grant') }}</a>
						</template>
					</I18nT>

					<VRadioCards v-model="licenseChoice" :items="licenseChoices" />

					<template v-if="licenseChoice === 'key'">
						<label class="field-label">{{ $t('license_key') }}</label>
						<SystemLicenseKey :value="licenseKey" @input="licenseKey = $event" />
					</template>

					<template v-else-if="licenseChoice === 'core'">
						<label class="field-label">{{ $t('project_usage') }}</label>
						<VSelect v-model="projectUsage" :items="projectUsageChoices" />

						<template v-if="showOrgName">
							<label class="field-label">{{ $t('org_name') }}</label>
							<VInput
								:model-value="orgName ?? undefined"
								:placeholder="$t('org_name_placeholder')"
								@update:model-value="orgName = $event ?? null"
							/>
						</template>
					</template>
				</VCardText>
				<VCardActions>
					<VButton secondary @click="dismiss">{{ $t('skip') }}</VButton>
					<VButton :disabled="!canSave" :loading="isSaving" @click="save">{{ $t('save') }}</VButton>
				</VCardActions>
			</div>
		</VCard>
	</VDialog>
</template>

<style scoped>
.v-card {
	max-inline-size: unset;
	inline-size: 30.375rem;
}

p {
	font-size: 0.875rem;
	line-height: 1.5;
	margin-block-end: 1.25rem;

	a {
		color: var(--theme--primary);
		text-decoration: underline;
	}
}

.v-radio-cards {
	margin-block-end: 1.25rem;
}

.field-label {
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	margin-block: 1.25rem 0.5rem;
}
</style>
