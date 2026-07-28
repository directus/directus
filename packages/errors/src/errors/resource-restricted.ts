import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface ResourceRestrictedErrorExtensions {
	category: string;
}

export const messageConstructor = ({ category }: ResourceRestrictedErrorExtensions) => {
	return `${category} is a restricted resource.`;
};

export const ResourceRestrictedError: DirectusErrorConstructor<ResourceRestrictedErrorExtensions> =
	createError<ResourceRestrictedErrorExtensions>(ErrorCode.ResourceRestricted, messageConstructor, 403);
