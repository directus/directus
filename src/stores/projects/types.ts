/**
 * @NOTE
 *
 * api, server don't exist when the project errored out.
 * status, error don't exist for working projects.
 */

export interface Project {
	api?: {
		version?: string;
		database?: string;
		requires2FA: boolean;
		project_color: string;
		project_logo: {
			full_url: string;
			asset_url: string;
			url: string;
		} | null;
		project_foreground: {
			full_url: string;
			asset_url: string;
			url: string;
		} | null;
		project_background: {
			full_url: string;
			asset_url: string;
			url: string;
		} | null;
		project_public_note: string | null;
		default_locale: string;
		telemetry: boolean;
		project_name: string;
		sso: {
			name: string;
			icon: string;
		}[];
	};
	server?: {
		max_upload_size: number;
		general: {
			php_version: string;
			php_api: string;
		};
	};
	status?: number;
	error?: {
		code: number;
		message: string;
	};
}

export interface ProjectWithKey extends Project {
	key: string;
	authenticated: boolean;
}
