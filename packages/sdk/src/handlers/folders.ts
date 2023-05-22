/**
 * Folders handler
 */

import { ItemsHandler } from '../items';
import { Transport } from '../transport';
import { DefaultType, FolderType } from '../types';

export type FolderItem<T = DefaultType> = FolderType & T;

export class FoldersHandler<T = DefaultType> extends ItemsHandler<FolderItem<T>> {
	constructor(transport: Transport) {
		super('directus_folders', transport);
	}
}
