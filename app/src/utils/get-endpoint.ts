import { isSystemCollection } from './is-system-collection';

export function getEndpoint(collection: string): string {
	if (isSystemCollection(collection)) {
		return `/${collection.substring(9)}`;
	}

	return `/items/${collection}`;
}
