import { AssetsService } from '@/services/assets.js';
import { FilesService } from '@/services/files.js';
import { requireText } from '@/utils/require-text.js';
import { UnsupportedMediaTypeError } from '@directus/errors';
import type { TransformationSet } from '@directus/types';
import { z } from 'zod';
import { defineTool } from '../define-tool.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const AssetsValidateSchema = z.strictObject({
	id: z.string(),
});

const AssetsInputSchema = z.object({
	id: z.string(),
});

export const assets = defineTool<z.infer<typeof AssetsValidateSchema>>({
	name: 'assets',
	description: requireText(resolve(__dirname, './prompt.md')),
	annotations: {
		title: 'Directus - Assets',
	},
	inputSchema: AssetsInputSchema,
	validateSchema: AssetsValidateSchema,
	async handler({ args, schema, accountability }) {
		const serviceOptions = {
			accountability,
			schema,
		};

		const filesService = new FilesService(serviceOptions);

		const file = await filesService.readOne(args.id, { limit: 1 });

		if (!file.type || !['image', 'audio'].some((t) => file.type?.startsWith(t))) {
			throw new UnsupportedMediaTypeError({ mediaType: file.type ?? 'unknown', where: 'asset tool' });
		}

		let transformation: TransformationSet | undefined = undefined;

		// ensure image dimensions are within allowable LLM limits
		if (file.type.startsWith('image') && file.width && file.height && (file.width > 1200 || file.height > 1200)) {
			transformation = {
				transformationParams: {
					transforms:
						file.width > file.height
							? [['resize', { width: 800, fit: 'contain' }]]
							: [['resize', { height: 800, fit: 'contain' }]],
				},
			};
		}

		const assetsService = new AssetsService(serviceOptions);

		const asset = await assetsService.getAsset(args.id, transformation);

		const chunks = [];

		for await (const chunk of asset.stream) {
			chunks.push(Buffer.from(chunk));
		}

		return {
			type: file.type.startsWith('image') ? 'image' : 'audio',
			data: Buffer.concat(chunks).toString('base64'),
			mimeType: file.type,
		};
	},
});
