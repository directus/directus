import type { SandboxConfig } from './services/quickjs-sandbox';

/**
 * Global configuration for the App Builder module.
 */
export const APP_BUILDER_CONFIG = {
	sandbox: {
		/**
		 * Maximum execution time for sandbox operations (in milliseconds).
		 * Default: 5000ms (5 seconds)
		 */
		timeoutMs: 5000,
	} satisfies SandboxConfig,
};
