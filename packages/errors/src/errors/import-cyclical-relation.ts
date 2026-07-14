import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface ImportCyclicalRelationErrorExtensions {
	/** The collections that form the cycle. */
	collections: string[];
	/** The non-nullable foreign keys forming the cycle (`collection.field -> related`). */
	relations: { collection: string; field: string; related: string }[];
}

export const messageConstructor = ({ collections }: ImportCyclicalRelationErrorExtensions): string =>
	`Can't import collections [${collections.join(', ')}] because they form a relational cycle with only non-nullable foreign keys.`;

export const ImportCyclicalRelationError: DirectusErrorConstructor<ImportCyclicalRelationErrorExtensions> =
	createError<ImportCyclicalRelationErrorExtensions>(ErrorCode.ImportCyclicalRelation, messageConstructor, 422);
