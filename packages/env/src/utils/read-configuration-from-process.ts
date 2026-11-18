/**
 * Returns the raw variables from the process
 */
export function readConfigurationFromProcess(): Record<string, any> {
	return { ...process.env } as Record<string, any>;
}
