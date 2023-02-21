import { parseJSON } from './parse-json';

export function isValidJSON(input: string): any {
	try {
		parseJSON(input);
		return true;
	} catch {
		return false;
	}
}
