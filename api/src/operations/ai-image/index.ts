import { Readable } from 'node:stream';
import {
	AI_IMAGE_REFERENCE_MIME_TYPES,
	DEFAULT_ASPECT_RATIO,
	findImageModel,
	getImageSizeSetting,
	getMaxImagesPerCall,
	type ImageProviderType,
	isImageProviderType,
} from '@directus/ai';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { defineOperationApi } from '@directus/extensions';
import type { Accountability, SchemaOverview } from '@directus/types';
import { isValidUuid } from '@directus/utils';
import { generateImage } from 'ai';
import type { Knex } from 'knex';
import {
	assertAIEnabled,
	getFileIds,
	getOperationAccountability,
	type ModelFile,
	parseModelKey,
	readFilesForModel,
	readPrompt,
	toOperationError,
} from '../../ai/flow-operations/utils.js';
import { resolveImageModel } from '../../ai/providers/resolve-model.js';
import { getAISettings } from '../../ai/providers/settings.js';
import { fetchAllowedFields } from '../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { validateAccess } from '../../permissions/modules/validate-access/validate-access.js';
import { AssetsService } from '../../services/assets.js';
import { FilesService } from '../../services/files.js';

type Options = {
	model: string; // `${provider}:${model}`
	prompt: unknown;
	referenceImages?: unknown; // file ids, comma-separated ids, or file objects
	aspectRatio?: string | null; // e.g. 16:9 or `reference`, snapped to the closest ratio the model supports
	count?: number | null;
	quality?: 'low' | 'medium' | 'high' | null;
	transparent?: boolean;
	folder?: string | null;
	title?: string | null;
	permissions?: string; // $public, $trigger, $full, or UUID of a role
	emitEvents?: boolean;
};

const MAX_IMAGES = 4;

export default defineOperationApi<Options>({
	id: 'ai-image',

	handler: async (options, { accountability, database, getSchema }) => {
		assertAIEnabled();

		const { provider, model: modelId } = parseModelKey(options.model);

		if (!isImageProviderType(provider)) {
			throw new InvalidPayloadError({ reason: `Image generation supports OpenAI, Google, and OpenRouter models` });
		}

		const prompt = readPrompt(options.prompt);

		const referenceIds = getFileIds(options.referenceImages);

		const count = Math.min(Math.max(Math.floor(Number(options.count)) || 1, 1), MAX_IMAGES);

		const schema = await getSchema({ database });

		const settings = await getAISettings({ knex: database, schema });
		const model = resolveImageModel(provider, modelId, settings);

		const opAccountability = await getOperationAccountability(options.permissions, {
			accountability,
			database,
			schema,
		});

		await assertCanSave(options.folder, opAccountability, { schema, knex: database });

		const assets = new AssetsService({ schema, accountability: opAccountability, knex: database });
		const references = await readFilesForModel(assets, referenceIds, AI_IMAGE_REFERENCE_MIME_TYPES);

		const maxImagesPerCall = getMaxImagesPerCall(provider, modelId);

		const result = await generateImage({
			model,
			prompt: references.length > 0 ? { text: prompt, images: references.map((file) => file.data) } : prompt,
			n: count,
			...(maxImagesPerCall ? { maxImagesPerCall } : {}),
			...getImageSizeSetting(provider, modelId, getRequestedRatio(options.aspectRatio, references)),
			providerOptions: getProviderOptions(provider, modelId, options),
		}).catch((error) => {
			throw toOperationError(error, provider);
		});

		const filesService = new FilesService({ schema, accountability: opAccountability, knex: database });
		const files = [];

		// Gemini can return more than one image in a reply
		const images = result.images.slice(0, count);

		for (const [index, image] of images.entries()) {
			const extension = image.mediaType.split('/')[1] ?? 'png';
			const title = options.title || 'AI image';

			files.push(
				await filesService.uploadOne(
					Readable.from(Buffer.from(image.uint8Array)),
					{
						type: image.mediaType,
						title: images.length > 1 ? `${title} (${index + 1})` : title,
						filename_download: `ai-image-${Date.now()}-${index + 1}.${extension}`,
						...(options.folder ? { folder: options.folder } : {}),
					},
					undefined,
					// Off by default, so a flow that runs on file uploads doesn't run again for every image it makes
					{ emitEvents: !!options.emitEvents },
				),
			);
		}

		const warnings: unknown[] = [...(result.warnings ?? [])];

		// Google makes one request per image and skips ones that come back without an image
		if (files.length < count) {
			warnings.push({ type: 'other', message: `Asked for ${count} images and got ${files.length}` });
		}

		return { files, model: options.model, warnings };
	},
});

/**
 * Fails before paying for images that couldn't be saved. Access is checked before the folder, so a caller who can't
 * save files can't use this to learn which folder ids exist. Validation rules on files only run when saving, so those
 * can still fail after the images are made.
 */
async function assertCanSave(
	folder: string | null | undefined,
	accountability: Accountability | null,
	context: { schema: SchemaOverview; knex: Knex },
) {
	if (accountability && !accountability.admin) {
		const options = { accountability, action: 'create', collection: 'directus_files' } as const;

		await validateAccess(options, context);

		// The fields FilesService sets when it saves an upload
		const needed = ['storage', 'type', 'title', 'filename_download', ...(folder ? ['folder'] : [])];
		const allowed = await fetchAllowedFields(options, context);
		const missing = allowed.includes('*') ? [] : needed.filter((field) => !allowed.includes(field));

		if (missing.length > 0) {
			throw new ForbiddenError({
				reason: `Saving the images needs create access to these file fields: ${missing.join(', ')}`,
			});
		}
	}

	if (folder) {
		const exists =
			isValidUuid(folder) && (await context.knex.select('id').from('directus_folders').where({ id: folder }).first());

		if (!exists) throw new InvalidPayloadError({ reason: `Folder "${folder}" doesn't exist` });
	}
}

/** `reference` uses the first reference image's shape. Without one it falls back to square. */
function getRequestedRatio(aspectRatio: string | null | undefined, references: ModelFile[]): string {
	if (aspectRatio !== 'reference') return aspectRatio || DEFAULT_ASPECT_RATIO;

	const { width, height } = references[0] ?? {};
	return width && height ? `${width}:${height}` : DEFAULT_ASPECT_RATIO;
}

/** The SDK maps these to OpenAI's field names. Transparency is skipped for models the catalog says can't do it. */
function getProviderOptions(provider: ImageProviderType, modelId: string, options: Options) {
	if (provider !== 'openai') return {};

	const transparent = options.transparent && findImageModel(provider, modelId)?.transparency !== false;

	return {
		openai: {
			...(options.quality ? { quality: options.quality } : {}),
			...(transparent ? { background: 'transparent', outputFormat: 'png' } : {}),
		},
	};
}
