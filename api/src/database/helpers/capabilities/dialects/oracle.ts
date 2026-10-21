import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperOracle extends CapabilitiesHelper {
	override getMaxBindings(): number {
		// a single IN list is capped at 1000 expressions, lower than the per-query binding limit
		// https://docs.oracle.com/en/error-help/db/ora-01795/
		return 1000;
	}
}
