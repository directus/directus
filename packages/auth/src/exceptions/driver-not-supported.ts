import { BaseException } from '@directus/shared/exceptions';

export class DriverNotSupportedException extends BaseException {
	constructor(message = 'Driver not supported', driver?: string) {
		super(message, 400, 'DRIVER_NOT_SUPPORTED', { driver });
	}
}
