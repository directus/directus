import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
	{
		extends: './vitest.config.ts',
		test: {
			name: 'common',
			include: ['tests/common/**/*.test.ts', 'common/common.test.ts'],
			globalSetup: './setup/setup.ts',
		},
	},
	{
		extends: './vitest.config.ts',
		test: {
			name: 'db',
			include: ['tests/db/**/*.test.ts', 'common/common.test.ts'],
			globalSetup: './setup/setup.ts',
		},
	},
]);
