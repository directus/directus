import { RuntimeException } from 'node-exceptions';

export class DriverNotSupported extends RuntimeException {
	public driver!: string;

	public static driver(name: string): DriverNotSupported {
		const exception = new this(`Driver ${name} is not supported`, 400);

		exception.driver = name;

		return exception;
	}
}
