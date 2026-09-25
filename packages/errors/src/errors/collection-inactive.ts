import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface CollectionInactiveErrorExtensions {
	collection: string;
}

export const messageConstructor = ({ collection }: CollectionInactiveErrorExtensions) => {
	return `Collection "${collection}" is inactive.`;
};

export const CollectionInactiveError: DirectusErrorConstructor<CollectionInactiveErrorExtensions> =
	createError<CollectionInactiveErrorExtensions>(ErrorCode.CollectionInactive, messageConstructor, 403);
