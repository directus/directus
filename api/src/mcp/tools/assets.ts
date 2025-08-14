import { z } from 'zod';
import { AssetsService } from '../../services/assets.js';
import { defineTool } from '../define.js';
import prompts from './prompts/index.js';

const AssetValidateSchema = z.strictObject({
	id: z.string(),
});

const AssetInputSchema = z.strictObject({
	id: z.string().optional().describe(''),
});

export const assets = defineTool<z.infer<typeof AssetValidateSchema>>({
	name: 'assets',
	description: prompts.assets,
	inputSchema: AssetInputSchema,
	validateSchema: AssetValidateSchema,
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
