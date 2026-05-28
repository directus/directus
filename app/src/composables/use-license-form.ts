import { computed, type MaybeRefOrGetter, ref } from 'vue';
import { toValue } from 'vue';
import { useI18n } from 'vue-i18n';

export type LicenseChoice = 'key' | 'core';

export function useLicenseForm(options: {
	projectUsage: MaybeRefOrGetter<string | null | undefined>;
	orgName: MaybeRefOrGetter<string | null | undefined>;
	isLicenseKeyValid: MaybeRefOrGetter<boolean>;
	initialChoice?: LicenseChoice | null;
}) {
	const { t } = useI18n();

	const licenseChoice = ref<LicenseChoice | null>(options.initialChoice ?? null);

	const showOrgName = computed(() => licenseChoice.value === 'core' && toValue(options.projectUsage) === 'commercial');

	const licenseChoices = computed(() => [
		{ value: 'key', label: t('license_key_option'), description: t('license_key_option_desc'), icon: 'key' },
		{ value: 'core', label: t('core_option'), description: t('core_option_desc'), icon: 'deployed_code' },
	]);

	const canProceed = computed(() => {
		if (!licenseChoice.value) return false;
		if (licenseChoice.value === 'key') return toValue(options.isLicenseKeyValid);
		if (!toValue(options.projectUsage)) return false;
		if (showOrgName.value && !toValue(options.orgName)?.trim()) return false;
		return true;
	});

	return { licenseChoice, showOrgName, licenseChoices, canProceed };
}
