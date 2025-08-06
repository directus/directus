import type { LanguageModelV2 } from '@ai-sdk/provider';
import { useEnv } from '@directus/env';
import { memoize } from 'lodash-es';
import { validateEnv } from '../../utils/validate-env.js';

export const getModel: () => Promise<LanguageModelV2> = memoize(async () => {
	const env = useEnv();

	validateEnv(['AI_PROVIDER', 'AI_MODEL']);

	switch (env['AI_PROVIDER']) {
		case 'openai': {
			validateEnv(['AI_OPENAI_API_KEY']);

			const { createOpenAI } = await import('@ai-sdk/openai');

			return createOpenAI({
				// @TODO these env vars may or may not be strings
				apiKey: env['AI_OPENAI_API_KEY'] as string,
			})(env['AI_MODEL'] as string);
		}

		default: {
			throw new Error(`AI provider ${env['AI_PROVIDER']} is not currently supported`);
		}
	}
});
