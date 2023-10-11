import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import type { OnboardingPayload } from '@directus/types';

export async function collectOnboarding() {
	const settingsStore = useSettingsStore();
	const userStore = useUserStore();

	await Promise.all([settingsStore.hydrate(), userStore.hydrate()]);

	const payload: OnboardingPayload = {
		version: 1,
		body: {
			user: {
				primary_skillset: userStore.currentUser?.onboarding?.primary_skillset,
				wants_emails: userStore.currentUser?.onboarding?.wants_emails,
			},
			project: {
				name: settingsStore.settings?.project_name,
				url: settingsStore.settings?.project_url,
				type: settingsStore.settings?.onboarding?.project_use_case,
			},
		},
	};

	return Promise.reject('I dont wanna');
	// return api.post('https://telemetry.directus.io/onboarding', payload);
}
