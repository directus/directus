// empty directus
export interface DirectusClient<Schema extends object> {
	url: URL;
	use: <Extension extends object>(createExtension: (client: DirectusClient<Schema>) => Extension) => this & Extension;
}
