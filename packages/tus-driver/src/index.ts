import type { Accountability, Item, PrimaryKey, Query, File } from '@directus/types';
import formatTitle from '@directus/format-title';
import { extension } from 'mime-types';
import { DataStore, ERRORS, Upload } from '@tus/utils';
import { extname } from 'node:path';
import type { Logger } from 'pino';
import type { Knex } from 'knex';

type AbstractService = {
	knex: Knex;
	accountability: Accountability | null | undefined;

	createOne(data: Partial<Item>): Promise<PrimaryKey>;
	createMany(data: Partial<Item>[]): Promise<PrimaryKey[]>;

	readOne(key: PrimaryKey, query?: Query): Promise<Item>;
	readMany(keys: PrimaryKey[], query?: Query): Promise<Item[]>;
	readByQuery(query: Query): Promise<Item[]>;

	updateOne(key: PrimaryKey, data: Partial<Item>): Promise<PrimaryKey>;
	updateMany(keys: PrimaryKey[], data: Partial<Item>): Promise<PrimaryKey[]>;

	deleteOne(key: PrimaryKey): Promise<PrimaryKey>;
	deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
};

export type TusDataStoreConfig = {
	constants: {
		ENABLED: boolean;
		CHUNK_SIZE: number;
		MAX_SIZE: number;
		EXPIRATION_TIME: number;
		SCHEDULE: string;
	};
	options: Record<string, unknown>;
	/** Storage location name **/
	location: string;
	logger: Logger<never>;
};

export class TusDataStore extends DataStore {
	protected chunkSize: number;
	protected maxSize: number;
	protected expirationTime: number;
	protected logger: Logger<never>;
	protected location: string;
	protected service: AbstractService | undefined;

	constructor(config: TusDataStoreConfig) {
		super();

		this.chunkSize = config.constants.CHUNK_SIZE;
		this.maxSize = config.constants.MAX_SIZE;
		this.expirationTime = config.constants.EXPIRATION_TIME;
		this.logger = config.logger;
		this.location = config.location;
		this.service = undefined;
	}

	getService(): AbstractService {
		if (!this.service) throw new Error('no service set');
		return this.service;
	}

	setService(service: AbstractService) {
		this.service = service;
	}

	public override async create(upload: Upload): Promise<Upload> {
		upload.creation_date = new Date().toISOString();

		upload.metadata ??= {};
		const fileName = upload.metadata['filename']!;
		const fileType = upload.metadata['filetype'] ?? 'application/octet-stream';

		const fileData: Partial<File> = {
			tus_id: upload.id,
			tus_data: upload,
			type: fileType,
			filesize: upload.size!,
			filename_download: fileName,
			title: formatTitle(fileName),
			storage: this.location,
		};

		if (upload.metadata['folder']) {
			fileData.folder = upload.metadata['folder'];
		}

		const primaryKey = await this.getService().createOne(fileData);

		const fileExtension = extname(fileName!) || (fileType && '.' + extension(fileType)) || '';
		const diskFileName = primaryKey + (fileExtension || '');

		await this.getService().updateOne(primaryKey!, {
			filename_disk: diskFileName,
		});

		return upload;
	}

	protected async getFileById(tus_id: string) {
		const results = await this.getService().readByQuery({
			filter: {
				tus_id: { _eq: tus_id },
				// uploaded_by: { _eq: this.service.accountability!.user! }
			},
		}); /*
		.catch((e) => { console.error(e)})*/

		if (!results || !results[0]) {
			throw ERRORS.FILE_NOT_FOUND;
		}

		return results[0] as File;
	}

	override async deleteExpired(): Promise<number> {
		const now = new Date();
		const toDelete: Promise<void>[] = [];

		const uploadFiles = (await this.getService().readByQuery({
			filter: { tus_id: { _null: false } },
		})) as undefined | File[];

		if (!uploadFiles) return 0;

		for (const fileData of uploadFiles) {
			try {
				if (
					fileData &&
					fileData.tus_data &&
					'creation_date' in fileData.tus_data &&
					this.getExpiration() > 0 &&
					fileData.tus_data['size'] !== fileData.tus_data['offset'] &&
					fileData.tus_data['creation_date']
				) {
					const creation = new Date(fileData.tus_data['creation_date']);
					const expires = new Date(creation.getTime() + this.getExpiration());

					if (now > expires) {
						toDelete.push(this.remove(fileData.tus_id!));
					}
				}
			} catch (error) {
				if (error !== ERRORS.FILE_NO_LONGER_EXISTS) {
					throw error;
				}
			}
		}

		await Promise.all(toDelete);
		return toDelete.length;
	}

	override getExpiration(): number {
		return this.expirationTime;
	}
}
