import type { OnboardingPayload, UserOnboarding } from '@directus/types';
import logger from '../logger.js';
import { SettingsService } from '../services/settings.js';
import { UsersService } from '../services/users.js';
import { getSchema } from './get-schema.js';

export async function collectOnboarding(userId: string) {
	const axios = (await import('axios')).default;

	const schema = await getSchema();
	const usersService = new UsersService({ schema });
	const user = await usersService.readOne(userId, { fields: ['email', 'onboarding'] });

	// Some databases that dont have a native json type may return strings
	if (typeof user?.['onboarding'] === 'string') {
		user['onboarding'] = JSON.parse(user['onboarding']);
	}

	if (!user?.['onboarding']?.['retryTransmission']) {
		return;
	}

	const settingsService = new SettingsService({ schema });
	const settings = await settingsService.readSingleton({
		fields: ['project_name', 'project_url', 'onboarding'],
	});

	if (typeof settings?.['onboarding'] === 'string') {
		settings['onboarding'] = JSON.parse(settings['onboarding']);
	}

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

	return axios.post('https://telemetry.directus.io/onboarding', payload).then(
		() => {
			const updatedUserOnboarding = {
				onboarding: { ...user?.['onboarding'], retryTransmission: false } satisfies UserOnboarding,
			};
			return usersService.updateOne(userId, updatedUserOnboarding);
		},
		(reason) => {
			logger.error(reason);
			throw reason;
		}
	);
}
