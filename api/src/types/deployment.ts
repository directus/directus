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
  createdAt: Date;
  readyAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  url?: string;
  framework?: string;
  /** Whether the project has a Git source and can trigger deployments */
  deployable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  /** Latest deployment info (only from getProject) */
  latestDeployment?: LatestDeployment;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: Status;
  url?: string;
  createdAt: Date;
  readyAt?: Date;
  errorMessage?: string;
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
  deploymentId: string;
  status: Status;
  url?: string;
}
