import jwt from 'jsonwebtoken';

export function getExpiresAtForToken(token: string): number | null {
	const decoded = jwt.decode(token);

	if (decoded && typeof decoded === 'object' && decoded.exp) {
		return decoded.exp;
	}

	return null;
}
