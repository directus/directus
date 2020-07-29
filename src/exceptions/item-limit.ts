import { BaseException } from './base';

export class ItemLimitException extends BaseException {
	constructor(message: string) {
		super(message, 400, 'ITEM_LIMIT_REACHED');
	}
}
