/**
 * Supported deployment provider types
 */
export const DEPLOYMENT_PROVIDER_TYPES = ['vercel'] as const;
export type ProviderType = (typeof DEPLOYMENT_PROVIDER_TYPES)[number];

/**
 * Credentials structure varies per provider
 * Stored encrypted in database as JSON string
 */
export type Credentials = Record<string, any>;

/**
 * Provider-specific options
 */
export type Options = Record<string, any>;

export type Status = 'queued' | 'building' | 'ready' | 'error' | 'canceled';

/**
 * Latest deployment summary for project overview
 */
export interface LatestDeployment {
	status: Status;
	created_at: Date;
	finished_at?: Date;
}

/**
 * Project from deployment provider (e.g. Vercel project)
 */
export interface Project {
	id: string;
	name: string;
	url?: string;
	framework?: string;
	/** Whether the project has a Git source and can trigger deployments */
	deployable: boolean;
	created_at?: Date;
	updated_at?: Date;
	/** Latest deployment info (only from getProject) */
	latest_deployment?: LatestDeployment;
}

/**
 * Deployment run
 */
export interface Deployment {
	id: string;
	project_id: string;
	status: Status;
	url?: string;
	created_at: Date;
	finished_at?: Date;
	error_message?: string;
	meta?: Record<string, any>;
}

/**
 * Deployment log entry
 */
export interface Log {
	timestamp: Date;
	type: 'stdout' | 'stderr' | 'info';
	message: string;
}

/**
 * Deployment details with logs
 */
export interface Details extends Deployment {
	logs?: Log[];
}

/**
 * Result of triggering a deployment
 */
export interface TriggerResult {
	deployment_id: string;
	status: Status;
	url?: string;
}

/**
 * Deployment configuration
 */
export interface DeploymentConfig {
	id: string;
	provider: ProviderType;
	credentials: Credentials;
	options: Options | null;
	date_created: string;
	projects?: StoredProject[];
}

/**
 * Stored project
 */
export interface StoredProject {
	id: string;
	deployment: string;
	external_id: string;
	name: string;
	date_created: string;
}

/**
 * Stored run
 */
export interface StoredRun {
	id: string;
	project: string;
	external_id: string;
	status: Status;
	target: string;
	date_created: string;
	url: string | null;
}
