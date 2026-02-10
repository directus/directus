/**
 * Returns the raw variables from the process
 */
export const readConfigurationFromProcess = () => {
	return { ...process.env } as Record<string, any>;
};
