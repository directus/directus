/**
 * Files handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Files<T extends object = DefaultFields> = {
	// Files Fields
} & T;

export class FilesHandler<T extends object> extends ItemsHandler<Files<T>> {
	constructor(transport: ITransport) {
		super('directus_files', transport);
	}
}
