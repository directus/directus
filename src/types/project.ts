export interface Project {
	api: {
		version?: string;
		database?: string;
		requires2FA: boolean;
		project_color: string;
		project_logo: {
			full_url: string;
			url: string;
		} | null;
		project_foreground: {
			full_url: string;
			url: string;
		} | null;
		project_background: {
			full_url: string;
			url: string;
		} | null;
		project_public_note: string | null;
		default_locale: string;
		telemetry: boolean;
		project_name: string;
	};
	server?: {
		max_upload_size: number;
		general: {
			php_version: string;
			php_api: string;
		};
	};
}
