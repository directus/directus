import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperOracle extends CapabilitiesHelper {
	override supportsSameValuesInQueryParameter(): boolean {
		return true;
	}
}
