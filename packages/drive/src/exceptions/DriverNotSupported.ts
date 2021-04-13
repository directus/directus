import { RuntimeException } from 'node-exceptions';

export class DriverNotSupported extends RuntimeException {
	public driver!: string;

	private constructor(message: string, code?: number) {
		super(message, code);
	}

	public static driver(name: string): DriverNotSupported {
		const exception = new this(`Driver ${name} is not supported`, 400);

		exception.driver = name;

		return exception;
	}
}
