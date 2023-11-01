import type { OnboardingPayload, UserOnboarding } from '@directus/types';
import { ServerService } from '../services/server.js';
import { SettingsService } from '../services/settings.js';
import { UsersService } from '../services/users.js';
import { getSchema } from './get-schema.js';

export async function collectOnboarding(userId: string) {
	const schema = await getSchema();
	const usersService = new UsersService({ schema });
	const user = await usersService.readOne(userId, { fields: ['email', 'onboarding'] });

	if (!user?.['onboarding']?.['retry_transmission']) {
		return;
	}

	const axios = (await import('axios')).default;
	const serverService = new ServerService({ schema, accountability: { user: 'CollectOnboardingUtil', role: null } });
	const info = await serverService.serverInfo();
	const settingsService = new SettingsService({ schema });

	const settings = await settingsService.readSingleton({
		fields: ['project_name', 'project_url', 'onboarding'],
	});

	const wants_emails = user?.['onboarding']?.['wants_emails'] ?? null;

	// Only phone home if telemetry is enabled or user explicitly opted into mails
	if (info?.['telemetry']) {
		await axios.post('https://telemetry.directus.io/onboarding', {
			version: 1,
			body: {
				user: {
					email: wants_emails ? user?.['email'] : null,
					primary_skillset: user?.['onboarding']?.['primary_skillset'] ?? null,
					wants_emails,
				},
				project: {
					url: settings?.['project_url'] ?? null,
					name: settings?.['project_name'] ?? null,
					type: settings?.['onboarding']?.['project_use_case'] ?? null,
				},
			},
		} satisfies OnboardingPayload);
	} else if (wants_emails) {
		await axios.post('https://telemetry.directus.io/onboarding', {
			version: 1,
			body: {
				user: {
					email: user?.['email'] ?? null,
					wants_emails,
					primary_skillset: null,
				},
				project: {
					name: null,
					url: null,
					type: null,
				},
			},
		} satisfies OnboardingPayload);
	}

	await usersService.updateOne(userId, {
		onboarding: { ...user?.['onboarding'], retry_transmission: false } satisfies UserOnboarding,
	});
}
