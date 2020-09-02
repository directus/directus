import { BaseException } from './base';

export class ExportFailedException extends BaseException {
	constructor(message: string) {
		super(message, 500, 'EXPORT_FAILED');
	}
}
