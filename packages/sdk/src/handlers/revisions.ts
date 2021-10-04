/**
 * Revisions handler
 */

import { ItemsHandler } from '@/src/base/items.js';
import { ITransport } from '@/src/transport.js';
import { RevisionType, DefaultType } from '@/src/types.js';

export type RevisionItem<T = DefaultType> = RevisionType & T;

export class RevisionsHandler<T = DefaultType> extends ItemsHandler<RevisionItem<T>> {
	constructor(transport: ITransport) {
		super('directus_revisions', transport);
	}
}
