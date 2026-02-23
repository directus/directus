import { createHmac, timingSafeEqual } from 'node:crypto';
import { HitRateLimitError, InvalidCredentialsError, ServiceUnavailableError } from '@directus/errors';
import type {
	Credentials,
	Deployment,
	DeploymentWebhookEvent,
	DeploymentWebhookEventType,
	Details,
	Log,
	Options,
	Project,
	Status,
	TriggerResult,
	WebhookRegistrationResult,
} from '@directus/types';
import pLimit from 'p-limit';
import { DeploymentDriver, type DeploymentRequestOptions } from '../deployment.js';

export interface VercelCredentials extends Credentials {
	access_token: string;
}

export interface VercelOptions extends Options {
	team_id?: string;
}

/**
 * Vercel API response types
 */
interface VercelProject {
	id: string;
	name: string;
	framework?: string;
	link?: {
		type?: string;
		productionBranch?: string;
		repoId?: string;
	};
	targets?: {
		production?: {
			alias?: string[];
			readyState?: string;
			createdAt?: number;
			readyAt?: number;
		};
	};
	createdAt?: number;
	updatedAt?: number;
}

interface VercelDeployment {
	uid: string;
	id: string;
	projectId?: string;
	state?: string;
	status?: string;
	url?: string;
	createdAt: number;
	ready?: number;
}

interface VercelEvent {
	type: string;
	created: number;
	payload?: {
		text?: string;
	};
	text?: string;
}

interface VercelWebhookResponse {
	id: string;
	secret: string;
}

interface VercelWebhookPayload {
	type: string;
	id: string;
	createdAt: number;
	payload: {
		deployment: {
			id: string;
			url?: string;
			name?: string;
		};
		project: {
			id: string;
		};
		target?: string;
	};
}

const VERCEL_WEBHOOK_EVENTS: DeploymentWebhookEventType[] = [
	'deployment.created',
	'deployment.succeeded',
	'deployment.error',
	'deployment.canceled',
];

export class VercelDriver extends DeploymentDriver<VercelCredentials, VercelOptions> {
	private static readonly API_URL = 'https://api.vercel.com';
	private requestLimit = pLimit(5);

	constructor(credentials: VercelCredentials, options: VercelOptions = {}) {
		super(credentials, options);
	}

	/**
	 * Make authenticated request with retry on rate limit and concurrency control
	 */
	private async request<T>(endpoint: string, options: DeploymentRequestOptions = {}, retryCount = 0): Promise<T> {
		return this.requestLimit(async () => {
			const response = await this.axiosRequest<T>(VercelDriver.API_URL, endpoint, {
				...options,
				headers: {
					Authorization: `Bearer ${this.credentials.access_token}`,
					'Content-Type': 'application/json',
					...(options.headers ?? {}),
				},
				params: {
					...(this.options.team_id ? { teamId: this.options.team_id } : {}),
					...(options.params ?? {}),
				},
			});

			// Handle rate limiting with retry (max 3 retries)
			if (response.status === 429) {
				const resetAt = parseInt(response.headers['x-ratelimit-reset'] || '0');
				const limit = parseInt(response.headers['x-ratelimit-limit'] || '0');

				if (retryCount < 3) {
					const waitTime = resetAt > 0 ? Math.max(resetAt * 1000 - Date.now(), 1000) : 1000 * (retryCount + 1);
					await new Promise((resolve) => setTimeout(resolve, waitTime));
					return this.request(endpoint, options, retryCount + 1);
				}

				// Max retries exceeded
				throw new HitRateLimitError({
					limit,
					reset: new Date(resetAt > 0 ? resetAt * 1000 : Date.now()),
				});
			}

			const body = response.data;

			if (response.status >= 400) {
				const message =
					typeof body === 'object' && body !== null && 'error' in body
						? (body as { error?: { message?: string } }).error?.message || `Vercel API error: ${response.status}`
						: `Vercel API error: ${response.status}`;

				if (response.status === 401 || response.status === 403) {
					throw new InvalidCredentialsError();
				}

				throw new ServiceUnavailableError({ service: 'vercel', reason: message });
			}

			return body;
		});
	}

	private mapStatus(vercelStatus: string | undefined): Status {
		const normalized = vercelStatus?.toLowerCase();

		switch (normalized) {
			case 'building':
			case 'error':
			case 'canceled':
			case 'ready':
				return normalized as Status;
			case 'queued':
			case 'initializing':
			case 'analyzing':
			case 'deploying':
			default:
				return 'building';
		}
	}

	async testConnection(): Promise<void> {
		return await this.request('/v9/projects', { params: { limit: '1' } });
	}

	private mapProjectBase(project: VercelProject): Project {
		const result: Project = {
			id: project.id,
			name: project.name,
			deployable: Boolean(project.link?.type),
		};

		if (project.framework) {
			result.framework = project.framework;
		}

		return result;
	}

	async listProjects(): Promise<Project[]> {
		const response = await this.request<{ projects: VercelProject[] }>('/v9/projects', { params: { limit: '100' } });
		return response.projects.map((project) => this.mapProjectBase(project));
	}

	async getProject(projectId: string): Promise<Project> {
		const project = await this.request<VercelProject>(`/v9/projects/${projectId}`);
		const result = this.mapProjectBase(project);

		const production = project.targets?.production;

		if (production?.alias?.[0]) {
			result.url = `https://${production.alias[0]}`;
		}

		// Latest deployment info from detail endpoint
		if (production?.readyState && production.createdAt) {
			result.latest_deployment = {
				status: this.mapStatus(production.readyState),
				created_at: new Date(production.createdAt),
				...(production.readyAt && { finished_at: new Date(production.readyAt) }),
			};
		}

		if (project.createdAt) {
			result.created_at = new Date(project.createdAt);
		}

		if (project.updatedAt) {
			result.updated_at = new Date(project.updatedAt);
		}

		return result;
	}

	async listDeployments(projectId: string, limit = 20): Promise<Deployment[]> {
		const url = `/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=${limit}`;
		const response = await this.request<{ deployments: VercelDeployment[] }>(url);

		return response.deployments.map((deployment) => {
			const result: Deployment = {
				id: deployment.uid,
				project_id: deployment.projectId ?? projectId,
				status: this.mapStatus(deployment.state),
				created_at: new Date(deployment.createdAt),
			};

			if (deployment.url) {
				result.url = `https://${deployment.url}`;
			}

			if (deployment.ready) {
				result.finished_at = new Date(deployment.ready);
			}

			return result;
		});
	}

	async getDeployment(deploymentId: string): Promise<Details> {
		const deployment = await this.request<VercelDeployment>(`/v13/deployments/${encodeURIComponent(deploymentId)}`);

		const result: Details = {
			id: deployment.id,
			project_id: deployment.projectId ?? '',
			status: this.mapStatus(deployment.status || deployment.state),
			created_at: new Date(deployment.createdAt),
		};

		if (deployment.url) {
			result.url = `https://${deployment.url}`;
		}

		if (deployment.ready) {
			result.finished_at = new Date(deployment.ready);
		}

		return result;
	}

	async triggerDeployment(
		projectId: string,
		options?: { preview?: boolean; clearCache?: boolean },
	): Promise<TriggerResult> {
		// Fetch project to get realtime required name needed for the vercel request
		const project = await this.request<VercelProject>(`/v9/projects/${projectId}`);

		const body: Record<string, unknown> = {
			name: project.name,
			project: projectId,
		};

		if (!options?.preview) {
			body['target'] = 'production';
		}

		// Add required gitSource
		if (project.link?.type) {
			body['gitSource'] = {
				type: project.link.type,
				ref: project.link.productionBranch,
				repoId: project.link.repoId,
			};
		}

		// forceNew=1 skips build cache when clearCache is true
		const response = await this.request<VercelDeployment>('/v13/deployments', {
			method: 'POST',
			body: JSON.stringify(body),
			...(options?.clearCache && { params: { forceNew: '1' } }),
		});

		const triggerResult: TriggerResult = {
			deployment_id: response.id,
			status: this.mapStatus(response.status),
			created_at: new Date(response.createdAt),
		};

		if (response.url) {
			triggerResult.url = `https://${response.url}`;
		}

		return triggerResult;
	}

	async cancelDeployment(deploymentId: string): Promise<Status> {
		try {
			await this.request(`/v12/deployments/${encodeURIComponent(deploymentId)}/cancel`, {
				method: 'PATCH',
			});

			return 'canceled';
		} catch {
			const details = await this.getDeployment(deploymentId);

			if (details.status !== 'building') {
				return details.status;
			}

			throw new ServiceUnavailableError({
				service: 'vercel',
				reason: `Could not cancel the deployment: ${deploymentId}`,
			});
		}
	}

	async getDeploymentLogs(deploymentId: string, options?: { since?: Date }): Promise<Log[]> {
		let url = `/v3/deployments/${encodeURIComponent(deploymentId)}/events`;

		// Vercel's since parameter uses milliseconds timestamp
		if (options?.since) {
			const sinceMs = options.since.getTime();
			url += `?since=${sinceMs}`;
		}

		const response = await this.request<VercelEvent[]>(url);

		const mapEventType = (type: string): Log['type'] => {
			if (type === 'stderr') return 'stderr';
			if (type === 'command') return 'info';
			return 'stdout';
		};

		return response
			.filter((event) => event.type === 'stdout' || event.type === 'stderr' || event.type === 'command')
			.map((event) => ({
				timestamp: new Date(event.created),
				type: mapEventType(event.type),
				message: event.text || event.payload?.text || '',
			}));
	}

	async registerWebhook(webhookUrl: string, projectIds: string[]): Promise<WebhookRegistrationResult> {
		const response = await this.request<VercelWebhookResponse>('/v1/webhooks', {
			method: 'POST',
			body: JSON.stringify({
				url: webhookUrl,
				events: VERCEL_WEBHOOK_EVENTS,
				projectIds,
			}),
		});

		return {
			webhook_ids: [response.id],
			webhook_secret: response.secret,
		};
	}

	async unregisterWebhook(webhookIds: string[]): Promise<void> {
		for (const id of webhookIds) {
			await this.request(`/v1/webhooks/${encodeURIComponent(id)}`, {
				method: 'DELETE',
			});
		}
	}

	verifyAndParseWebhook(
		rawBody: Buffer,
		headers: Record<string, string | string[] | undefined>,
		webhookSecret: string,
	): DeploymentWebhookEvent | null {
		const signature = headers['x-vercel-signature'];

		if (!signature || typeof signature !== 'string') {
			return null;
		}

		const expected = createHmac('sha1', webhookSecret).update(rawBody).digest('hex');

		if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
			return null;
		}

		const body: VercelWebhookPayload = JSON.parse(rawBody.toString('utf-8'));

		if (!VERCEL_WEBHOOK_EVENTS.includes(body.type as DeploymentWebhookEventType)) {
			return null;
		}

		const eventTypeToStatus: Record<string, Status> = {
			'deployment.created': 'building',
			'deployment.succeeded': 'ready',
			'deployment.error': 'error',
			'deployment.canceled': 'canceled',
		};

		return {
			type: body.type as DeploymentWebhookEventType,
			provider: 'vercel',
			project_external_id: body.payload.project.id,
			deployment_external_id: body.payload.deployment.id,
			status: eventTypeToStatus[body.type] ?? 'building',
			...(body.payload.deployment.url ? { url: `https://${body.payload.deployment.url}` } : {}),
			...(body.payload.target ? { target: body.payload.target } : {}),
			timestamp: new Date(body.createdAt),
			raw: body as unknown as Record<string, any>,
		};
	}
}
