/**
 * Files handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { FileType } from '../types';

export type FileItem<T extends object = {}> = FileType & T;

export class FilesHandler<T extends object> extends ItemsHandler<FileItem<T>> {
	constructor(transport: ITransport) {
		super('directus_files', transport);
	}
}
