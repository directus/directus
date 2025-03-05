import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperMSSQL extends CapabilitiesHelper {
	override supportsSameValuesWithDifferentTypesInParameters(): boolean {
		return true;
	}
}
