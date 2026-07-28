import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';
import { type LicenseChoice, useLicenseForm } from './use-license-form';

const i18n = createI18n({ legacy: false });

beforeAll(() => {
	vi.spyOn(i18n.global, 't').mockImplementation((key) => key as any);
});

function mountComposable(options?: {
	projectUsage?: string | null;
	orgName?: string | null;
	isLicenseKeyValid?: boolean;
	initialChoice?: LicenseChoice | null;
}) {
	const projectUsage = ref(options?.projectUsage ?? null);
	const orgName = ref(options?.orgName ?? null);
	const isLicenseKeyValid = ref(options?.isLicenseKeyValid ?? false);

	let result!: ReturnType<typeof useLicenseForm>;

	mount(
		defineComponent({
			setup() {
				result = useLicenseForm({
					projectUsage,
					orgName,
					isLicenseKeyValid,
					initialChoice: options?.initialChoice,
				});

				return result;
			},
			render: () => h('div'),
		}),
		{ global: { plugins: [i18n] } },
	);

	return { result, projectUsage, orgName, isLicenseKeyValid };
}

describe('useLicenseForm', () => {
	describe('licenseChoice', () => {
		test('defaults to null', () => {
			const { result } = mountComposable();
			expect(result.licenseChoice.value).toBeNull();
		});

		test('initializes to provided initialChoice', () => {
			const { result } = mountComposable({ initialChoice: 'key' });
			expect(result.licenseChoice.value).toBe('key');
		});
	});

	describe('licenseChoices', () => {
		test('returns key and core options', () => {
			const { result } = mountComposable();
			const values = result.licenseChoices.value.map((c) => c.value);
			expect(values).toEqual(['key', 'core']);
		});
	});

	describe('showOrgName', () => {
		test('is false when no choice is made', () => {
			const { result } = mountComposable();
			expect(result.showOrgName.value).toBe(false);
		});

		test('is false when choice is key', () => {
			const { result } = mountComposable({ initialChoice: 'key' });
			expect(result.showOrgName.value).toBe(false);
		});

		test('is false when choice is core but usage is not commercial', () => {
			const { result } = mountComposable({ initialChoice: 'core', projectUsage: 'personal' });
			expect(result.showOrgName.value).toBe(false);
		});

		test('is true when choice is core and usage is commercial', () => {
			const { result } = mountComposable({ initialChoice: 'core', projectUsage: 'commercial' });
			expect(result.showOrgName.value).toBe(true);
		});

		test('reacts to projectUsage changes', async () => {
			const { result, projectUsage } = mountComposable({ initialChoice: 'core' });
			expect(result.showOrgName.value).toBe(false);
			projectUsage.value = 'commercial';
			await nextTick();
			expect(result.showOrgName.value).toBe(true);
		});
	});

	describe('canProceed', () => {
		test('is false when no choice', () => {
			const { result } = mountComposable();
			expect(result.canProceed.value).toBe(false);
		});

		test('is false when choice is key and key is invalid', () => {
			const { result } = mountComposable({ initialChoice: 'key', isLicenseKeyValid: false });
			expect(result.canProceed.value).toBe(false);
		});

		test('is true when choice is key and key is valid', () => {
			const { result } = mountComposable({ initialChoice: 'key', isLicenseKeyValid: true });
			expect(result.canProceed.value).toBe(true);
		});

		test('is false when choice is core and no projectUsage', () => {
			const { result } = mountComposable({ initialChoice: 'core' });
			expect(result.canProceed.value).toBe(false);
		});

		test('is true when choice is core and projectUsage is set (non-commercial)', () => {
			const { result } = mountComposable({ initialChoice: 'core', projectUsage: 'personal' });
			expect(result.canProceed.value).toBe(true);
		});

		test('is false when showOrgName and orgName is empty', () => {
			const { result } = mountComposable({ initialChoice: 'core', projectUsage: 'commercial', orgName: '' });
			expect(result.canProceed.value).toBe(false);
		});

		test('is false when showOrgName and orgName is only whitespace', () => {
			const { result } = mountComposable({ initialChoice: 'core', projectUsage: 'commercial', orgName: '   ' });
			expect(result.canProceed.value).toBe(false);
		});

		test('is true when showOrgName and orgName is set', () => {
			const { result } = mountComposable({ initialChoice: 'core', projectUsage: 'commercial', orgName: 'Acme' });
			expect(result.canProceed.value).toBe(true);
		});

		test('reacts to isLicenseKeyValid changes', async () => {
			const { result, isLicenseKeyValid } = mountComposable({ initialChoice: 'key', isLicenseKeyValid: false });
			expect(result.canProceed.value).toBe(false);
			isLicenseKeyValid.value = true;
			await nextTick();
			expect(result.canProceed.value).toBe(true);
		});
	});
});
