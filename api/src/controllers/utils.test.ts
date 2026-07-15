import { PassThrough } from 'node:stream';
import { ContentTooLargeError, InvalidPayloadError } from '@directus/errors';
import FormData from 'form-data';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import router from './utils.js';

vi.mock('../database/index.js', () => ({
	getDatabase: vi.fn(),
	default: vi.fn(),
}));

vi.mock('../services', () => ({}));
vi.mock('../services/revisions.js', () => ({ RevisionsService: vi.fn() }));
vi.mock('../services/utils.js', () => ({ UtilsService: vi.fn() }));

vi.mock('../services/import-export.js', () => {
	const ImportService = vi.fn();
	ImportService.prototype.import = vi.fn();
	const ExportService = vi.fn();
	return { ImportService, ExportService, getImportMaxFileSize: vi.fn().mockReturnValue(undefined) };
});

// https://github.com/directus/directus/issues/27854
describe('import route', () => {
	let importHandler: (req: any, res: any, next: any) => Promise<void>;
	let mockImport: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		const { ImportService } = await import('../services/import-export.js');
		mockImport = vi.mocked(ImportService.prototype.import);
		vi.clearAllMocks();

		// Default: the service consumes the uploaded file stream (as the real import does) and resolves.
		mockImport.mockImplementation((_collection: string, _mime: string, fileStream: any) => {
			fileStream.resume();
			return Promise.resolve();
		});

		const layer = (router as any).stack.find((l: any) => l.route?.path === '/import/:collection');
		// The route is [collectionExists, asyncHandler(importHandler)] - grab the final handler.
		importHandler = layer.route.stack[layer.route.stack.length - 1].handle;
	});

	const buildRequest = (query: Record<string, unknown>) => {
		const form = new FormData();
		form.append('file', JSON.stringify([{ title: 'a' }]), { filename: 'data.json', contentType: 'application/json' });

		const stream = new PassThrough();
		stream.end(form.getBuffer());

		return {
			headers: form.getHeaders(),
			is: vi.fn().mockReturnValue(true),
			query,
			params: { collection: 'articles' },
			accountability: null,
			schema: { collections: {}, relations: [] },
			pipe: (dest: NodeJS.WritableStream) => stream.pipe(dest),
		} as any;
	};

	const makeRes = () => {
		let resolveEnded: () => void;
		const ended = new Promise<void>((resolve) => (resolveEnded = resolve));

		const res = {
			status: vi.fn().mockReturnThis(),
			end: vi.fn(() => resolveEnded()),
		} as any;

		return { res, ended };
	};

	it('responds 200 for a background import once the upload has been received', async () => {
		const next = vi.fn();
		const { res, ended } = makeRes();

		await importHandler(buildRequest({ background: 'true' }), res, next);
		await ended;

		expect(mockImport).toHaveBeenCalledTimes(1);
		expect(mockImport).toHaveBeenCalledWith('articles', 'application/json', expect.anything(), { background: true });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.end).toHaveBeenCalledTimes(1);
		expect(next).not.toHaveBeenCalled();
	});

	it('responds 200 for a synchronous import', async () => {
		const next = vi.fn();
		const { res, ended } = makeRes();

		await importHandler(buildRequest({}), res, next);
		await ended;

		expect(mockImport).toHaveBeenCalledWith('articles', 'application/json', expect.anything(), { background: false });
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.end).toHaveBeenCalledTimes(1);
		expect(next).not.toHaveBeenCalled();
	});

	it('does not respond before the import settles', async () => {
		const next = vi.fn();
		const { res } = makeRes();

		let resolveImport: () => void;

		mockImport.mockImplementation((_c: string, _m: string, fileStream: any) => {
			fileStream.resume();
			return new Promise<void>((resolve) => (resolveImport = resolve));
		});

		await importHandler(buildRequest({ background: 'true' }), res, next);

		// Busboy has reached 'close' (body consumed) but the import promise is still pending.
		await new Promise((resolve) => setImmediate(resolve));
		expect(res.end).not.toHaveBeenCalled();

		resolveImport!();
		await new Promise((resolve) => setImmediate(resolve));
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.end).toHaveBeenCalledTimes(1);
	});

	it('calls next with InvalidPayloadError when no file is included', async () => {
		const next = vi.fn();
		const { res } = makeRes();

		const form = new FormData();
		form.append('notafile', 'test');
		const stream = new PassThrough();
		stream.end(form.getBuffer());

		const req = {
			headers: form.getHeaders(),
			is: vi.fn().mockReturnValue(true),
			query: {},
			params: { collection: 'articles' },
			accountability: null,
			schema: { collections: {}, relations: [] },
			pipe: (dest: NodeJS.WritableStream) => stream.pipe(dest),
		} as any;

		await importHandler(req, res, next);
		await new Promise((resolve) => setImmediate(resolve));

		expect(mockImport).not.toHaveBeenCalled();
		expect(next).toHaveBeenCalledWith(expect.any(InvalidPayloadError));
		expect(res.end).not.toHaveBeenCalled();
	});

	it('forwards the error once and does not respond when the import fails', async () => {
		const next = vi.fn();
		const { res } = makeRes();

		const failure = new Error('unsupported media type');

		// import() can reject before consuming the stream; drain it so busboy still reaches 'close'.
		mockImport.mockImplementation((_c: string, _m: string, fileStream: any) => {
			fileStream.resume();
			return Promise.reject(failure);
		});

		await importHandler(buildRequest({}), res, next);
		// Let the 'file' rejection and the subsequent busboy 'close' both flush.
		await new Promise((resolve) => setImmediate(resolve));
		await new Promise((resolve) => setImmediate(resolve));

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith(failure);
		expect(res.end).not.toHaveBeenCalled();
	});

	it('rejects an upload larger than the configured size cap with ContentTooLargeError', async () => {
		const next = vi.fn();
		const { res } = makeRes();

		const { getImportMaxFileSize } = await import('../services/import-export.js');
		// Tiny cap so the small multipart body trips busboy's fileSize limit.
		vi.mocked(getImportMaxFileSize).mockReturnValueOnce(4);

		// Mirror the real service: consume the stream and reject when busboy destroys it on 'limit'.
		mockImport.mockImplementation(
			(_c: string, _m: string, fileStream: any) =>
				new Promise((_resolve, reject) => {
					fileStream.on('data', () => {});
					fileStream.on('error', (err: Error) => reject(err));
					fileStream.resume();
				}),
		);

		await importHandler(buildRequest({ background: 'true' }), res, next);
		await new Promise((resolve) => setImmediate(resolve));
		await new Promise((resolve) => setImmediate(resolve));

		expect(next).toHaveBeenCalledTimes(1);
		expect(next).toHaveBeenCalledWith(expect.any(ContentTooLargeError));
		expect(res.end).not.toHaveBeenCalled();
	});
});
