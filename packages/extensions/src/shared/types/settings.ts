export interface ExtensionSettings {
	id: string;
	source: 'module' | 'registry' | 'local';
	enabled: boolean;
	bundle: string | null;
	folder: string;
	// options: Record<string, unknown> | null;
	// permissions: Record<string, unknown> | null;
}
