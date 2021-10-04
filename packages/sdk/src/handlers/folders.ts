/**
 * Folders handler
 */

import { ItemsHandler } from '@/src/base/items.js';
import { ITransport } from '@/src/transport.js';
import { FolderType, DefaultType } from '@/src/types.js';

export type FolderItem<T = DefaultType> = FolderType & T;

export class FoldersHandler<T = DefaultType> extends ItemsHandler<FolderItem<T>> {
	constructor(transport: ITransport) {
		super('directus_folders', transport);
	}
}
