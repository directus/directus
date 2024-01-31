import { useEnv } from '@directus/env';
import type { OnboardingPayload, UserOnboarding } from '@directus/types';
import { SettingsService } from '../services/settings.js';
import { UsersService } from '../services/users.js';
import { getSchema } from './get-schema.js';

export async function collectOnboarding(userId: string) {
	const env = useEnv();
	const schema = await getSchema();
	const usersService = new UsersService({ schema });
	const user = await usersService.readOne(userId, { fields: ['email', 'onboarding'] });

	if (!user?.['onboarding']?.['retry_transmission']) {
		return;
	}

	const axios = (await import('axios')).default;
	const isTelemetryEnabled = env['TELEMETRY'];
	const endpointOnboarding = new URL('/v1/onboarding', env['TELEMETRY_URL'] as string).toString();
	const settingsService = new SettingsService({ schema });
	const headers: HeadersInit = {};

	if (env['TELEMETRY_AUTHORIZATION']) {
		headers['Authorization'] = env['TELEMETRY_AUTHORIZATION'] as string;
	}

	const settings = await settingsService.readSingleton({
		fields: ['project_name', 'project_url', 'onboarding'],
	});

	const wants_emails = user?.['onboarding']?.['wants_emails'] ?? null;

	// Only phone home if telemetry is enabled or user explicitly opted into mails
	if (isTelemetryEnabled) {
		await axios.post(
			endpointOnboarding,
			{
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
			} satisfies OnboardingPayload,
			{ headers },
		);
	} else if (wants_emails) {
		await axios.post(
			endpointOnboarding,
			{
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
			} satisfies OnboardingPayload,
			{ headers },
		);
	}

	await usersService.updateOne(userId, {
		onboarding: { ...user?.['onboarding'], retry_transmission: false } satisfies UserOnboarding,
	});
}
