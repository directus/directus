import { DatabaseHelper } from '../types.js';

export class CapabilitiesHelper extends DatabaseHelper {
	supportsColumnPositionInGroupBy(): boolean {
		return false;
	}

	supportsSameValuesWithDifferentTypesInParameters(): boolean {
		return false;
	}
}
