import { InvalidPayloadError } from '@directus/errors';
import { APICallError, generateImage } from 'ai';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { readFilesForModel } from '../../ai/flow-operations/utils.js';
import { resolveImageModel } from '../../ai/providers/index.js';
import { fetchAllowedFields } from '../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { validateAccess } from '../../permissions/modules/validate-access/validate-access.js';
import config from './index.js';

vi.mock('ai', async (importOriginal) => ({
	...(await importOriginal<typeof import('ai')>()),
	generateImage: vi.fn(),
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: () => ({ warn: vi.fn() }),
}));

vi.mock('../../ai/providers/index.js', () => ({
	getAISettings: vi.fn(async () => ({})),
	resolveImageModel: vi.fn(() => 'mock-image-model'),
}));

vi.mock('../../ai/flow-operations/utils.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('../../ai/flow-operations/utils.js')>()),
	getOperationAccountability: vi.fn(async () => ({ user: 'user-1' })),
	readFilesForModel: vi.fn(),
}));

vi.mock('../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js', () => ({
	fetchAllowedFields: vi.fn(),
}));

vi.mock('../../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('../../services/assets.js', () => ({
	AssetsService: vi.fn(),
}));

const uploadOne = vi.fn();

vi.mock('../../services/files.js', () => ({
	FilesService: vi.fn().mockImplementation(function () {
		return { uploadOne };
	}),
}));

const FOLDER = 'e591754c-d673-11ee-a506-0242ac120002';

const folderRow = vi.fn<() => Promise<unknown>>();

const database = {
	select: () => ({ from: () => ({ where: () => ({ first: folderRow }) }) }),
};

const context = { accountability: null, database, getSchema: vi.fn(async () => ({})) } as any;

beforeEach(() => {
	folderRow.mockResolvedValue({ id: FOLDER });
	vi.mocked(fetchAllowedFields).mockResolvedValue(['*']);
	vi.mocked(readFilesForModel).mockResolvedValue([]);

	vi.mocked(generateImage).mockResolvedValue({
		images: [{ uint8Array: new Uint8Array([1, 2, 3]), mediaType: 'image/png' }],
		warnings: [],
	} as any);

	uploadOne.mockResolvedValueOnce('file-1').mockResolvedValueOnce('file-2');
});

afterEach(() => {
	vi.clearAllMocks();
	uploadOne.mockReset();
	folderRow.mockReset();
	vi.mocked(fetchAllowedFields).mockReset();
	vi.mocked(validateAccess).mockReset();
});

describe('Operations / AI Image', () => {
	test('generates and saves an image', async () => {
		const result = await config.handler(
			{ model: 'openai:gpt-image-2.5-flare', prompt: 'A red bicycle', aspectRatio: '16:9', folder: FOLDER },
			context,
		);

		expect(resolveImageModel).toHaveBeenCalledWith('openai', 'gpt-image-2.5-flare', {});

		expect(generateImage).toHaveBeenCalledWith(
			expect.objectContaining({ model: 'mock-image-model', prompt: 'A red bicycle', n: 1, size: '1536x864' }),
		);

		expect(uploadOne).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ type: 'image/png', title: 'AI image', folder: FOLDER }),
			undefined,
			{ emitEvents: false },
		);

		expect(result).toEqual({
			files: ['file-1'],
			model: 'openai:gpt-image-2.5-flare',
			warnings: [],
		});
	});

	test('uses an aspect ratio for Google models', async () => {
		await config.handler({ model: 'google:gemini-nano-banana-2.1', prompt: 'A cat', aspectRatio: '9:16' }, context);

		expect(generateImage).toHaveBeenCalledWith(expect.objectContaining({ aspectRatio: '9:16', providerOptions: {} }));
	});

	test('sends OpenAI quality and transparency', async () => {
		await config.handler(
			{ model: 'openai:gpt-image-2.5-flare', prompt: 'A logo', quality: 'high', transparent: true },
			context,
		);

		expect(generateImage).toHaveBeenCalledWith(
			expect.objectContaining({
				providerOptions: { openai: { quality: 'high', background: 'transparent', outputFormat: 'png' } },
			}),
		);
	});

	test('skips transparency for models without it', async () => {
		await config.handler({ model: 'openai:gpt-image-2', prompt: 'A logo', transparent: true }, context);

		expect(generateImage).toHaveBeenCalledWith(expect.objectContaining({ providerOptions: { openai: {} } }));
	});

	test('checks the files can be saved before generating', async () => {
		vi.mocked(validateAccess).mockRejectedValueOnce(new Error('Forbidden'));

		await expect(config.handler({ model: 'openai:gpt-image-2.5-flare', prompt: 'A cat' }, context)).rejects.toThrow(
			'Forbidden',
		);

		expect(validateAccess).toHaveBeenCalledWith(
			expect.objectContaining({ action: 'create', collection: 'directus_files' }),
			expect.anything(),
		);

		expect(generateImage).not.toHaveBeenCalled();
	});

	test.each([
		['missing', FOLDER],
		['not an id', 'folder-1'],
	])('rejects a folder that is %s before generating', async (_, folder) => {
		folderRow.mockResolvedValue(undefined);

		await expect(
			config.handler({ model: 'openai:gpt-image-2.5-flare', prompt: 'A cat', folder }, context),
		).rejects.toThrow(`Folder "${folder}" doesn't exist`);

		expect(generateImage).not.toHaveBeenCalled();
	});

	test("gives a caller who can't save files the same error whether or not the folder exists", async () => {
		vi.mocked(validateAccess).mockRejectedValue(new Error('Forbidden'));

		const run = () => config.handler({ model: 'openai:gpt-image-2.5-flare', prompt: 'A cat', folder: FOLDER }, context);

		await expect(run()).rejects.toThrow('Forbidden');
		folderRow.mockResolvedValue(undefined);
		await expect(run()).rejects.toThrow('Forbidden');
		expect(folderRow).not.toHaveBeenCalled();
	});

	test('checks the file fields an upload sets before generating', async () => {
		vi.mocked(fetchAllowedFields).mockResolvedValue(['title', 'type']);

		await expect(
			config.handler({ model: 'openai:gpt-image-2.5-flare', prompt: 'A cat', folder: FOLDER }, context),
		).rejects.toThrow('storage, filename_download, folder');

		expect(generateImage).not.toHaveBeenCalled();
	});

	test('saves no more images than asked for', async () => {
		vi.mocked(generateImage).mockResolvedValueOnce({
			images: [1, 2, 3].map((n) => ({ uint8Array: new Uint8Array([n]), mediaType: 'image/png' })),
			warnings: [],
		} as any);

		await config.handler({ model: 'google:gemini-nano-banana-2.1', prompt: 'A cat', count: 2 }, context);

		expect(uploadOne).toHaveBeenCalledTimes(2);
	});

	test('keeps the request out of provider errors', async () => {
		vi.mocked(generateImage).mockRejectedValueOnce(
			new APICallError({
				message: 'Rejected request',
				url: 'https://api.openai.com/v1/images/edits',
				requestBodyValues: { image: 'PRIVATE IMAGE' },
				statusCode: 400,
			}),
		);

		const handler = config.handler(
			{ model: 'openai:gpt-image-2.5-flare', prompt: 'A cat' },
			context,
		) as Promise<unknown>;

		const error = await handler.catch((error: any) => error);

		expect(error).toBeInstanceOf(InvalidPayloadError);
		expect(JSON.stringify(error)).not.toContain('PRIVATE IMAGE');
	});

	test('warns when fewer images come back than asked for', async () => {
		const result = await config.handler({ model: 'google:gemini-nano-banana-2.1', prompt: 'A cat', count: 2 }, context);

		expect(result).toEqual(
			expect.objectContaining({ warnings: [{ type: 'other', message: 'Asked for 2 images and got 1' }] }),
		);
	});

	test('sends reference images with the prompt', async () => {
		vi.mocked(readFilesForModel).mockResolvedValue([mockFile(1600, 900)]);

		await config.handler(
			{ model: 'openai:gpt-image-2.5-flare', prompt: 'Make it blue', referenceImages: ['file-9'] },
			context,
		);

		expect(generateImage).toHaveBeenCalledWith(
			expect.objectContaining({ prompt: { text: 'Make it blue', images: [Buffer.from('ref')] } }),
		);
	});

	test.each([
		['the reference image shape', 'google:gemini-nano-banana-2.1', [mockFile(1080, 1920)], { aspectRatio: '9:16' }],
		['square without a reference', 'openai:gpt-image-2.5-flare', [], { size: '1024x1024' }],
	])('matching the reference uses %s', async (_, model, references, expected) => {
		vi.mocked(readFilesForModel).mockResolvedValue(references);

		await config.handler({ model, prompt: 'Restyle', referenceImages: ['file-9'], aspectRatio: 'reference' }, context);

		expect(generateImage).toHaveBeenCalledWith(expect.objectContaining(expected));
	});

	test.each([
		[10, 4],
		[2.5, 2],
	])('asks for %s images as %s', async (count, n) => {
		await config.handler({ model: 'openai:gpt-image-2.5-flare', prompt: 'A cat', count }, context);

		expect(generateImage).toHaveBeenCalledWith(expect.objectContaining({ n }));
	});

	test.each(['anthropic:claude-sonnet-4-6', 'openai-compatible:flux'])('rejects %s', async (model) => {
		await expect(config.handler({ model, prompt: 'A cat' }, context)).rejects.toThrow(InvalidPayloadError);
	});

	test.each([
		['google:gemini-nano-banana-2.1', 1],
		['openai:gpt-image-2.5-flare', undefined],
	])('sets the images per request for %s to %s', async (model, maxImagesPerCall) => {
		await config.handler({ model, prompt: 'A cat', count: 3 }, context);

		expect(vi.mocked(generateImage).mock.calls[0]![0].maxImagesPerCall).toBe(maxImagesPerCall);
	});

	test('reads reference ids from the data chain as images only', async () => {
		vi.mocked(readFilesForModel).mockResolvedValue([mockFile(1024, 1024)]);

		await config.handler(
			{ model: 'openai:gpt-image-2.5-flare', prompt: 'A cat', referenceImages: 'file-1, file-2' },
			context,
		);

		expect(readFilesForModel).toHaveBeenCalledWith(
			expect.anything(),
			['file-1', 'file-2'],
			['image/jpeg', 'image/png', 'image/webp'],
		);
	});

	test('emits upload events only when asked to', async () => {
		await config.handler({ model: 'openai:gpt-image-2.5-flare', prompt: 'A cat', emitEvents: true }, context);

		expect(uploadOne).toHaveBeenCalledWith(expect.anything(), expect.anything(), undefined, { emitEvents: true });
	});

	test('checks the provider is set up before reading reference images', async () => {
		vi.mocked(resolveImageModel).mockImplementationOnce(() => {
			throw new Error('No API key configured for AI provider');
		});

		await expect(
			config.handler({ model: 'openai:gpt-image-2.5-flare', prompt: 'A cat', referenceImages: ['file-1'] }, context),
		).rejects.toThrow('No API key');

		expect(readFilesForModel).not.toHaveBeenCalled();
	});

	test('numbers the titles of multiple images', async () => {
		vi.mocked(generateImage).mockResolvedValueOnce({
			images: [
				{ uint8Array: new Uint8Array([1]), mediaType: 'image/png' },
				{ uint8Array: new Uint8Array([2]), mediaType: 'image/png' },
			],
			warnings: [],
		} as any);

		const result = await config.handler(
			{ model: 'openai:gpt-image-2.5-flare', prompt: 'A cat', count: 2, title: 'Cat' },
			context,
		);

		expect(uploadOne.mock.calls.map(([, data]) => data.title)).toEqual(['Cat (1)', 'Cat (2)']);
		expect(result).toEqual(expect.objectContaining({ files: ['file-1', 'file-2'] }));
	});

	test('rejects a missing prompt before generating', async () => {
		await expect(config.handler({ model: 'openai:gpt-image-2.5-flare', prompt: null }, context)).rejects.toThrow(
			InvalidPayloadError,
		);

		expect(generateImage).not.toHaveBeenCalled();
	});
});

function mockFile(width: number, height: number) {
	return { data: Buffer.from('ref'), mediaType: 'image/png', filename: 'ref.png', width, height };
}
