import { DatabaseHelper } from '../types.js';

export class CapabilitiesHelper extends DatabaseHelper {
	supportsColumnPositionInGroupBy(): boolean {
		return false;
	}

	supportsSameValuesInQueryParameter(): boolean {
		return false;
	}
}
