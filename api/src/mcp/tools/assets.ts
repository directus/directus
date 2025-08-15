import { z } from 'zod';
import { AssetsService } from '../../services/assets.js';
import { defineTool } from '../define.js';
import prompts from './prompts/index.js';

const AssetsValidateSchema = z.strictObject({
	id: z.string(),
});

const AssetsInputSchema = z.object({
	id: z.string(),
});

export const assets = defineTool<z.infer<typeof AssetsValidateSchema>>({
	name: 'assets',
	description: prompts.assets,
	inputSchema: AssetsInputSchema,
	validateSchema: AssetsValidateSchema,
	async handler({ args, schema, accountability }) {
		const assetsService = new AssetsService({
			accountability,
			schema,
		});

		const asset = await assetsService.getAsset(args.id);

		const chunks = [];

		for await (const chunk of asset.stream) {
			chunks.push(Buffer.from(chunk));
		}

		return {
			type: 'image',
			data: Buffer.concat(chunks).toString('base64'),
			mimeType: 'image/png',
		};
	},
});
