import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperPostgres extends CapabilitiesHelper {
	override supportsAliasInGroupBy(): boolean {
		return true;
	}
}
