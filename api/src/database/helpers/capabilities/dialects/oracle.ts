import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperOracle extends CapabilitiesHelper {
	override maxInListSize(): number {
		// ORA-01795: maximum number of expressions in a list is 1000
		return 1000;
	}
}
