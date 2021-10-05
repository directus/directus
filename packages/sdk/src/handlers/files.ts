/**
 * Files handler
 */

import { ItemsHandler } from '../base/items.js';
import { ITransport } from '../transport.js';
import { FileType, DefaultType } from '../types.js';

export type FileItem<T = DefaultType> = FileType & T;

export class FilesHandler<T = DefaultType> extends ItemsHandler<FileItem<T>> {
	constructor(transport: ITransport) {
		super('directus_files', transport);
	}
}
