export function getDirectusAssetURL(fileOrString: string | DirectusFile | null | undefined): string {
	if (!fileOrString) return '';

	const runtimeConfig = useRuntimeConfig();
	const directusUrl = runtimeConfig.public.directusUrl;

	if (typeof fileOrString === 'string') {
		return `${directusUrl}/assets/${fileOrString}`;
	}

	return `${directusUrl}/assets/${fileOrString.id}`;
}
