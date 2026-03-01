import { useEnv } from '@directus/env';
import type { LanguageModelMiddleware } from 'ai';
import { useLogger } from '../../logger/index.js';

let devToolsMiddleware: LanguageModelMiddleware | null = null;
let devToolsInitPromise: Promise<void> | null = null;

export const initAIDevTools = async (): Promise<void> => {
	if (devToolsMiddleware) return;
	if (devToolsInitPromise) return devToolsInitPromise;

	const initPromise = (async () => {
		const env = useEnv();

		if (env['AI_DEVTOOLS_ENABLED'] !== true) return;

		const logger = useLogger();

		if (process.env['NODE_ENV'] === 'production') {
			logger.warn('AI DevTools is enabled but refused in production');
			return;
		}

		try {
			const { devToolsMiddleware: createDevToolsMiddleware } = await import('@ai-sdk/devtools');

			devToolsMiddleware = createDevToolsMiddleware();
			logger.info('AI DevTools middleware enabled. Run `npx @ai-sdk/devtools` and open http://localhost:4983');
		} catch (error) {
			logger.warn(error, 'Failed to initialize AI DevTools middleware');
		}
	})().finally(() => {
		devToolsInitPromise = null;
	});

	devToolsInitPromise = initPromise;

	return initPromise;
};

export const getDevToolsMiddleware = (): LanguageModelMiddleware | null => {
	return devToolsMiddleware;
};
