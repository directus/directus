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
		super(`You don't have permission to access this.`, 403, 'FORBIDDEN');

		/**
		 * We currently don't show the reason for a forbidden exception in the API output, as that
		 * has the potential to leak schema information (eg a "No permission" vs "No permission to files"
		 * would leak that a thing called "files" exists.
		 * Ref https://github.com/directus/directus/discussions/4368
		 */
	}
}
