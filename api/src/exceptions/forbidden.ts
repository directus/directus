import { BaseException } from './base';
import { Permission } from '../types';

type Extensions = {
	field?: string;
	collection?: string;
	item?: string | number | (string | number)[];
	action?: Permission['action'];
};

export class ForbiddenException extends BaseException {
	constructor(message = `You don't have permission to access this.`, extensions?: Extensions) {
		super(message, 403, 'FORBIDDEN', extensions);
	}
}
