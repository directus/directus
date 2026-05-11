import type { DeepPartial } from '@directus/types';
import type { MockLicense } from '../src/types.js';
import { createLicense } from '../src/utils.js';

const DAY = 24 * 60 * 60;
const now = () => Math.floor(Date.now() / 1000);

type Scenario = 'team' | 'team-grace' | 'team-expired' | 'oig' | 'core' | 'tiny';

const SCENARIOS: Record<Scenario, DeepPartial<MockLicense>> = {
	team: {
		meta: { name: 'Team', expires_at: now() + 365 * DAY },
	},
	'team-grace': {
		meta: { name: 'Team', expires_at: now() - 2 * DAY, grace_period: 30 * DAY },
	},
	'team-expired': {
		meta: { name: 'Team', expires_at: now() - 60 * DAY, grace_period: 30 * DAY },
	},
	oig: {
		meta: { name: 'Open Innovation Grant', expires_at: now() + 90 * DAY },
		entitlements: {
			seats: { limit: 5 },
			collections: { limit: 25 },
			flows: { limit: 10 },
			sso_enabled: { default: false },
			custom_llms_enabled: { default: false },
			custom_permission_rules_enabled: { default: false },
			production_enabled: { default: false },
			ai_translations_enabled: { default: false },
			display_powered_by: 'OIG',
		},
	},
	core: {
		meta: { name: 'Core', expires_at: now() + 365 * DAY },
		entitlements: {
			seats: { limit: 3 },
			collections: { limit: 50 },
			flows: { limit: 5 },
			sso_enabled: { default: false },
			custom_llms_enabled: { default: false },
			custom_permission_rules_enabled: { default: false },
		},
	},
	tiny: {
		meta: { name: 'Tiny', expires_at: now() + 365 * DAY },
		entitlements: {
			seats: { limit: 1 },
			collections: { limit: 1 },
			flows: { limit: 1 },
		},
	},
};

async function main() {
	const scenario = (process.argv[2] ?? 'team') as Scenario;
	const port = process.env['LICENSE_PORT'] ?? '1133';
	const baseUrl = `http://localhost:${port}`;

	if (!(scenario in SCENARIOS)) {
		console.error(`Unknown scenario: ${scenario}. Valid: ${Object.keys(SCENARIOS).join(', ')}`);
		process.exit(1);
	}

	const license = createLicense(SCENARIOS[scenario]);

	// Workaround: createLicense defaults overage_billed values to 0 but
	// the License schema expects strictly positive numbers.
	license.meta.overage_billed = { seats: 1, collections: 1, flows: 1 };

	const response = await fetch(`${baseUrl}/admin/license`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(license),
	});

	if (!response.ok) {
		console.error(`Failed to seed license (${response.status}): ${await response.text()}`);
		process.exit(1);
	}

	console.log(`Seeded ${scenario} license on ${baseUrl}`);
	console.log(``);
	console.log(`  LICENSE_KEY=${license.key}`);
	console.log(``);
	console.log(`Copy that line into api/.env then restart Directus.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
