import { BaseException } from './base';

export class FieldNotFoundException extends BaseException {
	constructor(collection: string, field: string) {
		super(
			`Field "${field}" in collection "${collection}" doesn't exist.`,
			404,
			'FIELD_NOT_FOUND'
		);
	}
}
