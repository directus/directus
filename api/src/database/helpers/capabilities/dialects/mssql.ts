import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperMSSQL extends CapabilitiesHelper {
	override supportsSameValuesInQueryParameter(): boolean {
		return true;
	}
}
