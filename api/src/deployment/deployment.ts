import { UnprocessableContentError } from '@directus/errors';
import type { Credentials, Options, Deployment, Details, Log, Project, TriggerResult } from '../types/index.js';

export abstract class DeploymentDriver<
	TCredentials extends Credentials = Credentials,
	TOptions extends Options = Options,
> {
	credentials: TCredentials;
	options: TOptions;

	constructor(credentials: TCredentials, options: TOptions = {} as TOptions) {
		this.credentials = credentials;
		this.options = options;
	}

	/**
	 * Test connection with provider using credentials
	 *
	 * @throws InvalidCredentialsError if credentials are invalid
	 */
	abstract testConnection(): Promise<void>;

	/**
	 * List all available projects from provider
	 *
	 * @returns Array of external projects
	 */
	abstract listProjects(): Promise<Project[]>;

	/**
	 * Get project details by ID
	 *
	 * @param projectId External project ID
	 * @returns Project details
	 */
	abstract getProject(projectId: string): Promise<Project>;

	/**
	 * List deployments for a project
	 *
	 * @param projectId External project ID
	 * @param limit Number of deployments to return
	 * @returns Array of deployments
	 */
	abstract listDeployments(projectId: string, limit?: number): Promise<Deployment[]>;

	/**
	 * Get deployment details including logs
	 *
	 * @param deploymentId External deployment ID
	 * @returns Deployment details with logs
	 */
	abstract getDeployment(deploymentId: string): Promise<Details>;

	/**
	 * Trigger a new deployment
	 *
	 * @param projectId External project ID
	 * @param options Deployment options
	 * @returns Deployment result
	 */
	abstract triggerDeployment(
		projectId: string,
		options?: { preview?: boolean; clearCache?: boolean },
	): Promise<TriggerResult>;

	/**
	 * Cancel a running deployment
	 *
	 * @param deploymentId External deployment ID
	 * @throws UnprocessableContentError if the provider doesn't support cancellation
	 */
	async cancelDeployment(_deploymentId: string): Promise<void> {
		throw new UnprocessableContentError({ reason: 'This deployment provider does not support cancellation' });
	}

	/**
	 * Get deployment build logs
	 *
	 * @param deploymentId External deployment ID
	 * @param options.since Only return logs after this timestamp
	 * @returns Array of log entries
	 */
	abstract getDeploymentLogs(deploymentId: string, options?: { since?: Date }): Promise<Log[]>;
}
