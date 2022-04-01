import { RuntimeException } from 'node-exceptions';

export class InvalidConfig extends RuntimeException {
	private constructor(message: string, status?: number, code?: string) {
		super(message, status, code);
	}

	public static missingDiskName(): InvalidConfig {
		return new this('Make sure to define a default disk name inside config file', 500, 'E_INVALID_CONFIG');
	}

	public static missingDiskConfig(name: string): InvalidConfig {
		return new this(`Make sure to define config for ${name} disk`, 500, 'E_INVALID_CONFIG');
	}

	public static missingDiskDriver(name: string): InvalidConfig {
		return new this(`Make sure to define driver for ${name} disk`, 500, 'E_INVALID_CONFIG');
	}

	public static duplicateDiskName(name: string): InvalidConfig {
		return new this(`A disk named ${name} is already defined`, 500, 'E_INVALID_CONFIG');
	}
}
