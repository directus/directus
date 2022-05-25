/**
 * Files handler
 */

import { ItemsHandler } from '../base/items';
import { OneItem, PartialItem } from '../items';
import { ITransport } from '../transport';
import { FileType, DefaultType } from '../types';

export type FileItem<T = DefaultType> = FileType & T;

export class FilesHandler<T = DefaultType> extends ItemsHandler<FileItem<T>> {
	constructor(transport: ITransport) {
		super('directus_files', transport);
	}

	async import(body: { url: string; data?: PartialItem<T> }): Promise<OneItem<T>> {
		const response = await this.transport.post(`/files/import`, body);
		return response.data as T;
	}
}
