/**
 * Folders handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Folders<T extends object = DefaultFields> = {
	// Folders Fields
} & T;

export class FoldersHandler<T extends object> extends ItemsHandler<Folders<T>> {
	constructor(transport: ITransport) {
		super('directus_folders', transport);
	}
}
