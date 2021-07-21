import { RuntimeException } from 'node-exceptions';

export class DriverNotSupportedException extends RuntimeException {
	driver?: string;

	constructor(message = 'Driver not supported', driver?: string) {
		super(message, 400, 'DRIVER_NOT_SUPPORTED');
		this.driver = driver;
	}
}
