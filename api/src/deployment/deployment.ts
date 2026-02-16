import type {
	Credentials,
	Deployment,
	DeploymentWebhookEvent,
	Details,
	Log,
	Options,
	Project,
	TriggerResult,
	WebhookRegistrationResult,
} from '@directus/types';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAxios } from '../request/index.js';

export type DeploymentRequestOptions = Pick<AxiosRequestConfig<string>, 'method' | 'headers'> & {
	body?: string | null;
	params?: Record<string, string>;
};

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

	protected async axiosRequest<T>(
		apiUrl: string,
		endpoint: string,
		options: DeploymentRequestOptions = {},
	): Promise<AxiosResponse<T>> {
		const { params, ...requestOptions } = options;
		const url = new URL(endpoint, apiUrl);

		if (params) {
			for (const [key, value] of Object.entries(params)) {
				url.searchParams.set(key, value);
			}
		}

		const axios = await getAxios();

		const requestConfig: AxiosRequestConfig<string | null> = {
			url: url.toString(),
			method: requestOptions.method ?? 'GET',
			validateStatus: () => true,
			headers: requestOptions.headers ?? {},
		};

		if (requestOptions.body) {
			requestConfig.data = requestOptions.body;
		}

		return await axios.request<T>(requestConfig);
	}

	/**
	 * Test connection with provider using credentials
	 *
	 * @throws {InvalidCredentialsError} When API credentials are invalid
	 */
	abstract testConnection(): Promise<void>;

	/**
	 * List all available projects from provider
	 *
	 * @returns Array of external projects
	 * @throws {InvalidCredentialsError} When API credentials are invalid
	 * @throws {HitRateLimitError} When rate limit is exceeded
	 * @throws {ServiceUnavailableError} When provider API fails
	 */
	abstract listProjects(): Promise<Project[]>;

	/**
	 * Get project details by ID
	 *
	 * @param projectId External project ID
	 * @returns Project details
	 * @throws {InvalidCredentialsError} When API credentials are invalid
	 * @throws {HitRateLimitError} When rate limit is exceeded
	 * @throws {ServiceUnavailableError} When provider API fails
	 */
	abstract getProject(projectId: string): Promise<Project>;

	/**
	 * List deployments for a project
	 *
	 * @param projectId External project ID
	 * @param limit Number of deployments to return
	 * @returns Array of deployments
	 * @throws {InvalidCredentialsError} When API credentials are invalid
	 * @throws {HitRateLimitError} When rate limit is exceeded
	 * @throws {ServiceUnavailableError} When provider API fails
	 */
	abstract listDeployments(projectId: string, limit?: number): Promise<Deployment[]>;

	/**
	 * Get deployment details including logs
	 *
	 * @param deploymentId External deployment ID
	 * @returns Deployment details with logs
	 * @throws {InvalidCredentialsError} When API credentials are invalid
	 * @throws {HitRateLimitError} When rate limit is exceeded
	 * @throws {ServiceUnavailableError} When provider API fails
	 */
	abstract getDeployment(deploymentId: string): Promise<Details>;

	/**
	 * Trigger a new deployment
	 *
	 * @param projectId External project ID
	 * @param options Deployment options
	 * @returns Deployment result
	 * @throws {InvalidCredentialsError} When API credentials are invalid
	 * @throws {HitRateLimitError} When rate limit is exceeded
	 * @throws {ServiceUnavailableError} When provider API fails
	 */
	abstract triggerDeployment(
		projectId: string,
		options?: { preview?: boolean; clearCache?: boolean },
	): Promise<TriggerResult>;

	/**
	 * Cancel a running deployment
	 *
	 * @param deploymentId External deployment ID
	 * @throws {InvalidCredentialsError} When API credentials are invalid
	 * @throws {HitRateLimitError} When rate limit is exceeded
	 * @throws {ServiceUnavailableError} When provider API fails
	 */
	abstract cancelDeployment(deploymentId: string): Promise<void>;

	/**
	 * Get deployment build logs
	 *
	 * @param deploymentId External deployment ID
	 * @param options.since Only return logs after this timestamp
	 * @returns Array of log entries
	 * @throws {InvalidCredentialsError} When API credentials are invalid
	 * @throws {HitRateLimitError} When rate limit is exceeded
	 * @throws {ServiceUnavailableError} When provider API fails
	 */
	abstract getDeploymentLogs(deploymentId: string, options?: { since?: Date }): Promise<Log[]>;

	/**
	 * Register a webhook with the provider
	 *
	 * @param webhookUrl The public URL that will receive webhook events
	 * @param projectIds External project IDs to scope the webhook
	 * @returns Webhook ID and secret for signature verification
	 */
	abstract registerWebhook(webhookUrl: string, projectIds: string[]): Promise<WebhookRegistrationResult>;

	/**
	 * Unregister webhooks from the provider
	 *
	 * @param webhookIds The webhook IDs returned from registerWebhook
	 */
	abstract unregisterWebhook(webhookIds: string[]): Promise<void>;

	/**
	 * Verify webhook signature and parse the event payload
	 *
	 * @param rawBody Raw request body buffer (before JSON parsing)
	 * @param headers Request headers
	 * @param webhookSecret Secret used for signature verification
	 * @returns Parsed event or null if signature is invalid
	 */
	abstract verifyAndParseWebhook(
		rawBody: Buffer,
		headers: Record<string, string | string[] | undefined>,
		webhookSecret: string,
	): DeploymentWebhookEvent | null;
}
