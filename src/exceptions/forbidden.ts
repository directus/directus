import { BaseException } from './base';

export class ForbiddenException extends BaseException {
	constructor(message = `You don't have permission to access this.`) {
		super(message, 403, 'NO_PERMISSION');
	}
}
