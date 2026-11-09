import { defineConfig } from 'vitest/config';

declare module 'vitest' {
	export interface ProvidedContext {
		/** Host port the Redis spun up by the integration global setup is reachable on */
		redisPort: number;
	}
}

export default defineConfig({
	test: {
		// Only takes effect at the root, so it's set here rather than on the integration project
		// that actually needs it to tear its container down
		teardownTimeout: 60000,
		projects: [
			{
				test: {
					name: 'unit',
					include: ['src/**/*.test.ts'],
				},
			},
			{
				test: {
					// Needs Docker, so it's only run when selected with `--project integration`
					name: 'integration',
					include: ['test/**/*.test.ts'],
					globalSetup: './test/global-setup.ts',
					// Pulling the image and waiting for the healthcheck on a cold run takes a while
					hookTimeout: 120000,
					testTimeout: 30000,
				},
			},
		],
	},
});
