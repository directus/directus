import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperOracle extends CapabilitiesHelper {
	override supportsSameValuesWithDifferentTypesInParameters(): boolean {
		return true;
	}
}
