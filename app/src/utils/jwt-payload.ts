import { decode } from 'base-64';

export function jwtPayload(token: string): any {
	const payloadBase64 = token.split('.')[1];

	if (!payloadBase64) throw new Error('Invalid JWT token');

	const payloadBase64Clean = payloadBase64.replace('-', '+').replace('_', '/');
	const payloadDecoded = decode(payloadBase64Clean);
	const payloadObject = JSON.parse(payloadDecoded);

	return payloadObject;
}
