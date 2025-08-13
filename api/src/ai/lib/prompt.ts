import { useEnv } from '@directus/env';
import { OpenAI } from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { type ZodType } from 'zod';
import { validateEnv } from '../../utils/validate-env.js';
import { z } from 'zod';

export interface PromptOptions {
	input: string;
	instructions?: string;
	formatName: string;
	formatSchema: ZodType;
	provider: 'openai';
	model: 'gpt-5' | 'gpt-5-nano' | 'gpt-5-mini';
}

export const prompt = async (opts: PromptOptions) => {
	const env = useEnv();

	validateEnv(['AI_ENABLED', 'AI_OPENAI_KEY']);

	// TODO validate AI_OPENAI_KEY is a string
	const client = new OpenAI({ apiKey: env['AI_OPENAI_KEY'] as string });

	client.responses
		.stream({
			input: opts.input,
			instructions: opts.instructions ?? null,
			model: opts.model,
			stream: true,
			// text: {
			// 	format: zodTextFormat(z.object({ test: z.string() }), opts.formatName),
			// },
		})
		.on('response.refusal.delta', (event) => {
			process.stdout.write(event.delta);
		})
		.on('response.output_text.delta', (event) => {
			process.stdout.write(event.delta);
		})
		.on('response.output_text.done', () => {
			process.stdout.write('\n');
		})
		.on('response.error', (event) => {
			console.error(event.error);
		});
};
