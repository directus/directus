/**
 * Revisions handler
 */

import { ItemsHandler } from '../base/items';
import { ITransport } from '../transport';
import { RevisionType } from '../types';

export type RevisionItem<T extends object = {}> = RevisionType & T;

export class RevisionsHandler<T extends object> extends ItemsHandler<RevisionItem<T>> {
	constructor(transport: ITransport) {
		super('directus_revisions', transport);
	}
}
