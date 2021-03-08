/**
 * Revisions handler
 */

import { DefaultFields } from './default';
import { ItemsHandler } from '..';
import { ITransport } from '../../transport';

export type Revisions<T extends object = DefaultFields> = {
	// Revisions Fields
} & T;

export class RevisionsHandler<T extends object> extends ItemsHandler<Revisions<T>> {
	constructor(transport: ITransport) {
		super('directus_revisions', transport);
	}
}
