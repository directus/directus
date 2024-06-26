/**
 * TUS implementation for resumable uploads
 *
 * https://tus.io/
 */
import { FilesService } from '../files.js';
import { useEnv } from '@directus/env';
import type { Request /*, Response /*, NextFunction*/ } from 'express';
import { getTusAdapter } from './adapters/index.js';
import type { ServerOptions } from './types.js';
import { getTusLocker } from './lockers.js';
import { Server } from '@tus/server';
import bytes from 'bytes';
import type { IncomingMessage } from 'node:http';

const env = useEnv();

export const tusStore = getTusAdapter();

export const tusServerOptions: ServerOptions = {
	path: '/files/tus',
	locker: getTusLocker(),
	maxSize: bytes(env['FILES_MAX_UPLOAD_SIZE'] as string),
	async onIncomingRequest(msg: IncomingMessage) {
		const req = msg as Request;
		const schema = req.schema;

		if (req.method === 'PATCH' && schema.collections['directus_files']) {
			// dont add revisions for each individual chunks
			schema.collections['directus_files'].accountability = null;
		}

		await tusStore.init({
			accountability: req.accountability,
			schema: schema,
		});
	},
	onUploadFinish: async (req: any, res, upload) => {
		const service = new FilesService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.updateByQuery(
			{
				filter: { tus_id: { _eq: upload.id } },
			},
			{
				tus_id: null,
				tus_data: null,
			},
		);

		return res;
	},
	generateUrl(_req, opts) {
		return env['PUBLIC_URL'] + '/files/tus/' + opts.id;
	},
	relativeLocation: String(env['PUBLIC_URL']).startsWith('http'),
};

export const tusServer = new Server({
	...tusServerOptions,
	datastore: tusStore,
});

// export type TusServiceOptions = AbstractServiceOptions & {
// 	locker?: Locker;
// 	storage?: DataStore;
// 	maxSize?: number;
// 	lockDrainTimeout?: number;
// 	respectForwardedHeaders?: boolean;
// };

// export class TusService {
// 	knex: Knex;
// 	accountability: Accountability | null;
// 	schema: SchemaOverview;
// 	storage: DataStore;
// 	locker: Locker;
// 	/**
// 	 * The route to accept requests.
// 	 */
// 	readonly path = '/files/tus';
// 	/**
// 	 * Max file size allowed when uploading
// 	 */
// 	readonly maxSize: number;
// 	/**
// 	 * This timeout controls how long the server will wait a cancelled lock to do its cleanup.
// 	 */
// 	readonly lockDrainTimeout: number;
// 	/**
// 	 * Allow `Forwarded`, `X-Forwarded-Proto`, and `X-Forwarded-Host` headers
// 	 * to override the `Location` header returned by the server.
// 	 */
// 	readonly respectForwardedHeaders: boolean;

// 	constructor(options: TusServiceOptions) {
// 		this.knex = options.knex || getDatabase();
// 		this.accountability = options.accountability || null;
// 		this.schema = options.schema;
// 		this.locker = options.locker ?? getMemoryLocker();
// 		this.storage = options.storage ?? tusStore;
// 		this.maxSize = options.maxSize ?? 0; // TODO add as env var
// 		this.lockDrainTimeout = options.lockDrainTimeout ?? 3000; // TODO add as env var
// 		this.respectForwardedHeaders = options.respectForwardedHeaders ?? false; // TODO add as env var
// 	}

// 	async create(req: Request, res: Response, context: CancellationContext) {
// 		// Throw errors for unsupported extensions
// 		if ('upload-concat' in req.headers) {
// 			throw ERRORS.UNSUPPORTED_CONCATENATION_EXTENSION;
// 		}

// 		if ('upload-defer-length' in req.headers) {
// 			throw ERRORS.UNSUPPORTED_CREATION_DEFER_LENGTH_EXTENSION;
// 		}

// 		const upload_length = req.headers['upload-length'] as string | undefined;
// 		const upload_metadata = req.headers['upload-metadata'] as string | undefined;

// 		if (upload_length === undefined) {
// 			throw ERRORS.INVALID_LENGTH;
// 		}

// 		let metadata: Record<string, string | null> | undefined = undefined;

// 		if ('upload-metadata' in req.headers) {
// 			try {
// 				metadata = Metadata.parse(upload_metadata);
// 			} catch {
// 				throw ERRORS.INVALID_METADATA;
// 			}
// 		}

// 		const id = randomUUID();

// 		if (upload_length && this.maxSize > 0 && Number.parseInt(upload_length, 10) > this.maxSize) {
// 			throw ERRORS.ERR_MAX_SIZE_EXCEEDED;
// 		}

// 		const upload = new Upload({
// 			id,
// 			offset: 0,
// 			...(metadata ? { metadata } : {}),
// 			...(upload_length ? { size: Number.parseInt(upload_length, 10) } : {}),
// 		});

// 		const lock = await this.acquireLock(id, context);

// 		let isFinal: boolean;
// 		let url: string;

// 		// Recommended response defaults
// 		const responseData = {
// 			status: 201,
// 			headers: {} as Record<string, string | number>,
// 			body: '',
// 		};

// 		try {
// 			await this.storage.create(upload);
// 			url = this.generateUrl(req, upload.id);

// 			// this.emit(EVENTS.POST_CREATE, req, res, upload, url);

// 			isFinal = upload.size === 0 && !upload.sizeIsDeferred;
// 		} catch (e) {
// 			context.abort();
// 			throw e;
// 		} finally {
// 			await lock.unlock();
// 		}

// 		if (isFinal) {
// 			// Do finish stuff
// 			// update database record and such
// 		}

// 		// The Upload-Expires response header indicates the time after which the unfinished upload expires.
// 		// If expiration is known at creation time, Upload-Expires header MUST be included in the response
// 		if (this.storage.hasExtension('expiration') && this.storage.getExpiration() > 0 && upload.creation_date) {
// 			const created = await this.storage.getUpload(upload.id);

// 			if (created.offset !== Number.parseInt(upload_length as string, 10)) {
// 				const creation = new Date(upload.creation_date);

// 				// Value MUST be in RFC 7231 datetime format
// 				responseData.headers['Upload-Expires'] = new Date(
// 					creation.getTime() + this.storage.getExpiration(),
// 				).toUTCString();
// 			}
// 		}

// 		//Only append Location header if its valid for the final http status (201 or 3xx)
// 		if (responseData.status === 201 || (responseData.status >= 300 && responseData.status < 400)) {
// 			responseData.headers['Location'] = url;
// 		}

// 		const writtenRes = this.writeResponse(res, responseData.status, responseData.headers, responseData.body);

// 		// if (isFinal) {
// 		// 	this.emit(EVENTS.POST_FINISH, req, writtenRes, upload);
// 		// }

// 		return writtenRes;
// 	}

// 	async uploadChunk() {}

// 	async getOffset() {}

// 	namingFunction() {
// 		return randomUUID();
// 	}

// 	generateUrl(req: Request, id: string) {
// 		const { proto, host } = this.extractHostAndProto(req);
// 		return `${proto}://${host}${this.path}/${id}`;
// 	}

// 	removeExpiredUploads(): Promise<number> {
// 		if (!this.storage.hasExtension('expiration')) {
// 			throw ERRORS.UNSUPPORTED_EXPIRATION_EXTENSION;
// 		}

// 		return this.storage.deleteExpired();
// 	}

// 	private writeResponse(res: Response, status: number, headers = {}, body = '') {
// 		if (status !== 204) {
// 			// @ts-expect-error not explicitly typed but possible
// 			headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
// 		}

// 		res.writeHead(status, headers);
// 		res.write(body);
// 		return res.end();
// 	}

// 	private async acquireLock(id: string, context: CancellationContext) {
// 		const lock = this.locker.newLock(id);

// 		await lock.lock(() => {
// 			context.cancel();
// 		});

// 		return lock;
// 	}

// 	private extractHostAndProto(req: Request) {
// 		let proto;
// 		let host;

// 		if (this.respectForwardedHeaders) {
// 			const forwarded = req.headers.forwarded as string | undefined;

// 			if (forwarded) {
// 				host ??= reForwardedHost.exec(forwarded)?.[1];
// 				proto ??= reForwardedProto.exec(forwarded)?.[1];
// 			}

// 			const forwardHost = req.headers['x-forwarded-host'];
// 			const forwardProto = req.headers['x-forwarded-proto'];

// 			// @ts-expect-error we can pass undefined
// 			if (['http', 'https'].includes(forwardProto)) {
// 				proto ??= forwardProto as string;
// 			}

// 			host ??= forwardHost;
// 		}

// 		host ??= req.headers.host;
// 		proto ??= 'http';

// 		return { host: host as string, proto };
// 	}
// }
