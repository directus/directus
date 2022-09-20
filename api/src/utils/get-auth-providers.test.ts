let factoryEnv: { [k: string]: any } = {};

jest.mock(
	'../../src/env',
	() =>
		new Proxy(
			{},
			{
				get(target, prop) {
					return factoryEnv[prop as string];
				},
			}
		)
);

import { getAuthProviders } from '../../src/utils/get-auth-providers';

const scenarios = [
	{ name: 'when no providers configured, expect empty array', input: {}, output: [] },
	{
		name: 'when provider has not recognized characters, expect empty array',
		input: { AUTH_PROVIDERS: 'go0$' },
		output: [],
	},

	{
		name: 'when no driver configured, expect empty array',
		input: {
			AUTH_PROVIDERS: 'directus',
		},
		output: [],
	},

	{
		name: 'when provider and driver are properly configured',
		input: {
			AUTH_PROVIDERS: 'directus',
			AUTH_DIRECTUS_DRIVER: 'openid',
			AUTH_DIRECTUS_LABEL: 'Directus',
			AUTH_DIRECTUS_ICON: 'hare',
		},
		output: [
			{
				name: 'directus',
				driver: 'openid',
				label: 'Directus',
				icon: 'hare',
			},
		],
	},
];

describe('get auth providers', () => {
	for (const scenario of scenarios) {
		test(scenario.name, () => {
			factoryEnv = scenario.input;
			expect(getAuthProviders()).toEqual(scenario.output);
		});
	}
});
