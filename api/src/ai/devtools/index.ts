import { useEnv } from '@directus/env';
import { getNodeEnv } from '@directus/utils/node';
import type { LanguageModelMiddleware } from 'ai';
import { useLogger } from '../../logger/index.js';

let devToolsMiddleware: LanguageModelMiddleware | null = null;
let devToolsInitPromise: Promise<void> | null = null;

async function doDevToolsInit(): Promise<void> {
	const env = useEnv();

	if (env['AI_DEVTOOLS_ENABLED'] !== true) return;

	const logger = useLogger();

	if (getNodeEnv() === 'production') {
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
}

export const initAIDevTools = async (): Promise<void> => {
	if (devToolsMiddleware) return;
	if (devToolsInitPromise) return devToolsInitPromise;

	const initPromise = doDevToolsInit().finally(() => {
		devToolsInitPromise = null;
	});

	devToolsInitPromise = initPromise;

	return initPromise;
};

export const getDevToolsMiddleware = (): LanguageModelMiddleware | null => {
	return devToolsMiddleware;
};
