import { DatabaseHelper } from '../types.js';

export class CapabilitiesHelper extends DatabaseHelper {
	supportsAliasInGroupBy(): boolean {
		return false;
	}
}
