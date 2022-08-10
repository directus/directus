import { decode } from 'base-64';

export function jwtPayload(token: string): any {
	const payloadBase64 = token.split('.')[1].replace('-', '+').replace('_', '/');
	const payloadDecoded = decode(payloadBase64);
	const payloadObject = JSON.parse(payloadDecoded);

	return payloadObject;
}
