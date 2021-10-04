/**
 * Files handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { FileType, DefaultType } from '../types';

export type FileItem<T = DefaultType> = FileType & T;

export class FilesHandler<T = DefaultType> extends ItemsHandler<FileItem<T>> {
	constructor(transport: ITransport) {
		super('directus_files', transport);
	}
}
