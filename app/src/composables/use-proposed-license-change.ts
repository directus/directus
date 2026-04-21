import api from '@/api';
import { LICENSE_CHANGE_BLOCKED } from '@/modules/licensing/constants';
import type { LicenseDeactivationAssessment } from '@/types/license';

type ApplyProposedKeyResult =
	| { status: 'applied' }
	| {
			status: 'blocked';
			assessment: LicenseDeactivationAssessment;
	  };

export function useProposedLicenseChange() {
	async function checkProposedKey(licenseKey: string): Promise<LicenseDeactivationAssessment> {
		const { data } = await api.post('/server/license/change-assessment', { license_key: licenseKey });
		return data.data as LicenseDeactivationAssessment;
	}

	function getBlockedAssessment(error: unknown): LicenseDeactivationAssessment | null {
		const extensions = (error as any)?.response?.data?.errors?.[0]?.extensions;

		if (extensions?.code !== LICENSE_CHANGE_BLOCKED) {
			return null;
		}

		return extensions.assessment ?? null;
	}

	async function applyProposedKey(licenseKey: string): Promise<ApplyProposedKeyResult> {
		try {
			await api.patch('/settings', { license_key: licenseKey });
			return { status: 'applied' };
		} catch (error) {
			const blockedAssessment = getBlockedAssessment(error);

			if (blockedAssessment) {
				return {
					status: 'blocked',
					assessment: blockedAssessment,
				};
			}

			throw error;
		}
	}

	return { checkProposedKey, applyProposedKey, getBlockedAssessment };
}
