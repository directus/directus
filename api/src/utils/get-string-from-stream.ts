import { Readable } from 'node:stream';
import { InvalidPayloadException } from '../exceptions';

export function getStringFromStream(stream: Readable) {
	const chunks: Buffer[] = [];

	return new Promise<string>((resolve, reject) => {
		stream
			.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
			.on('error', (err: any) => {
				return reject(new InvalidPayloadException(err.message));
			})
			.on('end', () => {
				const streamString = Buffer.concat(chunks).toString('utf8');
				return resolve(streamString);
			});
	});
}
