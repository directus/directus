import { BaseException } from './base';

type Extensions = {
	allow: string[];
};

export class MethodNotAllowedException extends BaseException {
	constructor(message = 'Method not allowed.', extensions: Extensions) {
		super(message, 405, 'METHOD_NOT_ALLOWED', extensions);
	}
}
