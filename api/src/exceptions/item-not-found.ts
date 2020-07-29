import { BaseException } from './base';

export class ItemNotFoundException extends BaseException {
	constructor(id: string | number, collection: string) {
		super(`Item "${id}" doesn't exist in "${collection}".`, 404, 'ITEM_NOT_FOUND');
	}
}
