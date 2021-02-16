import { RuntimeException } from 'node-exceptions';

export class NoSuchBucket extends RuntimeException {
	raw: Error;
	constructor(err: Error, bucket: string) {
		super(`The bucket ${bucket} doesn't exist\n${err.message}`, 500, 'E_NO_SUCH_BUCKET');
		this.raw = err;
	}
}
