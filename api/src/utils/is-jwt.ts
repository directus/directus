import atob from 'atob';
import logger from '../logger';

/**
 * Check if a given string conforms to the structure of a JWT.
 */
export default function isJWT(string: string): boolean {
	const parts = string.split('.');

	// JWTs have the structure header.payload.signature
	if (parts.length !== 3) return false;

	// Check if all segments are base64 encoded
	try {
		atob(parts[0]);
		atob(parts[1]);
		atob(parts[2]);
	} catch (err) {
		logger.error(err);
		return false;
	}

	// Check if the header and payload are valid JSON
	try {
		JSON.parse(atob(parts[0]));
		JSON.parse(atob(parts[1]));
	} catch {
		return false;
	}

	return true;
}
