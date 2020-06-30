import { BaseException } from './base';

export class CollectionNotFoundException extends BaseException {
	constructor(collection: string) {
		super(`Collection "${collection}" doesn't exist.`, 404, 'COLLECTION_NOT_FOUND');
	}
}
