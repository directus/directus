import type { OnboardingPayload, UserOnboarding } from '@directus/types';
import { SettingsService } from '../services/settings.js';
import { UsersService } from '../services/users.js';
import { getSchema } from './get-schema.js';

export async function collectOnboarding(userId: string) {
	const axios = (await import('axios')).default;

	const schema = await getSchema();
	const usersService = new UsersService({ schema });
	const user = await usersService.readOne(userId, { fields: ['email', 'onboarding'] });

	if (!user?.['onboarding']?.['retry_transmission']) {
		return;
	}

	const settingsService = new SettingsService({ schema });

	const settings = await settingsService.readSingleton({
		fields: ['project_name', 'project_url', 'onboarding'],
	});

	const payload: OnboardingPayload = {
		version: 1,
		body: {
			user: {
				email: user?.['email'] ?? null,
				primary_skillset: user?.['onboarding']?.['primary_skillset'] ?? null,
				wants_emails: user?.['onboarding']?.['wants_emails'] ?? null,
			},
			project: {
				url: settings?.['project_url'] ?? null,
				name: settings?.['project_name'] ?? null,
				type: settings?.['onboarding']?.['project_use_case'] ?? null,
			},
		},
	};

	await axios.post('https://telemetry.directus.io/onboarding', payload);

	const updatedUserOnboarding = {
		onboarding: { ...user?.['onboarding'], retry_transmission: false } satisfies UserOnboarding,
	};

	await usersService.updateOne(userId, updatedUserOnboarding);
}
