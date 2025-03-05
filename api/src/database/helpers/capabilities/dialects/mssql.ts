import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperMSSQL extends CapabilitiesHelper {
	override supportsAliasReuse(): boolean {
		return false;
	}
}
