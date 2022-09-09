export function getEntryFile(): string | undefined {
	return PhusionPassenger !== undefined ? PhusionPassenger.options.startup_file : require.main?.filename;
}
