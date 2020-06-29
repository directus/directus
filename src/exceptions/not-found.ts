import { BaseException } from './base';

export class RouteNotFound extends BaseException {
	constructor(path: string) {
		super(`Route ${path} doesn't exist.`, 404, 'ROUTE_NOT_FOUND');
	}
}

export class CollectionNotFoundException extends BaseException {
	constructor(collection: string) {
		super(`Collection ${collection} can't be found.`, 404, 'COLLECTION_NOT_FOUND');
	}
}

export class FieldNotFoundException extends BaseException {
	constructor(field: string) {
		super(`Field ${field} can't be found.`, 404, 'FIELD_NOT_FOUND');
	}
}
