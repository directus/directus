export type ExtensionAPI = {
	fetch: (url: string, options?: RequestInit) => Promise<Response>;
}
