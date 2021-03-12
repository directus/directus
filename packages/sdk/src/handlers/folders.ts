/**
 * Folders handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { FolderType } from '../types';

export type FolderItem<T extends object = {}> = FolderType & T;

export class FoldersHandler<T extends object> extends ItemsHandler<FolderItem<T>> {
	constructor(transport: ITransport) {
		super('directus_folders', transport);
	}
}
