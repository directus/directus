import { parseJSON } from './parse-json.js';

export function isValidJSON(input: string) {
	try {
		parseJSON(input);
		return true;
	} catch {
		return false;
	}
}
