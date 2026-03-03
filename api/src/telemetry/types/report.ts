export interface TelemetryReport {
	/**
	 * The project's web-facing public URL
	 */
	url: string;

	/**
	 * Current Directus version in use
	 */
	version: string;

	/**
	 * Database client in use
	 */
	database: string;

	/**
	 * Number of users in the system that have admin access to the system
	 */
	admin_users: number;

	/**
	 * Number of users that can access the app, but don't have admin access
	 */
	app_users: number;

	/**
	 * Number of users that can only access the API
	 */
	api_users: number;

	/**
	 * Number of unique roles in the system
	 */
	roles: number;

	/**
	 * Number of unique flows in the system
	 */
	flows: number;

	/**
	 * Number of unique dashboards in the system
	 */
	dashboards: number;

	/**
	 * Number of installed extensions in the system. Does not differentiate between enabled/disabled
	 */
	extensions: number;

	/**
	 * Number of Directus-managed collections
	 */
	collections: number;

	/**
	 * Total number of items in the non-system tables
	 */
	items: number;

	/**
	 * Number of files in the system
	 */
	files: number;

	/**
	 * Number of shares in the system
	 */
	shares: number;

	/**
	 * Maximum number of fields in a collection
	 */
	fields_max: number;

	/**
	 * Number of fields in the system
	 */
	fields_total: number;

	/**
	 * Size of the database in bytes
	 */
	database_size: number;

	/**
	 * Total size of the files in bytes
	 */
	files_size_total: number;

	/**
	 * Unique project identifier
	 */
	project_id: string;

	/**
	 * Whether the project has enabled MCP
	 */
	mcp_enabled: boolean;

	/**
	 * Whether the project allows deletes in MCP
	 */
	mcp_allow_deletes: boolean;

	/**
	 * Whether the project has enabled MCP system prompt
	 */
	mcp_system_prompt_enabled: boolean;

	/**
	 * Number of Visual Editor URLs configured in the system
	 */
	visual_editor_urls: number;

	/**
	 * Whether collaborative editing is enabled
	 */
	collaborative_editing_enabled: boolean;

	/**
	 * Whether WebSockets are enabled
	 */
	websockets_enabled: boolean;
}
