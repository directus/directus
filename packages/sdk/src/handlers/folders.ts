/**
 * Folders handler
 */

import { ItemsHandler } from '../base/items.js';
import { ITransport } from '../transport.js';
import { FolderType, DefaultType } from '../types.js';

export type FolderItem<T = DefaultType> = FolderType & T;

export class FoldersHandler<T = DefaultType> extends ItemsHandler<FolderItem<T>> {
	constructor(transport: ITransport) {
		super('directus_folders', transport);
	}
}
