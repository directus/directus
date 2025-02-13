import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperMySQL extends CapabilitiesHelper {
	override supportsAliasInGroupBy(): boolean {
		return true;
	}
}
