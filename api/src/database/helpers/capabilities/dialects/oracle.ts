import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperOracle extends CapabilitiesHelper {
	override supportsAliasReuse(): boolean {
		return false;
	}
}
