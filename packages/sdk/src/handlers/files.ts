/**
 * Files handler
 */

import { ItemsHandler } from '@/src/base/items.js';
import { ITransport } from '@/src/transport.js';
import { FileType, DefaultType } from '@/src/types.js';

export type FileItem<T = DefaultType> = FileType & T;

export class FilesHandler<T = DefaultType> extends ItemsHandler<FileItem<T>> {
	constructor(transport: ITransport) {
		super('directus_files', transport);
	}
}
