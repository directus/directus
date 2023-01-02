export const dynamicImport = async (mod: string) => {
	return process.env.VITEST ? await import(mod) : require(mod);
};
