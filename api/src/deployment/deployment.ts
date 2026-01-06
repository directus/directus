import type {
  Credentials,
  Options,
  Deployment,
  Details,
  Project,
  TriggerResult,
} from '../types/index.js';

export abstract class DeploymentDriver<TCredentials extends Credentials = Credentials> {
  credentials: TCredentials;
  options: Options;

  constructor(credentials: TCredentials, options: Options = {}) {
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
   * @param target Optional target environment (production/preview)
   * @param clearCache Optional flag to clear build cache
   * @returns Deployment result
   */
  abstract triggerDeployment(projectId: string, target?: string, clearCache?: boolean): Promise<TriggerResult>;

  /**
   * Cancel a running deployment
   *
   * @param deploymentId External deployment ID
   */
  async cancelDeployment(_deploymentId: string): Promise<void> {
    // Default implementation - some providers may not support this
    return;
  }
}
