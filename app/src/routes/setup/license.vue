<script setup lang="ts">
import { SetupForm } from '@directus/types';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { defaultValues, useKycFields, useLicenseFields } from './form';
import VButton from '@/components/v-button.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VRadioCards from '@/components/v-radio-cards.vue';
import { useLicenseForm } from '@/composables/use-license-form';
import { useServerStore } from '@/stores/server';

const { t } = useI18n();

withDefaults(
	defineProps<{
		modelValue?: Partial<SetupForm>;
		initialValues?: SetupForm;
	}>(),
	{
		initialValues: () => defaultValues,
		modelValue: () => ({}),
	},
);

const value = defineModel<SetupForm>();

const licenseFields = useLicenseFields();
const kycFields = useKycFields();
const serverStore = useServerStore();

const { licenseChoice, showOrgName, licenseChoices, canProceed } = useLicenseForm({
	projectUsage: () => value.value?.owner?.project_usage,
	orgName: () => value.value?.owner?.org_name,
	isLicenseKeyValid: () => !!value.value?.license_key,
	initialChoice: value.value?.license_key ? 'key' : null,
});

watch(licenseChoice, (choice) => {
	if (!value.value) return;

	if (choice === 'key') {
		value.value = {
			...value.value,
			owner: { ...value.value.owner, project_usage: null, org_name: null },
		};
	} else {
		value.value = { ...value.value, license_key: null };
	}
});

watch(
	() => value.value?.owner?.project_usage,
	(usage, prev) => {
		if (prev === 'commercial' && usage !== 'commercial' && value.value) {
			value.value = { ...value.value, owner: { ...value.value.owner, org_name: null } };
		}
	},
);

const visibleKycFields = computed(() =>
	showOrgName.value ? kycFields.value : kycFields.value.filter((f) => f.field !== 'org_name'),
);

// VForm.setValue uses selectiveClone which only keeps fields it knows about, so binding
// v-model directly to the full parent form would wipe admin fields on any KYC interaction.
// These slice computeds merge field-specific updates back into the full form instead.
const licenseKeySlice = computed({
	get: () => ({ license_key: value.value?.license_key ?? null }),
	set: (update: { license_key?: string | null }) => {
		if (value.value) value.value = { ...value.value, ...update };
	},
});

const kycSlice = computed({
	get: () => ({
		project_usage: value.value?.owner?.project_usage ?? null,
		org_name: value.value?.owner?.org_name ?? null,
	}),
	set: (update: { project_usage?: SetupForm['owner']['project_usage']; org_name?: string | null }) => {
		if (!value.value) return;

		value.value = {
			...value.value,
			owner: {
				...value.value.owner,
				...(update.project_usage !== undefined && { project_usage: update.project_usage }),
				...(update.org_name !== undefined && { org_name: update.org_name }),
			},
		};
	},
});

defineExpose({ canProceed });
</script>

<template>
	<div class="license-form">
		<VRadioCards v-model="licenseChoice" :items="licenseChoices" />

		<VForm
			v-if="licenseChoice === 'key'"
			v-model="licenseKeySlice"
			:show-validation-errors="false"
			:fields="licenseFields"
			disabled-menu
		/>

		<VForm
			v-else-if="licenseChoice === 'core'"
			v-model="kycSlice"
			:show-validation-errors="false"
			:fields="visibleKycFields"
			disabled-menu
		/>

		<div v-if="licenseChoice === 'key'" class="get-license-key">
			{{ $t('no_license_key') }}
			<VButton
				secondary
				:href="`https://directus.io/license-request?utm_source=self_hosted&utm_medium=product&utm_campaign=2025_10_kyc&utm_term=${serverStore.info.version}&utm_content=onboarding_get_license_link`"
				target="_blank"
			>
				<VIcon name="key" />
				{{ $t('get_license_key') }}
			</VButton>
		</div>
	</div>
</template>

<style scoped>
.license-form {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: 1.8125rem;
}

.v-form {
	--theme--form--row-gap: 1.8125rem;
}

.get-license-key {
	display: flex;
	font-weight: 600;
	align-items: center;
	justify-content: space-between;
	padding: 1.8125rem;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);

	.v-button {
		--v-button-background-color: var(--theme--background-accent);
		--v-button-background-color-hover: var(--theme--background-normal);

		.v-icon {
			margin-inline-end: 0.6875rem;
		}
	}
}
</style>
