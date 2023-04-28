import { BaseException } from '@directus/exceptions';

export class IllegalAssetTransformation extends BaseException {
	constructor(message: string) {
		super(message, 400, 'ILLEGAL_ASSET_TRANSFORMATION');
	}
}
